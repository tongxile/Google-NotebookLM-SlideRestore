
import pptxgen from "pptxgenjs";
import { SlideData, ElementType, SlideElement } from "../types";

/**
 * Advanced crop with Chroma-Key (Background Removal) logic.
 */
const cropAndProcessImage = (
  base64: string,
  xPerc: number,
  yPerc: number,
  wPerc: number,
  hPerc: number,
  targetBgColor: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas context error"));

        const sx = (xPerc / 100) * img.width;
        const sy = (yPerc / 100) * img.height;
        const sw = (wPerc / 100) * img.width;
        const sh = (hPerc / 100) * img.height;

        canvas.width = Math.max(1, sw);
        canvas.height = Math.max(1, sh);
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

        // --- "Koutu" (Background Removal) Implementation ---
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        const hexToRgb = (hex: string) => {
          const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
          return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
          } : { r: 255, g: 255, b: 255 };
        };

        const target = hexToRgb(targetBgColor);
        const threshold = 45;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const diff = Math.abs(r - target.r) + Math.abs(g - target.g) + Math.abs(b - target.b);
          if (diff < threshold) {
            data[i + 3] = 0;
          }
        }
        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error("Image load error"));
    img.src = base64;
  });
};

export const generatePptx = async (slidesData: SlideData[]): Promise<Blob> => {
  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_16x9";

  for (const slideData of slidesData) {
    const slide = pptx.addSlide();
    const bgColorHex = slideData.backgroundColor || "#FFFFFF";
    const bgColorPptx = bgColorHex.replace("#", "");
    slide.background = { fill: bgColorPptx };

    if (!slideData.elements) continue;

    const graphics = slideData.elements.filter(e => e.type !== 'text');
    const texts = slideData.elements.filter(e => e.type === 'text');

    // 1. Render Graphics (Bottom Layer)
    for (const element of graphics) {
      // Ignore bottom-right watermark area (X > 75%, Y > 85%)
      const isWatermarkArea = element.x > 75 && element.y > 85;
      if (isWatermarkArea && element.width < 25 && element.height < 15) {
        continue;
      }

      try {
        const processedImage = await cropAndProcessImage(
          slideData.thumbnail,
          element.x,
          element.y,
          element.width,
          element.height,
          bgColorHex
        );
        slide.addImage({
          data: processedImage,
          x: `${element.x}%`,
          y: `${element.y}%`,
          w: `${element.width}%`,
          h: `${element.height}%`
        });
      } catch (e) {
        console.warn("Asset processing failed", e);
      }
    }

    // 2. Render Text Boxes (Top Layer)
    for (const element of texts) {
      if (element.content.toLowerCase().includes("notebooklm")) {
        continue;
      }

      const { content, x, y, width, height, fontSize, fontColor, isBold, textAlign } = element as any;
      const refinedFontSize = typeof fontSize === 'number' ? Math.max(7, Math.round(fontSize * 0.75)) : 11;
      
      slide.addText(content, {
        x: `${x}%`,
        y: `${y}%`,
        w: `${width}%`,
        h: `${height}%`,
        fontSize: refinedFontSize,
        color: (fontColor || "#333333").replace("#", ""),
        bold: isBold || false,
        align: (textAlign as any) || "left",
        valign: "top",
        fontFace: "Microsoft YaHei",
        margin: 0,
        wrap: true,
        autoFit: false,
        fill: { color: bgColorPptx }, 
        line: { color: bgColorPptx, transparency: 100 },
      });
    }
  }

  return await pptx.write({ outputType: "blob" }) as Blob;
};
