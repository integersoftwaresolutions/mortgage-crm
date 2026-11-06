const { PDFParse } = require("pdf-parse");
const {
  formatPdfTextAsMarkdown,
  formatOcrTextAsMarkdown,
} = require("../markdownFormatters");
const { withRecognizer } = require("../ocr.service");

const PDF_TEXT_LAYER_MIN_CHARS = 20;
const OCR_RENDER_SCALE = 2.5;

function visibleText(raw) {
  return String(raw || "").replace(/\f/g, "").trim();
}

async function convertPdfToMarkdown({ buffer, fileName }) {
  const parser = new PDFParse({ data: buffer });

  try {
    let raw = "";
    let total = 0;

    try {
      const result = await parser.getText({ pageJoiner: "\f" });
      raw = String(result?.text || "");
      total = Number(result?.total || 0);
    } catch (_) {
      raw = "";
    }

    if (visibleText(raw).length > PDF_TEXT_LAYER_MIN_CHARS) {
      return {
        markdown: formatPdfTextAsMarkdown(fileName, raw),
        method: "pdf-parse",
      };
    }

    if (!total) {
      try {
        const info = await parser.getInfo();
        total = Number(info?.total || 0);
      } catch (_) {
        total = 0;
      }
    }

    const pageTexts = [];
    if (total > 0) {
      console.log(`OCR ${fileName}: ${total} scanned page(s)`);
      await withRecognizer(async (recognize) => {
        for (let pageNumber = 1; pageNumber <= total; pageNumber += 1) {
          const shot = await parser.getScreenshot({
            first: pageNumber,
            last: pageNumber,
            scale: OCR_RENDER_SCALE,
            imageDataUrl: false,
            imageBuffer: true,
          });
          const page =
            (shot?.pages || []).find((item) => item.pageNumber === pageNumber) ||
            shot?.pages?.[0];
          const bytes = page?.data;
          if (!bytes || !bytes.length) {
            pageTexts.push("");
            continue;
          }
          pageTexts.push(await recognize(Buffer.from(bytes)));
        }
      });
    }

    return {
      markdown: formatOcrTextAsMarkdown(fileName, pageTexts.join("\f")),
      method: "tesseract",
    };
  } finally {
    await parser.destroy();
  }
}

module.exports = { convertPdfToMarkdown };
