<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

## ————“化腐朽为神奇，使模糊变清晰”

## 痛点：google NotebookLm 生成的演示文稿是PDF格式的，而且中文扭曲，图片，图标也都以图片形式嵌入PDF中

## 解决方案：PDF转PPTX，重点关注：去notebookLM水印，同时大图片拆分，OCR文字识别放到透明文本框，有些是直接抠图，图片下标小文字单独提取

## 安服售前-AI辅助工具！

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1flvJ103rzWpN81SN6tngca0o2DPy66kG

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
