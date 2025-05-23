require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
const port = 5000;
const cors = require('cors');

// Middleware to parse JSON request bodies
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:3000', 'https://mysolvingerai.vercel.app'],
  methods: ['POST'],
}));

// --- API Configuration ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyDWrOJa8VHy5Du9jKcLb3zVcCDhlVguNUk";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

// --- Function to interact with Gemini API ---
async function sendToGeminiModel(messages) {
  try {
    const response = await axios.post(
      GEMINI_API_URL,
      {
        contents: messages.map(message => ({
          role: message.role,
          parts: [{ text: message.text }]
        }))
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const generatedText = response.data.candidates &&
                          response.data.candidates[0] &&
                          response.data.candidates[0].content &&
                          response.data.candidates[0].content.parts &&
                          response.data.candidates[0].content.parts[0] &&
                          response.data.candidates[0].content.parts[0].text;

    return {
      model: 'gemini-1.5-flash-latest',
      promptReceived: messages[messages.length - 1].text,  // Echo the last message as prompt
      response: generatedText || 'No text generated',
    };

  } catch (error) {
    console.error('Error calling Gemini API:', error.response ? error.response.data : error.message);
    throw new Error(error.response?.data?.error?.message || 'Failed to fetch response from Gemini API');
  }
}

// --- Express Router for Gemini API interaction ---
const geminiRouter = express.Router();

geminiRouter.post('/chat', async (req, res) => {
  const { messages } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Messages array is required' });
  }

  const latestMessage = messages[messages.length - 1].text;
  if (latestMessage.toLowerCase().includes('name')) {
    return res.json({
      model: 'custom-response',
      promptReceived: latestMessage,
      response: 'My name is Solvinger'
    });
  }

  try {
    const contextualMessages = [
      { role: 'user', text: 'Answer in a concise and short manner (like you are on a call).' },
      ...messages
    ];

    const modelResponse = await sendToGeminiModel(contextualMessages);
    res.json(modelResponse);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// --- Mount the Gemini router ---
app.use('/gemini', geminiRouter);

// --- Start the server ---
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Gemini chat endpoint: http://localhost:${port}/gemini/chat`);
});
