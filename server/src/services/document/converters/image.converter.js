const { formatOcrTextAsMarkdown } = require("../markdownFormatters");
const { detectTextFromImage } = require("../ocr.service");

async function convertImageToMarkdown({ buffer, fileName }) {
  const text = await detectTextFromImage(buffer);
  return {
    markdown: formatOcrTextAsMarkdown(fileName, text),
    method: "tesseract",
  };
}

module.exports = { convertImageToMarkdown };
