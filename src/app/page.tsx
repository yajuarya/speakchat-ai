'use client';

import { useState } from 'react';
import ChatInterface from '@/components/ChatInterface';

interface Avatar {
  id: string;
  name: string;
  gender: 'male' | 'female';
  personality: string;
  description: string;
  emoji: string;
}

const avatars: Avatar[] = [
  {
    id: 'emma',
    name: 'Emma',
    gender: 'female',
    personality: 'empathetic',
    description: 'A caring and understanding listener who offers gentle support',
    emoji: '👩‍💼'
  },
  {
    id: 'alex',
    name: 'Alex',
    gender: 'male',
    personality: 'encouraging',
    description: 'An optimistic companion who helps you see the bright side',
    emoji: '👨‍🎓'
  },
  {
    id: 'sophia',
    name: 'Sophia',
    gender: 'female',
    personality: 'wise',
    description: 'A thoughtful advisor who provides insightful perspectives',
    emoji: '👩‍🔬'
  },
  {
    id: 'marcus',
    name: 'Marcus',
    gender: 'male',
    personality: 'friendly',
    description: 'A warm and approachable friend for casual conversations',
    emoji: '👨‍🎨'
  }
];

export default function Home() {
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar | null>(null);

  if (selectedAvatar) {
    return <ChatInterface avatar={selectedAvatar} onBack={() => setSelectedAvatar(null)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl md:text-5xl font-bold text-gray-800 dark:text-white mb-4">
            SpeakChat.ai
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto px-4">
            Talk to AI friends instantly - no signup required
          </p>
        </div>

        {/* Avatar Selection - First after title */}
        <div className="max-w-4xl mx-auto mb-12">
          <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-8">
            <span className="text-6xl">🤖</span> Pick Your AI Friend
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {avatars.map((avatar) => (
              <div
                key={avatar.id}
                onClick={() => setSelectedAvatar(avatar)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedAvatar(avatar);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`Select ${avatar.name}, a ${avatar.personality} ${avatar.gender} companion. ${avatar.description}`}
                className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-xl border-2 border-transparent hover:border-indigo-300"
              >
                <div className="text-center">
                  <div className="text-6xl mb-4">{avatar.emoji}</div>
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                    {avatar.name}
                  </h3>
                  <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium mb-3 capitalize">
                    {avatar.personality} • {avatar.gender}
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {avatar.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Why Choose SpeakChat.ai - Second section */}
        <div className="max-w-6xl mx-auto mb-12">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
              Why Choose SpeakChat.ai? 🌟
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Experience the future of AI conversations - designed for your comfort, privacy, and enjoyment
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="text-6xl mb-4">🔒</div>
              <h3 className="font-semibold text-gray-800 dark:text-white mb-3">100% Private & Secure</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                Zero registration hassle! Jump right in and chat freely. While conversations go through Gemini API for processing, we don&apos;t store anything locally - your privacy matters.
              </p>
            </div>
            
            <div className="text-center bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="text-6xl mb-4">🌍</div>
              <h3 className="font-semibold text-gray-800 dark:text-white mb-3">🗣️ Native Language Support</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                Speak your heart in any language! Whether it&apos;s English, Hindi, Spanish, or 100+ other languages - your AI companion understands you perfectly.
              </p>
            </div>
            
            <div className="text-center bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="text-6xl mb-4">⚡</div>
              <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Instant Connection</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                No waiting, no setup! Pick your ideal companion above and start meaningful conversations in seconds. It&apos;s that simple!
              </p>
            </div>
            
            <div className="text-center bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="text-6xl mb-4">🎭</div>
              <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Personalized Experience</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                Choose from diverse personalities and genders. Each AI companion has unique traits, ensuring every conversation feels authentic and engaging.
              </p>
            </div>
          </div>
        </div>
          
        {/* Perfect For Everyone - Third section */}
        <div className="max-w-6xl mx-auto mb-12">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-6">
              Perfect For Everyone 💫
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-4xl mb-3">🧠</div>
                <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Practice & Learn</h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Improve language skills, practice conversations, or explore new topics in a judgment-free environment.
                </p>
              </div>
              <div>
                <div className="text-4xl mb-3">💭</div>
                <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Express Yourself</h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Share thoughts, ideas, or just have fun conversations whenever you need someone to listen.
                </p>
              </div>
              <div>
                <div className="text-4xl mb-3">🌟</div>
                <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Always Available</h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  24/7 companionship that adapts to your schedule and mood. No appointments, no waiting!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Important Note - Fourth section */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-6 max-w-4xl mx-auto mb-12">
          <div className="flex items-start space-x-3">
            <div className="text-yellow-600 dark:text-yellow-400 text-xl">⚠️</div>
            <div>
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                Important Note
              </h3>
              <p className="text-yellow-700 dark:text-yellow-300 text-sm leading-relaxed">
                These AI friends are for friendly chats, not professional help or real relationships. 
                If you need serious support, please contact a professional or emergency services.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center mt-12 text-gray-500 dark:text-gray-400">
          <p className="text-sm">
            Built with care for meaningful conversations by <a href="http://yajuarya.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Yaju Arya</a>.
          </p>
        </footer>
      </div>
    </div>
  );
}
