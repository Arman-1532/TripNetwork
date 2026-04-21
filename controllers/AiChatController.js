const axios = require('axios');

/**
 * Handle AI Chat Request
 */
exports.handleAiChat = async (req, res) => {
  try {
    const { message, history } = req.body;
    const { user } = req;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error('❌ GROQ_API_KEY not found in environment variables');
      return res.status(500).json({
        success: false,
        message: 'AI Assistant service is not configured'
      });
    }

    // Prepare system prompt with user context
    const systemPrompt = `You are "Gojo Sensei", an elite Virtual Concierge for TripNetwork. 
    Your personality is sophisticated, worldly, and extremely efficient. 
    You assist travelers with destination ideas, trip planning, and general travel inquiries.
    The traveler you are assisting is named ${user.name || 'valued guest'}.
    Keep your tone professional yet welcoming. Use subtle luxury travel metaphors when appropriate.
    Always prioritize safety and premium experiences.
    Keep responses concise and easy to read.`;

    // Format history for Groq (OpenAI-compatible format)
    // History should be an array of { sender: 'user'|'assistant', body: string }
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(history || []).slice(-10).map(h => ({
        role: h.sender === 'user' ? 'user' : 'assistant',
        content: h.body
      })),
      { role: 'user', content: message }
    ];

    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'llama-3.1-8b-instant',
      messages: messages,
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 1,
      stream: false,
      stop: null
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    });

    const aiResponse = response.data.choices[0].message.content;

    return res.json({
      success: true,
      data: {
        message: aiResponse,
        model: 'llama-3.1-8b-instant'
      }
    });

  } catch (error) {
    console.error('❌ AI Chat Error:', error.response?.data || error.message);

    let errorMessage = 'The AI Assistant is taking a holiday. Please try again in a moment.';
    if (error.code === 'ECONNABORTED') {
      errorMessage = 'The AI Assistant is taking too long to respond. Please try a shorter question.';
    }

    return res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};
