/**
 * Persona Quiz — "Which Historical Mind Are You?"
 *
 * Each answer distributes weighted scores across persona archetypes.
 * After all questions, the persona with the highest score is the match.
 */

/**
 * Short mindset/mentality summaries for the quiz result screen.
 * Written in third person, ~2–3 sentences. Not AI prompts.
 */
export const personaMindsets: Record<string, string> = {
  edison:
    "Edison believed that genius was a product of relentless work, not inspiration. He trusted results over theory — if it couldn't be built, tested, and sold, it wasn't real. His worldview was fundamentally commercial: ideas only mattered when they changed something people could hold in their hands.",

  morgan:
    "Morgan saw the world as a system that functioned best when controlled by capable, decisive men. He had no patience for sentiment in business, but deep reverence for order, stability, and the civilizing force of capital. Where others saw chaos, he saw an opportunity to consolidate, rationalize, and lead.",

  carnegie:
    "Carnegie held two convictions simultaneously and never fully resolved the tension between them: that ruthless ambition was the engine of progress, and that great wealth carried an equally great moral obligation to give back. He believed any man could rise — and that those who did owed the world a library.",

  twain:
    "Twain used humor as a scalpel. Beneath the wit was a deep skepticism of power, institutions, and the comfortable lies people tell themselves. He believed the truth was usually uncomfortable, often absurd, and best delivered with a straight face and perfect timing.",

  adams:
    "Adams approached the present as a historian — always asking what the past revealed about where things were heading. Deeply pessimistic about democracy's ability to resist corruption and mediocrity, he found more clarity in patterns across centuries than in the noise of any single moment. He was an aristocrat of the mind who never stopped watching.",

  tesla:
    "Tesla lived entirely in the future. He thought in systems of energy and frequency that most of his contemporaries couldn't visualize, and he was willing to sacrifice everything — money, credit, comfort — to see his ideas made real. He believed science was a moral calling, not a career, and that the world would eventually catch up to him.",

  wilde:
    "Wilde treated every room as a stage and every conversation as an opportunity to expose the gap between what people pretended to value and what they actually did. He believed beauty and wit were not luxuries but necessities, and that earnestness — the unexamined, self-satisfied kind — was civilization's greatest flaw.",

  einstein:
    "Einstein thought in pictures before he thought in equations. His instinct was always to simplify — to find the single elegant principle underneath the complexity. He was gentle in temperament but immovable on matters of conscience, and he distrusted any system, scientific or political, that demanded belief without allowing questions.",

  cleopatra:
    "Cleopatra understood that power is never given — it is constructed, maintained, and defended through intelligence, language, and strategic alliance. She ruled by reading people with forensic precision and positioning herself at the center of every negotiation. Charm and command were not opposites in her hands; they were the same instrument.",

  darwin:
    "Darwin's greatest strength was patience — the willingness to observe, gather evidence, and withhold conclusions until the weight of proof was undeniable. He was methodical where others were impulsive, and he understood that the most profound changes happen slowly, through accumulation rather than revolution. He let the evidence do the arguing.",

  hypatia:
    "Hypatia believed that the examined life was the only life worth living, and that reason was the one thing no authority could legitimately take from you. She taught everyone who sought knowledge regardless of their beliefs, and she died for the right to think freely. Her worldview was simple and radical: question everything, including the questioner.",

  machiavelli:
    "Machiavelli was not cynical — he was honest about how power actually works when the idealism wears off. He separated political effectiveness from personal morality not to celebrate ruthlessness, but to describe reality clearly enough to act in it. He believed good intentions without effective action produced worse outcomes than clear-eyed pragmatism.",

  curie:
    "Curie operated with a kind of focused intensity that left no room for distraction or self-pity. She believed knowledge was worth any personal cost and that withholding scientific discovery for profit or prestige was a moral failure. She faced every obstacle — poverty, discrimination, grief — by working harder and refusing to let any of it become an excuse.",

  "sun-tzu":
    "Sun Tzu believed the highest form of strategy was winning without conflict — positioning yourself so thoroughly that victory became inevitable before the first move. He was less interested in strength than in timing, terrain, and the psychology of the opponent. In his view, chaos was not the enemy of strategy; it was the raw material.",
};

export interface QuizAnswer {
  text: string;
  scores: Record<string, number>; // persona id → weight
}

export interface QuizQuestion {
  id: string;
  question: string;
  answers: QuizAnswer[];
}

export const quizQuestions: QuizQuestion[] = [
  {
    id: "conflict",
    question: "A heated disagreement breaks out at a meeting. You...",
    answers: [
      {
        text: "Cut through the noise with a well-timed joke that reframes the whole argument",
        scores: { twain: 3, wilde: 2, cleopatra: 1 },
      },
      {
        text: "Stay quiet, observe everyone's positions, then present the data that settles it",
        scores: { darwin: 3, curie: 2, adams: 1 },
      },
      {
        text: "Ask who benefits from each outcome — follow the incentives",
        scores: { machiavelli: 3, morgan: 2, "sun-tzu": 1 },
      },
      {
        text: "Propose a bold third option nobody considered",
        scores: { tesla: 3, einstein: 2, edison: 1 },
      },
    ],
  },
  {
    id: "legacy",
    question: "What matters most to you when you're gone?",
    answers: [
      {
        text: "That I built something people still use every day",
        scores: { edison: 3, curie: 2, tesla: 1 },
      },
      {
        text: "That I changed how people think",
        scores: { einstein: 3, darwin: 2, hypatia: 1 },
      },
      {
        text: "That I gave back more than I took",
        scores: { carnegie: 3, hypatia: 2, curie: 1 },
      },
      {
        text: "That they're still quoting me",
        scores: { twain: 3, wilde: 2, "sun-tzu": 1 },
      },
    ],
  },
  {
    id: "power",
    question: "Real power comes from...",
    answers: [
      {
        text: "Capital. Money moves the world; everything else is commentary",
        scores: { morgan: 3, machiavelli: 2, cleopatra: 1 },
      },
      {
        text: "Knowledge. Understanding the world gives you leverage over it",
        scores: { hypatia: 3, einstein: 2, darwin: 1 },
      },
      {
        text: "Vision. Seeing what others can't and making them believe",
        scores: { tesla: 3, cleopatra: 2, carnegie: 1 },
      },
      {
        text: "Positioning. Being in the right place at the right time, prepared",
        scores: { "sun-tzu": 3, machiavelli: 2, morgan: 1 },
      },
    ],
  },
  {
    id: "flaw",
    question: "Your biggest weakness is probably...",
    answers: [
      {
        text: "I get so focused on the big picture I forget the people around me",
        scores: { tesla: 3, adams: 2, einstein: 1 },
      },
      {
        text: "I can be ruthless when I think I'm right",
        scores: { morgan: 3, cleopatra: 2, edison: 1 },
      },
      {
        text: "I hide behind humor instead of being vulnerable",
        scores: { twain: 3, wilde: 2, machiavelli: 1 },
      },
      {
        text: "I give too much and don't protect my own interests",
        scores: { carnegie: 3, curie: 2, hypatia: 1 },
      },
    ],
  },
  {
    id: "approach",
    question: "When tackling a hard problem, you tend to...",
    answers: [
      {
        text: "Run experiments. Try, fail, iterate, repeat",
        scores: { edison: 3, darwin: 2, curie: 1 },
      },
      {
        text: "Think deeply until the elegant solution appears in your mind",
        scores: { einstein: 3, tesla: 2, hypatia: 1 },
      },
      {
        text: "Study what worked before. History doesn't repeat, but it rhymes",
        scores: { adams: 3, "sun-tzu": 2, machiavelli: 1 },
      },
      {
        text: "Talk to people. The answer is usually in the conversation",
        scores: { cleopatra: 3, carnegie: 2, wilde: 1 },
      },
    ],
  },
  {
    id: "dinner",
    question: "At a dinner party, people notice you because...",
    answers: [
      {
        text: "You're the funniest person at the table",
        scores: { twain: 3, wilde: 3 },
      },
      {
        text: "You ask the question that makes everyone go quiet and think",
        scores: { hypatia: 3, einstein: 2, adams: 1 },
      },
      {
        text: "You're clearly the most powerful person in the room",
        scores: { morgan: 3, cleopatra: 2, machiavelli: 1 },
      },
      {
        text: "You're talking passionately about something nobody else understands yet",
        scores: { tesla: 3, curie: 2, darwin: 1 },
      },
    ],
  },
  {
    id: "risk",
    question: "Your relationship with risk...",
    answers: [
      {
        text: "Calculate it precisely, then act decisively",
        scores: { "sun-tzu": 3, morgan: 2, machiavelli: 1 },
      },
      {
        text: "Risk is just the price of doing something that matters",
        scores: { curie: 3, cleopatra: 2, carnegie: 1 },
      },
      {
        text: "I'd rather observe and let others take the risk first",
        scores: { darwin: 3, adams: 2, machiavelli: 1 },
      },
      {
        text: "I don't think about risk — if the idea is right, you just go",
        scores: { tesla: 3, edison: 2, wilde: 1 },
      },
    ],
  },
];

export interface QuizResult {
  personaId: string;
  score: number;
  totalPossible: number;
  runners: Array<{ personaId: string; score: number }>;
}

export function calculateResult(answers: Record<string, number>): QuizResult {
  // answers is questionId → answerIndex
  const scores: Record<string, number> = {};

  for (const [questionId, answerIndex] of Object.entries(answers)) {
    const question = quizQuestions.find((q) => q.id === questionId);
    if (!question) continue;
    const answer = question.answers[answerIndex];
    if (!answer) continue;

    for (const [personaId, weight] of Object.entries(answer.scores)) {
      scores[personaId] = (scores[personaId] || 0) + weight;
    }
  }

  const sorted = Object.entries(scores)
    .sort(([, a], [, b]) => b - a);

  const [topId, topScore] = sorted[0] || ["twain", 0];
  const maxPossible = quizQuestions.length * 3; // max 3 points per question

  return {
    personaId: topId,
    score: topScore,
    totalPossible: maxPossible,
    runners: sorted.slice(1, 4).map(([personaId, score]) => ({ personaId, score })),
  };
}
