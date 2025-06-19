## 1. Purpose & Vision

Build a self-paced, AI-assisted **Frontend Interview Preparation App** that:

- Generates a theme-based curriculum from structured database.json file.
- Guides developers through JavaScript, React, Next.js, TypeScript, MUI, Testing, Performance, CSS, Html, other etc., from **beginner → expert**.
- Syncs progress and settings across devices using **Firebase Auth** and **Firebase**.
- Uses AI (DeepSeek R1, Gemini 2.5 Flash 05-20) for code review.
- Uses AI button on Random Questions/Tasks,  Incorrect Items,  **Mock Exams** pages.
- The app is a "personal coach." It tracks every correct/incorrect answer and code submission to identify weak areas.

------

## 2. App Pages & Tabs

### 1. Module Detail Page (`/modules/[path]`)

Displays a **three-tab interface** for each learning path/module:

- **Theory Tab**  
  - Component: `TheoryList` → multiple `TheoryCard`  
  - Cards show titles & excerpts; clicking opens `TheoryView`.

- **Questions Tab**  
  - Component: `QuestionList` → multiple `QuizCard`  
  - Supports types: MCQ, Flashcard, Open-ended, Code-trace  
  - Each card has an "Irrelevant" checkbox (checked questions are permanently hidden).

- **Tasks Tab**  
  - Component: `TaskList` → multiple Tasks  
  - Coding tasks & open-ended code questions  
  - Each card has an "Irrelevant" checkbox (checked tasks are permanently hidden).

###  Solution Submission & AI Review Flow (Tasks & Open-ended Questions)

1. **Submit Solution**  
   - Monaco editor (tasks) or textarea (open-ended questions).  
   - Click **"Submit for AI Review"**.

2. **Structured AI Prompt**  
   ```json
   {
     "itemId": "...",
     "type": "task" | "question",
     "prompt": "<original description/question>",
     "userCode": "<user solution code>",
     "testCases": [ ... ] // optional
   }
   AI Analysis

Sends structured prompt to selected AI (DeepSeek R1, Gemini 2.5, or both). Evaluates correctness, efficiency, style, edge-cases. AI Feedback Parsed into:Correctness: ✅ or ❌

---

### 2. Incorrect Items Page (/review/incorrect)

Reuses main UI components (TheoryCard, QuizCard, Task). 

Shows all incorrect questions & tasks.

"Extend" button:Uses AI to generate similar items based on tags & metadata. Writes new similar items into a dedicated Firestore collection (matching original index.ts types).

---

### 3. Random Chunk Page (/random)

Reuses existing components (TheoryCard, QuizCard, Task).

Shows a random TheoryItem, QuestionItem, or TaskItem from database.json.

"Shuffle" button: loads another random item.

---

### 4. Mock Exams Page (/mock)

Reuses existing components (TheoryCard, QuizCard, Task).

Config: Choose topics, number of MCQs/Open/Coding tasks, time limit.

Start: "Start Exam" button begins exam.

Exam UI:Timer, question progress (Q n of N). MCQ/Open-ended/Coding pane. Navigation: Next, Previous, "Mark for Review". Submit: Manual submission.

AI Feedback:MCQs/Open-ended: instant grading + explanations. 

Coding: DeepSeek tests + Gemini efficiency/style feedback.

Persistence: Attempts & AI feedback stored in Firestore (users/{uid}/exams).

---

### 5. Settings page:

Username, AI Reviewer Dropdown with 3 choices (DeepSeek | Gemini | DeepSeek and Gemini).



## 3. Data Ingestion & Validation

- **Input:** JSON “chunks” parsed from large Markdown source (e.g. `database.json).
- **Validation:** Runtime checks against the following TypeScript interfaces.

###  Data Models

```
ts

export type Difficulty = 'easy' | 'medium' | 'hard';
export type QuestionType = 'mcq' | 'code' | 'open' | 'flashcard';
export type Technology =
  | 'React' | 'Next.js' | 'TypeScript' | 'JavaScript'
  | 'MUI' | 'Testing' | 'Performance' | 'CSS' | 'HTML' | 'Other';

// Theory blocks
export interface TheoryItem {
  id: string;
  title: string;
  content: string;              // Markdown
  examples: CodeExample[];
  relatedQuestions: string[];   // QuestionItem IDs
  relatedTasks: string[];       // TaskItem IDs
  tags: string[];
  technology: Technology;

  // Sequencing fields
  prerequisites: string[];      // IDs of TheoryItem or TaskItem
  complexity: number;           // 1–10 conceptual difficulty
  interviewRelevance: number;   // 1–10 real-world relevance
  learningPath:                // course stage
    | 'beginner' | 'intermediate' | 'advanced' | 'expert';
  requiredFor: string[];        // downstream TheoryItem IDs
}

// Interview questions
export interface QuestionItem {
  id: string;
  topic: string;
  level: Difficulty;
  type: QuestionType;
  question: string;
  answer: string;
  example: string;
  tags: string[];
  options: string[];
  analysisPoints: string[];
  keyConcepts: string[];
  evaluationCriteria: string[];
  irrelevant: boolean;
  // Sequencing fields
  prerequisites: string[];      // IDs of TheoryItem or QuestionItem
  complexity: number;           // 1–10 conceptual difficulty
  interviewFrequency: number;   // 1–10 real-world frequency
  learningPath:                // course stage
    | 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

// Coding tasks
export interface TaskItem {
  id: string;
  title: string;
  description: string;          // Markdown
  difficulty: Difficulty;
  startingCode: string;
  solutionCode: string;
  testCases: string[];
  hints: string[];
  tags: string[];
  timeEstimate: number;         // minutes
  irrelevant: boolean;
  // Sequencing fields
  prerequisites: string[];      // IDs of TheoryItem or TaskItem
  complexity: number;           // 1–10 implementation difficulty
  interviewRelevance: number;   // 1–10 real-world relevance
  learningPath:                // course stage
    | 'beginner' | 'intermediate' | 'advanced' | 'expert';
  relatedConcepts: string[];    // TheoryItem IDs
}
```



### 4. The Complete, Step-by-Step Curriculum Generation Flow**

Main database.json file  is in root of project.

This document outlines the exact chronological sequence of operations for our hybrid engine. It describes the end-to-end process, from ingesting the raw database.json to producing a final, adaptive curriculum.

#### **Phase 1: Foundational Data Preparation & Analysis (Deterministic Pre-processing)**

This phase runs first, ingesting the entire database to build global data structures that inform all subsequent steps.

- **Step 1: Comprehensive Metadata Extraction**
  - 
  - **Action:** A pure TypeScript function ingests the database.json array. It iterates through every TheoryItem, QuestionItem, and TaskItem, extracting their complete metadata while preserving their original array indexes.
  - **Specific Fields Extracted:**
    - 
    - **TheoryItem**: relatedQuestions, relatedTasks, tags, technology, prerequisites, complexity, interviewRelevance, learningPath, requiredFor.
    - **QuestionItem**: topic, level, type, analysisPoints, keyConcepts, evaluationCriteria, tags, complexity, interviewFrequency, learningPath.
    - **TaskItem**: difficulty, tags, prerequisites, complexity, interviewRelevance, learningPath, relatedConcepts.
- **Step 2: Building Global Foundational Graphs**
  - 
  - **Action:** Using the fully extracted metadata from Step 1, the system constructs two critical, global graphs.
  - **Graph 1 (Dependency Graph):** Creates directed edges "A → B" if item A is listed in item B's prerequisites field, or if item B is listed in item A's requiredFor field. This maps all inviolable prerequisite chains.
  - **Graph 2 (Similarity Graph):** Creates undirected edges between items. Edges are weighted based on shared tags, technology, relatedConcepts, and keyConcepts. The weight is given a significant boost if items also share the same learningPath.
- **Step 3: Initial Deterministic Scoring**
  - 
  - **Action:** To create a logical baseline, a composite score is assigned to every item.
  - **Scoring Criteria:**
    1. 
    2. **Prerequisite Depth:** A topological sort on the Dependency Graph identifies foundational items to be placed earlier.
    3. **Difficulty & Relevance:** A weighted sum of complexity, difficulty, level, interviewRelevance, and interviewFrequency.
    4. **Thematic Cohesion:** A boost is given for clustering by learningPath and technology.

#### **Phase 2: AI-Assisted Clustering & Sequencing (Microservice)**

This phase uses the **AI-Assisted Curriculum-Builder Service**, a dedicated TypeScript microservice leveraging **Google Gemini 1.5 Flash Preview**, to analyze the content and define the curriculum's high-level structure.

- 

- **Step 4: Stream and Chunk the Database (ChunkManager)**

  - 
  - **Action:** The ChunkManager component reads the huge database.json (200–300 MB) via a streaming parser (e.g., JSONStream). It splits the data into manageable ~50 MB chunks. Each item in a chunk retains its full metadata and original index.

- **Step 5: Process Each Chunk with Gemini (PromptBuilder, AIClient)**

  - 
  - **Action:** For each chunk, the PromptBuilder constructs a detailed prompt. The AIClient then sends the prompt and chunk data to the Gemini endpoint, ensuring the total token count is ≤ 1,000,000.
  - **Prompt Template:**

  > “You have 1,000 content items (indexes X–Y), each with these metadata fields: [list of all specific fields from Step 1]. Identify prerequisite chains and group them into natural thematic clusters (e.g., *Event Loop*, *React State*, *CSS Layout*). Propose an ordered learning sequence from beginner to expert for each cluster. Return the ordered list of original indexes per cluster.”

  - 
  - **Result:** The Analyzer component parses Gemini's response, which is an ordered list of indexes for that chunk, often grouped by the AI-identified clusters. This intermediate result is saved (e.g., curriculum.chunks/chunk-<n>.json).

#### **Phase 3: Final Aggregation, Refinement, and Assembly**

This phase takes the AI's chunk-level suggestions and combines them with deterministic rules to produce the final, coherent curriculum file.

- 
- **Step 6: Merge, Deduplicate, and Resolve Dependencies (Aggregator)**
  - 
  - **Action:** The Aggregator component takes the results from all processed chunks.
  - **Sub-step 1 (Merge):** It concatenates all chunk-level index arrays in their original numeric order.
  - **Sub-step 2 (Deduplicate):** It removes duplicate indexes while preserving the relative ordering.
  - **Sub-step 3 (Cross-Chunk Dependency Resolution):** It uses the global Dependency Graph from Step 2 to scan the merged list. If an item's prerequisite lives in another chunk and appears later in the sequence, the Aggregator re-orders the items to fix the violation.
- **Step 7: Optional Final AI Pass (Sequencer)**
  - 
  - **Action:** The Sequencer component can optionally send the entire merged and corrected index list back to Gemini with a prompt to "refine the overall sequence," smoothing out the progression across the full curriculum.
- **Step 8: Final Rule-Based Ordering Within Modules**
  - 
  - **Action:** The AI-identified clusters are now treated as formal **modules**. The system applies a final, strict ordering pass within each module.
  - **Rules Applied:**
    1. 
    2. **Topological Sort:** The Dependency Graph is used to ensure all prerequisites strictly come before their dependent items within the module.
    3. **Tie-Breaking:** When multiple items are eligible at the same "layer," they are ordered with the following priority:
       1. 
       2. **Lower complexity / difficulty / level first.**
       3. **Higher interviewRelevance / interviewFrequency first.**
       4. **Higher tag density first** (items with more tags go earlier to maximize concept coverage).
- **Step 9: Interleave Content for Pedagogical Flow**
  - 
  - **Action:** The system iterates through the finalized, ordered list. When it encounters a TheoryItem, it programmatically inserts the items listed in its relatedQuestions and relatedTasks fields immediately after it. This reinforces each concept immediately with practice.
- **Step 10: Compose Final curriculum.json (Writer)**
  - 
  - **Action:** The Writer component takes the final, fully-ordered list of indexes. It maps each index back to its full object from the original database.json and assembles them into the final curriculum.json file—a sequenced array of full objects forming the beginner-to-expert program.

#### **Phase 4: Runtime Adaptation (Live User Interaction)**

This final phase occurs *after* the curriculum is generated and is specific to an individual user's learning journey.

- **Step 11: Adaptive Review Injection**
  - 
  - **Action:** As a user progresses, their performance metrics are tracked in a Firestore database. A deterministic logic monitors this data. If a user's performance in any cluster (module) falls below a predefined threshold, the system dynamically sprinkles in spaced-repetition review questions and tasks from that specific weak area into their upcoming learning queue.

### System Components & Operational Concerns

The microservice that performs this flow is composed of the following components and managed with these operational strategies.

| Component         | Responsibility                                               |
| ----------------- | ------------------------------------------------------------ |
| **ChunkManager**  | Stream‐reads & splits database.json into manageable chunks.  |
| **PromptBuilder** | Extracts metadata fields from items in a chunk and builds the detailed Gemini prompts. |
| **AIClient**      | Handles authentication, rate‐limits, and retries for all Gemini API calls. |
| **Analyzer**      | Parses Gemini JSON responses into structured, ordered index arrays. |
| **Aggregator**    | Merges & deduplicates chunk results and resolves cross-chunk dependencies. |
| **Sequencer**     | Manages the optional, final AI-driven sequence refinement pass. |
| **Writer**        | Composes the final curriculum.json file and saves intermediate per‐chunk files. |
| **Logger**        | Tracks progress, errors, answered questions, code created, AI code checker result in percentage and correctness (e.g., pass if >60-70% correct), and any unresolved dependencies for monitoring. |

#### **Error Handling & Scaling**

- **Retries:** Exponential back-off on API failures (up to 3×).
- **Fallback:** Chunks that consistently fail AI processing are flagged for manual review.
- **Monitoring:** The Logger tracks token consumption, chunk processing timings, and warnings for unmet prerequisites.
- **Scaling:** The entire service is Dockerized to run as multiple instances, allowing for parallel processing of distinct chunk ranges coordinated via a task queue.

## 5. Progress, Persistence & Sync

### 5.1 Authentication

- **Firebase Auth** supports (email/password, Google SSO) on any device.
- On sign-in, load the user’s Firebase data data under `users/{uid}`.

### 5.2 Firebase Schema


This is theoretical structure:

```
typescript


CopyEdit
users (collection)
 └── {uid} (document)
      ├── settings         (doc)
      │     • displayName: string
      │     • aiReviewer: 'DeepSeek'|'Gemini'|'Both'
      │
      ├── progress        (subcollection)
      │     └── {itemId} (doc)
      │           • itemType: 'theory'|'question'|'task'
      │           • status: 'pending'|'complete'
      │           • updatedAt: timestamp
      │
      ├── submissions     (subcollection)
      │     └── {submissionId} (doc)
      │           • taskId: string
      │           • code: string
      │           • result: 'pass'|'fail'
      │           • aiFeedback: string
      │           • createdAt: timestamp
      │
      └── sessions        (subcollection)
            └── {sessionId} (doc)
                  • name: string
                  • createdAt: timestamp
                  • archiveUrl?: string  // optional Firebase Storage path
```

- settings**: user profile & AI preferences
- **progress**: per-item completion state,  errors, answered questions, code created, AI code checer result in percentage and if it is correct generally or not (maybe if 60-70 percent is correct then it passes)
- **submissions**: each “Check with AI” run & feedback
- **sessions**: metadata for sessions

------

### 6. Real-Time Sync and Cross-Device Experience

- **Real-time listeners** keep all open tabs/devices in sync instantly with Firebase.
- **UI** built with Next.js + MUI—adapts seamlessly from mobile to desktop. Use simple design, with some box-shadow for some elements. Use Dark theme with contrast colors of buttons and buttons text and tags etc...
- **Progress Sync**: On any device sign-in, your Firebase-stored `progress`, `submissions`, and `settings` load instantly.

------

## 7. Tech Stack & Architecture

- **File Length** : No source file (except `.json`) may exceed 250 lines  length - split to different components functions hooks etc. and Always import from the nearest module boundary.

- No mocks or test files, only real data and real Gemini Deepseek and Firebase workflow.

- Don't hallucinate and don't create redundant funcitonality, go strict.

- **Framework:** Next.js + React 18 + TypeScript

- **UI:** MUI (Material UI)

- **State:** Zustand (in-memory) + Firebase (persistent)

- **Editors:** Monaco Editor for code tasks & quizzes; `react-live` for theory examples

- **Utilities:** Firebase, GEMINI, OPENROUTER

- **Deployment:** Vercel, with environment variables for Firebase GEMINI OPENROUTER and Google credentials

firebaseConfig = {
  apiKey: "AIzaSyD33KZogkjUhFgkXgm1B2s8xzCWMyVH0eQ",
  authDomain: "frontendinterviewer.firebaseapp.com",
  databaseURL: "https://frontendinterviewer-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "frontendinterviewer",
  storageBucket: "frontendinterviewer.firebasestorage.app",
  messagingSenderId: "203914945813",
  appId: "1:203914945813:web:d69ebc950393329ee0f51c",
  measurementId: "G-T2J7ZZ408S"
};

NEXT_PUBLIC_GEMINI_API_KEY = AIzaSyCrdk1AF66U1RR41GjRCucmcF16FPWpowo

openrouter key = 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







