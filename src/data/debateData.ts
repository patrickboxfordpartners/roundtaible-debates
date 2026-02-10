export interface Persona {
  id: string;
  name: string;
  role: string;
  avatar: string;
  color: string;
  wins: number;
  quotes: string[];
}

export interface TranscriptEntry {
  id: string;
  personaId: string;
  text: string;
  timestamp: number;
}

export interface DebateTopic {
  id: string;
  title: string;
}

export const personas: Persona[] = [
  {
    id: "edison",
    name: "Thomas Edison",
    role: "The Inventor",
    avatar: "",
    color: "#F5A623",
    wins: 3,
    quotes: [
      "I have not failed. I've just found 10,000 ways that won't work.",
      "Genius is one percent inspiration and ninety-nine percent perspiration.",
    ],
  },
  {
    id: "morgan",
    name: "J.P. Morgan",
    role: "The Capitalist",
    avatar: "",
    color: "#2E7D32",
    wins: 5,
    quotes: [
      "A man always has two reasons for doing anything: a good reason and the real reason.",
      "Go as far as you can see; when you get there, you'll be able to see further.",
    ],
  },
  {
    id: "carnegie",
    name: "Andrew Carnegie",
    role: "The Philanthropist",
    avatar: "",
    color: "#1565C0",
    wins: 2,
    quotes: [
      "No man becomes rich unless he enriches others.",
      "The man who dies rich, dies disgraced.",
    ],
  },
  {
    id: "twain",
    name: "Mark Twain",
    role: "The Satirist",
    avatar: "",
    color: "#E65100",
    wins: 7,
    quotes: [
      "The secret of getting ahead is getting started.",
      "Whenever you find yourself on the side of the majority, it is time to pause and reflect.",
    ],
  },
  {
    id: "adams",
    name: "Abigail Adams",
    role: "The Stateswoman",
    avatar: "",
    color: "#6A1B9A",
    wins: 4,
    quotes: [
      "Remember, all men would be tyrants if they could.",
      "Learning is not attained by chance, it must be sought for with ardor.",
    ],
  },
  {
    id: "tesla",
    name: "Nikola Tesla",
    role: "The Visionary",
    avatar: "",
    color: "#00838F",
    wins: 6,
    quotes: [
      "The present is theirs; the future, for which I really worked, is mine.",
      "If you want to find the secrets of the universe, think in terms of energy, frequency and vibration.",
    ],
  },
];

export const debateTopics: DebateTopic[] = [
  { id: "ai-rights", title: "Should AI have rights?" },
  { id: "capitalism", title: "Is capitalism ethical?" },
  { id: "free-will", title: "Free will vs determinism" },
  { id: "ubi", title: "Universal basic income" },
  { id: "space", title: "Space colonization priority" },
  { id: "social-media", title: "Regulate social media?" },
  { id: "education", title: "Value of higher education" },
  { id: "nuclear", title: "Nuclear energy future" },
];

export const sampleTranscript: TranscriptEntry[] = [
  { id: "1", personaId: "edison", text: "Progress demands invention, not regulation. Every great leap forward came from unfettered experimentation.", timestamp: 0 },
  { id: "2", personaId: "twain", text: "Unfettered, you say? The only thing unfettered about progress is the bill it leaves behind.", timestamp: 5 },
  { id: "3", personaId: "adams", text: "Gentlemen, progress without justice is merely tyranny wearing a top hat.", timestamp: 12 },
  { id: "4", personaId: "morgan", text: "Justice is a luxury afforded by prosperity. First, we build the engine—then we polish the brass.", timestamp: 18 },
  { id: "5", personaId: "tesla", text: "The engine you speak of runs on alternating current, Mr. Morgan. My alternating current.", timestamp: 24 },
  { id: "6", personaId: "carnegie", text: "What good is current—alternating or otherwise—if the workers who harness it cannot feed their families?", timestamp: 30 },
  { id: "7", personaId: "twain", text: "Carnegie worrying about workers is like a fox fretting over the henhouse ventilation.", timestamp: 36 },
  { id: "8", personaId: "edison", text: "At least the fox gets results, Twain. What has satire ever invented?", timestamp: 42 },
];

export const spectatorEmojis = [
  { emoji: "🎩", label: "Top Hat" },
  { emoji: "🧐", label: "Monocle" },
  { emoji: "📜", label: "Telegram" },
  { emoji: "⏱️", label: "Pocket Watch" },
  { emoji: "⚖️", label: "Gavel" },
];
