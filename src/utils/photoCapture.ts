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
 * Build a context-aware prompt for Claude based on the session type.
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
 * Send a photo to Claude Vision API and extract training data.
 */
export async function extractDataFromPhoto(
  base64: string,
  descriptor: SessionDescriptor,
  apiKey: string
): Promise<ExtractedData> {
  const prompt = buildPrompt(descriptor);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: base64,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('API key is invalid. Check your key in settings.');
    }
    if (response.status === 429) {
      throw new Error('Rate limit reached. Try again in a moment.');
    }
    throw new Error(`API error (${response.status}). Please try again.`);
  }

  const result = await response.json();
  const textContent = result.content?.[0]?.text;
  if (!textContent) {
    throw new Error('No response from API. Please try again.');
  }

  return parseExtractedData(textContent);
}

/**
 * Parse Claude's JSON response into ExtractedData, handling edge cases.
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
 * Validate an API key by making a minimal API call.
 */
export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 16,
        messages: [
          { role: 'user', content: 'Reply with exactly: OK' },
        ],
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}
