

import { GoogleGenAI, Type } from "@google/genai";
import { Chapter, Book, Character } from "../types";
import { getApiKey } from "../config";

class GeminiService {
  
  private getClient(): GoogleGenAI {
    // Prioritize user-configured key, then env var
    const apiKey = getApiKey() || process.env.API_KEY;
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
   * Generates the book structure (Title, Chapters, Summaries, Characters)
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
        
        Generate a JSON response with:
        1. The book title (feel free to improve it).
        2. A creative author name.
        3. A list of 8-12 chapters. Each chapter must have a title and a compelling plot summary (2-3 sentences).
        4. A list of 3-5 main characters. Each character must have a name, role (e.g., Protagonist, Antagonist), and a brief description.
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
              characters: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    role: { type: Type.STRING },
                    description: { type: Type.STRING },
                  },
                  required: ["name", "role", "description"],
                },
              },
            },
            required: ["title", "author", "chapters", "characters"],
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
        characters: data.characters || [],
      };
    });
  }

  /**
   * Generates a hyper-specific, visually striking book cover.
   */
  async generateBookCover(title: string, genre: string, tone: string): Promise<string | undefined> {
    try {
      return await this.withRetry(async () => {
        const ai = this.getClient();
        const model = "gemini-2.5-flash-image";
        const g = genre.toLowerCase();
        const t = tone.toLowerCase();
        
        let artDirection = "Highly contrasting, cinematic lighting, 8k resolution, award-winning digital art.";
        let typographyStyle = "Bold, readable, metallic typography.";

        if (g.includes('dark romance') || (g.includes('romance') && (t.includes('dark') || t.includes('gothic')))) {
            artDirection = "Gothic Baroque masterpiece in the style of Tom Bagshaw and Brom. High Contrast. Deep obsidian shadows vs piercing ruby red highlights. A single symbolic object (a key, a mask, a wilting rose). Smoke tendrils, velvet textures, thorns. Dramatic Chiaroscuro lighting.";
            typographyStyle = "Elegant, sharp serif font in Silver or Gold leaf, subtly distressed. Title '${title}' MUST be clearly visible and integrated into the art.";
        } 
        else if (g.includes('cyberpunk') || (g.includes('sci') && t.includes('neon'))) {
            artDirection = "Neon Noir Cyberpunk in the style of Josan Gonzalez and Syd Mead. High Contrast. Deep midnight blues vs blinding neon pinks and cyans. Hyper-detailed, rain-slicked streets, holographic advertisements, chrome reflections.";
            typographyStyle = "Futuristic, glitch-effect sans-serif font in glowing Neon. Title '${title}' MUST be large and legible, as if part of a heads-up display.";
        }
        else if (g.includes('fantasy')) {
           artDirection = "Ethereal High Fantasy in the style of John Howe and Alan Lee. High Contrast. Deep ancient forest greens vs glowing golden magic. Oil painting texture. Epic scale, atmospheric perspective, a lone figure gazing at ancient ruins.";
           typographyStyle = "Ornate, hand-lettered gold calligraphy with a subtle glow. Title '${title}' MUST be woven into the artwork's composition.";
        }
        else if (g.includes('thriller') || g.includes('mystery')) {
          artDirection = "Psychological Thriller cover, minimalist and stark. High Contrast. Stark Black and White with a single splash of Intense Red. Double exposure photography, a face blending with a cityscape, silhouettes in fog. Cinematic suspense.";
          typographyStyle = "Bold, distressed, condensed sans-serif font. Title '${title}' MUST be huge and imposing, creating tension.";
        }
        else if (g.includes('horror')) {
          artDirection = "Cosmic Horror in the style of Zdzisław Beksiński. High Contrast. Deep Vantablack shadows vs sickly neon green or blood orange. Surreal, unsettling, non-euclidean geometry, scratchy textures.";
          typographyStyle = "Jagged, hand-scratched font. Title '${title}' MUST look terrifying and unstable.";
        }
        
        const prompt = `
          Design a professional, publishable, best-selling book cover for: "${title}".
          Genre: ${genre}. Tone: ${tone}.
          VISUAL STYLE: ${artDirection}
          TYPOGRAPHY: The title "${title}" MUST be written prominently on the cover. Use this style: ${typographyStyle}
          COMPOSITION: Vertical aspect ratio (3:4). Clean, professional layout.
        `;

        const response = await ai.models.generateContent({
          model: model,
          contents: { parts: [{ text: prompt }] },
          config: { imageConfig: { aspectRatio: "3:4" } }
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
           if (part.inlineData && part.inlineData.mimeType.startsWith('image')) {
              return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
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
   * Generates a world map for a book.
   */
  async generateWorldMap(book: Book): Promise<string | undefined> {
    try {
      return await this.withRetry(async () => {
        const ai = this.getClient();
        const model = "gemini-2.5-flash-image";
        const settingSummary = book.chapters.map(c => c.summary).join(' ').substring(0, 1000);

        const prompt = `
          Create a detailed world map for a ${book.genre} book titled "${book.title}".
          The world is described as having a ${book.tone} tone. 
          Key elements from the story include: ${settingSummary}.
          
          STYLE: Generate a beautiful, hand-drawn map in a vintage parchment or epic fantasy style. 
          Include geographical features like mountains, forests, rivers, and cities that fit the genre.
          Do NOT include any text or labels on the map. The map should be purely visual.
          ASPECT RATIO: 16:9, landscape.
        `;
        
        const response = await ai.models.generateContent({
          model: model,
          contents: { parts: [{ text: prompt }] },
          config: { imageConfig: { aspectRatio: "16:9" } }
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
           if (part.inlineData && part.inlineData.mimeType.startsWith('image')) {
              return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
           }
        }
        return undefined;
      });
    } catch (error) {
      console.error("World map generation failed:", error);
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