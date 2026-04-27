# System Architecture: Multi-Layer Legal Assistance Platform

---

## Layer 0: The "Urgency" Base Layer (Critical & Immediate)

For serious issues like harassment, an email is useless. This layer addresses your concern about **"immediate attention."**

### Objective
Immediate triage and life-safety response.

### Feature: Pulse SOS
An emergency trigger that bypasses the chat interface.

### Technical Implementation

- **API**
  - Use the 112 India (ERSS) logic.
  - While there isn't a single public "Trigger SOS" API for third parties:
    - Use Google Places API (Nearby Search) to find the **3 nearest police stations and hospitals instantly**.

- **Action**
  - Generate a **Deep Link** to the phone's dialer for `112`.
  - Simultaneously use:
    - WhatsApp Business API **or**
    - Twilio  
  - Broadcast the user's **GPS coordinates** to predefined emergency contacts.

### The "Wow" for Judges
- AI triages intent:
  - If voice input = *"I am being followed"*
  - Instead of drafting a notice:
    - Expands a **Red Emergency Interface**
    - Prepares an **SOS trigger**

---

## Layer 1: The "Intelligence" Layer (Intent & Mapping)

This is where you ground your AI in real Indian law to avoid hallucinations.

### Objective
Move from Natural Language → Statute → Authority.

### Feature: Statute Guard

### Technical Implementation

- **Data Source**
  - Use **RAG (Retrieval-Augmented Generation)** over:
    - Indian Penal Code (IPC/BNS)
    - Specific Rules (Noise 2000, Electricity 2020)
  - Do NOT train a custom model.

- **Public APIs**
  - Indian Kanoon API
  - AnrakLegal  
  → Fetch verified legal sections instead of relying on GPT memory.

- **Mapping Nodal Officers**
  - Use **CPGRAMS Nodal Officer Dataset** (Data.gov.in)
  - Contains **1.07+ lakh grievance officers**

- **Database**
  - Store data in a **Vector Database**
    - FAISS or Pinecone
  - Enables querying:
    - Based on PIN code + department
    - Returns correct officer

---

## Layer 2: The "Execution" Layer (Action Engine)

This is your **Execution-First** differentiator.

### Objective
Automated filing with zero manual effort.

### Feature: Direct-File

### Technical Implementation

- **Bhashini Integration**
  - Use WebSocket API
  - Enables full-duplex voice input (22 languages)

- **Notice Synthesis**
  - Use structured JSON template:
    - Maps "Cause of Action" → Formal legal notice

- **Filing API**
  - For demo:
    - Use SMTP or SendGrid
    - Send complaint directly to Nodal Officer
    - From user's authenticated account

---

## Layer 3: The "Persistence" Layer (The "God" Feature)

This fulfills the vision of a system that **never lets go**.

### Objective
Enforce accountability via persistence loop.

### Feature: The Persistence Bot

### Technical Implementation

- **Scheduler**
  - Node.js (`node-cron`) or Redis (`BullMQ`)
  - Tracks grievance status

- **Persistence Loop**
  - If grievance not resolved in **7 days**:
    - Automatically resend email
    - CC higher authority (State/Regional Head)

- **Transparency Dashboard**
  - Build using  Next.js
  - Displays:
    - Initial filing
    - 7-day reminder
    - 14-day escalation
  - Shows complete **Chain of Action**
---

## Public APIs You Must Use (To Avoid Being Just a Wrapper)

- **Bhashini API**
  - Multilingual voice support (22 languages)

- **Indian Kanoon API**
  - Real legal statutes & case law grounding

- **Google Places API**
  - Locate nearest police stations (Urgency Layer)

- **SendGrid / Twilio**
  - Email + SMS execution layer

---