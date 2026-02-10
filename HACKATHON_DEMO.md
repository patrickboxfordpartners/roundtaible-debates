# Algonquin RoundtAIble - Hackathon Demo Guide

## 🎯 What It Is
A real-time AI-powered debate platform where historical figures (Edison, Morgan, Carnegie, Twain, Adams, Tesla) debate modern topics using GPT-4, with voice input and multiplayer viewing.

## 🚀 Quick Start
```bash
npm install
npm run dev
# Open http://localhost:8082
```

## 🎪 Demo Flow (3-5 minutes)

### 1. **Opening Hook** (30 seconds)
- Show the theatrical interface
- "Imagine if Thomas Edison, Mark Twain, and Nikola Tesla could debate AI rights... in real-time"

### 2. **Pick a Topic** (15 seconds)
- Click "Should AI have rights?" or "Surprise Me"
- Click "Lightning Round" for fast-paced action

### 3. **Watch AI Debate** (60 seconds)
- Personas debate with unique voices:
  - **Edison**: Pragmatic, solution-focused
  - **Morgan**: Capitalist, bottom-line
  - **Twain**: Witty, satirical
  - **Tesla**: Visionary, eccentric
  - **Carnegie**: Philanthropic
  - **Adams**: Philosophical
- Heat meter rises
- Transcript scrolls in real-time

### 4. **Voice Input** (30 seconds)
- Click microphone button
- Say: "But what about the workers?"
- Your voice → text → injected into debate
- AI personas respond to YOU

### 5. **Multiplayer** (30 seconds)
- Click "Share Room"
- Open link in new tab/phone
- Both see same debate in sync
- "Anyone can watch together"

### 6. **Summarize** (15 seconds)
- Click "Summarize"
- Twain delivers witty AI-generated recap

### 7. **Vote Winner** (15 seconds)
- Click persona avatar to vote
- Victory animation + quote
- Leaderboard updates

## 🎤 Pitch Points

### **The Problem**
Debates today are stale, one-dimensional, and lack diverse perspectives. We need tools that bring historical wisdom to modern questions.

### **The Solution**
AI-powered debates where historical figures engage in real-time discussion, with voice input and multiplayer viewing.

### **Tech Stack**
- **OpenAI GPT-4o-mini**: Persona-driven responses
- **Vapi**: Real-time voice transcription
- **React + Framer Motion**: Smooth theatrical UI
- **Hathora-ready**: Multiplayer foundation (scalable to thousands)

### **What Makes It Cool**
1. **Contextual AI**: Each persona has unique debate style
2. **Real-time Interaction**: Voice input joins the debate
3. **Multiplayer**: Watch debates together
4. **Lightning Round**: Rapid-fire 60s debates
5. **Theatrical Design**: Feels like a historical event

### **Use Cases**
- **Education**: Students debate with historical figures
- **Corporate**: Leadership debates business ethics
- **Entertainment**: Streaming debates on modern topics
- **Research**: Test argument structures across personas

## ⚡ Quick Features to Show

| Feature | Demo Time | Wow Factor |
|---------|-----------|------------|
| Lightning Round | 30s | ⚡⚡⚡ High |
| Voice Input | 30s | 🎤🎤🎤 High |
| AI Personalities | 60s | 🤖🤖🤖 Medium |
| Multiplayer Share | 20s | 👥👥 Medium |
| Victory Animation | 15s | 🎉 Medium |

## 🔧 Environment Variables
```bash
VITE_OPENAI_API_KEY=sk-proj-...
VITE_VAPI_PUBLIC_KEY=59dcb1a8-...
VITE_HATHORA_APP_TOKEN=hathora_org_st_...
```

## 🎨 Custom Personas
Users can add their own personas with custom context:
1. Click "+" button on table
2. Enter name, role, color, context
3. New persona joins debate with unique voice

## 📊 Metrics
- 6 default AI personas
- 8 pre-loaded topics
- 60s lightning rounds
- Real-time voice transcription
- Multiplayer sync across unlimited viewers

## 🏆 Judging Criteria Alignment

### **Innovation**: AI-powered historical debates with voice input
### **Technical Complexity**: Multi-AI coordination, real-time sync, voice transcription
### **Polish**: Theatrical UI, smooth animations, sound design
### **Usefulness**: Education, corporate training, entertainment
### **Demo-ability**: Instant wow factor, easy to understand

## 💡 Backup Talking Points

If asked about:
- **Scaling**: "Hathora handles thousands of concurrent viewers"
- **Accuracy**: "Each persona has context window for historical accuracy"
- **Monetization**: "Freemium: basic debates free, premium personas + private rooms paid"
- **Future**: "Add more historical figures, custom debates, tournament mode"

## 🐛 Known Issues (if asked)
- Vapi requires HTTPS in production (demo works locally)
- Multiplayer uses localStorage (upgradeable to Hathora WebSockets)
- Voice sometimes lags on slow connections

## 🎯 Final Pro Tip
Start with **Lightning Round** on "Should AI have rights?" for maximum impact. It's fast, controversial, and shows all features.
