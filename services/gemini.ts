import { GoogleGenAI } from "@google/genai";
import { Habit } from "../types";

export const getHabitAdvice = async (habit: Habit, streak: number): Promise<string> => {
  try {
    // Initializing GoogleGenAI inside the function ensures it uses the most current API key from process.env.API_KEY
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Using 'gemini-3-flash-preview' for basic text tasks like habit advice
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        You are a motivational habit coach. 
        User is tracking a habit: "${habit.title}" (Category: ${habit.category}).
        Current streak: ${streak} days.
        
        Give a short, punchy, 1-sentence motivational tip or quote specifically for this habit context.
        If the streak is 0, be encouraging to start. If high, congratulate them.
      `,
    });
    // Accessing .text property directly as per Gemini API guidelines
    return response.text?.trim() || "Consistency is key. You got this!";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Consistency is key. You got this!";
  }
};