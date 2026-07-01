import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import officeParser from 'officeparser';
import Resource from '../models/Resource.js';
import protect  from '../middleware/auth.js';
import upload   from '../middleware/upload.js';
import { fetchResourceBuffer } from '../utils/fileAccess.js';
import { aiLimiter } from '../middleware/security.js';

const router = express.Router();

// Apply AI-specific rate limit to all AI routes (30 req / 15 min)
router.use(aiLimiter);

function isOfficeFile(mimeType, filename) {
  const m = mimeType?.toLowerCase() || '';
  const f = filename?.toLowerCase() || '';
  return m.includes('officedocument') || m.includes('ms-word') || m.includes('ms-powerpoint') || f.endsWith('.docx') || f.endsWith('.pptx');
}

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
    const isOffice = isOfficeFile(mimeType, resource.title);

    if (!GEMINI_SUPPORTED.has(mimeType) && !isOffice) {
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

    let result;
    if (isOffice) {
      try {
        const ast = await officeParser.parseOffice(fileBuffer);
        const textContent = ast.toText();
        result = await model.generateContent([
          { text: `Here is the text content extracted from the document "${resource.title}":\n\n${textContent}` },
          PROMPTS[action],
        ]);
      } catch (parseErr) {
        console.error('Office parsing error:', parseErr);
        return res.status(500).json({ message: 'Failed to parse Office file text: ' + parseErr.message });
      }
    } else {
      result = await model.generateContent([
        { inlineData: { mimeType, data: fileBuffer.toString('base64') } },
        PROMPTS[action],
      ]);
    }

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
    const { message, history: historyRaw, resourceIds } = req.body;
    const history = typeof historyRaw === 'string' ? JSON.parse(historyRaw) : (historyRaw || []);
    let parsedResourceIds = [];
    if (resourceIds) {
      parsedResourceIds = typeof resourceIds === 'string' ? JSON.parse(resourceIds) : resourceIds;
    }

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
          if (isOfficeFile(mimeType, req.file.originalname)) {
            try {
              const ast = await officeParser.parseOffice(buffer);
              const textContent = ast.toText();
              parts.push({ text: `The user uploaded a document named "${req.file.originalname}". Here is its extracted text content:\n---\n${textContent}\n---\n` });
            } catch (parseErr) {
              console.warn('[ai/chat] Failed to parse uploaded Office file:', parseErr.message);
              parts.push({ text: `The user uploaded a document named "${req.file.originalname}" but text extraction failed.` });
            }
          } else {
            parts.push({ inlineData: { mimeType, data: buffer.toString('base64') } });
          }
        }
      } catch (e) {
        console.warn('[ai/chat] Failed to fetch uploaded file:', e.message);
      }
    }

    // If course resources were selected, include their content
    if (parsedResourceIds && parsedResourceIds.length > 0) {
      const resources = await Resource.find({ _id: { $in: parsedResourceIds } }).lean();
      const resourceParts = await Promise.all(resources.map(async (resDoc) => {
        if (!resDoc.fileUrl) return null;
        const mimeType = resDoc.mimeType || 'application/pdf';
        try {
          const buffer = await fetchResourceBuffer(resDoc);
          if (isOfficeFile(mimeType, resDoc.title)) {
            try {
              const ast = await officeParser.parseOffice(buffer);
              const textContent = ast.toText();
              return { text: `Course material document (name: "${resDoc.title}") text content:\n---\n${textContent}\n---\n` };
            } catch (parseErr) {
              console.warn('[ai/chat] Failed to parse resource Office file:', parseErr.message);
              return { text: `Course material document (name: "${resDoc.title}") but text extraction failed.` };
            }
          } else {
            // Check if natively supported
            if (GEMINI_SUPPORTED.has(mimeType)) {
               return { inlineData: { mimeType, data: buffer.toString('base64') } };
            } else {
               return { text: `Course material document (name: "${resDoc.title}") has unsupported format ${mimeType}.` };
            }
          }
        } catch (e) {
          console.warn(`[ai/chat] Failed to fetch resource ${resDoc.title}:`, e.message);
          return null;
        }
      }));
      parts.push(...resourceParts.filter(Boolean));
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

    // Build parts for all uploaded files (inlineData for natively supported types, text content for Office files)
    const fileParts = [];
    for (const file of req.files) {
      const fileUrl = file.path; // Cloudinary URL
      const mimeType = file.mimetype || 'application/pdf';
      try {
        const resp = await fetch(fileUrl);
        if (resp.ok) {
          const buffer = Buffer.from(await resp.arrayBuffer());
          if (isOfficeFile(mimeType, file.originalname)) {
            try {
              const ast = await officeParser.parseOffice(buffer);
              const textContent = ast.toText();
              fileParts.push({ text: `Study material document (name: "${file.originalname}") text content:\n---\n${textContent}\n---\n` });
            } catch (parseErr) {
              console.warn(`[generate-quiz] Failed to parse Office file ${file.originalname}:`, parseErr.message);
            }
          } else {
            fileParts.push({ inlineData: { mimeType, data: buffer.toString('base64') } });
          }
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
