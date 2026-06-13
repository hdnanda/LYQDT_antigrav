import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';

// GEMINI_API_KEY (no VITE_ prefix) = server-only, never exposed to browser
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
const MODEL = 'gemini-2.0-flash';

const BATTLE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    scenario: { type: Type.STRING },
    choices: {
      type: Type.ARRAY,
      minItems: 2,
      maxItems: 2,
      items: {
        type: Type.OBJECT,
        properties: {
          text:         { type: Type.STRING },
          riskLevel:    { type: Type.STRING },
          expectedCost: { type: Type.NUMBER },
          statImpact: {
            type: Type.OBJECT,
            properties: {
              wealth:     { type: Type.NUMBER },
              reputation: { type: Type.NUMBER },
            },
            required: ['wealth', 'reputation'],
          },
          winChance:    { type: Type.NUMBER },
          winMessage:   { type: Type.STRING },
          lossMessage:  { type: Type.STRING },
        },
        required: ['text', 'riskLevel', 'expectedCost', 'statImpact', 'winChance', 'winMessage', 'lossMessage'],
      },
    },
  },
  required: ['scenario', 'choices'],
};

const SPEED_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      text:      { type: Type.STRING },
      character: { type: Type.STRING },
      yesText:   { type: Type.STRING },
      noText:    { type: Type.STRING },
      yesImpact: { type: Type.OBJECT, properties: { wealth: { type: Type.NUMBER }, happiness: { type: Type.NUMBER } } },
      noImpact:  { type: Type.OBJECT, properties: { wealth: { type: Type.NUMBER }, happiness: { type: Type.NUMBER } } },
    },
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { type, payload } = req.body || {};

  try {
    if (type === 'battle') {
      const { turnRole, context } = payload;
      const { anchorScenario, round, matchHistory = [], currentSaboteurScenario, currentSaboteurChoice } = context;

      const historyText = matchHistory.length > 0
        ? matchHistory.map((h: any) =>
            `Round ${h.round}: Instigator set up "${h.saboteurScenario}" → chose "${h.saboteurChoice}". Reactor responded with "${h.fixerScenario}" → chose "${h.fixerChoice}".`
          ).join('\n')
        : 'First round — no history yet.';

      const prompt = turnRole === 'saboteur'
        ? `You are the Game Master of a 2-player financial literacy battle game for teenagers (ages 14-18).

MATCH SEED: "${anchorScenario}"
HISTORY SO FAR:
${historyText}

The INSTIGATOR needs a scenario for Round ${round}.
Create a money situation that:
- Flows naturally from the match story above
- Is a REAL decision a teenager faces: peer pressure spending, FOMO, group dynamics, impulse buying, side hustles, lending to friends, social media scams
- Puts financial or social pressure on the opponent
- Stays PG — no violence, nothing illegal

RULES:
- Scenario text: max 25 words, second person ("You...")
- Choice 1 = Safe (financially smart) — winChance 0.70–0.90
- Choice 2 = High Risk (tempting but risky) — winChance 0.30–0.50
- statImpact wealth + reputation: integers -15 to 15
- The Safe choice should protect wealth. High Risk gambles it.
- TEACH a real financial lesson.`
        : `You are the Game Master of a 2-player financial literacy battle game for teenagers (ages 14-18).

MATCH SEED: "${anchorScenario}"
HISTORY SO FAR:
${historyText}

Opponent just set up: "${currentSaboteurScenario || 'a financial challenge'}"
They chose: "${currentSaboteurChoice || 'an option'}"

The REACTOR must deal with the direct fallout in Round ${round}.
Create a consequence scenario that:
- Is a DIRECT result of what the opponent did (connect the dots)
- Is realistic for a teenager managing money under pressure
- Feels urgent — the player is on the back foot
- Teaches something real about financial resilience

RULES:
- Scenario text: max 25 words, second person ("You...")
- Choice 1 = Safe (defensive, protects your position) — winChance 0.70–0.90
- Choice 2 = High Risk (big counter-swing) — winChance 0.30–0.50
- statImpact wealth + reputation: integers -15 to 15`;

      const response = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: { responseMimeType: 'application/json', responseSchema: BATTLE_SCHEMA },
      });

      const raw = (response.text || '{}').replace(/```json/g, '').replace(/```/g, '').trim();
      const data = JSON.parse(raw);
      return res.status(200).json(data);

    } else if (type === 'speed') {
      const { count = 10, theme } = payload;

      const prompt = `You are a witty game master for teenagers (ages 14-18).
Generate exactly ${count} binary financial decision scenarios.

THEME: ${theme}

RULES:
1. PG only. No violence, no illegal activities.
2. Use "friend", "bestie", "classmate" — NOT "boyfriend/girlfriend".
3. Second person ("You...").
4. Max 25 words per scenario.
5. Button text max 2 words each.
6. Smart/saving choice MUST give POSITIVE wealth. Spending = negative wealth.
7. Mix high stakes (+/-18) and low stakes (+/-6).

Return JSON array: text, character (emoji), yesText, noText, yesImpact {wealth, happiness}, noImpact {wealth, happiness}`;

      const response = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: { responseMimeType: 'application/json', responseSchema: SPEED_SCHEMA },
      });

      const raw = (response.text || '[]').replace(/```json/g, '').replace(/```/g, '').trim();
      const data = JSON.parse(raw);
      return res.status(200).json(data);

    } else {
      return res.status(400).json({ error: 'Unknown type. Use "battle" or "speed".' });
    }

  } catch (err: any) {
    console.error('[API] Gemini error:', err?.message || err);
    return res.status(500).json({ error: 'Generation failed', details: err?.message });
  }
}
