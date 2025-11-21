import { GoogleGenAI, Type } from "@google/genai";
import { Chapter, Book } from "../types";

const API_KEY = process.env.API_KEY || '';

class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: API_KEY });
  }

  /**
   * Generates the book structure (Title, Chapters, Summaries)
   */
  async generateBookStructure(title: string, genre: string, tone: string, audience: string, additionalPrompt: string): Promise<Partial<Book>> {
    if (!API_KEY) throw new Error("API Key is missing");

    const model = "gemini-2.5-flash";
    const prompt = `
      You are a professional book editor and ghostwriter.
      Create a detailed book outline for a ${genre} book titled "${title}".
      Target Audience: ${audience}.
      Tone: ${tone}.
      Additional Context: ${additionalPrompt}.
      
      Generate a JSON response with the book title, a creative author name, and a list of 5-8 chapters.
      Each chapter must have a title and a brief plot summary (2-3 sentences).
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              author: { type: Type.STRING },
              chapters: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    summary: { type: Type.STRING },
                  },
                  required: ["title", "summary"],
                },
              },
            },
            required: ["title", "author", "chapters"],
          },
        },
      });

      const text = response.text;
      if (!text) throw new Error("No content generated");

      const data = JSON.parse(text);
      
      if (!data.chapters || !Array.isArray(data.chapters)) {
        throw new Error("Invalid book structure generated");
      }
      
      // Map to our internal structure
      const chapters: Chapter[] = data.chapters.map((c: any, index: number) => ({
        id: `ch-${index}-${Date.now()}`,
        title: c.title,
        summary: c.summary,
        content: "", // Empty initially
        isGenerated: false,
      }));

      return {
        title: data.title,
        author: data.author,
        chapters: chapters,
      };

    } catch (error) {
      console.error("Book structure generation failed:", error);
      throw error;
    }
  }

  /**
   * Generates a book cover image using Gemini Flash Image (Nano Banana)
   */
  async generateBookCover(title: string, genre: string, tone: string): Promise<string | undefined> {
    if (!API_KEY) return undefined;

    const model = "gemini-2.5-flash-image";
    const prompt = `Design a minimal, high-quality, abstract book cover for a ${genre} book titled "${title}". The tone is ${tone}. Do not include text on the cover.`;

    try {
      const response = await this.ai.models.generateContent({
        model: model,
        contents: {
          parts: [{ text: prompt }]
        },
        config: {
          imageConfig: {
            aspectRatio: "3:4"
          }
        }
      });

      // Iterate through parts to find the image
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
           if (part.inlineData && part.inlineData.mimeType.startsWith('image')) {
              return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
           }
        }
      }
      return undefined;

    } catch (error) {
      console.error("Cover generation failed:", error);
      // Return undefined to allow fallback to work
      return undefined;
    }
  }

  /**
   * Generates the content for a specific chapter based on its summary and previous context.
   */
  async generateChapterContent(bookTitle: string, chapter: Chapter, previousChapterSummary?: string): Promise<string> {
    if (!API_KEY) return "API Key missing. Mock content generated.";
    
    const model = "gemini-2.5-flash"; // Using flash for speed
    const prompt = `
      Write the full content for the chapter "${chapter.title}" for the book "${bookTitle}".
      
      Chapter Summary: ${chapter.summary}
      ${previousChapterSummary ? `Previous context: ${previousChapterSummary}` : ''}
      
      Style: Engaging, well-paced, formatted with paragraphs. 
      Length: Approximately 600-800 words.
      Do not include the chapter title at the top, just the story text.
      Format using Markdown for bold/italics if needed.
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: model,
        contents: prompt,
      });

      return response.text || "Content generation returned empty.";
    } catch (error) {
      console.error("Chapter generation failed:", error);
      return "Failed to generate content. Please try again.";
    }
  }

  /**
   * Asks a question to the "Book" (Contextual RAG-lite)
   */
  async askBook(question: string, currentChapterContent: string, bookSummary: string): Promise<string> {
    if (!API_KEY) return "I can't answer that without an API key.";

    const model = "gemini-2.5-flash";
    const prompt = `
      You are the spirit of this book. Answer the reader's question based ONLY on the provided context.
      If the answer isn't in the text, answer in the persona of the book's narrator speculating plausibly.
      
      Book Context: ${bookSummary}
      Current Chapter Text: ${currentChapterContent.substring(0, 5000)}... (truncated)
      
      Reader Question: ${question}
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: model,
        contents: prompt,
      });

      return response.text || "I am lost for words...";
    } catch (error) {
      console.error("Ask book failed:", error);
      return "I couldn't connect to the spirit world (API Error).";
    }
  }
}

export const geminiService = new GeminiService();