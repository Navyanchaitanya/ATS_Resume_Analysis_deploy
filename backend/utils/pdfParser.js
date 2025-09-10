const pdf = require('pdf-parse');

// Extract text from PDF buffer
const extractTextFromPdf = async (buffer) => {
  try {
    const data = await pdf(buffer);
    return data.text.trim();
  } catch (error) {
    console.error('Error reading PDF:', error);
    return '';
  }
};

module.exports = {
  extractTextFromPdf
};