
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
            3. NO CROPPED TEXT: Ensure 'image' elements focus on pure graphics. If text is nearby, capture the graphic as a clean sticker; we will use background-removal to clean the edges.
            4. FULL OCR: Detect every relevant text block (excluding the watermark). We will replace them with editable boxes.
            5. BACKGROUND: Identify the background color accurately.
            6. FONT SIZES: Be conservative for Chinese text (9-11pt body, 24-28pt titles).
            
            Return a JSON with 'backgroundColor' and 'elements'.`,
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
    const jsonStr = text.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};
