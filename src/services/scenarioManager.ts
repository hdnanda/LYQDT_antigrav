import {
  type SpeedScenario,
  getHardcodedByCategory,
} from '../data/SpeedRoundData';

// ─── Shared API caller ────────────────────────────────────────────────────────
// All Gemini calls go through our Vercel serverless function so the API key
// never appears in the browser bundle.
const API_URL = '/api/generate-scenario';

async function callApi(type: 'battle' | 'speed', payload: Record<string, unknown>) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, payload }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.details || err.error || `API error ${res.status}`);
  }
  return res.json();
}

// ─── Speed Round ─────────────────────────────────────────────────────────────

const isPrime = (n: number): boolean => {
  if (n <= 1) return false;
  if (n <= 3) return true;
  if (n % 2 === 0 || n % 3 === 0) return false;
  for (let i = 5; i * i <= n; i += 6)
    if (n % i === 0 || n % (i + 2) === 0) return false;
  return true;
};

const getThemeForLevel = (level: number): string => {
  if (isPrime(level))
    return '60% relatable daily teen money situations, 40% high-stakes financial mistakes.';
  if (level % 3 === 0)
    return 'High-stakes situations: debt, scams, financial burdens that spiral. Make the user sweat.';
  return 'Day-to-day teenage money decisions: food, peer pressure, splitting bills, small impulse buys.';
};

/** Synchronous first batch from hardcoded pool — shown instantly while AI loads */
export const getInitialBatch = (count = 10, level = 1): SpeedScenario[] =>
  getHardcodedByCategory('general', count);

const sanitizeScenario = (raw: any, index: number): SpeedScenario => {
  const safeNum = (v: any) => (typeof v === 'number' ? v : 0);
  return {
    id: `gen_${Date.now()}_${index}`,
    text: typeof raw.text === 'string' && raw.text ? raw.text : 'Scenario glitch — skip!',
    character: typeof raw.character === 'string' && raw.character ? raw.character : '🤖',
    bg: 'bg-slate-800',
    yesText: (raw.yesText || 'Yes').toString().substring(0, 12),
    noText: (raw.noText || 'No').toString().substring(0, 12),
    yesImpact: { wealth: safeNum(raw.yesImpact?.wealth), happiness: safeNum(raw.yesImpact?.happiness) },
    noImpact:  { wealth: safeNum(raw.noImpact?.wealth),  happiness: safeNum(raw.noImpact?.happiness)  },
    isAi: true,
  };
};

/** Fetches AI-generated speed round scenarios via the secure server proxy */
export const fetchAiScenarios = async (count = 15, level: number): Promise<SpeedScenario[]> => {
  try {
    const data = await callApi('speed', { count, theme: getThemeForLevel(level) });
    if (!Array.isArray(data)) return [];
    return data
      .map((item: any, i: number) => { try { return sanitizeScenario(item, i); } catch { return null; } })
      .filter(Boolean) as SpeedScenario[];
  } catch (error) {
    console.warn('[ScenarioManager] Speed AI failed, using hardcoded:', error);
    return [];
  }
};

// ─── Fight Mode ───────────────────────────────────────────────────────────────

/**
 * Anchor scenarios: relatable teen financial situations that seed the whole
 * match story. Every round's AI gets this context so the narrative branches
 * like a game of chess — each move is a consequence of the last.
 */
const ANCHOR_SCENARIOS = [
  "You and your best friend both want the same $180 limited sneaker drop. You have savings. They're flat broke and ask to borrow.",
  "Your friend group planned a $50/person birthday trip. Someone just booked a $300 Airbnb and expects everyone to split it equally.",
  "You just got your first paycheck — $340. Your cousin says he can double it in crypto 'guaranteed, I made $1k last week'.",
  "You and a classmate started a sneaker-reselling side hustle, $100 each. The first sale made $80 profit. Now they want to keep it all.",
  "Your friend borrowed $80 for a concert ticket two months ago and keeps dodging you. You actually need the money back now.",
  "Group food order: $140 total. One person says 'just split it evenly' but you only ordered a $9 sandwich.",
  "A classmate is selling 'factory-direct' AirPods for $40 cash — no receipt, 'order placed before payment'. 15 people already sent money.",
  "You won $500 in a school competition. Now every friend suddenly has 'investment advice' or an urgent favour they need.",
  "You're the only one in your friend group with a car. Everyone expects free rides everywhere. Nobody chips in for gas.",
  "Your part-time job just gave you a surprise $200 bonus. A limited merch drop hits your feed — 24 hours only, your size, $190.",
  "A friend asks you to be the guarantor for their $600 phone plan because their credit is bad. 'You won't have to pay a thing, I promise.'",
  "Someone in your school is running a group buy for concert tickets — send $120 now, tickets arrive 'next week'. 30 people already in.",
];

export const getAnchorScenario = (): string =>
  ANCHOR_SCENARIOS[Math.floor(Math.random() * ANCHOR_SCENARIOS.length)];

// ─── Battle Types ─────────────────────────────────────────────────────────────

export interface MatchHistoryEntry {
  round: number;
  saboteurScenario: string;
  saboteurChoice: string;
  fixerScenario: string;
  fixerChoice: string;
}

export interface MatchContext {
  anchorScenario: string;
  round: number;
  matchHistory: MatchHistoryEntry[];
  /** Fixer only: the Saboteur's scenario text from this round */
  currentSaboteurScenario?: string;
  /** Fixer only: the text of the Saboteur's chosen option */
  currentSaboteurChoice?: string;
}

export interface BattleChoice {
  text: string;
  riskLevel: 'Safe' | 'High Risk';
  expectedCost: number;
  statImpact: { wealth: number; reputation: number };
  winChance: number;
  winMessage: string;
  lossMessage: string;
}

export interface BattleScenario {
  scenario: string;
  choices: [BattleChoice, BattleChoice];
}

const FALLBACK_SCENARIO: BattleScenario = {
  scenario: 'Connection lost. The market waits for nobody — every second costs money.',
  choices: [
    {
      text: 'Hold steady and wait it out',
      riskLevel: 'Safe', expectedCost: 0,
      statImpact: { wealth: -3, reputation: 0 },
      winChance: 0.85, winMessage: 'You held the line.', lossMessage: 'You held too long.',
    },
    {
      text: 'Go all-in right now',
      riskLevel: 'High Risk', expectedCost: 20,
      statImpact: { wealth: 13, reputation: 8 },
      winChance: 0.35, winMessage: 'Massive payoff!', lossMessage: 'You lost it all.',
    },
  ],
};

/**
 * Generates a context-aware battle scenario via the secure server proxy.
 * The AI receives the full match history so every round is a narrative
 * consequence of the last — like moves in a chess game.
 */
export const generateBattleScenario = async (
  turnRole: 'saboteur' | 'fixer',
  context: MatchContext
): Promise<BattleScenario> => {
  try {
    const data = await callApi('battle', { turnRole, context });

    // Validate shape
    if (!data.scenario || !Array.isArray(data.choices) || data.choices.length < 2) {
      console.warn('[ScenarioManager] Malformed battle response, using fallback');
      return FALLBACK_SCENARIO;
    }

    return data as BattleScenario;
  } catch (error) {
    console.error('[ScenarioManager] Battle generation failed:', error);
    return FALLBACK_SCENARIO;
  }
};