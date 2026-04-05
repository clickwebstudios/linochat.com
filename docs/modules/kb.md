# Module: Knowledge Base

## Overview

The knowledge base (KB) stores help articles organized by category. Articles are served to:
1. Customers via the public help center (`/help/*`)
2. The AI chat engine (as context for answering questions)
3. Agents via the admin dashboard

---

## Components

- **Controller**: `KbController` (`app/Http/Controllers/Api/KbController.php`)
- **Public controller**: `HelpController` — public help center (no auth)
- **Service**: `KbGeneratorService` — AI-powered article generation from website
- **Job**: `GenerateKbFromWebsiteJob` — async KB generation
- **Job**: `GenerateEmbeddingJob` — generates OpenAI embeddings for semantic search
- **Observer**: `KbArticleObserver` — triggers embedding generation on save
- **Frontend**: `ArticleDetails.tsx`, `KnowledgeView.tsx`, `AIArticleGenerator.tsx`

---

## Data Structure

```
Project
  └─< KbCategory (project_id, name, slug, icon, sort_order)
        └─< KbArticle (category_id, project_id, author_id, title, slug, content, status, embedding)
```

---

## Article States

- `status`: `draft`, `published`, `archived`
- `is_published`: boolean (redundant with status — should use status only)
- `is_auto_generated`: true for AI-created articles

---

## AI Article Generation

### From Website (full KB)

1. Admin clicks "Generate from Website" or a new project auto-triggers it
2. `POST /projects/{project_id}/kb/generate` → dispatches `GenerateKbFromWebsiteJob`
3. Job calls `WebsiteAnalyzerService::analyze($website)` → scrapes + uses AI to extract:
   - Company description
   - Product/service categories
   - FAQ items
4. `KbGeneratorService` creates KB categories and articles in DB
5. Each article triggers `KbArticleObserver` → dispatches `GenerateEmbeddingJob`
6. Frontend polls `GET /projects/{project_id}/kb/generation-status`

### Single Article Generation

`POST /projects/{project_id}/kb/categories/{category_id}/generate-article`

AI generates a single article for the specified category.

### Auto-Learn from Chats

When a chat is closed, `AutoLearnFromChatJob` analyzes the conversation and:
- Identifies question/answer pairs
- Creates or updates KB articles with the knowledge
- Enabled if `ai_settings.auto_learn = true`

---

## Semantic Search (Embeddings)

Each article has an `embedding` column (JSON — OpenAI vector).

When a customer sends a message:
1. `AiChatService` embeds the query via OpenAI
2. Calculates cosine similarity against article embeddings
3. Returns top-N articles as context for the AI response

If embeddings aren't available, falls back to keyword search.

`GenerateEmbeddingJob` runs when:
- Article is created or content is updated (via `KbArticleObserver`)
- Can also be triggered manually

---

## Public Help Center

Routes: `/api/help/*` — no auth, serves published articles.

The help center is project-scoped — pass `project_id` or use a project slug to filter articles.

---

## Training Documents

Separate from KB articles. Training documents are raw content (PDFs, text, URLs) that the AI uses as additional context but are not displayed as articles.

- Stored in `training_documents` table
- Also have `embedding` column for semantic search
- Managed via `TrainingDocumentController`
