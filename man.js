const express = require('express');
const axios = require('axios');
const app = express();
const port = 5000;
const cors = require('cors');

app.use(express.json());
app.use(cors({
    origin: ['http://localhost:3000', 'https://mysolvingerai.vercel.app'],
    methods: ['POST'],
}));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDWrOJa8VHy5Du9jKcLb3zVcCDhlVguNUk';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyDWrOJa8VHy5Du9jKcLb3zVcCDhlVguNUk';

async function sendToGeminiModel(prompt, shortResponse = false) {  // Added shortResponse parameter
    let finalPrompt = prompt;
    if (shortResponse) {
        finalPrompt += " Respond in a concise and brief manner."; // Instruction for short response
    }

    try {
        const response = await axios.post(
            GEMINI_API_URL,
            {
                contents: [
                    {
                        parts: [
                            {
                                text: finalPrompt
                            }
                        ]
                    }
                ]
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                },
                params: {
                    key: GEMINI_API_KEY
                }
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
            promptReceived: prompt,
            response: generatedText || 'No text generated',
        };

    } catch (error) {
        console.error('Error calling Gemini API:', error.response ? error.response.data : error.message);
        throw new Error('Failed to fetch response from Gemini API');
    }
}

const geminiRouter = express.Router();

geminiRouter.post('/chat', async (req, res) => {
    const { prompt, shortResponse } = req.body;  // Extract shortResponse from request

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    if (prompt.toLowerCase().includes('name')) {
        return res.json({
            model: 'custom-response',
            promptReceived: prompt,
            response: 'My name is Solvinger'
        });
    }

    try {
        const modelResponse = await sendToGeminiModel(prompt, shortResponse); // Pass shortResponse flag
        res.json(modelResponse);
    } catch (error) {
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

app.use('/gemini', geminiRouter);

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`Gemini chat endpoint: http://localhost:${port}/gemini/chat`);
});