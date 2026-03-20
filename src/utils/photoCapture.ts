import type { SessionDescriptor } from '../data/trainingPlan';
import { isIntervalSession, getIntervalCount } from '../data/trainingPlan';

export interface ExtractedData {
  pace: string | null;
  totalTime: string | null;
  strokeRate: number | null;
  intervalPaces: string[] | null;
}

/**
 * Resize an image file to a max dimension, returning a base64 JPEG string (without data URI prefix).
 */
export function resizeImage(file: File, maxDim = 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      // Get base64 without the "data:image/jpeg;base64," prefix
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      const base64 = dataUrl.split(',')[1];
      resolve(base64);
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      reject(new Error('Failed to load image'));
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Build a context-aware prompt based on the session type.
 */
export function buildPrompt(descriptor: SessionDescriptor): string {
  const isInterval = isIntervalSession(descriptor.label);
  const intervalCount = isInterval ? getIntervalCount(descriptor.label) : 0;

  let fields = `{
  "pace": "m:ss or null",
  "totalTime": "mm:ss or null",
  "strokeRate": number or null`;

  if (isInterval && intervalCount > 0) {
    fields += `,
  "intervalPaces": ["m:ss", ...] or null  // pace for each of the ${intervalCount} intervals`;
  }

  fields += `
}`;

  return `You are analyzing a photo of a rowing machine performance monitor screen (likely a Concept2 PM5).
Extract the training data shown on the screen.

This session is: "${descriptor.label}"
${descriptor.description}

Return ONLY a JSON object with these fields:
${fields}

Rules:
- Pace is in m:ss format (minutes:seconds per 500m, e.g. "2:05")
- Total time in mm:ss format (e.g. "22:30"). If over 60 minutes, use mm:ss where mm > 59
- Stroke rate is a whole number (strokes per minute), typically 18-36
${isInterval ? `- intervalPaces should have exactly ${intervalCount} entries, one per interval split` : ''}
- If a value is not visible or unclear, use null for that field
- Do NOT guess values — only extract what you can clearly read
- Return ONLY the JSON object, no other text or markdown`;
}

/**
 * Sleep helper for retry backoff.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Send a single request to Gemini and return the Response.
 */
async function callGemini(
  base64: string,
  prompt: string,
  apiKey: string
): Promise<Response> {
  return fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: base64,
                },
              },
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 512,
          temperature: 0.1,
        },
      }),
    }
  );
}

// Track in-flight request to prevent concurrent duplicate calls
let inflightRequest: Promise<ExtractedData> | null = null;

/**
 * Send a photo to Google Gemini Flash API and extract training data.
 * Includes retry with exponential backoff for rate-limit (429) errors
 * and guards against concurrent duplicate requests.
 */
export async function extractDataFromPhoto(
  base64: string,
  descriptor: SessionDescriptor,
  apiKey: string
): Promise<ExtractedData> {
  // If a request is already in flight, return the same promise instead of firing another
  if (inflightRequest) {
    return inflightRequest;
  }

  const doRequest = async (): Promise<ExtractedData> => {
    const prompt = buildPrompt(descriptor);
    const MAX_RETRIES = 3;
    const BASE_DELAY_MS = 2000; // start at 2 seconds

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      // Wait before retrying (skip delay on first attempt)
      if (attempt > 0) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1); // 2s, 4s
        await sleep(delay);
      }

      const response = await callGemini(base64, prompt, apiKey);

      if (response.ok) {
        const result = await response.json();
        const textContent = result.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!textContent) {
          throw new Error('No response from API. Please try again.');
        }
        return parseExtractedData(textContent);
      }

      // Non-retryable errors — throw immediately
      if (response.status === 400) {
        const err = await response.json().catch(() => null);
        const msg = err?.error?.message || '';
        if (msg.includes('API_KEY')) {
          throw new Error('API key is invalid. Check your key in settings.');
        }
        throw new Error('Bad request. Please try again.');
      }
      if (response.status === 403) {
        throw new Error('API key is invalid or Gemini API not enabled. Check your key in settings.');
      }

      // Retryable: 429 rate limit or 5xx server errors
      if (response.status === 429 || response.status >= 500) {
        lastError = new Error(
          response.status === 429
            ? 'Rate limit reached. Retrying...'
            : `Server error (${response.status}). Retrying...`
        );
        continue; // retry
      }

      // Other errors — don't retry
      throw new Error(`API error (${response.status}). Please try again.`);
    }

    // All retries exhausted
    throw lastError ?? new Error('Rate limit reached. Please wait a minute and try again.');
  };

  inflightRequest = doRequest().finally(() => {
    inflightRequest = null;
  });

  return inflightRequest;
}

/**
 * Parse the API JSON response into ExtractedData, handling edge cases.
 */
function parseExtractedData(text: string): ExtractedData {
  // Strip markdown code fences if present
  const cleaned = text.replace(/```json?\s*/g, '').replace(/```\s*/g, '').trim();

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('Could not process photo. Enter data manually.');
  }

  const data: ExtractedData = {
    pace: null,
    totalTime: null,
    strokeRate: null,
    intervalPaces: null,
  };

  // Validate pace: should be m:ss format
  if (typeof parsed.pace === 'string' && /^\d{1,2}:\d{2}$/.test(parsed.pace)) {
    data.pace = parsed.pace;
  }

  // Validate totalTime: should be mm:ss or m:ss format
  if (typeof parsed.totalTime === 'string' && /^\d{1,3}:\d{2}$/.test(parsed.totalTime)) {
    data.totalTime = parsed.totalTime;
  }

  // Validate strokeRate: should be a number 0-60
  if (typeof parsed.strokeRate === 'number' && parsed.strokeRate >= 0 && parsed.strokeRate <= 60) {
    data.strokeRate = Math.round(parsed.strokeRate);
  }

  // Validate intervalPaces: array of m:ss strings
  if (Array.isArray(parsed.intervalPaces)) {
    const validPaces = parsed.intervalPaces
      .filter((p): p is string => typeof p === 'string' && /^\d{1,2}:\d{2}$/.test(p));
    if (validPaces.length > 0) {
      data.intervalPaces = validPaces;
    }
  }

  return data;
}

/**
 * Validate a Gemini API key by listing available models (free, no tokens consumed).
 */
export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}&pageSize=1`
    );
    return response.ok;
  } catch {
    return false;
  }
}
