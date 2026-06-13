import { GoogleGenAI, Type } from '@google/genai';
import {
  type SpeedScenario,
  getHardcodedByCategory,
} from '../data/SpeedRoundData';

// Initialize Gemini
const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY || 'dummy_key_to_stop_crashes',
});

// Add this wiretap:
console.log(
  "🔑 API KEY CHECK:", 
  import.meta.env.VITE_GEMINI_API_KEY ? `Loaded (Starts with ${import.meta.env.VITE_GEMINI_API_KEY.substring(0, 4)})` : "MISSING! USING DUMMY KEY"
);

// Helper: Check if a number is prime
const isPrime = (num: number): boolean => {
  if (num <= 1) return false;
  if (num <= 3) return true;
  if (num % 2 === 0 || num % 3 === 0) return false;
  for (let i = 5; i * i <= num; i += 6) {
    if (num % i === 0 || num % (i + 2) === 0) return false;
  }
  return true;
};

// Helper: Get Theme based on Level
const getThemeForLevel = (level: number): string => {
  // 1. Is Prime? -> Mixed Theme
  if (isPrime(level)) {
    return 'Generate a 60-40 split of scenarios. 60% should be relatable day-to-day teen money problems, and 40% should be high-stakes, heavy-burden financial mistakes.';
  }

  // 2. Is Multiple of 3? -> High Stakes Theme
  if (level % 3 === 0) {
    return 'The scenarios must carry heavy weight. These are high-stakes situations where making a mistake creates a massive burden that is hard to get out of. Make the user sweat the decision.';
  }

  // 3. Is Multiple of 2? -> Relatable Theme
  if (level % 2 === 0) {
    return 'Focus strictly on day-to-day problems involving friends, social life, and minor money issues. These MUST be 100% relatable to a 16-year-old. Think buying food, peer pressure, or splitting bills.';
  }

  // 4. Fallback -> Relatable Theme
  return 'Focus strictly on day-to-day problems involving friends, social life, and minor money issues. These MUST be 100% relatable to a 16-year-old. Think buying food, peer pressure, or splitting bills.';
};

/**
 * Phase 1: Synchronous Initial Batch
 * Returns 10 random hardcoded scenarios from the specific level Theme.
 */
export const getInitialBatch = (
  count: number = 10,
  level: number = 1
): SpeedScenario[] => {
  // Fallback to 'general' for hardcoded since we are moving to AI
  return getHardcodedByCategory('general', count);
};

/**
 * Helper: Sanitize AI Data
 * Ensures no missing fields cause a crash during gameplay.
 */
const sanitizeScenario = (raw: any, index: number): SpeedScenario => {
  // Safe default impact generator
  const safeImpact = (impactRaw: any) => ({
    wealth: typeof impactRaw?.wealth === 'number' ? impactRaw.wealth : 0,
    happiness:
      typeof impactRaw?.happiness === 'number' ? impactRaw.happiness : 0,
  });

  return {
    id: `gen_${Date.now()}_${index}`,
    text:
      typeof raw.text === 'string' && raw.text.length > 0
        ? raw.text
        : 'Scenario Error (AI Glitch).',
    character:
      typeof raw.character === 'string' && raw.character.length > 0
        ? raw.character
        : '🤖',
    bg: 'bg-slate-800', // Always default to dark card background
    // Strict 12 char limit on buttons to prevent layout breaks
    yesText:
      typeof raw.yesText === 'string' && raw.yesText.length > 0
        ? raw.yesText.substring(0, 12)
        : 'YES',
    noText:
      typeof raw.noText === 'string' && raw.noText.length > 0
        ? raw.noText.substring(0, 12)
        : 'NO',
    // Ensure impacts exist
    yesImpact: safeImpact(raw.yesImpact),
    noImpact: safeImpact(raw.noImpact),
    isAi: true, // Explicitly mark as AI
  };
};

/**
 * Phase 2: Asynchronous AI Supplement
 * Fetches AI scenarios in the background.
 * NOW PRIMARY: Fetches 100% of scenarios.
 */
export const fetchAiScenarios = async (
  count: number = 15,
  level: number
): Promise<SpeedScenario[]> => {
  return []; // 🛑 KILL SWITCH: Delete this line to turn Speed Round AI back on!
  try {
    const themeInstruction = getThemeForLevel(level);

    console.log(
      `[ScenarioManager] AI Fetching ${count} scenarios for Level ${level}. Theme Instruction: "${themeInstruction.substring(
        0,
        50
      )}..."`
    );

    const prompt = `
            You are a witty, slightly sarcastic game master for Gen Z/Alpha (Ages 10-18).
            Generate exactly ${count} binary financial scenarios.
            
            THEME INSTRUCTION: ${themeInstruction}
            
            TONE: Punchy, relatable, high-stakes, and funny. (e.g., "You accidentally liked your crush's post from 2018...", "Your situationship asks for money...").

            STRICT CONTENT RULES:
            1. Rated PG / Family Friendly.
            2. NEVER use words like "date", "lover", "boyfriend", "girlfriend", or "sex".
            3. ALWAYS use words like "partner", "friend", "bestie", or "plus-one".
            4. Write strictly in the second person (using 'You').
            5. Max 20 words per scenario.
            6. Button text ('yesText', 'noText') must be **STRICTLY 1-2 WORDS MAX**. No full sentences. No weird punctuation. Perfect spelling. (e.g. "Do it", "No way", "Buy", "Pass").

            GAME BALANCE RULES (CRITICAL):
            1. **NO DEATH SPIRALS**: Avoid "lose-lose" scenarios where both options hurt the player.
            2. **REWARD RESPONSIBILITY**: If the user chooses a frugal/saving option (e.g., "Cook at home", "Skip party"), the Wealth impact MUST be POSITIVE (e.g., wealth: +15). Saving money heals the wallet!
            3. **FAIR TRADE-OFFS**: 
               - Spending money = Wealth (-) / Happiness (+)
               - Saving money = Wealth (+) / Happiness (-) or (0)
            4. Ensure a mix of high stakes (+/- 20) and low stakes (+/- 5).

            Return a JSON array where each object has:
            - text: string (The situation)
            - character: string (A single emoji representing the situation)
            - yesText: string (Action 1, max 2 words)
            - noText: string (Action 2, max 2 words)
            - yesImpact: { wealth: number (-20 to 20), happiness: number (-20 to 20) }
            - noImpact: { wealth: number (-20 to 20), happiness: number (-20 to 20) }
        `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              character: { type: Type.STRING },
              yesText: { type: Type.STRING },
              noText: { type: Type.STRING },
              yesImpact: {
                type: Type.OBJECT,
                properties: {
                  wealth: { type: Type.NUMBER },
                  happiness: { type: Type.NUMBER },
                },
              },
              noImpact: {
                type: Type.OBJECT,
                properties: {
                  wealth: { type: Type.NUMBER },
                  happiness: { type: Type.NUMBER },
                },
              },
            },
          },
        },
      },
    });

    let text = response.text || '[]';
    text = text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
    const data = JSON.parse(text);

    if (Array.isArray(data)) {
      console.log(
        `[ScenarioManager] AI Received ${data.length} items. Sanitizing...`
      );

      // Map and Sanitize (Fail-safe against bad JSON props)
      const validScenarios = data
        .map((item, index) => {
          try {
            return sanitizeScenario(item, index);
          } catch (e) {
            console.warn('Skipping malformed AI scenario', e);
            return null;
          }
        })
        .filter(Boolean) as SpeedScenario[];

      return validScenarios;
    }
    return [];
  } catch (error) {
    console.warn('[ScenarioManager] AI Generation failed:', error);
    return [];
  }
};

// --- Battle Arena Types ---

export interface BattleChoice {
  text: string;
  riskLevel: string;
  expectedCost: number;
  statImpact: {
    wealth: number;
    reputation: number;
  };
  // We'll keep these for compatibility with the existing BattleInterface logic if needed,
  // or handle the mapping in the service.
  winChance?: number;
  winMessage?: string;
  lossMessage?: string;
}

export interface BattleScenario {
  scenario: string;
  choices: BattleChoice[];
}

// generate battle scenario is here

export const generateBattleScenario = async (
  turnRole: 'saboteur' | 'fixer',
  previousAttackText: string | null = null
): Promise<BattleScenario> => {
  console.log(`[ScenarioManager] 🎬 STARTING GENERATION FOR: ${turnRole.toUpperCase()}`);
  
  try {
    const basePrompt = `
      You are the Game Master in a competitive financial strategy game.
      
      ${turnRole === 'saboteur' 
        ? "The active player is the 'Saboteur'. Generate an OFFENSIVE scenario where they execute a clever financial maneuver (e.g., a short squeeze, aggressive marketing, buying a competitor, auditing) against their rival. Provide 2 choices to execute the move. KEEP IT PG, NO VIOLENCE, NO ILLEGAL ACTS." 
        : `The active player is the 'Fixer'. The rival Saboteur just made this move: "${previousAttackText}". Generate a DEFENSIVE scenario where the Fixer must react to the immediate market fallout. Provide 2 choices to defend the firm.`}
      
      RULES:
      1. Scenario text must be under 20 words.
      2. Choice 1 must be 'Safe' (low risk). Choice 2 must be 'High Risk'.
      3. Choice text must be 5 words or less.
      4. The 'wealth' and 'reputation' statImpact numbers MUST be integers between -15 and 15 (DAMAGE CAP).
      5. 'winChance' must be a decimal between 0.0 and 1.0.
      6. Strictly corporate and financial stakes.
    `;

    console.log(`[ScenarioManager] 📡 Sending prompt to Gemini 3 Flash...`);

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: basePrompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            scenario: { type: Type.STRING },
            choices: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  riskLevel: { type: Type.STRING },
                  expectedCost: { type: Type.NUMBER },
                  statImpact: {
                    type: Type.OBJECT,
                    properties: {
                      wealth: { type: Type.NUMBER },
                      reputation: { type: Type.NUMBER },
                    },
                    required: ['wealth', 'reputation'],
                  },
                  winChance: { type: Type.NUMBER },
                  winMessage: { type: Type.STRING },
                  lossMessage: { type: Type.STRING },
                },
                required: ['text', 'riskLevel', 'expectedCost', 'statImpact', 'winChance', 'winMessage', 'lossMessage'],
              },
              minItems: 2,
              maxItems: 2,
            },
          },
          required: ['scenario', 'choices'],
        },
      },
    });

    console.log(`[ScenarioManager] ✅ RAW AI RESPONSE RECEIVED:`, response.text);

    let cleanText = response.text || '{}';
    cleanText = cleanText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const data = JSON.parse(cleanText);
    console.log(`[ScenarioManager] 🎯 SUCCESSFULLY PARSED JSON:`, data);
    return data as BattleScenario;
    
  } catch (error: any) {
    // 🚨 THIS IS THE SMOKING GUN 🚨
    console.error('[ScenarioManager] ❌ CRASH DETECTED FOR:', turnRole);
    console.error('[ScenarioManager] 🩸 ERROR DETAILS:', error);
    if (error.status) console.error('[ScenarioManager] Status Code:', error.status);
    
    return {
      scenario: 'System failure. The market is shifting blindly.',
      choices: [
        { text: 'Hold positions', riskLevel: 'Safe', expectedCost: 0, statImpact: { wealth: -5, reputation: 0 }, winChance: 1.0, winMessage: 'You held the line.', lossMessage: 'You held the line.' },
        { text: 'Blind panic sell', riskLevel: 'High Risk', expectedCost: 20, statImpact: { wealth: 15, reputation: 10 }, winChance: 0.3, winMessage: 'You survived the crash!', lossMessage: 'You lost everything.' },
      ],
    };
  }
};