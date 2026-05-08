import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Resource from '../models/Resource.js';
import protect  from '../middleware/auth.js';
import { fetchResourceBuffer } from '../utils/fileAccess.js';

const router = express.Router();

// Supported MIME types Gemini can process directly
const GEMINI_SUPPORTED = new Set([
  'application/pdf',
  'text/plain', 'text/html', 'text/css', 'text/csv',
  'text/xml', 'text/rtf', 'text/markdown',
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
]);

const PROMPTS = {
  summary: `You are a helpful academic assistant. Provide a clear, well-structured summary of this document.
Include the main topics, key arguments, and important conclusions.
Use markdown formatting with headings, bullet points, and bold text where appropriate.`,

  quiz: `You are a helpful academic assistant. Generate 8 multiple-choice quiz questions based on this material.
Return ONLY a valid JSON array — no explanation, no markdown code fences, just the raw JSON array:
[{"question":"...","choices":["A. ...","B. ...","C. ...","D. ..."],"correct":0,"explanation":"..."}]
Where "correct" is the 0-based index of the correct answer.`,

  keypoints: `You are a helpful academic assistant. Extract the key points, important concepts, and main takeaways from this material.
Organise them clearly using markdown: headings for topics, bullet points for details, and **bold** for critical terms.`,

  flashcards: `You are a helpful academic assistant. Create 10 study flashcards from this material.
Return ONLY a valid JSON array — no explanation, no markdown code fences, just the raw JSON array:
[{"front":"Concept or question...","back":"Definition or answer..."}]`,
};

// ── POST /api/ai/analyze ─────────────────────────────────────────────────────
router.post('/analyze', protect, async (req, res) => {
  try {
    const { resourceId, action } = req.body;

    if (!PROMPTS[action]) {
      return res.status(400).json({ message: `Invalid action. Use: ${Object.keys(PROMPTS).join(', ')}` });
    }

    const resource = await Resource.findById(resourceId);
    if (!resource || !resource.fileUrl) {
      return res.status(404).json({ message: 'Resource not found or has no file' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ message: 'AI service not configured — add GEMINI_API_KEY to server/.env' });
    }

    const mimeType = resource.mimeType || 'application/pdf';

    if (!GEMINI_SUPPORTED.has(mimeType)) {
      return res.status(422).json({
        message: `File type "${mimeType}" is not supported for AI analysis. Convert to PDF for best results.`,
      });
    }

    // Fetch file bytes via signed Cloudinary URL (bypasses 401 access-control errors)
    let fileBuffer;
    try {
      fileBuffer = await fetchResourceBuffer(resource);
    } catch (fetchErr) {
      return res.status(502).json({ message: fetchErr.message });
    }

    // Call Gemini
    const genAI  = new GoogleGenerativeAI(apiKey);
    const model  = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent([
      { inlineData: { mimeType, data: fileBuffer.toString('base64') } },
      PROMPTS[action],
    ]);

    const text = result.response.text();

    // For JSON actions (quiz/flashcards), parse and validate
    if (action === 'quiz' || action === 'flashcards') {
      try {
        // Strip any accidental code fences
        const clean = text.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(clean);
        return res.json({ action, data: parsed });
      } catch {
        // If Gemini returned non-parseable JSON, return as raw text
        return res.json({ action, data: text, raw: true });
      }
    }

    res.json({ action, data: text });
  } catch (err) {
    console.error('AI analyze error:', err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
