# GenAI CLI - API Requirements

This document outlines all the APIs required for the GenAI CLI project, including external services, internal endpoints, and third-party integrations.

---

## 📋 Overview

The project consists of:
- **Backend Server**: Express.js REST API (port 3005)
- **Frontend Client**: Next.js web application (port 3000)
- **CLI Tool**: Command-line interface for AI interactions
- **Database**: PostgreSQL with Prisma ORM

---

## 🔐 Authentication APIs

### Better Auth
**Purpose**: Authentication and authorization framework  
**URL**: `http://localhost:3005`  
**Key Endpoints**:
- `/api/auth/*` - All authentication routes (better-auth handles routing)
- Uses device authorization flow for CLI
- Supports GitHub OAuth

**Dependencies**:
- `better-auth` v1.3.34
- `@prisma/client` v6.18.0
- PostgreSQL database

**Environment Variables Required**:
- `GITHUB_CLIENT_ID` - GitHub OAuth client ID
- `GITHUB_CLIENT_SECRET` - GitHub OAuth client secret
- `DATABASE_URL` - PostgreSQL connection string

---

## 🌐 Internal Server Endpoints

### Session Management

#### GET `/api/me`
**Description**: Get current user session  
**Headers**: 
```
Authorization: Bearer <access_token>
```
**Response**:
```json
{
  "user": { "id", "name", "email", "image" },
  "session": { "token", "expiresAt" }
}
```

#### GET `/api/me/:access_token`
**Description**: Get session using token from URL (alternative)  
**Params**: `access_token`  
**Response**: Same as above

### Device Authorization

#### GET `/device`
**Description**: Device flow redirect endpoint  
**Query Params**: `user_code`  
**Redirect**: Redirects to `http://localhost:3000/device?user_code={user_code}`

---

## 🤖 AI/ML APIs

### Google Generative AI (Gemini)
**Purpose**: Main AI model for chat, tool calling, and agentic responses  
**SDK**: `@ai-sdk/google` v2.0.29  
**Model**: `gemini-1.5-flash` (configurable via `ORBITAI_MODEL`)

**Environment Variables**:
- `GOOGLE_GENERATIVE_AI_API_KEY` - Google API key for Gemini

**Capabilities**:
1. **Streaming Text Generation** - Real-time response streaming
2. **Tool Calling** - Multi-step tool invocations with up to 5 steps
3. **Structured Output** - Using `generateObject` for schema validation

### Google AI Tools (from @ai-sdk/google)

#### 1. Google Search Tool
- **ID**: `google_search`
- **Status**: Currently disabled
- **Purpose**: Access latest information for current events/news
- **API**: `google.tools.googleSearch()`

#### 2. Code Execution Tool
- **ID**: `code_execution`
- **Status**: Currently disabled
- **Purpose**: Execute Python code for calculations
- **API**: `google.tools.codeExecution()`

#### 3. URL Context Tool
- **ID**: `url_context`
- **Status**: Currently disabled
- **Purpose**: Analyze content from up to 20 URLs per request
- **API**: `google.tools.urlContext()`

**Note**: Tools are disabled by default. Enable via `enableTools()` function in `tool.config.js`

---

## 📦 Database APIs

### Prisma ORM
**Purpose**: Database abstraction and ORM  
**Provider**: PostgreSQL  
**Version**: `@prisma/client` v6.18.0

**Models**:
1. **User**
   - `id` (primary key)
   - `name`, `email`, `image`
   - Relations: `sessions`, `conversations`

2. **Conversation**
   - `id` (primary key)
   - `userId` (foreign key)
   - `mode` - "chat", "tool", or "agent"
   - `title` - Conversation name
   - `createdAt`, `updatedAt`
   - Relations: `messages`, `user`

3. **Message**
   - `id` (primary key)
   - `conversationId` (foreign key)
   - `role` - "user", "assistant", "system", "tool"
   - `content` - JSON or text
   - `createdAt`
   - Relations: `conversation`

4. **Session** (managed by better-auth)
   - Token-based session management

### Chat Service Methods
- `createConversation(userId, mode, title)`
- `getOrCreateConversation(userId, conversationId, mode)`
- `addMessage(conversationId, role, content)`
- `getMessages(conversationId)`
- `getUserConversations(userId)`
- `deleteConversation(conversationId, userId)`
- `updateTitle(conversationId, title)`
- `formatMessagesForAI(messages)`

---

## 🛠️ CLI Commands & Flows

### Available CLI Commands
- `orbit login` - Authenticate using device flow
- `orbit logout` - Logout current user
- `orbit whoami` - Show current user info
- `orbit wakeup` - Start AI interaction with mode selection

### Modes
1. **Chat** - Simple conversation with AI
2. **Tool Calling** - Chat with access to tools
3. **Agent** - Advanced agentic mode (coming soon)

---

## 🎨 Frontend Client APIs

### Next.js Routes
- `/` - Home/Dashboard
- `/sign-in` - Authentication page
- `/device` - Device code verification
- `/approve` - Approval flow page
- `/device/*` - Device-related pages

### Auth Client (React)
**SDK**: `better-auth` (React plugin)  
**URL**: `http://localhost:3005`  
**Features**:
- Device authorization flow
- Session management
- Automatic token handling

### UI Component Library
- Radix UI components for accessible UI
- Form handling via `react-hook-form`
- Toast notifications via `sonner`

---

## 📡 External API Dependencies

| API | Purpose | Status | Required |
|-----|---------|--------|----------|
| Google Generative AI | Main AI model (Gemini) | Active | ✅ Yes |
| Google Search Tool | Web search capability | Disabled | ⚠️ Optional |
| Google Code Execution | Python code execution | Disabled | ⚠️ Optional |
| Google URL Context | URL content analysis | Disabled | ⚠️ Optional |
| GitHub OAuth | Social authentication | Active | ✅ Yes |

---

## 🔌 Environment Variables Checklist

### Server (.env or .env.local)
```
# Database
DATABASE_URL=postgresql://...

# Google AI
GOOGLE_GENERATIVE_AI_API_KEY=...
ORBITAI_MODEL=gemini-1.5-flash

# GitHub OAuth
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

# Auth
NODE_ENV=development
```

### Client (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3005
```

---

## 🚀 API Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                   CLI / Web Frontend                         │
│           (Next.js + React, Terminal UI)                     │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────────┐
│              Express.js Server (Port 3005)                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Better Auth    │ Chat Service   │ AI Service          │  │
│  │ /api/auth/*    │ Conversations  │ Google Generative AI│  │
│  │ /api/me        │ Messages       │ Tool Calling        │  │
│  │ /device        │ Database Ops   │ Streaming           │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────┬──────────────────────────────────────────┘
                   │
        ┌──────────┼──────────┐
        ↓          ↓          ↓
   ┌─────────┐ ┌────────┐ ┌──────────────┐
   │PostgreSQL│ │Prisma │ │Google APIs   │
   │Database  │ │ORM    │ │- Gemini      │
   │          │ │       │ │- Search      │
   │          │ │       │ │- Code Exec   │
   │          │ │       │ │- URL Context │
   └─────────┘ └────────┘ └──────────────┘
```

---

## ✅ Implementation Status

- ✅ Better Auth (authentication framework)
- ✅ Google Generative AI (Gemini model)
- ✅ Session management (`/api/me`)
- ✅ Device authorization flow
- ✅ Database (Prisma + PostgreSQL)
- ✅ Chat service
- ✅ CLI commands (login, wakeup)
- ⚠️ Tools (disabled, available for enabling)
- ⚠️ Agent mode (coming soon)

---

## 🔄 Data Flow Examples

### Chat Flow
1. User runs `orbit wakeup`
2. CLI fetches user from stored token
3. User selects "Chat" mode
4. CLI creates/loads conversation
5. User enters prompt
6. CLI calls `AIService.sendMessage()`
7. Google Gemini API streams response
8. Messages saved to database
9. Response displayed in terminal

### Tool Calling Flow
1. User selects "Tool Calling" mode
2. Available tools are initialized
3. User enters prompt
4. AI model decides to use tool
5. Tool is executed (up to 5 steps)
6. Results fed back to model
7. Final response generated
8. All steps logged to database

---

## 📚 Key Dependencies Summary

### Server-side
- `express` - Web framework
- `better-auth` - Authentication
- `@ai-sdk/google` - Gemini AI
- `ai` - AI streaming & tools
- `@prisma/client` - ORM
- `prisma` - Migration tool
- `cors` - CORS middleware
- CLI tools: `@clack/prompts`, `chalk`, `commander`, `figlet`, `marked`

### Client-side
- `next` - React framework
- `better-auth` - Auth client
- `@radix-ui/*` - UI components
- `react-hook-form` - Form handling
- `sonner` - Notifications
- `next-themes` - Dark mode

---

**Last Updated**: December 8, 2025  
**Project**: Orbital CLI - AI-Powered CLI Tool
