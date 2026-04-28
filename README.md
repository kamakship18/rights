# Actionable Justice OS

> Rights exist. Access doesn't. We're fixing that.

An AI-powered legal redressal platform that takes a citizen from *"I have a problem"* to *"The right authority is already being held accountable"* — automatically, in under 60 seconds.

**Team Maverick** · Kamakshi & Chirag

---

## The Problem

Most grievance systems are black holes. You file. You wait. Nothing happens. Authorities face zero consequences for ignoring complaints. Citizens have no way to escalate, no legal language, and no proof.

---

## What We Built

### 🚨 Pulse SOS
One-tap emergency mode. Finds the 3 nearest police stations and hospitals instantly via Google Places, broadcasts your live GPS to saved emergency contacts over WhatsApp/SMS, and opens a direct 112 dial link. No forms. No delays.

### 🤖 AI Grievance Intake
Type or speak your complaint in plain language. The AI triages it, maps it to the exact Indian law (BNS, Noise Pollution Rules, Electricity Act, Consumer Protection Act, and more) using a RAG pipeline — not hallucinations — and identifies the correct nodal officer for your PIN code.

### 📄 Direct Filing
One confirmation tap sends a formal legal notice directly to the responsible authority's inbox. No lawyers. No RTI expertise needed. The system writes it, signs it with your identity, and delivers it.

### 🔁 Persistence Bot
The system never lets go. If your grievance isn't resolved in 7 days, it automatically resends. At 14 days, it escalates to the parent authority and CCs them. Every action is logged in a visible Chain of Action timeline.

### ⛓️ Blockchain Evidence Layer
Every grievance can be filed immutably on a custom SHA-256 blockchain ledger. Append-only, tamper-evident, court-ready. If the blockchain write fails, it falls back to MongoDB automatically. Full proof bundle available for download at any time.

### 📊 Performance & Accountability Dashboard
A fully public leaderboard ranking every nodal officer and region by grievance resolution rate. Star ratings, progress bars, top vs. lowest performing regions — all live from the database. Designed to create transparency and healthy competition among authorities.

### 🌐 Local Issues Feed
When 5 or more similar complaints cluster in the same locality within 72 hours, they auto-group into a community grievance. Citizens can see they're not alone — and authorities can't ignore a pattern.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 · TypeScript · Tailwind CSS · Framer Motion · Clerk |
| API | NestJS · BullMQ · Socket.io · Prisma |
| Worker | NestJS · node-cron · SendGrid |
| AI | FastAPI · LangChain · Groq · Pinecone |
| Blockchain | Express.js · Node crypto (SHA-256) · MongoDB |
| Database | PostgreSQL · Redis · Pinecone |

---

*Built for impact. Every grievance deserves to be heard — and followed up on.*
