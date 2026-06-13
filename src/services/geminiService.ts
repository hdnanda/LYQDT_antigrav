import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || "dummy_key_to_stop_crashes" });

export const getDailyFinancialTip = async (): Promise<string> => {
  return "AI is resting: Always buy low and sell high! 🛑"; // KILL SWITCH
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "Generate a short, witty, 1-sentence financial wisdom tip for a Gen-Z user playing a finance game. Keep it under 20 words. Do not use hashtags.",
    });
    return response.text || "Save first, spend later!";
  } catch (error) {
    console.error("Failed to fetch daily tip:", error);
    return "Compound interest is the 8th wonder of the world.";
  }
};