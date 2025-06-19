# Frontend Interviewer

A self-paced, AI-assisted Frontend Interview Preparation App that guides developers through JavaScript, React, Next.js, TypeScript, MUI, Testing, Performance, CSS, HTML, and other frontend technologies from beginner to expert level.

## Features

- **Structured Learning Path**: Curriculum generated from a comprehensive database.json file
- **Three-Tab Interface**: Theory, Questions, and Tasks for each module
- **AI-Powered Review**: Get feedback on your code and answers using DeepSeek R1 and Gemini 2.5 Flash
- **Progress Tracking**: Track your performance and focus on weak areas
- **Cross-Device Sync**: Firebase Auth and Firestore for seamless experience across devices
- **Mock Exams**: Test your knowledge under timed conditions

## Pages

1. **Module Detail Page** (`/modules/[path]`)
   - Theory Tab: Comprehensive explanations with code examples
   - Questions Tab: MCQs, flashcards, open-ended questions
   - Tasks Tab: Coding challenges with Monaco Editor

2. **Incorrect Items Page** (`/review/incorrect`)
   - Review items you've answered incorrectly
   - "Extend" button generates similar items using AI

3. **Random Chunk Page** (`/random`)
   - Practice with random theory items, questions, or tasks
   - "Shuffle" button loads another random item

4. **Mock Exams Page** (`/mock`)
   - Configure exam parameters (topics, question types, time limit)
   - Get AI feedback on your performance

5. **Settings Page**
   - Set username and preferred AI reviewer

## Tech Stack

- **Framework**: Next.js + React 18 + TypeScript
- **UI**: Material UI (MUI) with dark theme
- **State Management**: Zustand (in-memory) + Firebase (persistent)
- **Editors**: Monaco Editor for code tasks, react-live for theory examples
- **Backend**: Firebase (Auth, Firestore)
- **AI Services**: Gemini 2.5 Flash, DeepSeek R1 via OpenRouter

## Setup

1. Clone the repository
2. Copy `.env.local.example` to `.env.local`
3. Install dependencies: `npm install`
4. Run the development server: `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

- `src/components`: Reusable UI components
- `src/pages`: Next.js pages and routing
- `src/store`: Zustand stores for state management
- `src/services`: Firebase, AI, and data services
- `src/types`: TypeScript interfaces and types
- `src/theme`: MUI theme configuration
- `src/styles`: Global styles
- `database.json`: Source data for curriculum

## Architecture

The application follows a strict architecture with:
- No file exceeding 250 lines (except JSON files)
- Imports always from the nearest module boundary
- Real data and services (no mocks)
- Deterministic curriculum generation with optional AI assistance

## Firebase Schema

```
users (collection)
 └── {uid} (document)
      ├── settings (doc)
      │     • displayName: string
      │     • aiReviewer: 'DeepSeek'|'Gemini'|'Both'
      │
      ├── progress (subcollection)
      │     └── {itemId} (doc)
      │           • itemType: 'theory'|'question'|'task'
      │           • status: 'pending'|'complete'
      │           • updatedAt: timestamp
      │
      ├── submissions (subcollection)
      │     └── {submissionId} (doc)
      │           • taskId: string
      │           • code: string
      │           • result: 'pass'|'fail'
      │           • aiFeedback: string
      │           • createdAt: timestamp
      │
      └── sessions (subcollection)
            └── {sessionId} (doc)
                  • name: string
                  • createdAt: timestamp
                  • archiveUrl?: string
```
