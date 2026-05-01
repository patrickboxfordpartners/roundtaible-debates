// Grade-level academic vocabulary with definitions
// Based on Academic Word List (AVL) and Common Core standards

export interface VocabWord {
  word: string;
  definition: string;
  gradeLevel: string[];
}

// Academic vocabulary by grade level
const vocabularyDatabase: VocabWord[] = [
  // Middle School (6-8)
  { word: "analyze", definition: "Examine in detail to understand better", gradeLevel: ["6-8", "9-10", "11-12", "college"] },
  { word: "evidence", definition: "Facts or information supporting a claim", gradeLevel: ["6-8", "9-10", "11-12", "college"] },
  { word: "interpret", definition: "Explain the meaning of something", gradeLevel: ["6-8", "9-10", "11-12", "college"] },
  { word: "justify", definition: "Show or prove to be right or reasonable", gradeLevel: ["6-8", "9-10", "11-12", "college"] },
  { word: "perspective", definition: "A particular way of viewing things", gradeLevel: ["6-8", "9-10", "11-12", "college"] },
  { word: "significant", definition: "Important or noteworthy", gradeLevel: ["6-8", "9-10", "11-12", "college"] },
  { word: "contribute", definition: "Give something to help achieve a result", gradeLevel: ["6-8", "9-10", "11-12", "college"] },
  { word: "establish", definition: "Set up or create something lasting", gradeLevel: ["6-8", "9-10", "11-12", "college"] },

  // High School (9-12)
  { word: "synthesize", definition: "Combine different ideas into a coherent whole", gradeLevel: ["9-10", "11-12", "college"] },
  { word: "hypothesis", definition: "A proposed explanation to be tested", gradeLevel: ["9-10", "11-12", "college"] },
  { word: "empirical", definition: "Based on observation or experience rather than theory", gradeLevel: ["9-10", "11-12", "college"] },
  { word: "methodology", definition: "A system of methods used in a particular field", gradeLevel: ["9-10", "11-12", "college"] },
  { word: "paradigm", definition: "A typical example or pattern of something", gradeLevel: ["9-10", "11-12", "college"] },
  { word: "pragmatic", definition: "Dealing with things sensibly and realistically", gradeLevel: ["9-10", "11-12", "college"] },
  { word: "inherent", definition: "Existing as a natural or essential part", gradeLevel: ["9-10", "11-12", "college"] },
  { word: "contextual", definition: "Depending on or relating to circumstances", gradeLevel: ["9-10", "11-12", "college"] },

  // Advanced (11-12, College)
  { word: "dichotomy", definition: "A division into two contrasting groups or ideas", gradeLevel: ["11-12", "college"] },
  { word: "epistemology", definition: "The theory of knowledge and how we know what we know", gradeLevel: ["11-12", "college"] },
  { word: "ontological", definition: "Relating to the nature of being or existence", gradeLevel: ["11-12", "college"] },
  { word: "hegemony", definition: "Leadership or dominance, especially by one state or group", gradeLevel: ["11-12", "college"] },
  { word: "juxtapose", definition: "Place side by side for comparison", gradeLevel: ["11-12", "college"] },
  { word: "ameliorate", definition: "Make something bad or unsatisfactory better", gradeLevel: ["11-12", "college"] },
  { word: "extrapolate", definition: "Extend or project known information into an area not known", gradeLevel: ["11-12", "college"] },
  { word: "obfuscate", definition: "Make something unclear or difficult to understand", gradeLevel: ["11-12", "college"] },
];

// Create lookup maps for quick access
const vocabByGrade: Record<string, Set<string>> = {
  "6-8": new Set(),
  "9-10": new Set(),
  "11-12": new Set(),
  "college": new Set(),
};

const definitionMap: Record<string, string> = {};

vocabularyDatabase.forEach(({ word, definition, gradeLevel }) => {
  gradeLevel.forEach((grade) => {
    vocabByGrade[grade].add(word.toLowerCase());
  });
  definitionMap[word.toLowerCase()] = definition;
});

/**
 * Get vocabulary words appropriate for a grade level
 */
export function getVocabForGrade(gradeLevel: string): Set<string> {
  return vocabByGrade[gradeLevel] || new Set();
}

/**
 * Get definition for a vocabulary word
 */
export function getDefinition(word: string): string | undefined {
  return definitionMap[word.toLowerCase()];
}

/**
 * Check if a word is academic vocabulary for the given grade level
 */
export function isVocabWord(word: string, gradeLevel: string): boolean {
  const vocabSet = vocabByGrade[gradeLevel];
  if (!vocabSet) return false;
  return vocabSet.has(word.toLowerCase());
}

/**
 * Extract vocabulary words from text for a given grade level
 */
export function extractVocabulary(text: string, gradeLevel: string): Array<{ word: string; definition: string }> {
  const vocabSet = getVocabForGrade(gradeLevel);
  const words = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
  const found = new Set<string>();

  return words
    .filter((word) => {
      if (found.has(word)) return false;
      if (vocabSet.has(word)) {
        found.add(word);
        return true;
      }
      return false;
    })
    .map((word) => ({
      word,
      definition: definitionMap[word] || "Definition not available",
    }));
}
