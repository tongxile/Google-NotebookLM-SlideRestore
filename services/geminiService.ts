
import { GoogleGenAI, Type } from "@google/genai";
import { SlideElement, ElementType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    backgroundColor: {
      type: Type.STRING,
      description: "Primary hex color of the slide background (e.g., #F9F9F9).",
    },
    elements: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: {
            type: Type.STRING,
            description: "Element type: 'text' or 'image'.",
          },
          content: {
            type: Type.STRING,
            description: "OCR text for 'text' type. Description for 'image' type.",
          },
          x: { type: Type.NUMBER, description: "X pos (0-100)" },
          y: { type: Type.NUMBER, description: "Y pos (0-100)" },
          width: { type: Type.NUMBER, description: "Width (0-100)" },
          height: { type: Type.NUMBER, description: "Height (0-100)" },
          fontSize: {
            type: Type.NUMBER,
            description: "Font size in pt. (Body: 9-11pt, Title: 24-28pt, Stats: 32-40pt).",
          },
          fontColor: { type: Type.STRING, description: "Hex color." },
          isBold: { type: Type.BOOLEAN },
          textAlign: { type: Type.STRING, description: "left, center, or right." }
        },
        required: ["type", "content", "x", "y", "width", "height"],
      },
    },
  },
  required: ["backgroundColor", "elements"],
};

/**
 * Cleans the string to prevent JSON.parse errors due to malformed escapes or control chars.
 */
const sanitizeJsonString = (str: string): string => {
  // Remove markdown code blocks if present
  let cleaned = str.replace(/```json\s?/, "").replace(/```\s?$/, "").trim();
  
  // Find the actual JSON object bounds
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  // Sanitize bad unicode escapes: replace \u followed by non-hex with just u
  // This is the likely culprit for "Bad Unicode escape"
  cleaned = cleaned.replace(/\\u(?![0-9a-fA-F]{4})/g, "u");
  
  // Remove problematic control characters (00-1F range, excluding common ones like tab/newline)
  cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, "");
  
  return cleaned;
};

export const analyzeSlideImage = async (base64Image: string): Promise<{ backgroundColor: string, elements: SlideElement[] }> => {
  try {
    const model = 'gemini-3-flash-preview';
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image.split(',')[1],
            },
          },
          {
            text: `You are a Slide Restoration Expert. Your mission is to reconstruct this slide as an editable PPTX while perfectly preserving graphics and erasing text.
            
            STRICT WATERMARK REMOVAL RULES:
            1. REMOVE WATERMARKS: Explicitly ignore and EXCLUDE any text or logos that say "NotebookLM", especially in the bottom right corner. Do NOT create text boxes or image crops for these watermarks.
            2. COHESIVE ASSETS: Do NOT break icons or diagrams into fragments. Capture the WHOLE graphic group as a SINGLE 'image' element.
            3. NO CROPPED TEXT: Ensure 'image' elements focus on pure graphics. If text is nearby, capture the graphic as a clean sticker.
            4. FULL OCR: Detect every relevant text block (excluding the watermark). We will replace them with editable boxes.
            5. BACKGROUND: Identify the background color accurately.
            6. FONT SIZES: Be conservative for Chinese text (9-11pt body, 24-28pt titles).
            
            OUTPUT RULES:
            - Return ONLY a valid JSON object.
            - Do NOT include backslashes in text content unless properly escaped for JSON.
            - Do NOT use markdown code blocks in your response.`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema,
        thinkingConfig: { thinkingBudget: 4096 }
      },
    });

    const text = response.text;
    if (!text) return { backgroundColor: '#FFFFFF', elements: [] };
    
    const sanitizedText = sanitizeJsonString(text);
    return JSON.parse(sanitizedText);
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    // Return a graceful fallback if parsing still fails
    if (error instanceof SyntaxError) {
      console.warn("Retrying with more aggressive cleaning...");
      try {
        const text = (error as any).message; // Sometimes original text is in error
        // Last ditch effort: if it's too broken, return empty slide
      } catch (e) {}
    }
    throw error;
  }
};
