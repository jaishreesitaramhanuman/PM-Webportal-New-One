# 🌐 VisitWise

### Smart Workflow & Analytics Platform for Government Reform Monitoring

> A **Next.js-powered, role-based workflow engine** that automates the end-to-end lifecycle of reform-monitoring visits across Indian states and domains (Energy, Health, Education, etc.).
> Cascades requests downward from NITI Aayog to districts, consolidates data upward, produces publication-ready documents, and keeps stakeholders informed through deadline-driven alerts and AI-assisted insights.

---

## 🚀 Live Demo

**Deployed on Vercel (Manual Deploy)**
👉 [https://visit-wise-tau.vercel.app](https://visit-wise-tau.vercel.app) *(Demo – UI prototype only)*

> Login with demo credentials (see Quick Start below)

---

## 🧩 Core Highlights

| Feature                                    | Description                                                     | Tech Stack                     |
| ------------------------------------------ | --------------------------------------------------------------- | ------------------------------ |
| 🧑‍💼 **Role-Based Access Control (RBAC)** | 7 roles from PMO → Div YP with JWT auth                         | Next.js API Routes + JWT       |
| ⚙️ **Workflow Engine**                     | Auto-cascading requests & hierarchical approvals                | Serverless API Routes          |
| 🧾 **Dynamic Template Forms**              | Domain templates (Energy, Tourism, etc.) + Custom schema editor | React Hook Form + MongoDB      |
| 📄 **Document Generation**                 | DOCX/PDF preview/export (Govt. style letterheads)               | `docx-templates` + Puppeteer   |
| 🔔 **Alert & Escalation System**           | Email, SMS, in-app notifications                                | SendGrid + Twilio (Free Tiers) |
| 🤖 **AI Insights**                         | Summarize deficits, generate reform suggestions                 | Gemini API                     |
| 📊 **Analytics Dashboards**                | Role-based progress heatmaps and overdue tracking               | Recharts + Next.js SSR         |
| 💾 **Storage**                             | Document & form storage                                         | MongoDB Atlas + GridFS         |
| 🌱 **Hosting**                             | Fully serverless setup                                          | Vercel (Manual deploys)        |

---

## 🏗️ Overview

VisitWise is a **serverless workflow automation platform** tailored to hierarchical organizations. It replaces manual email/DOCX workflows with structured form collection, automated consolidation, AI-suggested insights, and ready-to-export government-style reports.

**Example Flow (Energy):**
PMO → create request → cascades to State Advisor → Div YP submits domain template (MW tables) → HOD consolidates → system generates DOCX/PDF → AI suggests reform bullets → publish.

---

## 🧱 Architecture

```
 ┌──────────────────────────────────────────────┐
 │                USER LAYER                    │
 │  PMO | CEO NITI | State Advisor | Div YP     │
 │  (Role-based dashboards & forms)             │
 └──────────────────────────────────────────────┘
               │
               ▼
 ┌──────────────────────────────────────────────┐
 │            WORKFLOW SERVICE (API)            │
 │  /api/auth  → JWT login & RBAC               │
 │  /api/workflows → Request creation & routing │
 │  /api/forms → Template-based submissions     │
 │  /api/alerts → Cron-triggered notifications  │
 └──────────────────────────────────────────────┘
               │
               ▼
 ┌──────────────────────────────────────────────┐
 │               DATA LAYER                     │
 │  MongoDB Atlas (M0) + GridFS                 │
 │  Stores users, templates, submissions, docs  │
 └──────────────────────────────────────────────┘
               │
               ▼
 ┌──────────────────────────────────────────────┐
 │             AI / INSIGHTS LAYER              │
 │  Gemini API for RAG-based summaries & advice │
 └──────────────────────────────────────────────┘
               │
               ▼
 ┌──────────────────────────────────────────────┐
 │          EXTERNAL SERVICES (Free Tier)       │
 │  SendGrid (email), Twilio (SMS), Vercel Cron │
 └──────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Category      | Technology                                |
| ------------- | ----------------------------------------- |
| Frontend      | Next.js 14 (App Router) + Tailwind CSS    |
| Backend       | Next.js API Routes (Serverless Functions) |
| Database      | MongoDB Atlas (Free M0 Cluster)           |
| Storage       | MongoDB GridFS                            |
| Auth          | JWT + bcrypt                              |
| Forms         | React Hook Form + AJV validation          |
| AI            | Gemini API (Google Generative AI)         |
| Notifications | SendGrid (email), Twilio (SMS)            |
| Charts        | Recharts                                  |
| Hosting       | Vercel (Free Tier)                        |

---

## ⚡ Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/visitwise.git
cd visitwise
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file with:

```env
MONGODB_URI="your_mongodb_connection_string"
JWT_SECRET="your_strong_secret"
GEMINI_API_KEY="your_gemini_api_key"
SENDGRID_API_KEY="your_sendgrid_api_key"
TWILIO_SID="your_twilio_sid"
TWILIO_TOKEN="your_twilio_token"
TWILIO_PHONE="+1234567890"
```

### 4. Run Locally

```bash
npm run dev
```

> App runs at: [http://localhost:3000](http://localhost:3000)

### 5. Demo Credentials (example)

| Role          | Username     | Password  |
| ------------- | ------------ | --------- |
| PMO           | pmo_demo     | pmo@123   |
| State Advisor | advisor_demo | state@123 |
| Div YP        | yp_demo      | yp@123    |

---

## 🧮 Core Modules

| Module         | API Route        | Description                                |
| -------------- | ---------------- | ------------------------------------------ |
| Authentication | `/api/auth`      | Login, Logout, JWT Issue                   |
| Workflow       | `/api/workflows` | Request creation & propagation             |
| Templates      | `/api/templates` | Load & manage domain templates             |
| Forms          | `/api/forms`     | Submit & validate domain-specific forms    |
| Alerts         | `/api/alerts`    | Cron-based email/SMS reminders             |
| Reports        | `/api/reports`   | Generate and preview DOCX/PDF              |
| Analytics      | `/api/analytics` | Dashboard metrics and exports              |
| AI             | `/api/ai`        | Query Gemini API for summaries/suggestions |

---

## 🧠 AI Features

| Feature                           | Description                             |
| --------------------------------- | --------------------------------------- |
| **Auto Summaries**                | “Summarize Energy deficits for Andaman” |
| **Reform Suggestions**            | “Suggest reforms for Tourism domain”    |
| **Chatbot Interface**             | RAG-style query bot powered by Gemini   |
| **Context-Aware Recommendations** | AI uses form data for domain context    |

> Tip: Cache frequent AI responses to conserve Gemini free-tier quota.

---

## 🆓 Free-Tier Resource Map

| Resource           | Plan  | Limit                                  |
| ------------------ | ----- | -------------------------------------- |
| MongoDB Atlas (M0) | Free  | 512 MB + GridFS                        |
| Vercel Hosting     | Hobby | 100 GB/month (manual deploys)          |
| SendGrid           | Free  | 100 emails/day                         |
| Twilio             | Trial | Dev SMS (trial constraints)            |
| Gemini API         | Free  | Quotas depend on key (cache responses) |

---

## 🧪 Testing

| Type       | Tool       |
| ---------- | ---------- |
| Unit Tests | Jest       |
| E2E Tests  | Playwright |
| API Tests  | Supertest  |

Run tests:

```bash
npm run test
```

---

## 🤝 Contributing

Contributions welcome!

1. Fork 🍴
2. Create branch: `git checkout -b feature/your-feature`
3. Commit: `git commit -m "Add feature"`
4. Push & open PR 🚀

Follow TypeScript + ESLint + Prettier rules.

---

## 📚 Documentation

* `docs/SRS.md` — Software Requirements Specification (SRS)
* `docs/architecture.md` — Architecture diagram & notes
* `docs/api.yaml` — API spec (OpenAPI)
* `docs/template_guide.md` — Template creation guide
* `docs/user_manual.md` — End-user manual

---

## 🪪 License

MIT License — free for personal, pilot, and government evaluation uses.

---

## 💡 Pro Tips & Gotchas

* Preserve existing UI components; extend via props/hooks.
* Version every template (`templateId + version`) for reproducible docs.
* Use AJV server-side to validate submitted forms against template schema.
* Compress DOCX/PDF before uploading to GridFS to stay under free-tier limits.
* Mock SendGrid/Twilio in dev to avoid consuming trial quotas.

---

## 🏁 Roadmap (Suggested)

| Phase   | Focus                                       | Timeline |
| ------- | ------------------------------------------- | -------- |
| Phase 1 | Core workflow (Auth, Requests, Forms, Docs) | 4 weeks  |
| Phase 2 | Alerts & Escalations                        | +1 week  |
| Phase 3 | AI Assistance & Analytics                   | +2 weeks |
| Phase 4 | Manual Vercel production deploy             | +ongoing |

---

## 🧾 Credits

Built & maintained by **Harsh Kumar Jha** and contributors — for smarter, auditable government reform monitoring.