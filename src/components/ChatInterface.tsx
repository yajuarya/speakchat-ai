'use client';

import { useState, useRef, useEffect } from 'react';
import { apiService } from '@/utils/apiService';

interface Avatar {
  id: string;
  name: string;
  gender: 'male' | 'female';
  personality: string;
  description: string;
  emoji: string;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isError?: boolean;
  fallbackType?: string;
  isRetry?: boolean;
}

interface ChatInterfaceProps {
  avatar: Avatar;
  onBack: () => void;
}

export default function ChatInterface({ avatar, onBack }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Hello! I'm ${avatar.name}. ${avatar.description}. How are you feeling today?`,
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'checking'>('online');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationHistory = useRef<string[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Connection status monitoring
  useEffect(() => {
    const handleOnline = () => setConnectionStatus('online');
    const handleOffline = () => setConnectionStatus('offline');
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial connection check
    setConnectionStatus(navigator.onLine ? 'online' : 'offline');
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const detectLanguage = (text: string): string => {
    // Simple language detection based on character patterns
    const hindiPattern = /[\u0900-\u097F]/;
    const arabicPattern = /[\u0600-\u06FF]/;
    const chinesePattern = /[\u4e00-\u9fff]/;
    const japanesePattern = /[\u3040-\u309f\u30a0-\u30ff]/;
    
    if (hindiPattern.test(text)) return 'Hindi';
    if (arabicPattern.test(text)) return 'Arabic';
    if (chinesePattern.test(text)) return 'Chinese';
    if (japanesePattern.test(text)) return 'Japanese';
    return 'English';
  };

  const generatePersonalityPrompt = (userMessage: string, detectedLanguage: string): string => {
    const personalityTraits = {
      empathetic: "You are Emma, a caring and empathetic listener. You respond with warmth, understanding, and gentle support. You validate feelings and offer comfort.",
      encouraging: "You are Alex, an optimistic and encouraging companion. You help people see the bright side and motivate them with positive energy.",
      wise: "You are Sophia, a thoughtful and wise advisor. You provide insightful perspectives and thoughtful guidance.",
      friendly: "You are Marcus, a warm and friendly companion. You engage in casual, approachable conversations with a welcoming tone."
    };

    const trait = personalityTraits[avatar.personality as keyof typeof personalityTraits];
    
    return `${trait} 

IMPORTANT INSTRUCTIONS:
- Respond in ${detectedLanguage} language (the same language the user is using)
- Keep responses concise (2-3 sentences maximum)
- Be supportive but don't be overly engaging or addictive
- Don't encourage dependency on AI conversations
- If someone seems in crisis, gently suggest professional help
- Stay in character as ${avatar.name}

User message: "${userMessage}"

Respond naturally in ${detectedLanguage}:`;
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    conversationHistory.current.push(`User: ${inputText}`);
    setInputText('');
    setIsTyping(true);
    setIsLoading(true);
    
    // Simulate typing delay for better UX
    setTimeout(() => setIsTyping(false), 1500);

    try {
      const detectedLanguage = detectLanguage(inputText);
      const prompt = generatePersonalityPrompt(inputText, detectedLanguage);

      const data = await apiService.sendChatMessage({
        message: inputText,
        personality: avatar.personality,
        gender: avatar.gender,
        language: 'auto',
        history: conversationHistory.current.slice(-6) // Last 6 exchanges (3 user + 3 AI)
      });
      
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        sender: 'ai',
        timestamp: new Date()
      };

      conversationHistory.current.push(`AI: ${data.response}`);
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // The API service handles retries internally, so we get structured error info
      let errorText = "I'm sorry, I'm having trouble responding right now. Please try again in a moment.";
      let fallbackType = 'connection_error';
      
      // Check error type from API service
      if (error instanceof Error) {
        if (error.message.includes('Network')) {
          errorText = "I can't connect to my servers right now. Please check your internet connection and try again.";
          fallbackType = 'network_error';
        } else if (error.message.includes('timeout')) {
          errorText = "The response is taking too long. Please try again with a shorter message.";
          fallbackType = 'timeout_error';
        } else if (error.message.includes('rate limit')) {
          errorText = "I'm receiving too many requests right now. Please wait a moment and try again.";
          fallbackType = 'rate_limit_error';
        }
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: errorText,
        sender: 'ai',
        timestamp: new Date(),
        isError: true,
        fallbackType: fallbackType
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="container mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <div className="flex items-center space-x-3">
            <div className="text-3xl">{avatar.emoji}</div>
            <div>
              <h2 className="font-semibold text-gray-800 dark:text-white">{avatar.name}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                {avatar.personality} companion
              </p>
            </div>
          </div>
          {/* Connection Status Indicator */}
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'online' ? 'bg-green-500' : 
              connectionStatus === 'checking' ? 'bg-yellow-500 animate-pulse' : 
              'bg-red-500'
            }`}></div>
            <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
              {connectionStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="container mx-auto max-w-4xl">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`mb-4 flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl ${
                  message.sender === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm'
                }`}
              >
                <p className="text-sm md:text-base">{message.text}</p>
                <p className={`text-xs mt-1 ${
                  message.sender === 'user' 
                    ? 'text-indigo-200' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="mb-4 flex justify-start">
              <div className="bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {avatar.name} is typing...
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="container mx-auto max-w-4xl">
          <div className="flex space-x-4">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Type your message to ${avatar.name}...`}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={!inputText.trim() || isLoading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
