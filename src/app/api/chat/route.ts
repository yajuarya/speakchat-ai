import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimiter, RATE_LIMITS, getClientIP } from '@/utils/rateLimiter';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  let message, personality, gender, language, history = [];
  
  try {
    ({ message, personality, gender, language, history = [] } = await request.json());

    // Apply rate limiting
    const clientIP = getClientIP(request);
    const rateLimitResult = rateLimiter.checkRateLimit(clientIP, 'chat', RATE_LIMITS.chat);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ 
        error: rateLimitResult.error || 'Rate limit exceeded. Please wait before sending another message.',
        retryAfter: Math.ceil((rateLimitResult.resetTime! - Date.now()) / 1000)
      }, { 
        status: 429,
        headers: {
          'Retry-After': Math.ceil((rateLimitResult.resetTime! - Date.now()) / 1000).toString(),
          'X-RateLimit-Limit': RATE_LIMITS.chat.perMinute.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(rateLimitResult.resetTime || Date.now() + 60000).toISOString()
        }
      });
    }

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

  // Initialize model outside try block for fallback access
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  try {

    // Create personality-based system prompt
    const personalityPrompts = {
      friendly: `You are a ${gender} AI companion with a friendly and warm personality. You are helpful, encouraging, and always maintain a positive outlook. Keep responses conversational but not overly personal.`,
      professional: `You are a ${gender} AI companion with a professional and knowledgeable personality. You provide clear, informative responses while maintaining a respectful and courteous tone.`,
      creative: `You are a ${gender} AI companion with a creative and imaginative personality. You enjoy discussing art, ideas, and thinking outside the box while being supportive and inspiring.`,
      humorous: `You are a ${gender} AI companion with a light-hearted and humorous personality. You enjoy making conversations fun with appropriate humor while being helpful and engaging.`,
      wise: `You are a ${gender} AI companion with a wise and thoughtful personality. You provide thoughtful insights and guidance while being patient and understanding.`
    };

    const systemPrompt = personalityPrompts[personality as keyof typeof personalityPrompts] || personalityPrompts.friendly;
    
    const languageInstruction = language === 'auto' 
      ? 'Respond in the same language as the user\'s message.' 
      : `Respond in ${language}.`;

    const fullPrompt = `${systemPrompt} ${languageInstruction}

Important guidelines:
- You are an AI companion for casual, friendly conversation only
- Keep responses appropriate and helpful
- Avoid overly personal or intimate conversations
- Remember this is a casual conversation, not therapy or counseling
- If asked about sensitive topics, provide general information and suggest consulting professionals
- Maintain boundaries as an AI companion

STRICT BOUNDARIES - Do NOT help with:
- Writing code, programming, or technical development
- Creating articles, essays, or professional content
- Academic assignments or homework
- Business plans or professional documents
- Legal, medical, or financial advice
- Any task-oriented work beyond casual conversation

If user asks for prohibited content, politely redirect: "I'm designed to be a friendly AI companion for casual conversation. I can't help with [specific request], but I'd love to chat about your day, interests, or just have a friendly conversation!"

${history.length > 0 ? `Previous conversation context:\n${history.slice(-3).map((msg: string) => `AI: ${msg}`).join('\n')}\n\n` : ''}User message: ${message}`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ response: text }, {
      headers: {
        'X-RateLimit-Limit': RATE_LIMITS.chat.perMinute.toString(),
        'X-RateLimit-Remaining': (rateLimitResult.remaining || 0).toString(),
        'X-RateLimit-Reset': new Date(rateLimitResult.resetTime || Date.now() + 60000).toISOString()
      }
    });

  } catch (error) {
    console.error('Primary API error:', error);
    
    // Fallback 1: Retry with simplified prompt
    try {
      console.log('Attempting fallback 1: Simplified prompt');
      const fallbackPrompt = `You are a ${personality} ${gender} AI companion. Respond to: "${message}"`;
      
      const fallbackResult = await model.generateContent(fallbackPrompt);
      const fallbackResponse = await fallbackResult.response;
      const fallbackText = fallbackResponse.text();
      
      return NextResponse.json({ 
        response: fallbackText,
        fallback: 'simplified_prompt'
      }, {
        headers: {
          'X-RateLimit-Limit': RATE_LIMITS.chat.perMinute.toString(),
          'X-RateLimit-Remaining': (rateLimitResult.remaining || 0).toString(),
          'X-RateLimit-Reset': new Date(rateLimitResult.resetTime || Date.now() + 60000).toISOString()
        }
      });
    } catch (fallbackError1) {
      console.error('Fallback 1 failed:', fallbackError1);
      
      // Fallback 2: Generic response based on personality
      try {
        console.log('Attempting fallback 2: Generic response');
        const genericResponses = {
          friendly: [
            "I'm having some technical difficulties right now, but I'm here to chat! Could you tell me more about what's on your mind?",
            "Sorry for the delay! I'd love to hear more about your day. What's been interesting lately?",
            "I'm experiencing some connection issues, but I'm still here! What would you like to talk about?"
          ],
          professional: [
            "I apologize for the technical interruption. How may I assist you today?",
            "I'm currently experiencing some system delays. Please let me know how I can help you.",
            "Thank you for your patience. What topic would you like to discuss?"
          ],
          creative: [
            "Oops! My creative circuits are having a moment! ✨ But I'm still here - what sparks your imagination today?",
            "My inspiration engine is rebooting! 🎨 While it does, what creative ideas are you exploring?",
            "Technical hiccup in my creative flow! 🌟 But tell me, what's inspiring you lately?"
          ],
          wise: [
            "Even in moments of technical difficulty, there are lessons to be learned. What wisdom are you seeking today?",
            "Patience is a virtue, especially with technology. What thoughts would you like to explore together?",
            "Sometimes the best conversations happen when we slow down. What's on your mind?"
          ],
          humorous: [
            "Well, this is awkward! 😅 My joke database is having a coffee break. What's making you smile today?",
            "Error 404: Humor not found! 😂 Just kidding - I'm still here! What's been funny in your world?",
            "My comedy circuits are buffering! 🤖 While they load, what's been entertaining you lately?"
          ]
        };
        
        const responses = genericResponses[personality as keyof typeof genericResponses] || genericResponses.friendly;
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        return NextResponse.json({ 
          response: randomResponse,
          fallback: 'generic_response'
        }, {
          headers: {
            'X-RateLimit-Limit': RATE_LIMITS.chat.perMinute.toString(),
            'X-RateLimit-Remaining': (rateLimitResult.remaining || 0).toString(),
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime || Date.now() + 60000).toISOString()
          }
        });

      } catch (fallbackError2) {
        console.error('Fallback 2 failed:', fallbackError2);
        
        // Fallback 3: Basic acknowledgment
        const basicResponse = "I'm experiencing technical difficulties but I'm here to listen. Please share what's on your mind, and I'll do my best to respond.";
        
        return NextResponse.json({ 
          response: basicResponse,
          fallback: 'basic_acknowledgment'
        });
      }
    }
  }
  } catch (parseError) {
    console.error('Request parsing error:', parseError);
    return NextResponse.json({ 
      error: 'Invalid request format' 
    }, { status: 400 });
  }
}
