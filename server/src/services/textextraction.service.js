const { convertFileToMarkdown } = require("./document/markdownConversion.service");

async function extractTextFromFile(file) {
  const { plainText } = await convertFileToMarkdown(file);
  return plainText;
}

module.exports = { extractTextFromFile };
