-- ResearchLab database schema (PostgreSQL + pgvector)
-- Run order: top to bottom. Adjust vector(1024) to match your embedding model.

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============ USERS ============
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name     VARCHAR(150) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============ FOLDERS & CHATS ============
-- "All chats" is NOT a folder: it is simply SELECT * FROM chats WHERE user_id = ?
CREATE TABLE folders (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, name)
);

CREATE TABLE chats (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  folder_id           UUID REFERENCES folders(id) ON DELETE SET NULL, -- NULL = not in any folder
  title               VARCHAR(200) NOT NULL DEFAULT 'New chat',
  web_search_enabled  BOOLEAN NOT NULL DEFAULT FALSE,
  response_language    VARCHAR(10) NOT NULL DEFAULT 'en'
                       CHECK (response_language IN ('en', 'si', 'ta')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_chats_user ON chats (user_id, updated_at DESC);
CREATE INDEX idx_chats_folder ON chats (folder_id);

-- ============ DOCUMENTS ============
CREATE TABLE documents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name    VARCHAR(255) NOT NULL,
  storage_url  VARCHAR(500) NOT NULL,
  page_count   INT,
  file_size_bytes BIGINT,
  source_type  VARCHAR(20) NOT NULL DEFAULT 'uploaded'
               CHECK (source_type IN ('uploaded', 'converted')),
  ingest_status VARCHAR(20) NOT NULL DEFAULT 'pending'
               CHECK (ingest_status IN ('pending', 'processing', 'ready', 'failed')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_documents_user ON documents (user_id);

CREATE TABLE chat_documents (
  chat_id     UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  added_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (chat_id, document_id)
);
CREATE INDEX idx_chat_documents_doc ON chat_documents (document_id);

CREATE TABLE document_summaries (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id  UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  summary_json JSONB NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_summaries_doc ON document_summaries (document_id);

-- ============ RAG CHUNKS (uploaded PDFs) ============
CREATE TABLE document_chunks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id   UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index   INT NOT NULL,
  page_number   INT NOT NULL,
  section_title VARCHAR(300),
  text          TEXT NOT NULL,
  char_start    INT,  -- offset within the page text, for exact highlighting
  char_end      INT,
  embedding     vector(1024),
  text_search   TSVECTOR GENERATED ALWAYS AS (to_tsvector('simple', text)) STORED,
  UNIQUE (document_id, chunk_index)
);
CREATE INDEX idx_chunks_doc_page ON document_chunks (document_id, page_number);
CREATE INDEX idx_chunks_fts ON document_chunks USING GIN (text_search);
CREATE INDEX idx_chunks_embedding ON document_chunks
  USING hnsw (embedding vector_cosine_ops);

-- ============ WEB SOURCES ============
CREATE TABLE web_sources (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type  VARCHAR(20) NOT NULL
               CHECK (source_type IN ('article', 'research_paper', 'other')),
  title        VARCHAR(500) NOT NULL,
  url          VARCHAR(1000) NOT NULL UNIQUE,
  retrieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============ MESSAGES ============
CREATE TABLE messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id    UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  role       VARCHAR(10) NOT NULL CHECK (role IN ('user', 'assistant')),
  content    TEXT NOT NULL,
  language   VARCHAR(10),
  used_web   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_messages_chat ON messages (chat_id, created_at);

-- ============ CITATIONS ============
-- Each citation points to EITHER an uploaded document OR a web source.
CREATE TABLE citations (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id     UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  document_id    UUID REFERENCES documents(id) ON DELETE SET NULL,
  web_source_id  UUID REFERENCES web_sources(id) ON DELETE SET NULL,
  chunk_id       UUID REFERENCES document_chunks(id) ON DELETE SET NULL,
  page_number    INT,
  section_title  VARCHAR(300),
  char_start     INT,
  char_end       INT,
  position_in_message INT, -- order of the citation in the answer
  CHECK (
    (document_id IS NOT NULL AND web_source_id IS NULL) OR
    (document_id IS NULL AND web_source_id IS NOT NULL)
  )
);
CREATE INDEX idx_citations_message ON citations (message_id);
CREATE INDEX idx_citations_document ON citations (document_id);
CREATE INDEX idx_citations_web ON citations (web_source_id);

-- ============ ANNOTATIONS ============
CREATE TABLE annotations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chat_id       UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  document_id   UUID REFERENCES documents(id) ON DELETE CASCADE,
  web_source_id UUID REFERENCES web_sources(id) ON DELETE CASCADE,
  page_number   INT,
  selected_text TEXT NOT NULL,
  position_data JSONB,  -- rectangles / offsets for re-drawing the highlight
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (
    (document_id IS NOT NULL AND web_source_id IS NULL) OR
    (document_id IS NULL AND web_source_id IS NOT NULL)
  )
);
CREATE INDEX idx_annotations_chat ON annotations (chat_id);

CREATE TABLE message_annotations (
  message_id    UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  annotation_id UUID NOT NULL REFERENCES annotations(id) ON DELETE CASCADE,
  PRIMARY KEY (message_id, annotation_id)
);

-- ============ PDF CONVERTER ============
CREATE TABLE conversions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  input_file_name    VARCHAR(255) NOT NULL,
  input_format       VARCHAR(10) NOT NULL
                     CHECK (input_format IN ('docx','txt','html','csv','xlsx','pptx','md')),
  run_ocr            BOOLEAN NOT NULL DEFAULT FALSE,
  recognize_tables   BOOLEAN NOT NULL DEFAULT FALSE,
  compress           BOOLEAN NOT NULL DEFAULT FALSE,
  status             VARCHAR(20) NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'processing', 'done', 'failed')),
  output_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  error_message      TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_conversions_user ON conversions (user_id);

-- ============ GRADING / PLAGIARISM / RELEVANCE ============
CREATE TABLE analysis_requests (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id            UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  message_id         UUID REFERENCES messages(id) ON DELETE SET NULL,
  document_id        UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  analysis_type      VARCHAR(20) NOT NULL
                     CHECK (analysis_type IN ('grading', 'plagiarism', 'relevance')),
  criteria           JSONB,    -- grading aspects chosen by the user
  input_text         TEXT,     -- for relevance checks
  allow_other_papers BOOLEAN NOT NULL DEFAULT FALSE,
  used_web           BOOLEAN NOT NULL DEFAULT FALSE,
  result_json        JSONB,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_analysis_chat ON analysis_requests (chat_id);

-- ============ NOTEPAD ============
CREATE TABLE notepads (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  content    TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE notepad_exports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notepad_id  UUID NOT NULL REFERENCES notepads(id) ON DELETE CASCADE,
  exported_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============ EXAMPLE: HYBRID SEARCH ============
-- Retrieve the best chunks for a question, only from PDFs attached to one chat.
-- :chat_id, :query_embedding (vector), :query_text are parameters.
--
-- WITH vector_hits AS (
--   SELECT c.id,
--          ROW_NUMBER() OVER (ORDER BY c.embedding <=> :query_embedding) AS rank
--   FROM document_chunks c
--   JOIN chat_documents cd ON cd.document_id = c.document_id
--   WHERE cd.chat_id = :chat_id
--   ORDER BY c.embedding <=> :query_embedding
--   LIMIT 20
-- ),
-- keyword_hits AS (
--   SELECT c.id,
--          ROW_NUMBER() OVER (
--            ORDER BY ts_rank(c.text_search, plainto_tsquery('simple', :query_text)) DESC
--          ) AS rank
--   FROM document_chunks c
--   JOIN chat_documents cd ON cd.document_id = c.document_id
--   WHERE cd.chat_id = :chat_id
--     AND c.text_search @@ plainto_tsquery('simple', :query_text)
--   LIMIT 20
-- )
-- SELECT c.id, c.document_id, c.page_number, c.section_title, c.text,
--        COALESCE(1.0 / (60 + v.rank), 0) + COALESCE(1.0 / (60 + k.rank), 0) AS score
-- FROM document_chunks c
-- LEFT JOIN vector_hits v ON v.id = c.id
-- LEFT JOIN keyword_hits k ON k.id = c.id
-- WHERE v.id IS NOT NULL OR k.id IS NOT NULL
-- ORDER BY score DESC
-- LIMIT 8;