import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Missing content' });
    }

    // Access the API key securely on the server
    // It should be set as GEMINI_API_KEY in Vercel, but we fallback to VITE_... for local dev compatibility if needed
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: "Missing Gemini API Key on server" });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

    const prompt = `You are an expert educator. Read the following lesson content and generate exactly ONE multiple choice question based on it.
    Return ONLY a valid JSON object in this exact format, with no markdown formatting, no backticks, just the raw JSON:
    {
      "question": "The actual question text?",
      "options": {
        "A": "First option",
        "B": "Second option",
        "C": "Third option",
        "D": "Fourth option"
      },
      "correctOpt": "A"
    }
    
    Lesson Content:
    ${content.substring(0, 3000)}`;

    const result = await model.generateContent(prompt);
    const text = await result.response.text();
    
    const cleanedText = text.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
    const quizResult = JSON.parse(cleanedText);

    return res.status(200).json(quizResult);

  } catch (error) {
    console.error('Error generating quiz:', error);
    return res.status(500).json({ error: 'Failed to generate quiz', details: error.message });
  }
}
