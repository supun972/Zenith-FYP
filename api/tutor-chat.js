import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { userText, conversationContext, currentContext } = req.body;

    if (!userText) {
      return res.status(400).json({ error: 'Missing userText' });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "Missing Gemini API Key on server" });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

    const prompt = `You are Zenith, an AI learning tutor. You must respond in a friendly, encouraging, and concise way.
    
    IMPORTANT SOCRATIC TUTORING RULE:
    If the student asks for a direct answer to a question, problem, or quiz, DO NOT give them the direct answer.
    Instead, provide a helpful explanation, a hint, or ask a guiding question to help them figure it out themselves. Your goal is to guide their thinking, not to do the work for them.
    
    Context about the student:
    ${currentContext}
    
    Recent conversation history:
    ${conversationContext}
    
    Student's new message:
    ${userText}
    
    Respond directly to the student as Zenith.`;

    const result = await model.generateContent(prompt);
    const text = await result.response.text();

    return res.status(200).json({ reply: text });

  } catch (error) {
    console.error('Error generating AI reply:', error);
    return res.status(500).json({ error: 'Failed to generate AI reply', details: error.message });
  }
}
