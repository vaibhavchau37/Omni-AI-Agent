# 🚀 OmniAgent — High-Utility Multimodal AI Assistant

<p align="center">
  <strong>Autonomous Daily-Life AI Assistant & Deterministic Artifact Engine for India</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 18" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-5.4-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Backend-Deno%20Edge%20Functions-000000?style=flat-square&logo=deno&logoColor=white" alt="Deno Edge" />
  <img src="https://img.shields.io/badge/Architecture-Deterministic%20Pipeline-F78318?style=flat-square" alt="Deterministic Pipeline" />
  <img src="https://img.shields.io/badge/Locale-Bilingual%20(EN%20%2B%20HI)-16A89A?style=flat-square" alt="Bilingual" />
</p>

---

## 📖 Executive Summary

**OmniAgent** is an everyday AI utility platform designed for real-world tasks in India. Rather than functioning as a standard conversational AI wrapper, OmniAgent combines autonomous task assistance, multimodal processing, deterministic artifact generation, and domain-aware reasoning.

The platform implements five core capabilities:

1. **Deterministic Artifact Pipeline:** Converts schema-validated AI outputs into downloadable binary files, including `.pptx` presentations, `.docx` documents, `.csv` spreadsheets, and standalone HTML landing pages. Files are compiled directly in the browser without third-party SaaS rendering services.

2. **Epistemic Guardrails (Confidence ≥ 0.70):** An anti-hallucination arbitration layer that prioritizes local domain knowledge, including GST, UPI, Indian corporate guidelines, and academic patterns. When confidence falls below the defined threshold, the system requests clarification rather than fabricating information.

3. **Finite-State Role Orchestration:** Five specialized agent personalities:
   - General Assistant
   - Study Buddy
   - HR Specialist
   - Customer Support
   - Admin Ops

   Each role operates with specialized instructions and guardrails.

4. **Bilingual Multimodal Processing:** Supports English and Hindi, including code-switching, voice interaction, text-to-speech, speech recognition, and document/image ingestion.

5. **Autonomous Daily-Life Assistance:** Helps users organize tasks, understand information, troubleshoot problems, prepare documents, and generate practical deliverables.

---

## 🏛️ System Architecture

OmniAgent follows a modular architecture separating the user interface, orchestration layer, edge processing, AI inference, storage, and deterministic artifact compilation.

```text
+-----------------------------------------------------------------------------------+
|                              CLIENT BROWSER (React 18)                            |
|                                                                                   |
|  +---------------------------+  +------------------------+  +-------------------+ |
|  |     Adaptive Workspace    |  |     Voice Subsystem    |  |  Multimodal Dock  | |
|  |  (Sidebar / History /     |  | (Web Speech Recognition|  | (Images, PDFs,    | |
|  |   ControlBar / Settings)  |  |  & TTS / Continuous)   |  |  Docs, Drag&Drop) | |
|  +-------------+-------------+  +-----------+------------+  +---------+---------+ |
|                |                            |                         |           |
|                v                            v                         v           |
|  +------------------------------------------------------------------------------+ |
|  |                State Orchestrator & Client Services Layer                    | |
|  |           (chatService, artifactService, chatHistory, localSettings)        | |
|  +--------------------------------------+---------------------------------------+ |
+-----------------------------------------|-----------------------------------------+
                                          | HTTPS / SSE Streaming
                                          v
+-----------------------------------------------------------------------------------+
|                        EDGE COMPUTE LAYER (Deno Runtime)                          |
|                                                                                   |
|  +-------------------------+  +-------------------------+  +--------------------+ |
|  |    /omniagent-chat      |  |   /omniagent-artifact   |  | /omniagent-analyze | |
|  |  - Intent Extraction    |  |  - Schema Synthesizer   |  | - Multimodal OCR   | |
|  |  - 6-Step Dialogue Loop |  |  - JSON-Schema Enforcer |  | - File Structuring | |
|  |  - Confidence Scoring   |  |  (PPTX/DOCX/Sheet/HTML) |  |                    | |
|  |  - Role Prompt Injector |  +------------+------------+  +--------------------+ |
|  +------------+------------+               |                                      |
+---------------|----------------------------|--------------------------------------+
                |                            |
                v                            v
+-----------------------------------------------------------------------------------+
|                       INFERENCE & STORAGE SUBSYSTEM                               |
|                                                                                   |
|  +-----------------------------------+  +---------------------------------------+ |
|  |         AI Gateway & LLMs         |  |             Lovable Cloud             | |
|  |   (Language & Reasoning Models)   |  |   (RLS Policies, Chat History,        | |
|  |                                   |  |    Conversation Summaries)            | |
|  +-----------------------------------+  +---------------------------------------+ |
+-----------------------------------------------------------------------------------+
                                          |
                                          v Validated JSON Schema
+-----------------------------------------------------------------------------------+
|                    DETERMINISTIC COMPILATION ENGINE (Client-Side)                 |
|                                                                                   |
|    +-------------------+  +-------------------+  +----------------------------+   |
|    |      PptxGenJS    |  |     docx-packer   |  |    Self-Contained HTML5    |   |
|    | (.pptx SlideDeck) |  | (.docx Document)  |  |  (Scoped Tailwind Canvas)  |   |
|    +-------------------+  +-------------------+  +----------------------------+   |
+-----------------------------------------------------------------------------------+
```

---

## ⚡ Core Engineering Highlights

### 1. The 6-Step Conversational Loop

Every assistant interaction follows a structured processing pipeline:

```text
Input → Greet → Understand → Follow-up → Process → Verify
```

**Processing stages:**

- **Input Validation:** Strict Zod schemas validate message lengths, input structures, and role states.
- **Goal Classification:** Anchored regex matching distinguishes casual inquiries from actionable task sequences.
- **Context Understanding:** Identifies user intent and determines the required processing path.
- **Follow-up Management:** Requests missing information when necessary.
- **Task Processing:** Executes the selected reasoning or artifact-generation workflow.
- **Output Verification:** Validates the generated response against applicable constraints.

**Epistemic Threshold:** When the confidence score falls below `0.70`, the system requests clarification instead of presenting uncertain information as fact.

### 2. Client-Side Binary Compilation

OmniAgent uses client-side compilation to support data sovereignty, reduce latency, and eliminate per-export server rendering costs.

Supported output formats:

| Format | Technology | Output |
|---|---|---|
| Presentations | PptxGenJS | `.pptx` |
| Documents | docx | `.docx` |
| Data Sheets | CSV generation | `.csv` |
| Landing Pages | HTML5 + Tailwind CSS | `.html` |

**Presentation Generation (`.pptx`)**
- Structured slide hierarchies
- Custom layouts and styling
- Bullet-point formatting
- Presenter notes

**Document Generation (`.docx`)**
- Declarative document structures
- Headers and paragraphs
- Typography and margin configuration

**Landing Page Generation**
- Responsive HTML templates
- Embedded styling
- Self-contained output

**Spreadsheet Generation**
- Structured CSV data
- Excel compatibility
- Google Sheets compatibility

### 3. Role-Based Specialization

OmniAgent provides five specialized assistant roles, each with independent instructions and operational guardrails.

| Role | Identity | Guardrails / Responsibilities |
|---|---|---|
| General | OmniAgent | Goal planning, document assembly, and general reasoning. |
| Student | Study Buddy | Socratic learning methodology; explains concepts and principles step by step instead of directly completing homework. |
| HR | HR Specialist | Indian labor codes, formal job descriptions, POSH and provident fund awareness, and appraisal frameworks. |
| Support | Customer Support | Troubleshooting workflows, de-escalation protocols, empathetic communication, and issue isolation. |
| Admin | Admin Ops | Operational checklists, risk assessments, SOP structuring, and regulatory validation. |

---

## 📂 Repository Directory Structure

```text
omniagent/
├── public/                     # Static assets (Favicon, robots.txt, symbols)
├── src/
│   ├── components/
│   │   ├── chat/               # Chat workspace, sidebar, artifact cards, inputs
│   │   │   ├── AccountMenu.tsx         # User profile & settings trigger
│   │   │   ├── ArtifactCard.tsx        # One-click PPTX/DOCX downloads
│   │   │   ├── ChatContainer.tsx       # Message list and layout
│   │   │   ├── ChatHeader.tsx          # Responsive navigation and status
│   │   │   ├── ChatInput.tsx           # Input dock, uploads, microphone
│   │   │   ├── ChatMessage.tsx         # Message bubbles and Markdown
│   │   │   ├── ChatSidebar.tsx         # Responsive history sidebar
│   │   │   ├── ControlBar.tsx          # Role and language controls
│   │   │   ├── SettingsDialog.tsx      # Multi-tab settings
│   │   │   └── WelcomeScreen.tsx      # Welcome and workflow cards
│   │   └── ui/                 # Radix UI + shadcn primitives
│   ├── hooks/                  # Speech recognition, TTS, responsive hooks
│   ├── lib/
│   │   ├── artifacts.ts        # Client-side artifact compilation
│   │   ├── chatHistory.ts      # LocalStorage and database history
│   │   ├── knowledgeBase.ts    # Indian domain knowledge definitions
│   │   ├── roles.ts            # Agent role configurations
│   │   └── settings.ts         # User preferences and settings
│   ├── services/
│   │   ├── artifactService.ts  # Edge bridge for artifact generation
│   │   └── chatService.ts      # SSE streaming and fallback controller
│   ├── pages/                  # Main Index and 404 views
│   ├── index.css               # Design tokens and typography
│   └── main.tsx                # Application bootstrap
├── supabase/
│   └── functions/
│       ├── omniagent-chat/     # Primary LLM chat and orchestrator
│       ├── omniagent-artifact/ # Structured JSON artifact generator
│       ├── omniagent-analyze-file/ # File and image OCR/analysis
│       └── vision-agent/       # Vision inspection endpoint
├── index.html                  # SEO metadata and PWA headers
├── tailwind.config.ts          # Custom design tokens
├── vite.config.ts              # Vite configuration
└── package.json                # Project dependencies
```

---

## 🛠️ Tech Stack & Libraries

### Frontend
- **React 18** — Component-based UI architecture.
- **TypeScript 5.8** — Type-safe application development.
- **Vite 5** — Development server and build tooling.
- **Tailwind CSS 3** — Utility-first styling.

### UI & Accessibility
- Radix UI
- shadcn/ui
- Lucide React
- Sonner / Toast

### Artifact Generation
- `pptxgenjs` — PowerPoint presentation generation.
- `docx` — Word document generation.
- `file-saver` — Browser-based file downloads.

### Backend & Infrastructure
- Deno Runtime
- Supabase Edge Functions
- Lovable Cloud
- Row-Level Security (RLS)

### Voice & Speech
- Web Speech API
- Speech Recognition
- Speech Synthesis
- Continuous voice listening

---

## 🚀 Getting Started

### Prerequisites

Make sure the following tools are installed:

- [Node.js](https://nodejs.org/) — Version 18.x or later.
- npm or Bun package manager.
- Git.

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/omniagent.git
cd omniagent
```

### 2. Install Dependencies

Using npm:

```bash
npm install
```

Or using Bun:

```bash
bun install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```ini
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

Replace the placeholders with your actual Supabase project credentials.

**Security Note:** Never commit service-role keys, private API keys, or other server-side secrets to GitHub. Only expose credentials specifically intended for browser-side use.

### 4. Start the Development Server

```bash
npm run dev
```

Open the local development URL displayed in your terminal. The default configured URL is:

```text
http://localhost:8080
```

---

## 🧪 Build & Production Deployment

Generate an optimized production build:

```bash
npm run build
```

The compiled application will be available inside:

```text
dist/
```

The production build can be deployed using:

- [Vercel](https://vercel.com/)
- [Cloudflare Pages](https://pages.cloudflare.com/)
- [Lovable](https://lovable.dev/)

**Note:** The frontend build alone does not deploy Supabase Edge Functions. Configure the required backend environment variables, database policies, and Edge Functions separately.

---

## 🔒 Security & Privacy

OmniAgent follows a security-conscious architecture designed to protect user data and isolate sessions.

### Guest-First Security Model
- Unauthenticated sessions use isolated browser storage.
- Local session data is separated between browser users.
- No unnecessary cross-user credential sharing.

### Row-Level Security (RLS)
- Database access is controlled through RLS policies.
- User-specific conversation records are isolated.
- Sensitive backend operations are restricted to authorized server-side contexts.

### Authentication Security
- Leaked-password protection through Have I Been Pwned (HIBP) integration on supported authentication endpoints.
- Secure handling of authentication credentials.
- Server-side secrets are not exposed through frontend bundles.

---

## 🗺️ Project Vision

OmniAgent aims to make practical AI assistance accessible for everyday users in India.

The long-term vision is to build a unified AI workspace that combines:

- Conversational intelligence
- Autonomous task assistance
- Multimodal understanding
- Voice-first interaction
- Structured document generation
- Indian domain-specific knowledge
- Reliable, verifiable outputs

The goal is not simply to create another AI chatbot, but to build a practical AI utility platform that converts user intent into useful, downloadable, and actionable results.

---

## 👤 Author & Acknowledgments

**Lead Engineer:** Vaibhav Chaudhary

**Project:** OmniAgent

---

<p align="center">
  <strong>Built with ❤️ to make AI more practical, accessible, and useful for everyday life in India.</strong>
</p>
