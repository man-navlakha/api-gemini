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
// It's highly recommended to use environment variables for API keys in production.
// Replace 'YOUR_GEMINI_API_KEY' with your actual Gemini API Key.
// const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDWrOJa8VHy5Du9jKcLb3zVcCDhlVguNUk';
// Gemini API endpoint for generating content - Updated to use v1 API version and a different model name
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyDWrOJa8VHy5Du9jKcLb3zVcCDhlVguNUk';

// --- Function to interact with Gemini API ---
/**
 * Sends a prompt to the Gemini model and returns the generated content.
 * @param {string} prompt - The user's input prompt.
 * @returns {Promise<{model: string, promptReceived: string, response: string}>} - The model response object.
 * @throws {Error} - If the API call fails.
 */
async function sendToGeminiModel(prompt) {
  try {
    // Make a POST request to the Gemini API
    const response = await axios.post(
      GEMINI_API_URL,
      {
        // Structure of the request body for Gemini's generateContent
        contents: [
          {
            parts: [
              {
                text: prompt // The prompt content goes here
              }
            ]
          }
        ]
      },
      {
        // Configuration for the request, including headers and parameters
        headers: {
          'Content-Type': 'application/json',
        },
        // The API key is passed as a query parameter for Gemini
        params: {
          key: GEMINI_API_KEY
        }
      }
    );

    // --- Extracting the response from Gemini ---
    // The generated text is typically found in response.data.candidates[0].content.parts[0].text
    const generatedText = response.data.candidates &&
                          response.data.candidates[0] &&
                          response.data.candidates[0].content &&
                          response.data.candidates[0].content.parts &&
                          response.data.candidates[0].content.parts[0] &&
                          response.data.candidates[0].content.parts[0].text;

    // Return a structured response object
    return {
      model: 'gemini-1.5-flash-latest', // Indicate the model used
      promptReceived: prompt, // Echo the received prompt
      response: generatedText || 'No text generated', // Return generated text or a default message
    };

  } catch (error) {
    // Log the detailed error and throw a new error for the caller to handle
    console.error('Error calling Gemini API:', error.response ? error.response.data : error.message);
    throw new Error('Failed to fetch response from Gemini API');
  }
}

// --- Express Router for Gemini API interaction ---
const geminiRouter = express.Router();

// Define a unique POST route for chat interactions
// This route will be accessed at /gemini/chat
geminiRouter.post('/chat', async (req, res) => {
  // Extract the prompt from the request body
  const { prompt } = req.body;

  // Validate that a prompt was provided
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  // --- Custom Response Logic ---
  // Check if the prompt includes the word "name" (case-insensitive)
  if (prompt.toLowerCase().includes('name')) {
    // If it does, send the custom response directly
    return res.json({
      model: 'custom-response', // Indicate this is a custom response
      promptReceived: prompt,
      response: 'My name is Solvinger' // The hardcoded response
    });
  }
  // --- Call Gemini API for other prompts ---
  try {
    // Call the function to send the prompt to the Gemini model
    const modelResponse = await sendToGeminiModel(prompt);
    // Send the model's response back to the client
    res.json(modelResponse);
  } catch (error) {
    // Handle errors during the API call
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// --- Mount the Gemini router ---
// All routes defined in geminiRouter will be prefixed with '/gemini'
app.use('/gemini', geminiRouter);

// --- Start the server ---
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Gemini chat endpoint: http://localhost:${port}/gemini/chat`);
});
