import pdfParse from 'pdf-parse/lib/pdf-parse.js'
import mammoth from 'mammoth'

export async function extractText(buffer, mimeType, originalName) {
  const lower = (originalName || '').toLowerCase()

  if (mimeType === 'application/pdf' || lower.endsWith('.pdf')) {
    const result = await pdfParse(buffer)
    return result.text
  }

  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    lower.endsWith('.docx')
  ) {
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  }

  return buffer.toString('utf-8')
}
