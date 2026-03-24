<div align="center">

# 克 Clairo

### Chinese learning app for everyone who cares

**Flashcards · Quiz · Sentence Builder · Stroke Order**

[![React Native](https://img.shields.io/badge/React_Native-0.76-61DAFB?style=flat-square&logo=react)](https://reactnative.dev)
[![Expo](https://img.shields.io/badge/Expo-52-000020?style=flat-square&logo=expo)](https://expo.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

</div>

---

## What is Clairo?

Clairo started as a personal problem. Most Chinese learning apps are built for English speakers — leaving CIS students with no real alternative. So I built one.

It's a mobile app designed specifically for **Russian/English-speaking students preparing to study in China**, covering everything from vocabulary and stroke order to sentence construction. Built by [Emir Babayev](https://github.com/Jerssy-h).

> *"I wanted to create a tool that will provide everything people need to become good at learning language."*

---

## Features

Clairo is built around four core activities, each designed to reinforce Chinese in a different way.

**Flashcards** give you 3D flip animations and swipe-based review — swipe right if you know it, left if you don't. Progress is tracked per device, no account needed.

**Quiz** tests your knowledge with multiple choice questions, a combo counter that rewards streaks, and instant feedback so you learn from mistakes immediately.

**Sentence Builder** shows you a prompt and challenges you to assemble the correct Chinese sentence from word tiles — great for understanding grammar and word order.

**Stroke Order** lets you watch full stroke animations, then guides you through four practice rounds — two guided, two from memory — with a peek button when you get stuck.

On top of that, every screen supports a full **EN / RU language switcher**, progress is synced to Supabase without requiring a login, and the whole app runs on a premium dark design inspired by Spotify's aesthetic.

---

## Download

> **Android APK — ready to install**
>
> 📲 [**Download latest build →**](https://expo.dev/accounts/jerssy/projects/Clairo/builds/7e3c8198-8e1c-4f5b-b71e-197ac33c78d4)
>
> On your Android device: open the link, download the APK, allow installation from unknown sources, and you're in.
>
> Once installed, tap **"Check for updates"** on the home screen whenever you want to grab the latest version.

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
cd clairo
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

## Contributing

This project is open source and built in public. If you're a student learning Chinese and want to contribute words, sentences, or features — PRs are welcome.

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

Built with obsession · Deployed all over the world

**[⭐ Star this repo](https://github.com/Jerssy-h/clairo)** if you find it useful

</div>
