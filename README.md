<div align="center">

# 克 Clairo

### Chinese learning app for Russian-speaking students

**Flashcards · Quiz · Sentence Builder · Stroke Order**

[![React Native](https://img.shields.io/badge/React_Native-0.76-61DAFB?style=flat-square&logo=react)](https://reactnative.dev)
[![Expo](https://img.shields.io/badge/Expo-52-000020?style=flat-square&logo=expo)](https://expo.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

</div>

---

## What is Clairo?

Clairo is a mobile app built specifically for **CIS students preparing to study in China**. Most Chinese learning apps are built for English speakers — Clairo speaks Russian first.

Built by [Emir Babayev](https://github.com/Jerssy-h), incoming CS student at **Beijing Institute of Technology**

> *"I needed an app that actually worked for students like me — Russian-speaking, going to Beijing, learning from scratch."*

---

## Features

| Activity | Description |
|---|---|
| 🃏 **Flashcards** | 3D flip animation · swipe left/right · per-device progress tracking |
| 🧠 **Quiz** | Multiple choice · combo counter · instant feedback |
| 🔤 **Sentence Builder** | Assemble Chinese words from Russian prompts · animated success state |
| ✏️ **Stroke Order** | Watch stroke animations · 4 practice rounds (2 guided → 2 from memory) · peek button |

**Other highlights:**
- 🌐 Full **EN / RU** language switcher — every string, every screen
- 📊 Progress tracked per device via Supabase — no account needed
- 🔒 Admin panel — add topics, words (EN + RU translations), sentences from your iPhone
- ⚡ In-memory caching — fast loads, minimal network calls
- 🎨 Premium dark design — Spotify-inspired, topic color gradients, glass cards

---

## Screenshots

> Coming soon — TestFlight beta in progress

---

## Tech Stack

```
React Native + Expo (file-based routing)
TypeScript
Supabase (Postgres + realtime backend)
expo-linear-gradient
react-native-gesture-handler
react-native-reanimated
react-native-svg
@jamsch/react-native-hanzi-writer
```

---

## Getting Started

### Prerequisites

- Node v20 (`nvm use 20`)
- Expo Go app on your phone
- iOS or Android device on the same network

### Install

```bash
git clone git@github.com:Jerssy-h/clairo.git
cd clairo/Clairo
npm install
```

### Run

```bash
# Same WiFi network
npx expo start --lan

# Different network
npx expo start --tunnel
```

Scan the QR code with Expo Go (Android) or Camera app (iOS).

---

## Database Schema

```sql
-- Topics (e.g. "Greetings", "Numbers", "University Life")
topics (id, title, emoji, color, sort_order)

-- Vocabulary words
words (id, topic_id, chinese, pinyin, english, russian)

-- Sentence builder exercises
sentences (id, topic_id, russian, chinese_words[], correct_order[])

-- Per-device learning progress
progress (id, device_id, word_id, known, updated_at)
```

Progress is tracked by device ID — no sign-up required, works out of the box.

---

## Project Structure

```
Clairo/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx         # Home screen
│   │   └── admin.tsx         # Admin panel (device-locked)
│   ├── _layout.tsx           # Root layout
│   ├── topic.tsx             # Activity selector
│   ├── flashcard.tsx         # Flashcard activity
│   ├── quiz.tsx              # Quiz activity
│   ├── sentence.tsx          # Sentence builder
│   └── stroke.tsx            # Stroke order activity
├── lib/
│   ├── supabase.ts           # Supabase client
│   ├── device.ts             # Device ID helper
│   ├── auth.ts               # Admin access control
│   ├── cache.ts              # In-memory cache
│   ├── i18n.ts               # EN/RU translations
│   └── LanguageContext.tsx   # Language provider
└── components/
    └── Logo.tsx              # Clairo logo
```

---

## Roadmap

- [ ] 🔥 Daily streak system
- [ ] 🎬 Onboarding flow for first-time users
- [ ] 🔤 Multi-character stroke practice (cycle through all chars in a word)
- [ ] 📱 TestFlight public beta
- [ ] 📊 Per-activity progress stats
- [ ] 💬 Word of the day on home screen

---

## Contributing

This project is open source and built in public. If you're a Russian-speaking student learning Chinese and want to contribute words, sentences, or features — PRs are welcome.

1. Fork the repo
2. Create your branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'feat: add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

---

## License

MIT © [Emir Babayev](https://github.com/Jerssy-h)

---

<div align="center">

Built with ❤️ in Turkmenistan · Deployed in Beijing

**[⭐ Star this repo](https://github.com/Jerssy-h/clairo)** if you find it useful

</div>