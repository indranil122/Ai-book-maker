
import { GoogleGenAI, Type } from "@google/genai";
import { Chapter, Book } from "../types";
import { GOOGLE_API_KEY } from "../config";

const API_KEY ="AIzaSyDk35hN7SfjjW0wF2l68CmWNtx5doJv23g";

class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: API_KEY });
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
    if (!API_KEY) throw new Error("API Key is missing");

    const model = "gemini-2.5-flash";
    
    const systemInstruction = this.getMasterAuthorPrompt(genre, tone);

    const prompt = `
      Create a complete, publish-worthy book blueprint for a book titled "${title}".
      Target Audience: ${audience}.
      Additional Context: ${additionalPrompt}.
      
      Generate a JSON response with the book title (feel free to improve it), a creative author name, and a list of 8-12 chapters.
      Each chapter must have a title and a compelling plot summary (2-3 sentences).
    `;

    try {
      const response = await this.ai.models.generateContent({
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
    
    const g = genre.toLowerCase();
    const t = tone.toLowerCase();
    
    // Sophisticated style selection for "Niche" and "Hot" market looks
    let visualStyle = "highly detailed, cinematic lighting, award-winning digital art";
    let element = "symbolic abstract representation";

    // 1. DARK ROMANCE (Special Niche Request)
    if (g.includes('dark romance') || (g.includes('romance') && (t.includes('dark') || t.includes('gothic')))) {
        visualStyle = "Gothic Baroque aesthetic, deep ruby and obsidian palette, velvet textures, dramatic chiaroscuro lighting, elegant, dangerous, photorealistic fantasy";
        element = "a wilting dark rose entangled with a crown of thorns or a silver dagger on silk";
    } 
    // 2. SCI-FI / CYBERPUNK
    else if (g.includes('cyberpunk') || (g.includes('sci') && t.includes('neon'))) {
        visualStyle = "Neon Noir, Blade Runner aesthetic, rain-slicked streets, chromatic aberration, pink and cyan lighting, glitch art textures";
        element = "a silhouette of a figure with cybernetic enhancements against a neon city";
    }
    else if (g.includes('sci-fi') || g.includes('space')) {
      if (t.includes('dark') || t.includes('gritty')) {
        visualStyle = "Brutalist sci-fi, HR Giger influence, monochromatic with distinct highlight, atmospheric fog, massive scale";
        element = "a monolith floating in a void";
      } else {
        visualStyle = "70s Retro-Futurism, airbrush style, vibrant synthwave colors, clean lines, Moebius inspired";
        element = "a sleek starship or distant planet horizon";
      }
    } 
    // 3. FANTASY
    else if (g.includes('fantasy')) {
      if (t.includes('whimsical') || t.includes('cozy')) {
        visualStyle = "Studio Ghibli style, watercolor textures, soft pastoral lighting, lush greenery, enchanting atmosphere";
        element = "a magical artifact or creature in a sunlit meadow";
      } else if (g.includes('high') || g.includes('epic')) {
         visualStyle = "Classic oil painting style, Frank Frazetta or Boris Vallejo influence, dramatic composition, golden age of fantasy";
         element = "a legendary weapon glowing with ancient power";
      } else {
        visualStyle = "Dark fantasy concept art, heavy texture, muted earth tones, epic scale, cinematic depth of field";
        element = "an ancient rune-covered relic";
      }
    } 
    // 4. THRILLER / MYSTERY
    else if (g.includes('mystery') || g.includes('thriller')) {
      visualStyle = "Double exposure photography, desaturated cool tones, foggy atmosphere, cinematic suspense, minimal noir, True Detective intro style";
      element = "a silhouette merging with a forest or cityscape";
    } 
    // 5. CONTEMPORARY ROMANCE
    else if (g.includes('romance')) {
      visualStyle = "Modern vector flat art, pastel color palette, soft edges, warm golden hour lighting, trendy illustrated style (BookTok aesthetic)";
      element = "abstract figures slightly touching or floral patterns";
    } 
    // 6. HORROR
    else if (g.includes('horror')) {
      visualStyle = "Surreal gothic, scratchy texture overlay, film grain, unsettling composition, muted red and black palette, psychological horror aesthetic";
      element = "a distorted shadow or an uncanny object in an empty room";
    } 
    // 7. NON-FICTION
    else if (g.includes('business') || g.includes('non-fiction')) {
      visualStyle = "Swiss design style, Bauhaus influence, minimalist geometric abstraction, clean typography-ready layout, solid bold colors";
      element = "abstract 3D shapes representing growth or structure";
    } 
    // 8. CHILDREN
    else if (g.includes('child')) {
      visualStyle = "Paper cut-out style, vibrant primary colors, charming character design, storybook illustration, textured";
      element = "a cute animal protagonist looking at a star";
    }

    const prompt = `
      Create a best-selling book cover art for a ${genre} book titled "${title}".
      Tone: ${tone}.
      
      ART STYLE: ${visualStyle}.
      SUBJECT: ${element}.
      COMPOSITION: Vertical aspect ratio (3:4), negative space at top for title (but do NOT add text), central focal point.
      
      CRITICAL INSTRUCTION: Do NOT include any text, letters, words, title, or author name on the image. Generate pure artwork only.
    `;

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
    
    const model = "gemini-2.5-flash"; 
    
    // We assume the genre/tone is passed or we default to a general sophisticated prompt. 
    // In a real app, we'd pass these in. For now, we'll use a robust default that encourages high quality.
    // To fix the type signature issue without changing all callsites immediately, 
    // I will hardcode a "General Masterpiece" check or just use a robust standard prompt here.
    // However, for best results, I'll infer it's a high-quality request.
    
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
   * Rewrites a specific section of text based on an instruction
   */
  async rewriteText(selectedText: string, instruction: string, bookContext: string): Promise<string> {
    if (!API_KEY) return selectedText;

    const model = "gemini-2.5-flash";
    const prompt = `
      You are an expert editor. 
      Rewrite the following text selection according to this instruction: "${instruction}".
      
      Context of the book: ${bookContext}
      
      Original Text: "${selectedText}"
      
      Return ONLY the rewritten text. Do not add quotes or conversational filler.
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: model,
        contents: prompt,
      });

      return response.text || selectedText;
    } catch (error) {
      console.error("Rewrite failed:", error);
      return selectedText;
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
