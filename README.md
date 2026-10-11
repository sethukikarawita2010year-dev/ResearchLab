# ResearchLab

An AI research assistant for PDFs: upload a research paper, get an automatic structured summary, and ask questions about it in a chat with cited answers.


## Assignment Requirements

- Upload a single research paper (PDF) - Completed
- Structured summary: Title and Authors and Abstract, Problem Statement, Methodology, Key Results, Conclusion - Completed
- Question-answering chatbot - Completed


## Extra Features

- Cited answers, with a split-screen source viewer that jumps to and highlights the cited passage (able to identify which sources allow this feature by having a green glow across its border)
- Web search on/off toggle 
- Folders for organising chats
- Email and password login and sign-up 
- Notepad, with export
- PDF converter (docx, csv, html, xlsx, txt, pptx, md → PDF)
- Paper grading system
- Text annotations
- Sources tab: view all the sources used (includes user's attached pdf's and web resources)
- Multi-document chat (ask one question across several papers)
- Profile and settings (avatar, change password, account deletion)


## Tech Stack

Frontend    - React 18, Vite 5, React Router 6, Tailwind CSS 4, pdfjs-dist 
Backend     - Python 3.10+, FastAPI, Uvicorn, SQLAlchemy 2.0, Pydantic 
Database    - SQLite (default, via SQLAlchemy); the app creates its own tables on first run. A PostgreSQL + pgvector schema is also included 
AI/LLM      - OpenAI Responses API (`gpt-4.1` by default) 
Web search  - Self-hosted SearXNG (free) with an OpenAI fallback 
PDF text    - pymupdf 
PDF convert - CloudConvert REST v2 (default) or self-hosted Gotenberg 
Auth        - argon2-cffi (Argon2id), itsdangerous 


## How It Works

1. Upload and extract: The PDF is validated (file type check and a 25 MB cap), stored, and its text is extracted page by page with pymupdf. Page markers are kept so answers can cite real page numbers.

2. Summary: The extracted text is sent to the LLM with a fixed template that returns the five required sections. Each statement carries an inline citation like `[p. PAGE §SECTION]`.

3. Grounded Q&A: The paper is sent to the model once at the start of the chat, and later questions continue the same conversation. Citations in answers are clickable and open the exact passage in the split-screen viewer.

4. Web grounding (optional): When the toggle is on, the question is also searched on the web (self-hosted SearXNG, with OpenAI web search as a fallback), and only the sources the answer used are shown. If both fail, the answer comes from the paper alone.

5. Grading system: Originality is calculated in code by comparing text overlap with other papers and web snippets. The model grades the other seven aspects with short reasoning, and the total is summed in code.


## Database Design

The running app uses two stores in one SQLite file (`backend/researchlab.db`), created automatically on first run:

Runtime tables (SQLite via SQLAlchemy)

`users`         - accounts: name, email, password, hash , profile picture, default web-search preference 
`chat_sessions` - a research session: title, folder, attached upload, messages, web sources, annotations, notepad, prompt 
`folders`       - user folders (seeded with "All Papers"); counts are derived from real chats, not a drifting counter 
`uploaded_docs` - uploaded PDF metadata (id, filename, size, timestamp) 
`conversions`   - document-to-PDF conversion history 

Target schema (`database/schema.sql`, PostgreSQL + pgvector)

`users`, `folders`, `chats`             - accounts and chat organisation 
`documents`, `chat_documents`           - uploaded/converted files and their chat attachments 
`document_summaries`, `document_chunks` - cached summaries and RAG chunks (with embeddings + full-text index) 
`web_sources`                           - cached web grounding sources 
`messages`, `citations`                 - chat turns and the page/section citations attached to them 
`annotations`, `message_annotations`    - user highlights and their link to messages 
`conversions`                           - PDF-converter jobs 
`analysis_requests`                     - grading / plagiarism / relevance runs 
`notepads`, `notepad_exports`           - per-user notepad and its exports 


## Getting Started

### Prerequisites
- Node.js 18+ (20+ recommended for Tailwind CSS 4)
- Python 3.10+
- An OpenAI API key
- Optional: a CloudConvert API key (or a self-hosted Gotenberg instance) for the PDF converter
- Optional: a self-hosted SearXNG instance (Docker) for free web search

### 1. Clone
```bash
git clone https://github.com/sethukikarawita2010year-dev/ResearchLab.git
cd ResearchLab
```

### 2. Install dependencies
```bash
# backend
cd backend
pip install -r requirements.txt

# frontend (from the repo root)
cd ..
npm install
```

### 3. Configure environment variables
```bash
# macOS / Linux
cp backend/.env.example backend/.env

# Windows PowerShell
Copy-Item backend/.env.example backend/.env
```
Open `backend/.env` and fill in:


`OPENAI_API_KEY`        - your OpenAI key (required for summaries, chat and grading) 
`OPENAI_MODEL`          - model used for all AI work (default `gpt-4.1`)
`AUTH_SECRET_KEY`       - any long random string (signs the session cookie) 
`CLOUDCONVERT_API_KEY`  - required only for the PDF converter (default provider) 
`SEARXNG_URL`           - optional, for free web search (default `http://localhost:8080`) 



### 4. Set up the database
Nothing to do: the backend creates its SQLite tables automatically on first run. (The PostgreSQL schema in `database/schema.sql` is the production-ready design and is not used by the running app.)

### 5. Run the app
```bash
# backend (terminal 1)
cd backend
uvicorn main:app --reload --port 8000

# frontend (terminal 2, from the repo root)
npm run dev
```
Open [http://localhost:5173](http://localhost:5173). Vite proxies `/api` to the backend at `http://127.0.0.1:8000`.

### 6. Try it
1. Click **Sign up** and create an account (any email, password of 12+ characters).
2. Log in and upload a research paper PDF (25 MB max).
3. Wait for the structured summary to appear.
4. Ask a question in the chat, for example "What problem does this paper solve?"


## Project Structure

```
ResearchLab/
├── src/                 # React app
│   ├── pages/           # Workspace, Chat, Reader, Login, Register, PDFConverter
│   ├── components/      # Sidebar, Composer, SourceViewer, GradeTable, ...
│   └── lib/             # api.js, authApi.js, pdfjs.js, folderStore.js, ...
├── backend/             # FastAPI app
│   ├── main.py          # upload, analyze, chat, grade, web sources, PDF serving
│   ├── llm.py           # OpenAI summaries and grounded chat
│   ├── grading.py       # rubric and code-computed plagiarism
│   ├── auth.py          # Argon2id auth and signed session cookies
│   ├── store.py         # sessions, folders, uploads, conversions
│   └── conversion.py    # document-to-PDF (CloudConvert / Gotenberg)
├── database/
│   └── schema.sql       # PostgreSQL + pgvector target schema
├── public/              # static assets
├── index.html
├── package.json
└── README.md
```


## Design Decisions and Challenges

1. Citations that must be checkable - The model is instructed to emit `[p. PAGE §SECTION]`; those brackets are parsed server-side and turned into citations that open the exact passage in the split-screen viewer. This avoided trusting the model to describe its own sources.

2. Free-by-default web search - A self-hosted SearXNG instance needs no API key; when it is unavailable the app falls back to OpenAI's paid web search, and otherwise answers from the paper alone instead of failing the turn.

3. Zero-setup storage - SQLite + SQLAlchemy keeps the whole app in one file with no database server to run, with lightweight in-place migrations; the PostgreSQL + pgvector schema documents the production-ready design.


## AI Tools Used

To generate the UI frames I used Google Stitch. I used an AI coding assistant (opencode) for UI work, debugging and developing. I reviewed and tested the generated code myself. The AI API used for the chatbot is OpenAI


## Known Limitations

- Whole-paper context instead of embeddings - Rather than splitting the paper into chunks and retrieving the relevant ones, the app sends the full paper text to the model. This keeps answers accurate for normal-sized papers and makes page citations simple. The trade-off is that very large PDFs are cut off at the limit set by `OPENAI_PDF_TEXT_MAX_CHARS`, so text beyond that point is not seen by the model.

- No support for scanned PDFs - The app reads the text already stored inside the PDF. A scan or an image-only PDF has no text layer, and there is no OCR step, so extraction returns nothing. Papers downloaded from journals or arXiv work fine.

- One main paper for the summary - The structured summary is generated for a single primary paper. Chat and grading can work across several uploaded papers.

- Web search depends on external services - Web grounding uses a self-hosted SearXNG instance, with OpenAI's paid web-search tool as a fallback. If neither is available, the app still answers, but only from the paper.

- The PDF converter needs a conversion service - It requires either a CloudConvert API key or a self-hosted Gotenberg instance. Without one of these configured, the converter won't work, though the rest of the app is unaffected.

- Database: SQLite in the running app - The PostgreSQL + pgvector schema in the docs is a design for scaling up, not what the app runs on. The working app uses SQLite, which needs no setup but is meant for single-user or demo use.
