# 🗣️ SpeakChat.ai

An innovative web-based AI companion application that allows users to have natural conversations with AI avatars without requiring login or registration.

## 🌟 Introduction

SpeakChat.ai is a Next.js-powered application that provides users with personalized AI companions. Choose your preferred gender and personality, and engage in meaningful conversations in multiple languages. Built with privacy-first principles and powered by Google's Gemini AI.

## ✨ Features

### Core Functionality
- 🤖 **AI Avatar Selection**: Choose between male and female AI companions
- 🎭 **Personality Customization**: Select from various personality types (Friendly, Professional, Creative, Humorous, Wise, Energetic)
- 🌍 **Multi-language Support**: Communicate in your native language with automatic detection
- 💬 **Real-time Chat**: Instant messaging with typing indicators and loading states
- 🧠 **Conversation Memory**: Basic context retention during chat sessions

### Technical Features
- 🔒 **No Login Required**: Start chatting immediately without registration
- 🛡️ **Privacy-Focused**: No data storage, conversations are ephemeral
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- ⚡ **Fast Performance**: Optimized with Next.js and modern web technologies
- 🔄 **Retry Mechanisms**: Automatic retry for failed API requests
- 📊 **Connection Monitoring**: Real-time connection status tracking

## 🎯 User Experience

### Simple 3-Step Process
1. **Choose Your Companion**: Select gender and personality
2. **Start Chatting**: Begin conversation immediately
3. **Enjoy**: Natural, engaging AI conversations

### Visual Indicators
- ⌨️ Typing indicators when AI is responding
- 🔄 Loading states for better user feedback
- 🟢 Connection status monitoring
- ❌ Clear error messages with retry options

## 🔐 Data Management

- **No User Registration**: Anonymous usage
- **No Data Storage**: Conversations are not saved
- **Session-Based**: Memory only lasts during active session
- **Privacy-First**: No tracking or analytics

## 🚀 Quickstart

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- Google Gemini API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yajuarya/speakchat-ai.git
   cd speakchat-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your API keys
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 🔧 Environment Variables

Create a `.env.local` file in the root directory:

```env
# Required API Keys
GEMINI_API_KEY=your_gemini_api_key_here

# Optional Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000
```

### Required API Keys
- **GEMINI_API_KEY**: Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

## 📁 Project Structure

```
speakchat-ai/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat/
│   │   │   │   └── route.ts      # Chat API endpoint
│   │   │   └── health/
│   │   │       └── route.ts      # Health check endpoint
│   │   ├── globals.css           # Global styles
│   │   ├── layout.tsx            # Root layout
│   │   └── page.tsx              # Home page
│   ├── components/
│   │   └── ChatInterface.tsx     # Main chat component
│   └── utils/
│       ├── apiService.ts         # API service layer
│       └── rateLimiter.ts        # Rate limiting utility
├── public/                       # Static assets
├── .env.local                    # Environment variables
├── package.json                  # Dependencies
└── README.md                     # This file
```

## 🔌 API Endpoints

### POST /api/chat
Send a message to the AI companion.

**Request Body:**
```json
{
  "message": "Hello, how are you?",
  "personality": "friendly",
  "gender": "female",
  "language": "auto"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Hello! I'm doing great, thank you for asking...",
  "conversationId": "unique-session-id"
}
```

### GET /api/health
Check API health status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 📖 Usage Guide

### Starting a Conversation
1. Visit the homepage
2. Select your preferred AI companion gender
3. Choose a personality type
4. Start typing your message
5. Press Enter or click Send

### Personality Types
- **Friendly**: Warm, approachable, and supportive
- **Professional**: Formal, knowledgeable, and efficient
- **Creative**: Imaginative, artistic, and inspiring
- **Humorous**: Witty, playful, and entertaining
- **Wise**: Thoughtful, philosophical, and insightful
- **Energetic**: Enthusiastic, motivating, and dynamic

### Language Support
The app automatically detects your language or you can specify it. Supported languages include English, Spanish, French, German, Italian, Portuguese, and many more.

## 🛠️ Development

### Running in Development Mode
```bash
npm run dev
```

### Building for Production
```bash
npm run build
npm start
```

### Code Quality
```bash
npm run lint        # ESLint
npm run type-check  # TypeScript checking
```

## 🤝 Contributing

We welcome contributions to SpeakChat.ai!

### Reporting Issues
1. Check existing issues first
2. Create a detailed bug report
3. Include steps to reproduce
4. Add screenshots if applicable

### Pull Requests
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Development Setup
1. Follow the installation steps above
2. Create a new branch for your feature
3. Make changes and test thoroughly
4. Ensure code passes linting
5. Submit your pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 About the Creator

**Yaju Arya**  
Full-Stack Developer & AI Enthusiast  
🌐 Website: [http://yajuarya.com](http://yajuarya.com)  
📧 Email: yajuarya@gmail.com  

Passionate about creating innovative AI applications that enhance human-computer interaction while maintaining privacy and accessibility.

---

**Made with ❤️. Star this repo if you found it helpful!**
