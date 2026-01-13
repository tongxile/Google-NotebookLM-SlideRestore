<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>
# 日常痛点：谷歌 NoteBookLM 生成的演示文稿是PDF（内嵌图片的）格式，还不能编辑，而且有的中文还不清或是扭曲
# 实现功能：文字识别，图片分离，图标分离，转换可编辑的 pptx格式
# 用 aistudio.google.com 整的，又手工调试了一会，转换后用PowerPoint和WPS打开都行

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1flvJ103rzWpN81SN6tngca0o2DPy66kG

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
