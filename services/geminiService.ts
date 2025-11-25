
import { GoogleGenAI, Type } from "@google/genai";
import { Chapter, Book } from "../types";
import { getApiKey } from "../config";

class GeminiService {
  
  private getClient(): GoogleGenAI {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error("API_KEY_MISSING");
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
          throw new Error("AUTH_ERROR");
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
        - If Cyberpunk/Sci-Fi: Tech-noir atmosphere, neon descriptions, grimy yet high-tech feel.
        
        WRITING STANDARDS:
        - Show, don't tell.
        - Strong hooks and vivid sensory details.
        - Cinematic pacing.
        - No clichés unless genre-appropriate.
      `;
  }

  /**
   * Generates the book structure (Title, Chapters, Summaries)
   */
  async generateBookStructure(title: string, genre: string, tone: string, audience: string, additionalPrompt: string): Promise<Partial<Book>> {
    return this.withRetry(async () => {
      const ai = this.getClient();
      const model = "gemini-2.5-flash";
      
      const systemInstruction = this.getMasterAuthorPrompt(genre, tone);

      const prompt = `
        Create a complete, publish-worthy book blueprint for a book titled "${title}".
        Target Audience: ${audience}.
        Additional Context: ${additionalPrompt}.
        
        Generate a JSON response with the book title (feel free to improve it), a creative author name, and a list of 8-12 chapters.
        Each chapter must have a title and a compelling plot summary (2-3 sentences).
      `;

      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
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
    });
  }

  /**
   * Generates a high-contrast, visually striking book cover.
   */
  async generateBookCover(title: string, genre: string, tone: string): Promise<string | undefined> {
    try {
      return await this.withRetry(async () => {
        const ai = this.getClient();
        const model = "gemini-2.5-flash-image";
        const g = genre.toLowerCase();
        const t = tone.toLowerCase();
        
        // Default fallback
        let artDirection = "Highly contrasting, cinematic lighting, 8k resolution, award-winning digital art.";
        let typographyStyle = "Bold, readable, metallic typography.";

        // 1. DARK ROMANCE / GOTHIC
        if (g.includes('dark romance') || (g.includes('romance') && (t.includes('dark') || t.includes('gothic')))) {
            artDirection = "Gothic Baroque masterpiece. High Contrast. Deep obsidian shadows vs piercing ruby red highlights. Velvet textures, thorns, blood red roses, silver daggers. Dramatic Chiaroscuro lighting.";
            typographyStyle = "Elegant, sharp serif font in Silver or Gold leaf. Title '${title}' MUST be clearly visible in center.";
        } 
        // 2. CYBERPUNK / SCI-FI
        else if (g.includes('cyberpunk') || (g.includes('sci') && t.includes('neon'))) {
            artDirection = "Neon Noir Cyberpunk. High Contrast. Deep midnight blues vs blinding neon pinks and cyans. Glitch art aesthetic, rain-slicked streets, chrome reflections. Blade Runner vibe.";
            typographyStyle = "Futuristic, glitch-effect sans-serif font in glowing Neon. Title '${title}' MUST be large and legible.";
        }
        // 3. HIGH FANTASY
        else if (g.includes('fantasy')) {
           artDirection = "Ethereal High Fantasy. High Contrast. Deep forest greens vs glowing bioluminescent gold/magic. Oil painting style (Frank Frazetta meets Studio Ghibli). Epic scale, magical artifacts.";
           typographyStyle = "Ornate, hand-lettered gold calligraphy. Title '${title}' MUST be woven into the artwork.";
        }
        // 4. THRILLER / MYSTERY
        else if (g.includes('thriller') || g.includes('mystery')) {
          artDirection = "Psychological Thriller. High Contrast. Stark Black and White with a single splash of Intense Red. Double exposure photography, silhouettes, fog, cinematic suspense.";
          typographyStyle = "Bold, distressed sans-serif font. Title '${title}' MUST be huge and imposing.";
        }
        // 5. ROMANCE (General)
        else if (g.includes('romance')) {
          artDirection = "Modern Romance. High Contrast. Vibrant pastel gradients vs deep saturated accents. Vector art style, flat design, clean lines, warm golden hour lighting.";
          typographyStyle = "Trendy, bold serif font. Title '${title}' MUST be central.";
        }
        // 6. HORROR
        else if (g.includes('horror')) {
          artDirection = "Cosmic Horror. High Contrast. Deep Vantablack shadows vs sickly neon green or blood orange. Surreal, unsettling composition, scratchy textures.";
          typographyStyle = "Jagged, scratched-in font. Title '${title}' MUST look terrifying.";
        }

        const prompt = `
          Design a professional, best-selling book cover for: "${title}".
          Genre: ${genre}. Tone: ${tone}.
          
          VISUAL STYLE: ${artDirection}
          COLORS: Use a High Contrast color palette. Make it pop.
          
          TYPOGRAPHY INSTRUCTION: The title "${title}" MUST be written on the cover. 
          STYLE: ${typographyStyle}
          
          COMPOSITION: Vertical aspect ratio (3:4). Title at top or center. Main artistic subject clearly defined.
        `;

        const response = await ai.models.generateContent({
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

        if (response.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
             if (part.inlineData && part.inlineData.mimeType.startsWith('image')) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
             }
          }
        }
        return undefined;
      });
    } catch (error) {
      console.error("Cover generation failed:", error);
      return undefined;
    }
  }

  /**
   * Generates a cinematic illustration for a specific scene.
   */
  async generateIllustration(sceneDescription: string, genre: string): Promise<string | undefined> {
    try {
      return await this.withRetry(async () => {
        const ai = this.getClient();
        const model = "gemini-2.5-flash-image";
        
        const prompt = `
          Create a stunning, high-contrast cinematic illustration for a ${genre} story.
          Scene Description: ${sceneDescription}
          
          STYLE: Cinematic, highly detailed, dramatic lighting, 8k resolution. 
          Use rich, deep colors and strong contrast. Make it look like a movie still or concept art.
          No text on the image.
        `;

        const response = await ai.models.generateContent({
          model: model,
          contents: {
            parts: [{ text: prompt }]
          },
          config: {
            imageConfig: {
              aspectRatio: "16:9"
            }
          }
        });

        if (response.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
             if (part.inlineData && part.inlineData.mimeType.startsWith('image')) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
             }
          }
        }
        return undefined;
      });
    } catch (error) {
       console.error("Illustration failed:", error);
       return undefined;
    }
  }

  /**
   * Generates the content for a specific chapter based on its summary and previous context.
   */
  async generateChapterContent(bookTitle: string, chapter: Chapter, previousChapterSummary?: string): Promise<string> {
    try {
      return await this.withRetry(async () => {
        const ai = this.getClient();
        const model = "gemini-2.5-flash"; 
        
        const prompt = `
          You are writing the book "${bookTitle}".
          Write the full content for the chapter: "${chapter.title}".
          
          Chapter Summary: ${chapter.summary}
          ${previousChapterSummary ? `Previous context: ${previousChapterSummary}` : ''}
          
          INSTRUCTIONS:
          - Write approx 800-1200 words.
          - Use immersive, sensory details.
          - Maintain cinematic pacing.
          - Focus on "Show, don't tell".
          - Format with Markdown (bold, italics).
          - Do NOT include the chapter title at the start. Start directly with the story.
        `;

        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });

        const text = response.text;
        
        if (text && text.trim().length > 300) {
            return text;
        } else {
            throw new Error("Content generated was too short or empty.");
        }
      });
    } catch (error) {
       console.error("Chapter generation failed:", error);
       throw error;
    }
  }

  /**
   * Rewrites a specific section of text based on an instruction
   */
  async rewriteText(selectedText: string, instruction: string, bookContext: string): Promise<string> {
    try {
      return await this.withRetry(async () => {
        const ai = this.getClient();
        const model = "gemini-2.5-flash";
        const prompt = `
          You are an expert editor. 
          Rewrite the following text selection according to this instruction: "${instruction}".
          
          Context of the book: ${bookContext}
          
          Original Text: "${selectedText}"
          
          Return ONLY the rewritten text. Do not add quotes or conversational filler.
        `;

        const response = await ai.models.generateContent({
          model: model,
          contents: prompt,
        });

        return response.text || selectedText;
      });
    } catch (error) {
      console.error("Rewrite failed:", error);
      throw error;
    }
  }

  /**
   * Asks a question to the "Book" (Contextual RAG-lite)
   */
  async askBook(question: string, currentChapterContent: string, bookSummary: string): Promise<string> {
    try {
      return await this.withRetry(async () => {
        const ai = this.getClient();
        const model = "gemini-2.5-flash";
        const prompt = `
          You are the spirit of this book. Answer the reader's question based ONLY on the provided context.
          If the answer isn't in the text, answer in the persona of the book's narrator speculating plausibly.
          
          Book Context: ${bookSummary}
          Current Chapter Text: ${currentChapterContent.substring(0, 5000)}... (truncated)
          
          Reader Question: ${question}
        `;

        const response = await ai.models.generateContent({
          model: model,
          contents: prompt,
        });

        return response.text || "I am lost for words...";
      });
    } catch (error) {
      return "I couldn't connect to the spirit world (API Error).";
    }
  }

  /**
   * Simple connection test for Settings validation
   */
  async testConnection(): Promise<boolean> {
    try {
       const ai = this.getClient();
       await ai.models.generateContent({
         model: "gemini-2.5-flash",
         contents: "Test",
       });
       return true;
    } catch(e) {
       console.error("Test connection failed:", e);
       return false;
    }
  }
}

export const geminiService = new GeminiService();
