# Clairo

**The Chinese learning app built for the next generation of students heading to China.**

Clairo is a mobile-first language learning platform designed specifically for Russian-speaking students preparing for university life in China. Unlike generic apps, Clairo focuses on real survival Chinese — the words, phrases, and sentence structures you actually need.

---

## The Problem

Millions of CIS students study in China every year. Most of them arrive unprepared — relying on Google Translate, struggling with tones, unable to construct basic sentences. Existing apps like Duolingo are built for English speakers and miss the cultural and linguistic context that Russian speakers need.

Clairo is built by a student, for students — with content curated from real Chinese study sessions.

---

## Core Features

| Feature | Description |
|---|---|
| 📚 Flashcards | Spaced learning with known/unknown tracking |
| 🧠 Quiz | Multiple choice to test retention |
| 🧩 Sentence Builder | Reconstruct Chinese sentences from Russian prompts |
| 📊 Progress Tracking | Per-topic progress saved to device |
| ⚡ Real-time Content | Admin adds new content, users see it instantly |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native + Expo |
| Language | TypeScript |
| Database | Supabase (PostgreSQL) |
| Auth | Device ID based access control |
| Deployment | Expo Go (beta) → TestFlight (coming) |

---

## Architecture
```
app/
├── (tabs)/
│   ├── index.tsx          # Home — topics, progress, stats
│   └── admin.tsx          # Admin panel (device-locked, hidden)
├── topic.tsx              # Activity selector per topic
├── flashcard.tsx          # Flashcard activity
├── quiz.tsx               # Quiz activity
└── sentence.tsx           # Sentence builder activity
lib/
├── supabase.ts            # Database client
├── device.ts              # Device fingerprinting
└── auth.ts                # Admin access control
components/
└── Logo.tsx               # Brand identity
```

---

## Database Schema
```sql
topics      — id, title, emoji, color, sort_order
words       — id, topic_id, chinese, pinyin, english
sentences   — id, topic_id, russian, chinese_words[], correct_order[]
progress    — id, device_id, word_id, known, updated_at
```

---

## Getting Started
```bash
# Clone the repo
git clone git@github.com:Jerssy-h/clairo.git
cd clairo

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Add your Supabase credentials

# Start development
npx expo start
```

---

## Roadmap

- [x] Flashcard activity
- [x] Quiz activity
- [x] Sentence builder activity
- [x] Progress tracking
- [x] Admin content management
- [ ] Stroke order tracing
- [ ] Tone recognition
- [ ] TestFlight release
- [ ] Android support
- [ ] AI-powered translation activity

---

## About

Clairo is being built by **Emir** — a 19 year old from Turkmenistan, incoming Computer Science student at Beijing Institute of Technology. Built out of a real need, for real students.

> *"I couldn't find an app that actually helped people like me prepare for China. So I built one."*

---

*Currently in closed beta. First public release coming soon.*