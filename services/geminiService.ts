import { GoogleGenAI, Type } from "@google/genai";
import { Chapter, Book } from "../types";
import { getApiKey } from "../config";

// HELPER: Cleans AI output to ensure JSON.parse doesn't fail
// (AI sometimes wraps JSON in ```json ... ``` blocks)
const cleanJson = (text: string): string => {
  if (!text) return "{}";
  // Remove markdown code blocks if present
  let clean = text.replace(/```json/g, "").replace(/```/g, "");
  return clean.trim();
};

class GeminiService {
  
  private getClient(): GoogleGenAI {
    // FIX: Updated to check for VITE_GEMINI_API_KEY in both process and import.meta
    const apiKey = getApiKey() || 
                   process.env.VITE_GEMINI_API_KEY || 
                   process.env.API_KEY ||
                   (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_GEMINI_API_KEY : undefined);

    if (!apiKey) {
      console.error("API Key missing. Checked: getApiKey(), process.env.VITE_GEMINI_API_KEY, import.meta.env.VITE_GEMINI_API_KEY");
      throw new Error("Configuration Error: API Key is missing.");
    }
    return new GoogleGenAI({ apiKey });
  }

  private async withRetry<T>(operation: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
    let lastError: any;
    
    for (let i = 0; i < retries; i++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        console.warn(`Attempt ${i + 1} failed:`, error);
        
        // Check for fatal errors that shouldn't be retried
        const msg = error.toString().toLowerCase();
        if (msg.includes("api_key") || msg.includes("auth") || msg.includes("permission")) {
          throw new Error("AUTH_ERROR: Please check your API Key configuration.");
        }
        if (msg.includes("quota") || msg.includes("429")) {
          throw new Error("QUOTA_EXCEEDED");
        }

        // Wait before retry
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
        }
      }
    }
    throw lastError;
  }

  /**
   * Private helper to get the "Master Author" system prompt based on genre/tone
   */
  private getMasterAuthorPrompt(genre: string, tone: string): string {
      return `
        You are an elite, award-winning, hyper-versatile master author.
        Your task is to write content for a "${genre}" book with a "${tone}" tone.
        
        TRANSFORMATION RULES:
        - If Dark Romance: Use seductive, intoxicating, erotic (implied), exotic, sensorial language. Deep emotional tension.
        - If Mythology: Adopt a divine, ancient, reverent tone. Use poetic metaphors.
        - If Thriller: Use tight pacing, sharp sentences, suspense, dread, cinematic action.
        - If Fantasy: Lush world-building, magic systems, immersive geography.
        - If Non-fiction: Professional, structured, factual, clear.
        - If Cyberpunk/Sci-Fi: Tech-noir atmosphere, neon descriptions, gr