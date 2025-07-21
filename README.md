# AI Email Sorter

An intelligent email management system with AI-powered categorization, summarization, and automated unsubscribe functionality.

## Features
- 🔐 Google OAuth authentication
- 📧 Multiple Gmail account support
- 🤖 AI-powered email categorization
- 📝 Email summarization
- 🔗 Automated unsubscribe link extraction
- 🗑️ Bulk email management
- 📊 Email analytics

## Live Demo
🌐 **Production URL**: [Your Render URL will go here]

## Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB Atlas
- **AI**: OpenAI GPT-3.5-turbo
- **OAuth**: Google OAuth 2.0
- **Deployment**: Render

## Local Development
```bash
# Install dependencies
npm run install:all

# Start development servers
npm run dev
```

## Environment Variables
- `MONGO_URI`: MongoDB connection string
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `JWT_SECRET`: JWT signing secret
- `OPENAI_API_KEY`: OpenAI API key
- `NODE_ENV`: Set to 'production' for deployment