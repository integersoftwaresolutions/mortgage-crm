const os = require("os");
const path = require("path");
const sharp = require("sharp");

const MAX_EDGE_PX = 2200;
const ENG_LANG_PATH = path
  .join(path.dirname(require.resolve("@tesseract.js-data/eng/package.json")), "4.0.0_best_int")
  .replace(/\\/g, "/");
const CACHE_PATH = path.join(os.tmpdir(), "mortgage-crm-tesseract").replace(/\\/g, "/");

let queue = Promise.resolve();

function withOcrLock(task) {
  const run = queue.then(() => task());
  queue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

async function prepareImage(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new Error("OCR requires an image buffer.");
  }

  try {
    return await sharp(buffer, {
      failOn: "none",
      limitInputPixels: 24_000_000,
      pages: 1,
    })
      .rotate()
      .resize({
        width: MAX_EDGE_PX,
        height: MAX_EDGE_PX,
        fit: "inside",
        withoutEnlargement: true,
      })
      .grayscale()
      .png()
      .toBuffer();
  } catch (err) {
    throw new Error(`Could not prepare image for OCR: ${err?.message || err}`);
  }
}

async function recognizeWithWorker(worker, buffer) {
  const image = await prepareImage(buffer);
  const result = await worker.recognize(image);
  return String(result?.data?.text || "").trim();
}

async function withRecognizer(fn) {
  return withOcrLock(async () => {
    const { createWorker } = require("tesseract.js");
    const worker = await createWorker("eng", 1, {
      langPath: ENG_LANG_PATH,
      cachePath: CACHE_PATH,
      errorHandler: (err) => console.error("Tesseract worker error:", err),
    });

    try {
      return await fn((buffer) => recognizeWithWorker(worker, buffer));
    } finally {
      await worker.terminate();
    }
  });
}

async function detectTextFromImage(buffer) {
  return withRecognizer((recognize) => recognize(buffer));
}

module.exports = {
  detectTextFromImage,
  withRecognizer,
};
