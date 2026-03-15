export interface SessionDescriptor {
  weekNumber: number;
  dayNumber: number;
  label: string;
  description: string;
  isOptional: boolean;
}

export function isIntervalSession(label: string): boolean {
  return /\d+\s*[x\u00d7]\s*\d+/i.test(label);
}

export function getIntervalCount(label: string): number {
  const match = label.match(/(\d+)\s*[x\u00d7]/i);
  return match ? parseInt(match[1], 10) : 0;
}

export const TRAINING_PLAN: SessionDescriptor[] = [
  // WEEK 1
  { weekNumber: 1, dayNumber: 1, label: "5000m", description: "Focus on technique, relaxation, and efficiency. Smooth acceleration through the drive, slow and relaxed on the recovery.", isOptional: false },
  { weekNumber: 1, dayNumber: 2, label: "6 x 500m / 2min rest", description: "Don't get carried away early \u2014 you have many weeks ahead to increase intensity. Learn pacing over the coming weeks.", isOptional: false },
  { weekNumber: 1, dayNumber: 3, label: "5000m", description: "Match the average pace of your last 5000m. Resist the temptation to go faster. Technique, relaxation, efficiency.", isOptional: false },
  { weekNumber: 1, dayNumber: 4, label: "20min", description: "Row at a slower pace than your 5000m sessions. Focus on making each stroke more efficient than the last.", isOptional: true },
  { weekNumber: 1, dayNumber: 5, label: "2 x 10min / 2min rest", description: "Row the first 10min at your 20min pace, then try to just beat the distance on the second 10min.", isOptional: true },

  // WEEK 2
  { weekNumber: 2, dayNumber: 1, label: "5500m", description: "Distance increases 500m/week. Same pace as last week's 5000m \u2014 fitness and technique should keep pace steady.", isOptional: false },
  { weekNumber: 2, dayNumber: 2, label: "4 x 750m / 2min rest", description: "50% longer intervals, same total distance as last week. Match your 6x500m pace exactly \u2014 don't go faster.", isOptional: false },
  { weekNumber: 2, dayNumber: 3, label: "5500m", description: "Same pace as your first 5500m, rowed as consistently as possible. Keep the same pace on every stroke.", isOptional: false },
  { weekNumber: 2, dayNumber: 4, label: "20min", description: "If 20min is less than your 5500m time, row at the same pace as your 5500m rows this week.", isOptional: true },
  { weekNumber: 2, dayNumber: 5, label: "3 x 8min / 2min rest", description: "Aim for similar pace to your 20min session, or match last week's 5th session pace.", isOptional: true },

  // WEEK 3
  { weekNumber: 3, dayNumber: 1, label: "6000m", description: "Keep building gradually. Same pace as last week's 5500m. Log sessions and look back at your progress.", isOptional: false },
  { weekNumber: 3, dayNumber: 2, label: "2 x 2000m / 4min rest", description: "First longer intervals with longer rest. Try ~2s faster pace than your recent 6000m session.", isOptional: false },
  { weekNumber: 3, dayNumber: 3, label: "6000m", description: "Same pace as your first 6000m. If performance dips, note factors like fatigue, temperature, nutrition.", isOptional: false },
  { weekNumber: 3, dayNumber: 4, label: "5000m", description: "Same pace as your 6000m, then try to speed up within the last 1000m.", isOptional: true },
  { weekNumber: 3, dayNumber: 5, label: "6 x 500m / 2min rest", description: "Look back to Week 1. Start 1s faster and see how you get on.", isOptional: true },

  // WEEK 4
  { weekNumber: 4, dayNumber: 1, label: "6500m", description: "500m more each week, same pace. These two sessions are the core of your training right now.", isOptional: false },
  { weekNumber: 4, dayNumber: 2, label: "3 x 1000m / 3min rest", description: "Similar intensity to Week 1's 6x500m. Try for the same pace you did in Week 1.", isOptional: false },
  { weekNumber: 4, dayNumber: 3, label: "6500m", description: "Same as Day 1 this week.", isOptional: false },
  { weekNumber: 4, dayNumber: 4, label: "6000m", description: "Same pace as your 6500m sessions this week.", isOptional: true },
  { weekNumber: 4, dayNumber: 5, label: "2 x 2500m / 2min rest", description: "Aim 1s faster pace than the 6000m from last session.", isOptional: true },

  // WEEK 5
  { weekNumber: 5, dayNumber: 1, label: "7000m", description: "You know what to do on these now.", isOptional: false },
  { weekNumber: 5, dayNumber: 2, label: "4 x 800m / 2min rest", description: "Match last week's 3x1000m pace for reps 1-3. On the last interval, see how fast you can go with good technique.", isOptional: false },
  { weekNumber: 5, dayNumber: 3, label: "7000m", description: "As always.", isOptional: false },
  { weekNumber: 5, dayNumber: 4, label: "20min", description: "If tired, just focus on technique. If feeling good, go 1-2s faster than your 7000m pace this week.", isOptional: true },
  { weekNumber: 5, dayNumber: 5, label: "2 x 10min / 2min rest", description: "Aim for a similar pace to your last session.", isOptional: true },

  // WEEK 6
  { weekNumber: 6, dayNumber: 1, label: "7500m", description: "50% further than Week 1 at the same pace! Use this as motivation to try optional sessions if you haven't yet.", isOptional: false },
  { weekNumber: 6, dayNumber: 2, label: "3 x 2000m / 4min rest", description: "Match your Week 3 2x2000m pace, and see if you can maintain it on the 3rd rep.", isOptional: false },
  { weekNumber: 6, dayNumber: 3, label: "7500m", description: "You know what to do.", isOptional: false },
  { weekNumber: 6, dayNumber: 4, label: "5000m", description: "Start at your 7500m pace. Past halfway, speed up by 1s whenever you feel able.", isOptional: true },
  { weekNumber: 6, dayNumber: 5, label: "6 x 500m / 2min rest", description: "Use your judgment for pacing. Beware going too fast early or you'll meet Mr Lactic Acid.", isOptional: true },

  // WEEK 7
  { weekNumber: 7, dayNumber: 1, label: "8000m", description: "Check your average stroke rate. If over 24spm, try lowering by 1-2 by slowing the recovery.", isOptional: false },
  { weekNumber: 7, dayNumber: 2, label: "7 x 500m / 2min rest", description: "One more rep than Week 1. Aim 1-2s faster if you haven't done this since Week 1.", isOptional: false },
  { weekNumber: 7, dayNumber: 3, label: "8000m", description: "Concentrate on bringing stroke rate to 24spm or below.", isOptional: false },
  { weekNumber: 7, dayNumber: 4, label: "6000m", description: "Judge recovery from the week. Aim for 8000m pace at a lower stroke rate.", isOptional: true },
  { weekNumber: 7, dayNumber: 5, label: "3 x 1500m / 3min rest", description: "1s faster than last week's 2000m reps. Keep pace consistent across reps.", isOptional: true },

  // WEEK 8
  { weekNumber: 8, dayNumber: 1, label: "8500m", description: "Technique, relaxation, and efficiency.", isOptional: false },
  { weekNumber: 8, dayNumber: 2, label: "4 x 1500m / 3min rest", description: "Aim for same pace as Week 6's 2000m reps. Try going slightly faster on the 4th rep.", isOptional: false },
  { weekNumber: 8, dayNumber: 3, label: "8000m", description: "Same pace for first 6000m as your 8500m, then speed up over the final 2000m.", isOptional: false },
  { weekNumber: 8, dayNumber: 4, label: "25min", description: "Row at 24spm or just below. Aim ~1s faster than your previous 8000m.", isOptional: true },
  { weekNumber: 8, dayNumber: 5, label: "3 x 1000m / 3min rest", description: "Try to match your Week 7 7x500m pace. Note how stroke rate compares to steady-state sessions.", isOptional: true },

  // WEEK 9
  { weekNumber: 9, dayNumber: 1, label: "9000m", description: "Full 2 months in. Distance will stop increasing soon, then you can focus on pace!", isOptional: false },
  { weekNumber: 9, dayNumber: 2, label: "4 x 800m / 2min rest", description: "Check Week 5 pace. If 1s faster feels right, go for it; otherwise match and push the final rep.", isOptional: false },
  { weekNumber: 9, dayNumber: 3, label: "8000m", description: "Periodically review technique notes to avoid bad habits.", isOptional: false },
  { weekNumber: 9, dayNumber: 4, label: "8000m", description: "More of the same.", isOptional: true },
  { weekNumber: 9, dayNumber: 5, label: "2 x 10min / 2min rest", description: "First piece ~1s faster than your 8000m, then beat it on the second piece.", isOptional: true },

  // WEEK 10
  { weekNumber: 10, dayNumber: 1, label: "9500m", description: "Review your training diary \u2014 pace should be steady as distance increased; stroke rate should be dropping gradually.", isOptional: false },
  { weekNumber: 10, dayNumber: 2, label: "3 x 2000m / 4min rest", description: "1s faster than Week 6. Go faster still on the last rep.", isOptional: false },
  { weekNumber: 10, dayNumber: 3, label: "8000m", description: "Row first 6000m at the same pace as Day 1, then gradually speed up to the end (negative split).", isOptional: false },
  { weekNumber: 10, dayNumber: 4, label: "8000m", description: "Same as last session.", isOptional: true },
  { weekNumber: 10, dayNumber: 5, label: "7 x 500m / 2min rest", description: "Match Week 7 average pace for first 6 reps, then go faster on the final rep.", isOptional: true },

  // WEEK 11
  { weekNumber: 11, dayNumber: 1, label: "10000m", description: "Double your Week 1 distance. Feel proud of this milestone.", isOptional: false },
  { weekNumber: 11, dayNumber: 2, label: "8 x 500m / 2min rest", description: "Extra rep. Match Week 7 pace for first 7 reps, faster on the last.", isOptional: false },
  { weekNumber: 11, dayNumber: 3, label: "8000m", description: "Use a rate cap 2-3spm lower than normal. See how it affects pace.", isOptional: false },
  { weekNumber: 11, dayNumber: 4, label: "25min", description: "Play games: count consecutive strokes holding target split. Beat your record.", isOptional: true },
  { weekNumber: 11, dayNumber: 5, label: "4 x 1500m / 3min rest", description: "Match Week 8 pace for all but the last rep. Go faster on the final rep and note the new average.", isOptional: true },

  // WEEK 12
  { weekNumber: 12, dayNumber: 1, label: "10000m", description: "No more distance increases for 3 weeks! Improve average pace even by a tenth of a second.", isOptional: false },
  { weekNumber: 12, dayNumber: 2, label: "4 x 1500m / 3min rest", description: "Same pacing plan as Week 11's optional session. Match previous pace, push last rep.", isOptional: false },
  { weekNumber: 12, dayNumber: 3, label: "3 x 10min / 2min rest", description: "First 2 reps at your 10k pace. Try to go faster on the final rep.", isOptional: false },
  { weekNumber: 12, dayNumber: 4, label: "8000m", description: "Keep stroke rate 20-22spm to limit pace. Focus on technique.", isOptional: true },
  { weekNumber: 12, dayNumber: 5, label: "4 x 800m / 2min rest", description: "Match Week 9 average for first 3 reps, faster on the last.", isOptional: true },

  // WEEK 13
  { weekNumber: 13, dayNumber: 1, label: "10000m", description: "Improve on last week's 10k pace. Set out at last week's pace for the first 3/4, then speed up.", isOptional: false },
  { weekNumber: 13, dayNumber: 2, label: "4 x 1000m / 3min rest", description: "Match Week 9 pace \u2014 your fitness gains should produce a fast final rep.", isOptional: false },
  { weekNumber: 13, dayNumber: 3, label: "2 x 15min / 2min rest", description: "Same pace as last week's 3x10min. Make the second rep faster.", isOptional: false },
  { weekNumber: 13, dayNumber: 4, label: "8000m", description: "Low stroke rate, technique focus.", isOptional: true },
  { weekNumber: 13, dayNumber: 5, label: "3 x 2000m / 4min rest", description: "Match Week 12's 4x1500m pace.", isOptional: true },

  // WEEK 14
  { weekNumber: 14, dayNumber: 1, label: "10000m", description: "Keep improving \u2014 the faster you row, the quicker you finish!", isOptional: false },
  { weekNumber: 14, dayNumber: 2, label: "3 x 2000m / 4min rest", description: "Aim for same pace as Week 12's 4x1500m.", isOptional: false },
  { weekNumber: 14, dayNumber: 3, label: "4 x 8min / 2min rest", description: "Match last week's 2x15min pace for first 3 reps. Build pace in the last rep.", isOptional: false },
  { weekNumber: 14, dayNumber: 4, label: "30min", description: "Low rate, technique focus. You're likely going faster now without trying.", isOptional: true },
  { weekNumber: 14, dayNumber: 5, label: "8 x 500m / 2min rest", description: "Match Week 11 average for first 7 reps, faster on the last.", isOptional: true },

  // WEEK 15
  { weekNumber: 15, dayNumber: 1, label: "10000m", description: "Go for a PB! 24spm, match last week's pace for 8000m, then speed up for the final 2000m.", isOptional: false },
  { weekNumber: 15, dayNumber: 2, label: "5 x 750m / 2min rest", description: "Match Week 13's 4x1000m pace for first 4 reps, faster on the last.", isOptional: false },
  { weekNumber: 15, dayNumber: 3, label: "3 x 10min / 2min rest", description: "Match last week's 4x8min pace for first 2 reps, faster on the final.", isOptional: false },
  { weekNumber: 15, dayNumber: 4, label: "8000m", description: "You went hard on the 10k \u2014 take it easy. Max 22spm, technique focus.", isOptional: true },
  { weekNumber: 15, dayNumber: 5, label: "4 x 1500m / 3min rest", description: "Match Week 14's 3x2000m pace. Resist the temptation to push the last rep \u2014 save it for next week.", isOptional: true },

  // WEEK 16
  { weekNumber: 16, dayNumber: 1, label: "10500m", description: "Over-distance makes the 10k feel more comfortable. Same pace as your 10k sessions.", isOptional: false },
  { weekNumber: 16, dayNumber: 2, label: "5 x 1500m / 3min rest", description: "Aim for Week 13's 3x2000m pace.", isOptional: false },
  { weekNumber: 16, dayNumber: 3, label: "30min", description: "Match your Week 15 10k pace. You'll have energy left to speed up in the final minutes.", isOptional: false },
  { weekNumber: 16, dayNumber: 4, label: "10000m", description: "Max 22spm, technique and efficient power delivery.", isOptional: true },
  { weekNumber: 16, dayNumber: 5, label: "4 x 1000m / 3min rest", description: "Match Week 13 pace for first 3 reps, faster final rep.", isOptional: true },

  // WEEK 17
  { weekNumber: 17, dayNumber: 1, label: "10500m", description: "Consolidate \u2014 match last week's pace.", isOptional: false },
  { weekNumber: 17, dayNumber: 2, label: "8 x 500m / 2min rest", description: "Check Week 11 pace. Match it for first 7 reps, all-out final rep.", isOptional: false },
  { weekNumber: 17, dayNumber: 3, label: "2 x 15min / 2min rest", description: "Match Week 15's 3x10min pace.", isOptional: false },
  { weekNumber: 17, dayNumber: 4, label: "30min", description: "Max 22spm. Work on recovery sequence and relaxation.", isOptional: true },
  { weekNumber: 17, dayNumber: 5, label: "4 x 8min / 2min rest", description: "Check Week 14 for reference pace.", isOptional: true },

  // WEEK 18
  { weekNumber: 18, dayNumber: 1, label: "11000m", description: "Same pace as last week's 10500m.", isOptional: false },
  { weekNumber: 18, dayNumber: 2, label: "4 x 2000m / 4min rest", description: "Match Week 14's 3x2000m pace for first 3 reps. Your month of work earns the extra rep.", isOptional: false },
  { weekNumber: 18, dayNumber: 3, label: "30min", description: "Match your 11000m pace for 20min, then speed up every couple of minutes to the end.", isOptional: false },
  { weekNumber: 18, dayNumber: 4, label: "10000m", description: "Strict 20spm for first half (technique). From halfway, only increase rate with a matching pace increase.", isOptional: true },
  { weekNumber: 18, dayNumber: 5, label: "4 x 1000m / 3min rest", description: "Match your last attempt's average for first 3 reps, all-out final rep.", isOptional: true },

  // WEEK 19
  { weekNumber: 19, dayNumber: 1, label: "10000m", description: "Back to 10k \u2014 try to beat your Week 15 PB. If you can't hold pace, back off but always finish.", isOptional: false },
  { weekNumber: 19, dayNumber: 2, label: "5 x 800m / 2min rest", description: "Only ~7 extra strokes/rep vs Week 15's 750m. Match that pace for 4 reps, all-out final rep.", isOptional: false },
  { weekNumber: 19, dayNumber: 3, label: "3 x 10min / 2min rest", description: "Treat short rests as rehydration/refocus breaks. Row as a steady piece.", isOptional: false },
  { weekNumber: 19, dayNumber: 4, label: "30min", description: "Max 22spm, technique only \u2014 don't worry about split time.", isOptional: true },
  { weekNumber: 19, dayNumber: 5, label: "4 x 2000m / 4min rest", description: "Match last week's pace. If not feeling it, restrict rate and note what you did.", isOptional: true },

  // WEEK 20
  { weekNumber: 20, dayNumber: 1, label: "12000m", description: "Your longest row yet. Start ~5s slower than 10k pace, reach 10k pace by 5000m to go, then negative split.", isOptional: false },
  { weekNumber: 20, dayNumber: 2, label: "5 x 1500m / 3min rest", description: "Compare Week 16's 5x1500m and your 4x2000m paces. Use the faster as your target for 4 reps, push the last.", isOptional: false },
  { weekNumber: 20, dayNumber: 3, label: "30min", description: "Steady all the way at your best 10k pace. Count consecutive strokes on target split.", isOptional: false },
  { weekNumber: 20, dayNumber: 4, label: "10000m", description: "Rate-restricted, technique focus.", isOptional: true },
  { weekNumber: 20, dayNumber: 5, label: "8 x 500m / 2min rest", description: "Check Week 17 pace. Can you beat it? Good indicator for future 2k test pace.", isOptional: true },

  // WEEK 21
  { weekNumber: 21, dayNumber: 1, label: "10000m", description: "Start 2s slow, build to PB pace by halfway, hold for 2000m, then try to go faster for the final 3000m.", isOptional: false },
  { weekNumber: 21, dayNumber: 2, label: "4 x 1000m / 3min rest", description: "Compare your 1000m and 500m session paces \u2014 notice the relationship. Use a recent similar session for pacing.", isOptional: false },
  { weekNumber: 21, dayNumber: 3, label: "4 x 8min / 2min rest", description: "Think of this as steady-state with short breaks. Aim for your 30min single-piece pace.", isOptional: false },
  { weekNumber: 21, dayNumber: 4, label: "12000m", description: "Strict 20spm, don't worry about pace. Switch display to calories/watts if you like.", isOptional: true },
  { weekNumber: 21, dayNumber: 5, label: "5 x 1500m / 3min rest", description: "Match last week's pace.", isOptional: true },

  // WEEK 22
  { weekNumber: 22, dayNumber: 1, label: "12000m", description: "Steady pace ~2s slower than last 10k. Check the machine memory afterward for consistency.", isOptional: false },
  { weekNumber: 22, dayNumber: 2, label: "4 x 2000m / 4min rest", description: "Compare with 5x1500m paces. Use the faster as target for first 3 reps, push the last.", isOptional: false },
  { weekNumber: 22, dayNumber: 3, label: "30min", description: "Try strict 20spm for the whole row (30r20). A popular benchmark session.", isOptional: false },
  { weekNumber: 22, dayNumber: 4, label: "3 x 10min / 2min rest", description: "Rate-restrict if you need an easier session, or aim for your best 30min pace.", isOptional: true },
  { weekNumber: 22, dayNumber: 5, label: "5 x 800m / 2min rest", description: "Check Week 19 pace. Hold it for 4 reps, unleash everything on the final rep.", isOptional: true },

  // WEEK 23
  { weekNumber: 23, dayNumber: 1, label: "10000m", description: "Whichever pacing strategy worked best for you (steady or negative split), use it for a new 10k PB.", isOptional: false },
  { weekNumber: 23, dayNumber: 2, label: "8 x 500m / 2min rest", description: "Find your last completed attempt and set your target pace accordingly.", isOptional: false },
  { weekNumber: 23, dayNumber: 3, label: "2 x 15min / 2min rest", description: "Row the first 15min slightly slower than your best 30min, then beat yourself on the second.", isOptional: false },
  { weekNumber: 23, dayNumber: 4, label: "10000m", description: "Easy session \u2014 max 22spm. Especially if you plan to do Day 5.", isOptional: true },
  { weekNumber: 23, dayNumber: 5, label: "4 x 2000m / 4min rest", description: "Can you match or beat last week's pace on the final rep?", isOptional: true },

  // WEEK 24
  { weekNumber: 24, dayNumber: 1, label: "12000m", description: "Keep rate \u226424spm. Technique focus on longer pieces. Don't overdo it \u2014 recover for intervals.", isOptional: false },
  { weekNumber: 24, dayNumber: 2, label: "5 x 1500m / 3min rest", description: "Final week! Check Week 20 pace. Hit target for 4 reps, then prove how tough you are on the last.", isOptional: false },
  { weekNumber: 24, dayNumber: 3, label: "30min", description: "Use your judgment. You're experienced now \u2014 pace by feel.", isOptional: false },
  { weekNumber: 24, dayNumber: 4, label: "2 x 15min / 2min rest", description: "Make the second piece slightly faster than the first.", isOptional: true },
  { weekNumber: 24, dayNumber: 5, label: "4 x 1000m / 3min rest", description: "Your final session! Reflect on the improvements since Week 1.", isOptional: true },
];
