import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Resource from '../models/Resource.js';
import protect  from '../middleware/auth.js';
import upload   from '../middleware/upload.js';
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
Include the main topics, key arguments, important conclusions, and key takeaways.
Highlight critical concepts and terms.
Use markdown formatting with headings, bullet points, and bold text where appropriate.`,

  quiz: `You are a helpful academic assistant. Generate 8 multiple-choice quiz questions based on this material.
Return ONLY a valid JSON array — no explanation, no markdown code fences, just the raw JSON array:
[{"question":"...","choices":["A. ...","B. ...","C. ...","D. ..."],"correct":0,"explanation":"..."}]
Where "correct" is the 0-based index of the correct answer.`,

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
    const model  = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
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

// ── POST /api/ai/chat ─────────────────────────────────────────────────────────
// General-purpose study chatbot. Optionally accepts a file upload.
//   body: { message: string, history: [{role:'user'|'model', text:string}] }
//   file: optional single file via multipart form
router.post('/chat', protect, upload.single('file'), async (req, res) => {
  try {
    const { message, history: historyRaw } = req.body;
    const history = typeof historyRaw === 'string' ? JSON.parse(historyRaw) : (historyRaw || []);

    if (!message?.trim()) {
      return res.status(400).json({ message: 'message is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ message: 'AI service not configured' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-flash-latest',
      systemInstruction:
        'You are a friendly and knowledgeable academic study assistant. ' +
        'Help students understand course material, explain concepts clearly, ' +
        'answer study questions, and provide guidance on academic topics. ' +
        'Keep responses concise, well-structured, and use markdown formatting where helpful.',
    });

    // Build message parts
    const parts = [];

    // If a file was uploaded, include its content
    if (req.file) {
      const fileUrl = req.file.path; // Cloudinary secure_url
      const mimeType = req.file.mimetype || 'application/octet-stream';
      try {
        const resp = await fetch(fileUrl);
        if (resp.ok) {
          const buffer = Buffer.from(await resp.arrayBuffer());
          parts.push({ inlineData: { mimeType, data: buffer.toString('base64') } });
        }
      } catch (e) {
        console.warn('[ai/chat] Failed to fetch uploaded file:', e.message);
      }
    }

    parts.push({ text: message.trim() });

    // Reconstruct chat history in Gemini's format
    const chat = model.startChat({
      history: history.map(h => ({
        role:  h.role,
        parts: [{ text: h.text }],
      })),
    });

    const result = await chat.sendMessage(parts);
    const reply  = result.response.text();

    res.json({ reply });
  } catch (err) {
    console.error('AI chat error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/ai/generate-quiz ───────────────────────────────────────────────
// Accepts multiple file uploads + questionCount. Generates quiz questions via AI.
router.post('/generate-quiz', protect, upload.array('files', 10), async (req, res) => {
  try {
    if (!['lecturer', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorised' });
    }

    const questionCount = Math.min(30, Math.max(3, parseInt(req.body.questionCount) || 10));

    if (!req.files?.length) {
      return res.status(400).json({ message: 'Upload at least one file' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ message: 'AI service not configured' });
    }

    // Build inline data parts for all uploaded files
    const fileParts = [];
    for (const file of req.files) {
      const fileUrl = file.path; // Cloudinary URL
      const mimeType = file.mimetype || 'application/pdf';
      try {
        const resp = await fetch(fileUrl);
        if (resp.ok) {
          const buffer = Buffer.from(await resp.arrayBuffer());
          fileParts.push({ inlineData: { mimeType, data: buffer.toString('base64') } });
        }
      } catch (e) {
        console.warn(`[generate-quiz] Failed to fetch file ${file.originalname}:`, e.message);
      }
    }

    if (!fileParts.length) {
      return res.status(422).json({ message: 'Could not process any of the uploaded files' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

    const prompt = `You are a helpful academic assistant. Based on the uploaded study materials, generate EXACTLY ${questionCount} multiple-choice quiz questions.

Each question should:
- Test understanding of key concepts from the material
- Have 4 answer options (A, B, C, D)
- Include a brief explanation for the correct answer

Return ONLY a valid JSON array — no explanation, no markdown code fences, just the raw JSON array:
[{"question":"...","choices":["A. ...","B. ...","C. ...","D. ..."],"correct":0,"explanation":"..."}]
Where "correct" is the 0-based index of the correct answer.
Generate EXACTLY ${questionCount} questions.`;

    const result = await model.generateContent([...fileParts, prompt]);
    const text = result.response.text();

    try {
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      res.json({ questions: parsed });
    } catch {
      res.json({ questions: text, raw: true });
    }
  } catch (err) {
    console.error('AI generate-quiz error:', err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
