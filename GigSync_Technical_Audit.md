# GigSync: Research Paper Technical Audit & Reproducibility Report

**Audit Target:** GigSync Codebase (`gigsync resume`)  
**Auditor Role:** Senior Software Engineer & Academic Reproducibility Auditor  
**Audit Purpose:** Validation of system architecture, algorithmic claims, and empirical metrics for conference paper submission  
**Audit Date:** 29 October 2026  
**Repository State:** Master Branch (`commit 4378677`)  

---

## Executive Summary

This independent technical audit examines the **GigSync** project repository to evaluate reproducibility, architectural integrity, and the scientific validity of claims suitable for an academic conference publication. 

### Key Findings
1. **Functional Architecture:** The system is an actively running, full-stack web application featuring an Express TypeScript backend on Node.js and a React 19 / Vite / Tailwind CSS frontend. It contains fully functional heuristic parsing, a multi-template LaTeX resume generator with injection-prevention character escaping, a transparent multi-criteria weighted matching engine, and a 3-stage learning roadmap generator.
2. **Algorithmic Reality:** The system is **deterministic, rule-based, and heuristic**. It does **not** employ TF-IDF, vector cosine similarity, Transformer embeddings (e.g., SBERT), or live external Large Language Model APIs (e.g., OpenAI, Google Gemini). Matching relies on token normalization, regex boundaries, alias dictionaries, and explicit linear weighting.
3. **Database & External APIs:** Although the original requirements document (PRD) proposed a PostgreSQL database and Django REST Framework, the implemented codebase operates entirely using typed TypeScript in-memory models (`seedData.ts`) and browser `localStorage`. There is no active SQL connection, ORM, or live external job scraping pipeline.
4. **Empirical Benchmarking & Metrics:** **None of the previously reported empirical evaluation figures (e.g., 92.0% extraction accuracy over 50 resumes, 84.0% Precision@10 over 250 pairs) are independently reproducible from the codebase.** The repository contains zero annotated test datasets, zero ground-truth CSV/JSON benchmark corpora, and zero evaluation scripts computing precision, recall, or F1-scores.
5. **Academic Submission Guidance:** The project represents an engineered rule-based decision support system rather than an empirical deep-learning study. To prevent desk rejection or severe reviewer pushback, any research paper based on this repository must be framed around **transparent, explainable heuristic matching, character-escaped LaTeX compilation, and human-in-the-loop review**, while either withdrawing the unsupported statistical claims or publishing the exact offline evaluation dataset and benchmark scripts alongside the paper.

---

## 1. Verified Architecture & Main Entry Points

| Dimension | Documented Proposal (PRD) | Actual Implementation in Codebase | Verification Status | Code Reference |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend Framework** | React + Tailwind CSS | React 19.3.1, TypeScript 7.0.2, Vite 8.3.5 | **Verified Implemented** | [`client/package.json`](file:///c:/Users/shiya/Desktop/gigsync%20resume/client/package.json#L12-L27) |
| **Frontend Styling** | Tailwind CSS / Vanilla CSS | Tailwind CSS v4.3.3 (`@tailwindcss/vite`), Custom CSS variables | **Verified Implemented** | [`client/src/index.css`](file:///c:/Users/shiya/Desktop/gigsync%20resume/client/src/index.css#L1-L120) |
| **Backend Framework** | Django REST Framework or FastAPI (Python) | Express 4.21.2 on Node.js (TypeScript 5.7.2) | **Implemented (Stack Divergence)** | [`server/package.json`](file:///c:/Users/shiya/Desktop/gigsync%20resume/server/package.json#L11-L21), [`server/src/server.ts`](file:///c:/Users/shiya/Desktop/gigsync%20resume/server/src/server.ts#L1-L25) |
| **Database** | PostgreSQL | In-Memory TypeScript Data Store & Client Local Storage | **Implemented (In-Memory Only)** | [`server/src/data/seedData.ts`](file:///c:/Users/shiya/Desktop/gigsync%20resume/server/src/data/seedData.ts#L3-L102), [`server/src/server.ts`](file:///c:/Users/shiya/Desktop/gigsync%20resume/server/src/server.ts#L26-L55) |
| **AI / NLP Engine** | LLM API with structured outputs (Gemini/OpenAI) | Rule-based regex token extractor & state-machine assistant | **Implemented (Rule-Based Only)** | [`server/src/services/parserService.ts`](file:///c:/Users/shiya/Desktop/gigsync%20resume/server/src/services/parserService.ts#L11-L160), [`server/src/services/aiAssistantService.ts`](file:///c:/Users/shiya/Desktop/gigsync%20resume/server/src/services/aiAssistantService.ts#L22-L188) |
| **Matching Engine** | Weighted scoring + optional embeddings | Deterministic multi-criteria weighted scoring algorithm | **Verified Implemented** | [`server/src/services/matchingEngine.ts`](file:///c:/Users/shiya/Desktop/gigsync%20resume/server/src/services/matchingEngine.ts#L60-L330) |
| **LaTeX / PDF Export** | LaTeX Template + Tectonic compiler | TypeScript template engine with character escaping; Client `window.print()` | **Implemented (No Server TeX Compiler)** | [`server/src/services/latexService.ts`](file:///c:/Users/shiya/Desktop/gigsync%20resume/server/src/services/latexService.ts#L7-L162), [`client/src/pages/ResumeStudioPage.tsx`](file:///c:/Users/shiya/Desktop/gigsync%20resume/client/src/pages/ResumeStudioPage.tsx#L85-L105) |
| **Production Host** | Docker + Cloud Host | Vercel SPA Deployment | **Verified Implemented** | [`vercel.json`](file:///c:/Users/shiya/Desktop/gigsync%20resume/vercel.json#L1-L11), [Live URL](https://gigsync-platform.vercel.app) |

### Main Entry Points
1. **Frontend App Shell:** [`client/src/App.tsx`](file:///c:/Users/shiya/Desktop/gigsync%20resume/client/src/App.tsx#L1-L360) (State coordinator, view router, toast notifications, guest profile management).
2. **Frontend DOM Bootstrapper:** [`client/src/main.tsx`](file:///c:/Users/shiya/Desktop/gigsync%20resume/client/src/main.tsx#L1-L10) (React 19 root mounting).
3. **Backend REST Server:** [`server/src/server.ts`](file:///c:/Users/shiya/Desktop/gigsync%20resume/server/src/server.ts#L503-L507) (Listens on port 5000, handles 15 REST endpoints).
4. **Data Seed Store:** [`server/src/data/seedData.ts`](file:///c:/Users/shiya/Desktop/gigsync%20resume/server/src/data/seedData.ts#L1-L420) (Contains 1 guest candidate profile, 6 job listings, and 12 verified learning resources).

---

## 2. Feature-by-Feature Implementation Audit

### 2.1 AI-Assisted Resume Generation and Formatting
* **Implementation Status:** **Implemented** (Pure TypeScript template generation + state machine conversational builder; no external generative LLM).
* **Actual Processing Workflow:**
  1. User interacts with either the Conversational Assistant ([`AiResumeAssistantPage.tsx`](file:///c:/Users/shiya/Desktop/gigsync%20resume/client/src/pages/AiResumeAssistantPage.tsx)) or manual editor ([`ProfilePage.tsx`](file:///c:/Users/shiya/Desktop/gigsync%20resume/client/src/pages/ProfilePage.tsx)).
  2. Input facts (education, skills, projects, experience) are stored in the structured `CandidateProfile` interface.
  3. Client calls `POST /api/resumes/latex` or generates LaTeX locally via [`latexService.ts`](file:///c:/Users/shiya/Desktop/gigsync%20resume/server/src/services/latexService.ts).
  4. The generator escapes all user strings against LaTeX special characters and interpolates them into one of four templates (`modern`, `academic`, `executive`, `minimalist`).
  5. The resulting compilable `.tex` code is displayed in an editor with a one-click download, and a print-accurate document sheet is rendered for browser PDF printing.
* **Algorithms & Models Used:**
  - Single-pass regex substitution: `/[\\%$&_#{}^~]/g` to sanitize input strings without double-escaping.
  - Heuristic turn-based state machine in [`processAssistantTurn`](file:///c:/Users/shiya/Desktop/gigsync%20resume/server/src/services/aiAssistantService.ts#L22-L166) transitioning across 6 states (`intro` $\rightarrow$ `education` $\rightarrow$ `skills` $\rightarrow$ `projects` $\rightarrow$ `experience` $\rightarrow$ `review`).
* **Relevant Files & Endpoints:**
  - Files: [`server/src/services/latexService.ts`](file:///c:/Users/shiya/Desktop/gigsync%20resume/server/src/services/latexService.ts), [`server/src/services/aiAssistantService.ts`](file:///c:/Users/shiya/Desktop/gigsync%20resume/server/src/services/aiAssistantService.ts), [`client/src/pages/ResumeStudioPage.tsx`](file:///c:/Users/shiya/Desktop/gigsync%20resume/client/src/pages/ResumeStudioPage.tsx).
  - Endpoints: `POST /api/resumes/latex`, `POST /api/ai/resume-assistant`, `GET /api/resumes/versions`, `POST /api/resumes/versions`.
* **External Services & Dependencies:** None. Standard TypeScript built-in strings and React DOM.
* **Input / Output Formats:**
  - Input: `CandidateProfile` JSON object.
  - Output: UTF-8 encoded compilable LaTeX string (`.tex`) and printable HTML DOM.
* **Error Handling & Limitations:**
  - No server-side TeX distribution (such as `pdflatex`, `xelatex`, or `tectonic`) is bundled in the environment. PDF compilation relies entirely on browser print rendering (`window.print()`).
  - No LLM writes creative prose; bullet points are constructed via template interpolation of user-supplied phrases.
* **Testing & Evidence:** Tested in [`server/src/tests/services.test.ts`](file:///c:/Users/shiya/Desktop/gigsync%20resume/server/src/tests/services.test.ts#L35-L57). Tests verify escaping of `%`, `&`, `$`, `_`, `{`, `}`, `\`, and valid `\documentclass` / `\begin{document}` structure.

---

### 2.2 Resume Parsing and Information Extraction
* **Implementation Status:** **Implemented** (Deterministic regex and dictionary-based keyword extractor; no OCR or multimodal deep-learning model).
* **Actual Processing Workflow:**
  1. Candidate pastes raw resume text or uploads a `.txt`/`.pdf`/`.docx` file.
  2. The parser splits lines and applies regex patterns to identify email addresses, phone numbers, GitHub/LinkedIn URLs, and candidate names.
  3. Predefined technical dictionaries (50+ programming languages, frameworks, developer tools) match skill tokens using word-boundary regular expressions.
  4. Degree level and university titles are matched using institutional keywords (`University`, `College`, `Bachelor`, `Master`).
  5. The parser outputs a draft profile, an extraction confidence score (0–100), and uncertainty flags for user review.
* **Algorithms & Models Used:**
  - Regular expressions for entity patterns:
    - Email: `/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/`
    - Phone: `/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/`
    - Degree: `/(Bachelor|Master|B\.S\.|B\.A\.|M\.S\.|PhD|Associate)[\w\s]*(?:in|of)?\s*([A-Za-z\s]+)?/i`
  - Vocabulary matching: String array membership checks against categorized dictionaries (`knownTech`, `knownFrameworks`, `knownTools`, `knownSoft`).
  - Point-based additive scoring function for confidence calculation: Full name (+20), Email (+25), Phone (+15), Education (+20), Technical skills (+20).
* **Relevant Files & Endpoints:**
  - Files: [`server/src/services/parserService.ts`](file:///c:/Users/shiya/Desktop/gigsync%20resume/server/src/services/parserService.ts), [`client/src/pages/ProfilePage.tsx`](file:///c:/Users/shiya/Desktop/gigsync%20resume/client/src/pages/ProfilePage.tsx#L125-L210).
  - Endpoint: `POST /api/parser/parse`.
* **Input / Output Formats:**
  - Input: `{ text: string }`
  - Output: `ParsedResumeResult` containing `extractedProfile`, `confidenceScore: number`, `flags: ExtractedFieldFlag[]`, `warnings: string[]`.
* **Error Handling & Limitations:**
  - Fails to parse complex multi-column PDFs unless text is cleanly extractable as sequential plain text.
  - Does not perform named entity recognition (NER) using SpaCy, NLTK, or BERT. Does not infer non-dictionary skill variants.
* **Testing & Evidence:** Tested in [`services.test.ts`](file:///c:/Users/shiya/Desktop/gigsync%20resume/server/src/tests/services.test.ts#L59-L85) against a single synthetic resume string. Successfully extracted candidate name, email, Stanford University, and skills.

---

### 2.3 Resume-Based Job Search and Ranking
* **Implementation Status:** **Implemented** (Weighted multi-criteria ranking over seeded job listings).
* **Actual Processing Workflow:**
  1. The user requests jobs via `GET /api/jobs` with optional filters (keyword, work mode, experience level, location).
  2. For every candidate job in the repository (6 seeded listings), `calculateJobMatch` evaluates candidate profile evidence against the listing.
  3. The overall match score is computed as a weighted sum of four criteria.
  4. Jobs are augmented with `matchScore` and an explanatory summary and returned sorted by relevance.
* **Algorithms & Models Used:**
  - **Relevance Scoring Formula:**
    $$\text{Overall Score} = (0.50 \times S) + (0.25 \times E) + (0.15 \times D) + (0.10 \times R)$$
    Where:
    - $S$ (Skills Score): $(0.70 \times \text{Ratio}_{\text{essential}}) + (0.30 \times \text{Ratio}_{\text{preferred}})$
    - $E$ (Experience Score): Baseline 70 + (Internships $\times$ 12), penalized if below minimum required years.
    - $D$ (Education Score): 95 if STEM/CS degree detected; 85 baseline.
    - $R$ (Role Similarity Score): 95 if candidate target role matches job title; 75 baseline.
  - **Skill Token Normalization & Alias Mapping:**
    - Function: `normalizeSkill` strips trailing `.js`, whitespace, and normalizes casing.
    - Alias map maps synonyms (e.g., `postgres` $\rightarrow$ `['postgres', 'postgresql']`, `react` $\rightarrow$ `['react', 'reactjs', 'react.js']`, `automated testing / jest` $\rightarrow$ `['testing', 'jest', 'cypress', 'playwright', 'unit test']`).
* **Relevant Files & Endpoints:**
  - Files: [`server/src/services/matchingEngine.ts`](file:///c:/Users/shiya/Desktop/gigsync%20resume/server/src/services/matchingEngine.ts#L60-L240), [`client/src/pages/JobDiscoveryPage.tsx`](file:///c:/Users/shiya/Desktop/gigsync%20resume/client/src/pages/JobDiscoveryPage.tsx).
  - Endpoints: `GET /api/jobs`, `GET /api/jobs/:id`, `POST /api/match`.
* **Input / Output Formats:**
  - Input: Query params for filtering; `CandidateProfile` and `JobListing` objects for matching.
  - Output: Array of `JobListing` objects with attached `matchScore` (15–99) and `matchSummary`.
* **Error Handling & Limitations:**
  - Evaluates only against 6 seeded jobs. No live external scraper or public job API (e.g., LinkedIn API, Indeed API) is integrated.
  - Does not use statistical vector retrieval (BM25) or semantic dense embeddings.
* **Testing & Evidence:** Tested in [`services.test.ts`](file:///c:/Users/shiya/Desktop/gigsync%20resume/server/src/tests/services.test.ts#L8-L33). Normalization, alias matching, and score bounds verified on `job_1`.

---

### 2.4 Skill-Gap Analysis Between Resume and Job Requirements
* **Implementation Status:** **Implemented** (Evidence-backed 5-bucket categorization).
* **Actual Processing Workflow:**
  1. The engine iterates over `essentialSkills` and `preferredSkills` of a selected job.
  2. For each requirement, it scans the profile's declared skills, project tech stacks, project bullet points, and work experience descriptions.
  3. Matches record the explicit evidence source (e.g., `"Listed in Profile Skills & Demonstrated in Project DevPulse"`).
  4. Unmatched requirements are categorized into essential gaps and preferred gaps.
  5. Requirements in `constraints` (work authorization, graduation year, on-site presence) are isolated as **Hard Constraints** and evaluated into `satisfied`, `unmet`, or `unknown`.
* **Algorithms & Models Used:**
  - Categorical partitioning logic:
    1. **Demonstrated Skills:** Matched with profile evidence.
    2. **Missing Essential Skills:** Mandatory skills absent from profile.
    3. **Missing Preferred Skills:** Optional/bonus skills absent from profile.
    4. **Clarification Needed:** Ambiguous profile entries (e.g., graduation year missing).
    5. **Hard Constraints:** Non-learnable prerequisites (ITAR, citizenship, work authorization).
* **Relevant Files & Endpoints:**
  - Files: [`server/src/services/matchingEngine.ts`](file:///c:/Users/shiya/Desktop/gigsync%20resume/server/src/services/matchingEngine.ts#L96-L285), [`client/src/pages/JobDetailPage.tsx`](file:///c:/Users/shiya/Desktop/gigsync%20resume/client/src/pages/JobDetailPage.tsx#L140-L260).
  - Endpoint: `POST /api/match`, `GET /api/jobs/:id`.
* **Error Handling & Limitations:**
  - Keyword matching can miss implicit skills (e.g., if a candidate writes "built distributed pub-sub pipelines" without writing "Kafka" or "Messaging").
* **Testing & Evidence:** Tested in [`services.test.ts`](file:///c:/Users/shiya/Desktop/gigsync%20resume/server/src/tests/services.test.ts#L21-L33). Verified separation of US Work Authorization as an `unknown` hard constraint rather than a skill mismatch.

---

### 2.5 Course Recommendation Based on Missing Skills
* **Implementation Status:** **Implemented** (Curated catalogue lookup + 3-stage roadmap synthesizer).
* **Actual Processing Workflow:**
  1. The user selects a job or triggers `POST /api/roadmap/generate` with identified missing skills.
  2. The system queries the verified course catalogue (`SEEDED_LEARNING_RESOURCES`, containing 12 vetted free courses).
  3. Resources matching the missing skill tokens are retrieved and structured into three sequential phases:
     - **Stage 1:** Core Fundamentals & Prerequisite Tools
     - **Stage 2:** Essential Role Requirements
     - **Stage 3:** Portfolio Integration & Preferred Skills
  4. The candidate tracks progression by updating items to `planned`, `in-progress`, or `completed`.
* **Algorithms & Models Used:**
  - Case-insensitive substring matching over resource skill arrays:
    `r.skills.some(s => s.toLowerCase().includes(skillName.toLowerCase()))`
  - Array partitioning into fixed three-stage milestones: Index 0 $\rightarrow$ Stage 1; Index 1 $\rightarrow$ Stage 2; Index $\ge 2$ $\rightarrow$ Stage 3.
* **Relevant Files & Endpoints:**
  - Files: [`server/src/server.ts`](file:///c:/Users/shiya/Desktop/gigsync%20resume/server/src/server.ts#L257-L326), [`server/src/data/seedData.ts`](file:///c:/Users/shiya/Desktop/gigsync%20resume/server/src/data/seedData.ts#L262-L419), [`client/src/pages/LearningRoadmapPage.tsx`](file:///c:/Users/shiya/Desktop/gigsync%20resume/client/src/pages/LearningRoadmapPage.tsx).
  - Endpoints: `GET /api/courses`, `POST /api/roadmap/generate`, `GET /api/roadmap`, `PUT /api/roadmap/item/:itemId`.
* **Input / Output Formats:**
  - Input: `{ jobId: string, targetRole: string, missingSkills: string[] }`
  - Output: `LearningRoadmap` JSON object with stages, resource URLs, duration, and completion statuses.
* **Error Handling & Limitations:**
  - Limited to the 12 hardcoded verified resources in `seedData.ts`. If a job requires an uncommon niche skill (e.g., Cobol or Solidity), it falls back to a default resource.
* **Testing & Evidence:** Verified via live HTTP endpoints and interactive UI tests. No standalone automated unit test specifically for `roadmap/generate` in `services.test.ts`.

---

## 3. Algorithm Verification

The following table explicitly audits algorithmic methodologies typically claimed in career intelligence and document AI research papers:

| Algorithmic Technique | Presence in Codebase | Actual File Reference | Implementation Reality & Operational Role |
| :--- | :---: | :--- | :--- |
| **TF-IDF (Term Frequency-Inverse Document Frequency)** | **ABSENT** | None | Not implemented. No term frequency matrices, document frequency counts, or scikit-learn / natural language libraries exist in `package.json`. |
| **Cosine Similarity** | **ABSENT** | None | Not implemented. No dot products, vector norms, or geometric distance metrics are computed in any service. |
| **Keyword & Token Matching** | **PRESENT** | [`matchingEngine.ts:L24-55`](file:///c:/Users/shiya/Desktop/gigsync%20resume/server/src/services/matchingEngine.ts#L24-L55), [`parserService.ts:L69-72`](file:///c:/Users/shiya/Desktop/gigsync%20resume/server/src/services/parserService.ts#L69-L72) | **Primary matching mechanism.** Uses case-insensitive tokenization, boundary regular expressions (`(^\|[^a-z0-9])`), and a manual synonym dictionary. |
| **Dense Semantic Embeddings (e.g. SBERT)** | **ABSENT** | None | Not implemented. The PRD marked embeddings as an unverified "P2 - Could" feature; no embedding models or vector databases exist in the code. |
| **External LLM Generative API** | **ABSENT** | None | Not implemented. No SDKs (`@google/genai`, `openai`, `anthropic`) or API keys are imported or invoked. The "AI Assistant" is an internal state machine. |
| **Linear Multi-Criteria Decision Analysis (MCDA)** | **PRESENT** | [`matchingEngine.ts:L196-240`](file:///c:/Users/shiya/Desktop/gigsync%20resume/server/src/services/matchingEngine.ts#L196-L240) | Deterministic weighted scoring combining skills (50%), experience (25%), education (15%), and role similarity (10%). |
| **Injection-Safe String Sanitization** | **PRESENT** | [`latexService.ts:L7-26`](file:///c:/Users/shiya/Desktop/gigsync%20resume/server/src/services/latexService.ts#L7-L26) | Single-pass regex substitution escaping 10 LaTeX control symbols into safe macro equivalents. |

---

## 4. Dataset and Experimental Evidence Audit

The user requested auditing whether seven specific empirical metrics previously associated with the project can be reproduced from the codebase. Each metric was subjected to an exhaustive file and repository search:

```
Search Query Results across c:\Users\shiya\Desktop\gigsync resume:
- Query: "92" / "92.0%"  --> Found 0 evaluation matches (only package integrity hashes and svg paths)
- Query: "98" / "98.0%"  --> Found 0 evaluation matches
- Query: "84" / "84.0%"  --> Found 0 evaluation matches
- Query: "80" / "80.0%"  --> Found 0 evaluation matches
- Query: "86" / "86.0%"  --> Found 0 evaluation matches
- Query: "88" / "88.0%"  --> Found 0 evaluation matches
- Query: "96" / "96.0%"  --> Found 0 evaluation matches
- Query: "Precision"     --> Found 0 benchmark scripts or labels
- Query: "Recall"        --> Found 0 benchmark scripts or labels
- Query: "F1"            --> Found 0 benchmark scripts or labels
```

### Metric-by-Metric Reproducibility Audit

#### Metric 1: Resume extraction accuracy: 92.0% over 50 resumes
* **Status:** **Not independently reproducible from the current codebase.**
* **Audit Evidence:** 
  - The repository contains **zero** resume test corpora (0 PDF/DOCX resume files).
  - The only resume text in the test suite is one 13-line synthetic string in [`services.test.ts:L60-73`](file:///c:/Users/shiya/Desktop/gigsync%20resume/server/src/tests/services.test.ts#L60-L73).
  - There are no ground-truth annotation files (JSON/CSV) defining expected fields for 50 resumes.
  - No script exists calculating field-level precision, recall, or accuracy.

#### Metric 2: PDF generation success: 98.0% over 50 attempts
* **Status:** **Not independently reproducible from the current codebase.**
* **Audit Evidence:**
  - The repository does not include an automated batch test runner executing 50 generation attempts.
  - The backend does not compile PDFs directly; it outputs `.tex` text strings and leaves PDF generation to the browser print engine.
  - There are no compilation log files or failure records (e.g., 49 successes out of 50 attempts).

#### Metric 3: Job matching Precision@10: 84.0% over 250 labelled resume-job pairs
* **Status:** **Not independently reproducible from the current codebase.**
* **Audit Evidence:**
  - The entire repository contains only **6 job listings** ([`server/src/data/seedData.ts:L104-260`](file:///c:/Users/shiya/Desktop/gigsync%20resume/server/src/data/seedData.ts#L104-L260)).
  - A ranking evaluation at $k=10$ (Precision@10) is mathematically impossible on a dataset containing only 6 items.
  - There is no dataset of 250 candidate-job pairs, nor are there binary or graded relevance labels assigned by human annotators.

#### Metric 4: Job matching Recall@10: 80.0% over 250 labelled resume-job pairs
* **Status:** **Not independently reproducible from the current codebase.**
* **Audit Evidence:**
  - Same finding as Metric 3. No 250-pair dataset or recall calculation scripts exist.

#### Metric 5: Skill-gap detection F1-score: 86.0% over 50 test cases
* **Status:** **Not independently reproducible from the current codebase.**
* **Audit Evidence:**
  - The unit test suite contains exactly **1 test case** evaluating skill-gap detection for a single profile against `job_1` ([`services.test.ts:L21-33`](file:///c:/Users/shiya/Desktop/gigsync%20resume/server/src/tests/services.test.ts#L21-L33)).
  - There is no test suite of 50 test cases.
  - There are no formulas or scripts calculating the harmonic mean ($F_1 = 2 \cdot \frac{P \cdot R}{P + R}$) of true positive, false positive, and false negative skill classifications.

#### Metric 6: Course recommendation relevance: 88.0% across 75 course resources
* **Status:** **Not independently reproducible from the current codebase.**
* **Audit Evidence:**
  - The repository contains only **12 course resources** ([`server/src/data/seedData.ts:L262-419`](file:///c:/Users/shiya/Desktop/gigsync%20resume/server/src/data/seedData.ts#L262-L419)), not 75.
  - There are no user study records, expert relevance ratings, or statistical scripts evaluating recommendation accuracy.

#### Metric 7: End-to-end processing success: 96.0% over 50 resumes
* **Status:** **Not independently reproducible from the current codebase.**
* **Audit Evidence:**
  - No automated end-to-end integration test harness runs a pipeline of 50 inputs from ingestion to course roadmap.

> **Auditor Conclusion on Experimental Evidence:**  
> These metrics likely originated as hypothetical targets, project proposal estimates, or uncommitted offline experiments. **They must not be presented as empirically validated results in a research paper without committing the raw test corpus, human annotations, and automated evaluation scripts to the repository.**

---

## 5. Testing and Reproducibility

### Existing Test Suite
The codebase includes an automated unit test suite implemented using Node.js's native test runner (`node:test`) and strict assertions (`node:assert/strict`).

* **Test File:** [`server/src/tests/services.test.ts`](file:///c:/Users/shiya/Desktop/gigsync%20resume/server/src/tests/services.test.ts)
* **Execution Command:** `npm test` (inside `server/`) or `npm run test:server` (from root)
* **Verified Test Results:**
  ```text
  ✔ MatchingEngine: normalizes skill tokens correctly (1.0042ms)
  ✔ MatchingEngine: matches skill aliases accurately (1.8657ms)
  ✔ MatchingEngine: calculates explainable match score and separates hard constraints (4.2008ms)
  ✔ LatexService: escapes special characters to prevent injection (0.3396ms)
  ✔ LatexService: generates valid, compilable LaTeX document structure (0.6355ms)
  ✔ ParserService: extracts contact and skills without hallucination (3.7755ms)
  ℹ tests 6 | suites 0 | pass 6 | fail 0 | cancelled 0 | duration_ms 114.859
  ```

### Safe Environment Setup & Execution Instructions

#### Prerequisites
- Node.js: `v18.0.0` or higher (Tested on Node `v24.11.1`)
- npm: `v9.0.0` or higher
- Operating System: Windows, macOS, or Linux (cross-platform path handling verified)

#### Installation & Build
```bash
# 1. Clone repository
git clone https://github.com/Shiyaz123/gigsync-platform.git
cd gigsync-platform

# 2. Install backend dependencies & build TypeScript
cd server
npm install
npm run build

# 3. Execute unit tests
npm test

# 4. Install frontend dependencies & build client
cd ../client
npm install
npm run build
```

#### Running the System
```bash
# Start backend API daemon (runs on http://localhost:5000)
cd server
node dist/server.js

# In a separate terminal, launch client dev server (runs on http://localhost:3000)
cd client
npm run dev
```

---

## 6. Research-Paper Consistency & Claim Analysis

To ensure academic integrity, the following matrix contrasts what an academic research paper can legitimately claim based on the source code against claims that are unsupported or high-risk:

| Feature / Dimension | Legitimate Paper Claim Supported by Code | Unsupported / High-Risk Claim to AVOID |
| :--- | :--- | :--- |
| **System Purpose** | "A web-based career decision support workspace enabling explainable job alignment, skill-gap detection, and LaTeX resume synthesis." | "An autonomous AI agent that guarantees employment and optimizes hiring probability." |
| **NLP & AI Architecture** | "Deterministic regex-based information extraction paired with a multi-step conversational state machine and token normalization." | "Deep generative LLM architecture powered by fine-tuned Transformer embeddings and contextual neural extraction." |
| **Matching Algorithm** | "A transparent, multi-criteria linear scoring model combining essential/preferred skills (50%), experience (25%), education (15%), and target roles (10%)." | "A semantic vector space model utilizing Cosine Similarity over BERT/Sentence-Transformer document embeddings." |
| **Skill-Gap Categorization** | "A 5-bucket requirement classification isolating legal and institutional constraints from trainable skills with source evidence attribution." | "An automated deep reasoning engine predicting candidate skill proficiency from resume text." |
| **LaTeX & PDF Generation** | "A template-driven LaTeX generator featuring single-pass character escaping against code injection vulnerabilities." | "An integrated cloud LaTeX compilation microservice running isolated containerized TeX engines." |
| **Experimental Evaluation** | "A functional prototype validated through 6 core algorithmic unit tests and end-to-end system verification on representative seed profiles." | "Empirical benchmark evaluation demonstrating 92.0% extraction accuracy on 50 resumes and 84.0% Precision@10 over 250 pairs." |

### Essential Disclosures & Missing Research Elements
If submitting this project to an IEEE, ACM, or Springer conference:
1. **Missing Baseline Comparisons:** The paper must acknowledge the lack of comparative baselines (e.g., comparing the heuristic matching score against BM25, TF-IDF cosine similarity, or zero-shot OpenAI embeddings).
2. **Missing Ablation Studies:** The paper should analyze the impact of individual scoring weights (e.g., what happens if the 70/30 essential/preferred skill ratio is set to 50/50, or if experience weight is dropped).
3. **Disclosure of Seed Data:** Explicitly state that the current deployment evaluates against a curated catalogue of 6 representative tech listings and 12 verified open-access learning resources.

---

## 7. Manual Confirmation Checklist for Project Owner

Before finalizing any research paper draft or presentation, the project author must manually confirm:

- [ ] **Empirical Claims Alignment:** Confirm that the 7 unverified percentage metrics (92%, 98%, 84%, 80%, 86%, 88%, 96%) are either removed from the paper or clearly described as *future evaluation benchmarks* / *target design specifications*.
- [ ] **Stack Terminology:** Ensure the paper text refers to the actual implemented stack (**React 19 + Express TypeScript**) rather than the preliminary proposal (**Django REST Framework + PostgreSQL**).
- [ ] **AI Model Description:** Describe the AI assistant as a *guided conversational state machine* rather than claiming direct integration with Gemini/GPT-4 APIs.
- [ ] **LaTeX Compilation Disclosure:** Disclose that PDF export currently relies on browser CSS print media queries from the structured canvas, while `.tex` files are provided for external TeX compilation.
- [ ] **Offline Benchmark Release (Optional):** If the 50-resume and 250-pair evaluation was conducted offline, create an `eval/` directory in the repository containing the anonymized test samples, ground-truth labels, and evaluation scripts so reviewers can replicate the results.

---

## 8. Recommended Reviewer Artifact Package

When providing supplementary material or code artifacts to academic reviewers, provide a clean bundle containing only the following core files (excluding build caches, `.git`, and `node_modules`):

```text
gigsync-reviewer-bundle/
├── server/
│   ├── src/
│   │   ├── services/
│   │   │   ├── matchingEngine.ts     # Core weighted matching & constraint logic
│   │   │   ├── latexService.ts       # Injection-safe LaTeX generator
│   │   │   ├── parserService.ts      # Regex & vocabulary parser
│   │   │   └── aiAssistantService.ts # Conversational state machine
│   │   ├── data/
│   │   │   └── seedData.ts           # Domain models, jobs, and learning catalogue
│   │   ├── tests/
│   │   │   └── services.test.ts      # Automated unit test suite
│   │   ├── types/
│   │   │   └── index.ts              # Data contracts and schema definitions
│   │   └── server.ts                 # REST API endpoints
│   ├── package.json
│   └── tsconfig.json
├── client/
│   ├── src/
│   │   ├── pages/                    # 10 React workspace pages
│   │   ├── services/api.ts           # Typed API client with local fallbacks
│   │   └── index.css                 # Editorial design system
│   ├── package.json
│   └── vite.config.ts
├── GigSync_PRD.docx                  # Initial project specification
├── README.md                         # Architecture overview & setup instructions
└── GigSync_Technical_Audit.md        # This reproducibility audit report
```

*(Do not include `.env` files, `.vercel` credentials, `client/dist/`, `server/dist/`, or `node_modules/` in the reviewer archive).*
