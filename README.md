# GigSync — AI-Powered Career Preparation & Job Matching Platform

> **Final-Year Computer Science Engineering Project**  
> *"Build your resume. Find relevant jobs. Bridge your skills gap."*

---

## 🚀 Overview

**GigSync** is an AI-assisted career enablement platform engineered specifically for students, fresh graduates, and early-career job seekers. It transforms raw project and academic experience into structured profiles, generates injection-safe, compilable LaTeX resumes, provides explainable job matching with evidence breakdowns, and builds actionable, staged learning roadmaps mapped to verified free and trustworthy courses.

### Core Distinctions
- **Zero-Hallucination Policy (FR-12):** Grounded strictly in confirmed user facts. Never invents degrees, employment dates, employer names, or fabricated metric impact.
- **Explainable Matching Engine (FR-17, FR-18):** Transparent weighted score based on skill overlap, project artifacts, experience, and education. Scores reflect evidence alignment—not employer hiring probabilities.
- **Hard Constraint Segregation (FR-19):** Separates legal, license, and geographic requirements from learnable technical skills.
- **LaTeX & PDF Architecture (FR-09, FR-10):** Generates clean, production-grade, compilable `.tex` code protected by character escaping, alongside instant PDF printing.

---

## 🛠️ System Architecture & Technology Stack

| Layer | Technology | Key Modules & Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite | Responsive UI, state management, interactive canvas, editorial design system |
| **Styling** | Vanilla CSS (CSS Variables) | Modern design tokens, editorial serif typography, print `@media print` |
| **Gateway API** | Node.js, Express, TypeScript | Session state, auth, profile, LaTeX resumes, saved jobs, courses, roadmap |
| **Job Search Service** | Python Flask, Requests, Pytest | Real location-based job search via Adzuna, The Muse, Remotive APIs |
| **Matching Engine**| Python Rule-Based Scoring | Honest evidence-based scoring (Skills 50%, Exp 25%, Edu 15%, Role 10%) |
| **Resume Extraction** | PyMuPDF (fitz), python-docx, Gemini | Multimodal document parsing, confidence scoring, zero-hallucination |
| **LaTeX Engine** | LaTeX Service | Character escaping against injection, multi-template generation (`modern`, etc.) |
| **Testing** | Pytest & Node Test Runner | 100% automated test coverage across Python Flask and Express services |

---

## 📂 Project Structure

```text
gigsync-resume/
├── client/                              # Vite + React + TypeScript Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx               # Sticky glassmorphic navigation & theme toggle
│   │   │   └── Toast.tsx                # Non-intrusive micro-feedback notifications
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx        # Profile readiness, stats, top matches, pipeline
│   │   │   ├── ProfilePage.tsx          # Structured editor, upload/parse drawer, fact verification
│   │   │   ├── ResumeStudioPage.tsx     # Template selector, live sheet preview, LaTeX editor, export
│   │   │   ├── JobDiscoveryPage.tsx     # Filterable search, verified job cards, match badges
│   │   │   ├── JobDetailPage.tsx        # Fit breakdown, evidence list, gaps, hard constraints
│   │   │   ├── LearningRoadmapPage.tsx  # 3-Stage learning timeline with course links & progress
│   │   │   └── SettingsPrivacyPage.tsx  # JSON data export, data erasure, responsible AI pledge
│   │   ├── services/
│   │   │   └── api.ts                   # Unified API client with resilient local fallback
│   │   ├── types/
│   │   │   └── index.ts                 # Type definitions matching PRD specifications
│   │   ├── index.css                    # Bespoke Vanilla CSS design system
│   │   ├── App.tsx                      # Main app shell and state coordination
│   │   └── main.tsx                     # React DOM entry point
│   ├── index.html                       # SEO-optimized HTML5 entry
│   ├── vite.config.ts                   # Vite configuration with API proxy to port 5000
│   └── package.json
│
├── server/                              # Node.js + Express API Backend
│   ├── src/
│   │   ├── data/
│   │   │   └── seedData.ts              # Verified seeded jobs and curated learning resources
│   │   ├── services/
│   │   │   ├── matchingEngine.ts        # Weighted scoring & constraint segregation engine
│   │   │   ├── latexService.ts          # Compilable LaTeX generator & character sanitizer
│   │   │   └── parserService.ts         # Heuristic document parser with confidence flags
│   │   ├── tests/
│   │   │   └── services.test.ts         # Automated unit test suite (100% passing)
│   │   ├── types/
│   │   │   └── index.ts                 # Server domain model types
│   │   └── server.ts                    # Express REST API endpoints
│   ├── tsconfig.json
│   └── package.json
│
├── README.md                            # Comprehensive project report & documentation
├── GigSync_PRD.docx                     # Original approved Product Requirements Document
└── package.json                         # Root orchestration package
```

---

## 🌟 Key Functional Features (PRD Alignment)

### 1. Dashboard & Candidate Health (FR-30, FR-31)
- Live calculation of **Profile Completeness Index** (0% to 100%).
- Application pipeline tracking: **Saved**, **Applied**, and **Interviewing**.
- Immediate next learning goal widget linking directly to high-priority coursework.

### 2. Confirmed Profile & Document Parser (FR-01 to FR-07)
- Edit personal details, education, work experience, technical projects, and skills.
- Document text parser extracts contact info, education, and keywords with confidence ratings.
- **Review-and-Correct Modal (FR-07):** Users explicitly review extracted facts before merging them into their master profile.

### 3. Resume Studio & Compilable LaTeX (FR-08 to FR-11)
- **Selectable Templates:** Modern Tech, Classic Academic, Executive, and Minimalist Developer.
- **Visual Preview:** High-fidelity print-accurate document preview.
- **LaTeX Source Code Exporter:** Generates compilable `.tex` files with syntax escaping for `%`, `$`, `&`, `_`, `#`, `{`, `}`, `~`, `^`, and `\`.
- **Targeted Tailoring:** Pre-focuses resume phrasing toward specific job postings without hallucinating claims.
- **Export Formats:** Print to PDF and download `.tex` source.

### 4. Job Discovery & Explainable Fit Analysis (FR-14 to FR-21)
- Real-world curated job postings with verified source links (LinkedIn, Indeed, Handshake, Direct).
- Search by keywords, work mode (Remote/Hybrid/On-site), and experience level.
- **Relevance Score Gauge:** Transparent weighted calculation (Skills 50%, Experience 25%, Education 15%, Role 10%).
- **Evidence Breakdown:** Exact proof points (e.g., *"Found in Profile Skills & Project: DevPulse"*).
- **Hard Constraints (FR-19):** Segregates work authorization, degree mandates, and location constraints from trainable skill gaps.

### 5. Staged Learning Roadmap (FR-22 to FR-29)
- Translates missing essential requirements into an actionable 3-stage progression:
  - **Stage 1:** Core Fundamentals & Prerequisites
  - **Stage 2:** Essential Role Requirements
  - **Stage 3:** Portfolio Integration & Preferred Skills
- Curated resources from top providers: **Harvard CS50**, **freeCodeCamp**, **The Odin Project**, **University of Helsinki**, **Docker Official Labs**, **MDN Web Docs**, etc.
- Interactive status tracking: *Planned* → *In Progress* → *Completed*.

### 6. Privacy & Responsible AI (FR-04, NFR-05, Section 12)
- **Data Portability:** One-click export of entire user data payload in standard JSON format.
- **Data Erasure:** Complete local and server session data wipe.
- Clear disclosures that match scores indicate relevance, not guarantees of employment.

---

## ⚡ Quick Start Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher (Tested on Node v24.11.1)
- **npm**: v9.0.0 or higher

### Installation & Launch

1. **Install Dependencies**
   ```bash
   npm run install:all
   ```

2. **Run Backend API Server (Port 5000)**
   ```bash
   npm run start:server
   ```

3. **Run Client Application (Port 3000)**
   ```bash
   cd client
   npm run dev
   ```

4. **Access Application**
   Open your browser to: **`http://localhost:3000`**

---

## 🧪 Automated Testing

Run the automated test suite verifying matching algorithms, LaTeX sanitization, and parsing logic:

```bash
npm run test:server
```

**Test Results:**
```text
✔ MatchingEngine: normalizes skill tokens correctly
✔ MatchingEngine: matches skill aliases accurately
✔ MatchingEngine: calculates explainable match score and separates hard constraints
✔ LatexService: escapes special characters to prevent injection
✔ LatexService: generates valid, compilable LaTeX document structure
✔ ParserService: extracts contact and skills without hallucination
ℹ tests 6 | pass 6 | fail 0 | 100% passing
```

---

## 📜 Academic Compliance & Ethics

This platform was developed in strict accordance with the GigSync Product Requirements Document (PRD v1.0). All generated output is grounded in confirmed applicant records. The system does not automate employer hiring decisions, crawl protected websites without authorization, or misrepresent student credentials.
