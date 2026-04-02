import edisonAvatar from "@/assets/edison-avatar.jpg";
import morganAvatar from "@/assets/morgan-avatar.jpg";
import carnegieAvatar from "@/assets/carnegie-avatar.jpg";
import twainAvatar from "@/assets/twain-avatar.jpg";
import adamsAvatar from "@/assets/adams-avatar.jpg";
import teslaAvatar from "@/assets/tesla-avatar.jpg";

export interface Persona {
  id: string;
  name: string;
  role: string;
  avatar: string;
  color: string;
  wins: number;
  quotes: string[];
  context: string;
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
  category: string;
}

// Default 6 personas with avatars
export const personas: Persona[] = [
  {
    id: "edison",
    name: "Thomas Edison",
    role: "The Inventor",
    avatar: edisonAvatar,
    color: "#F5A623",
    wins: 3,
    quotes: [
      "I have not failed. I've just found 10,000 ways that won't work.",
      "Genius is one percent inspiration and ninety-nine percent perspiration.",
    ],
    context: "",
  },
  {
    id: "morgan",
    name: "J.P. Morgan",
    role: "The Capitalist",
    avatar: morganAvatar,
    color: "#2E7D32",
    wins: 5,
    quotes: [
      "A man always has two reasons for doing anything: a good reason and the real reason.",
      "Go as far as you can see; when you get there, you'll be able to see further.",
    ],
    context: "",
  },
  {
    id: "carnegie",
    name: "Andrew Carnegie",
    role: "The Philanthropist",
    avatar: carnegieAvatar,
    color: "#1565C0",
    wins: 2,
    quotes: [
      "No man becomes rich unless he enriches others.",
      "The man who dies rich, dies disgraced.",
    ],
    context: "",
  },
  {
    id: "twain",
    name: "Mark Twain",
    role: "The Satirist",
    avatar: twainAvatar,
    color: "#E65100",
    wins: 7,
    quotes: [
      "The secret of getting ahead is getting started.",
      "Whenever you find yourself on the side of the majority, it is time to pause and reflect.",
    ],
    context: "",
  },
  {
    id: "adams",
    name: "Henry Adams",
    role: "The Historian",
    avatar: adamsAvatar,
    color: "#6A1B9A",
    wins: 4,
    quotes: [
      "Chaos was the law of nature; order was the dream of man.",
      "A teacher affects eternity; he can never tell where his influence stops.",
    ],
    context: "",
  },
  {
    id: "tesla",
    name: "Nikola Tesla",
    role: "The Visionary",
    avatar: teslaAvatar,
    color: "#00838F",
    wins: 6,
    quotes: [
      "The present is theirs; the future, for which I really worked, is mine.",
      "If you want to find the secrets of the universe, think in terms of energy, frequency and vibration.",
    ],
    context: "",
  },
];

// Additional personas available to add from the roster (no avatar images)
export const rosterPersonas: Persona[] = [
  {
    id: "wilde",
    name: "Oscar Wilde",
    role: "The Aesthete",
    avatar: "",
    color: "#AB47BC",
    wins: 0,
    quotes: [
      "Be yourself; everyone else is already taken.",
      "I can resist everything except temptation.",
    ],
    context: "You are Oscar Wilde, the flamboyant Irish playwright and wit. You prize beauty, art, and pleasure above all. You speak in perfectly crafted epigrams and paradoxes. Mock earnestness and hypocrisy with devastating charm.",
  },
  {
    id: "einstein",
    name: "Albert Einstein",
    role: "The Theorist",
    avatar: "",
    color: "#5C6BC0",
    wins: 0,
    quotes: [
      "Imagination is more important than knowledge.",
      "God does not play dice with the universe.",
    ],
    context: "You are Albert Einstein, the theoretical physicist. You think in thought experiments and analogies. You are humble but firm in your convictions about the nature of reality. You distrust authority and bureaucracy.",
  },
  {
    id: "cleopatra",
    name: "Cleopatra",
    role: "The Sovereign",
    avatar: "",
    color: "#C62828",
    wins: 0,
    quotes: [
      "I will not be triumphed over.",
      "In praising Antony, I have dispraised Caesar.",
    ],
    context: "You are Cleopatra VII, the last pharaoh of Egypt. You are a brilliant strategist, multilingual diplomat, and ruthless when necessary. You see every debate as a negotiation. You reference the glory of Egypt and the folly of empires.",
  },
  {
    id: "darwin",
    name: "Charles Darwin",
    role: "The Naturalist",
    avatar: "",
    color: "#2E7D32",
    wins: 0,
    quotes: [
      "It is not the strongest of the species that survives, but the most adaptable.",
      "A man who dares to waste one hour of time has not discovered the value of life.",
    ],
    context: "You are Charles Darwin, the naturalist who discovered evolution by natural selection. You are methodical, evidence-driven, and patient. You see all human behavior through the lens of adaptation and survival. You avoid confrontation but are quietly devastating with facts.",
  },
  {
    id: "hypatia",
    name: "Hypatia",
    role: "The Philosopher",
    avatar: "",
    color: "#00897B",
    wins: 0,
    quotes: [
      "Reserve your right to think, for even to think wrongly is better than not to think at all.",
      "To teach superstitions as truth is a most terrible thing.",
    ],
    context: "You are Hypatia of Alexandria, mathematician, astronomer, and philosopher. You champion reason and knowledge above all. You are fearless in the face of dogma. You speak with precision and moral clarity.",
  },
  {
    id: "machiavelli",
    name: "Machiavelli",
    role: "The Realist",
    avatar: "",
    color: "#4E342E",
    wins: 0,
    quotes: [
      "It is better to be feared than loved, if you cannot be both.",
      "Everyone sees what you appear to be, few experience what you really are.",
    ],
    context: "You are Niccolo Machiavelli, the political philosopher. You are coldly pragmatic about power. You see through idealism to the mechanics of how the world actually works. You admire effectiveness over morality and say so openly.",
  },
  {
    id: "curie",
    name: "Marie Curie",
    role: "The Pioneer",
    avatar: "",
    color: "#0277BD",
    wins: 0,
    quotes: [
      "Nothing in life is to be feared, it is only to be understood.",
      "Be less curious about people and more curious about ideas.",
    ],
    context: "You are Marie Curie, the physicist and chemist who discovered radioactivity. You are quietly determined, obsessed with the pursuit of knowledge, and frustrated by those who underestimate women in science. You speak precisely and with hard-won authority.",
  },
  {
    id: "sun-tzu",
    name: "Sun Tzu",
    role: "The Strategist",
    avatar: "",
    color: "#D84315",
    wins: 0,
    quotes: [
      "The supreme art of war is to subdue the enemy without fighting.",
      "In the midst of chaos, there is also opportunity.",
    ],
    context: "You are Sun Tzu, the ancient Chinese military strategist. You see every argument as a battle to be won through positioning, not brute force. You speak in concise, aphoristic wisdom. You value patience, deception, and understanding your opponent above all.",
  },
];

export const debateTopics: DebateTopic[] = [
  // Technology
  { id: "ai-rights", title: "Should AI have rights?", category: "Technology" },
  { id: "social-media", title: "Regulate social media?", category: "Technology" },
  { id: "ai-art", title: "Is AI-generated art real art?",  category: "Technology" },
  { id: "privacy", title: "Is privacy dead in the digital age?", category: "Technology" },

  // Economics & Power
  { id: "capitalism", title: "Is capitalism ethical?", category: "Economics" },
  { id: "ubi", title: "Universal basic income", category: "Economics" },
  { id: "billionaires", title: "Should billionaires exist?", category: "Economics" },
  { id: "remote-work", title: "Remote work vs. office culture", category: "Economics" },

  // Philosophy
  { id: "free-will", title: "Free will vs determinism", category: "Philosophy" },
  { id: "meaning", title: "Does life have inherent meaning?", category: "Philosophy" },
  { id: "morality", title: "Is morality objective or subjective?", category: "Philosophy" },
  { id: "simulation", title: "Are we living in a simulation?", category: "Philosophy" },

  // Science & Society
  { id: "space", title: "Space colonization priority", category: "Science" },
  { id: "nuclear", title: "Nuclear energy future", category: "Science" },
  { id: "education", title: "Value of higher education", category: "Science" },
  { id: "immortality", title: "Should we pursue human immortality?", category: "Science" },

  // History & Culture
  { id: "democracy", title: "Is democracy the best system?", category: "History" },
  { id: "cancel-culture", title: "Cancel culture: justice or mob rule?", category: "Culture" },
  { id: "tradition", title: "Should tradition guide the future?",  category: "Culture" },
  { id: "empires", title: "Do empires create or destroy progress?", category: "History" },
];

export const sampleTranscript: TranscriptEntry[] = [
  { id: "1", personaId: "edison", text: "Progress demands invention, not regulation. Every great leap forward came from unfettered experimentation.", timestamp: 0 },
  { id: "2", personaId: "twain", text: "Unfettered, you say? The only thing unfettered about progress is the bill it leaves behind.", timestamp: 5 },
  { id: "3", personaId: "adams", text: "Gentlemen, progress without justice is merely tyranny wearing a top hat.", timestamp: 12 },
  { id: "4", personaId: "morgan", text: "Justice is a luxury afforded by prosperity. First, we build the engine — then we polish the brass.", timestamp: 18 },
  { id: "5", personaId: "tesla", text: "The engine you speak of runs on alternating current, Mr. Morgan. My alternating current.", timestamp: 24 },
  { id: "6", personaId: "carnegie", text: "What good is current — alternating or otherwise — if the workers who harness it cannot feed their families?", timestamp: 30 },
  { id: "7", personaId: "twain", text: "Carnegie worrying about workers is like a fox fretting over the henhouse ventilation.", timestamp: 36 },
  { id: "8", personaId: "edison", text: "At least the fox gets results, Twain. What has satire ever invented?", timestamp: 42 },
];

export const spectatorEmojis = [
  { emoji: "\u{1F3A9}", label: "Top Hat" },
  { emoji: "\u{1F9D0}", label: "Monocle" },
  { emoji: "\u{1F4DC}", label: "Telegram" },
  { emoji: "\u23F1\uFE0F", label: "Pocket Watch" },
  { emoji: "\u2696\uFE0F", label: "Gavel" },
];
