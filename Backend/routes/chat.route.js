
import { Router } from 'express';
import Message from '../models/Message.model.js';
import auth from '../middleware/auth.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config(); 

const router = Router();

const apiKey = process.env.API_KEY;
console.log("API Key from env:", process.env.API_KEY);
if (!apiKey) {
  console.error("GEMINI_API_KEY environment variable not set!");
 
  process.exit(1);
}


const genAI = new GoogleGenerativeAI(process.env.API_KEY);

const getGeminiModel = () => {
  return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
};

router.get('/messages', auth, async (req, res) => {
  try {
    const messages = await Message.find({ userId: req.user.id }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/message', auth, async (req, res) => {
  try {
    const { content } = req.body;

    const userMessage = new Message({
      userId: req.user.id,
      sender: 'user',
      content,
    });

    await userMessage.save();

    const recentMessages = await Message.find({ userId: req.user.id })
      .sort({ timestamp: -1 })
      .limit(10);

    let context = "You are a helpful and empathetic AI journal assistant. Your goal is to help the user reflect on their day, thoughts, and feelings through conversation.";

    if (recentMessages.length > 1) {
      context += " Here's the recent conversation history (most recent last):";
      const formattedMessages = recentMessages
        .reverse()
        .map((msg) => `${msg.sender === 'user' ? 'User' : 'You'}: ${msg.content}`)
        .join('\n');
      context += '\n' + formattedMessages;
    }

    let prompt = content;
    const lcContent = content.toLowerCase();

    if (lcContent.includes('summarize my day')) {
      prompt = "The user has asked to summarize their day.";
    }

    const model = getGeminiModel();

    const result = await model.generateContent({
      contents: [
        { role: 'user', parts: [{ text: context }] },
        { role: 'model', parts: [{ text: 'I understand my role.' }] },
        { role: 'user', parts: [{ text: prompt }] },
      ],
    });

 
    const aiResponse = await result.response.text();

    if (aiResponse) {
      const aiMessage = new Message({
        userId: req.user.id,
        sender: 'ai',
        content: aiResponse,
      });
      await aiMessage.save();
      res.json({ userMessage, aiMessage });
    } else {
      console.error('Empty AI response:', result);
      const fallbackResponse = new Message({
        userId: req.user.id,
        sender: 'ai',
        content: "I'm having trouble generating a response right now. Please try again later.",
      });
      await fallbackResponse.save();
      res.json({ userMessage, aiMessage: fallbackResponse });
    }
  } catch (err) {
    console.error('AI response error:', err);

    const fallbackResponse = new Message({
      userId: req.user.id,
      sender: 'ai',
      content: "I'm having trouble processing your message right now. Could you try again in a moment?",
    });

    await fallbackResponse.save();

    res.status(500).json({
      userMessage: {
        userId: req.user.id,
        sender: 'user',
        content: req.body.content,
      },
      aiMessage: fallbackResponse,
      error: err.message, 
    });
  }
});

export default router;