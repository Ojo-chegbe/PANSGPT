/**
 * Diversity-First Prompt System
 * 
 * This system builds diversity directly into AI prompts rather than applying
 * post-generation modifications. Each prompt is designed to generate inherently
 * diverse questions across multiple dimensions.
 */

export interface DiversityPromptConfig {
  courseCode: string;
  courseTitle: string;
  topic?: string;
  level: string;
  numQuestions: number;
  questionType: 'MCQ' | 'TRUE_FALSE' | 'OBJECTIVE' | 'SHORT_ANSWER';
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit?: number;
}

export interface BloomLevel {
  level: number;
  name: string;
  verbs: string[];
  questionStarters: string[];
  cognitiveLoad: 'low' | 'medium' | 'high';
}

export const BLOOM_TAXONOMY_LEVELS: BloomLevel[] = [
  {
    level: 1,
    name: 'Remember',
    verbs: ['define', 'identify', 'list', 'name', 'recall', 'recognize', 'state'],
    questionStarters: [
      'What is the definition of...',
      'Identify the key component...',
      'List the main characteristics...',
      'Name the primary function...',
      'Recall the specific example...'
    ],
    cognitiveLoad: 'low'
  },
  {
    level: 2,
    name: 'Understand',
    verbs: ['classify', 'compare', 'contrast', 'describe', 'explain', 'interpret', 'summarize'],
    questionStarters: [
      'Explain how...',
      'Compare and contrast...',
      'Describe the relationship between...',
      'Interpret the meaning of...',
      'Summarize the key points...'
    ],
    cognitiveLoad: 'low'
  },
  {
    level: 3,
    name: 'Apply',
    verbs: ['apply', 'calculate', 'demonstrate', 'execute', 'implement', 'solve', 'use'],
    questionStarters: [
      'How would you apply...',
      'Calculate the value of...',
      'Demonstrate the process of...',
      'Solve this problem using...',
      'Use the principle to...'
    ],
    cognitiveLoad: 'medium'
  },
  {
    level: 4,
    name: 'Analyze',
    verbs: ['analyze', 'compare', 'contrast', 'differentiate', 'examine', 'investigate', 'organize'],
    questionStarters: [
      'Analyze the differences between...',
      'What are the causes of...',
      'Examine the relationship between...',
      'Investigate the factors that...',
      'Organize the following concepts...'
    ],
    cognitiveLoad: 'medium'
  },
  {
    level: 5,
    name: 'Evaluate',
    verbs: ['assess', 'critique', 'evaluate', 'judge', 'justify', 'recommend', 'validate'],
    questionStarters: [
      'Evaluate the effectiveness of...',
      'Critique the following approach...',
      'Justify your reasoning for...',
      'Recommend the best solution for...',
      'Assess the validity of...'
    ],
    cognitiveLoad: 'high'
  },
  {
    level: 6,
    name: 'Create',
    verbs: ['construct', 'create', 'design', 'develop', 'formulate', 'generate', 'propose'],
    questionStarters: [
      'Design a solution for...',
      'Create a new approach to...',
      'Develop a strategy to...',
      'Propose an alternative method...',
      'Generate ideas for...'
    ],
    cognitiveLoad: 'high'
  }
];

export interface QuestionDiversityProfile {
  bloomLevel: BloomLevel;
  cognitiveLoad: 'low' | 'medium' | 'high';
  questionStyle: 'conceptual' | 'analytical' | 'practical' | 'theoretical';
  vocabularyLevel: 'basic' | 'intermediate' | 'advanced';
  contextType: 'definition' | 'example' | 'application' | 'scenario';
}

export function generateDiverseQuestionProfiles(
  numQuestions: number,
  difficulty: 'easy' | 'medium' | 'hard'
): QuestionDiversityProfile[] {
  const profiles: QuestionDiversityProfile[] = [];
  
  // Define distribution based on difficulty
  const bloomDistribution = getBloomDistribution(difficulty);
  const cognitiveLoadDistribution = getCognitiveLoadDistribution(difficulty);
  const questionStyleDistribution = getQuestionStyleDistribution();
  const vocabularyDistribution = getVocabularyDistribution(difficulty);
  const contextTypeDistribution = getContextTypeDistribution();
  
  for (let i = 0; i < numQuestions; i++) {
    const profile: QuestionDiversityProfile = {
      bloomLevel: selectWeightedRandom(BLOOM_TAXONOMY_LEVELS, bloomDistribution),
      cognitiveLoad: selectWeightedRandom(['low', 'medium', 'high'], cognitiveLoadDistribution),
      questionStyle: selectWeightedRandom(['conceptual', 'analytical', 'practical', 'theoretical'], questionStyleDistribution),
      vocabularyLevel: selectWeightedRandom(['basic', 'intermediate', 'advanced'], vocabularyDistribution),
      contextType: selectWeightedRandom(['definition', 'example', 'application', 'scenario'], contextTypeDistribution)
    };
    
    profiles.push(profile);
  }
  
  return profiles;
}

export function createDiversityFirstPrompt(
  config: DiversityPromptConfig,
  context: string,
  questionProfiles: QuestionDiversityProfile[]
): string {
  const { courseCode, courseTitle, topic, level, numQuestions, questionType, difficulty } = config;
  
  const topicContext = topic ? ` focusing specifically on ${topic}` : '';
  
  return `You are an expert exam setter for ${courseCode} - ${courseTitle} at ${level} level.

Using the following DIVERSE course material sources${topicContext}, generate exactly ${numQuestions} diverse questions that test different aspects of the material.

IMPORTANT: The material below comes from MULTIPLE DIFFERENT SOURCES. You MUST use different sources for different questions to ensure maximum diversity.

COURSE MATERIAL:
${context}

ASSIGNMENT INSTRUCTIONS:
You have ${numQuestions} questions to create. You MUST assign each question to a DIFFERENT source:
- Question 1: Use SOURCE 1
- Question 2: Use SOURCE 2  
- Question 3: Use SOURCE 3
- Continue this pattern for all questions
- If you run out of sources, cycle back but ensure variety

DIVERSITY REQUIREMENTS:
1. MANDATORY: Use DIFFERENT SOURCES for each question - each question must reference a different source
2. Generate questions from DIFFERENT parts of the material
3. Vary question complexity - mix simple and complex questions
4. Use different question styles and approaches
5. Vary vocabulary and terminology
6. Each question should test a different concept or aspect
7. Reference different topics, examples, and concepts from the various sources

SOURCE USAGE RULES:
- Question 1: Must use SOURCE 1, 2, or 3
- Question 2: Must use SOURCE 4, 5, or 6 (different from Question 1)
- Question 3: Must use SOURCE 7, 8, or 9 (different from Questions 1 & 2)
- Continue this pattern - each question uses a different source
- If you have more questions than sources, cycle through sources but ensure variety

${getQuestionTypeRequirements(questionType)}

RESPONSE FORMAT (JSON):
{
  "questions": [
    {
      "questionText": "...",
      "questionType": "${questionType}",
      "options": ["...", ...], // Only for MCQ/OBJECTIVE
      "correctAnswer": "...", // for OBJECTIVE, TRUE_FALSE
      "correctAnswers": ["...", ...], // for MCQ (array of 3 true options)
      "explanation": "...",
      "points": 1,
      "sourceUsed": "SOURCE X" // REQUIRED: Specify which source this question uses
    }
  ]
}

CRITICAL INSTRUCTIONS:
1. Each question MUST use a different source (SOURCE 1, SOURCE 2, SOURCE 3, etc.)
2. Do NOT use the same source for multiple questions
3. The sourceUsed field is REQUIRED for each question
4. Return ONLY valid JSON, no extra text, no comments, and no trailing commas.

EXAMPLE:
Question 1 should reference content from "--- SOURCE 1: ... ---"
Question 2 should reference content from "--- SOURCE 2: ... ---"
Question 3 should reference content from "--- SOURCE 3: ... ---"`;
}

function getQuestionTypeRequirements(questionType: string): string {
  switch (questionType) {
    case 'MCQ':
      return `MULTIPLE CHOICE QUESTIONS (MCQ):
- Generate exactly 5 options per question
- 3 options must be TRUE (correct answers)
- 2 options must be FALSE but plausible
- TRUE options: Use EXACT phrases from the material (6 words or less)
- FALSE options: Create believable but incorrect statements
- Each option should be a complete, clear statement
- Vary the position of correct answers across questions`;
    case 'OBJECTIVE':
      return `OBJECTIVE QUESTIONS:
- Generate exactly 4 options per question
- 1 correct answer, 3 plausible distractors
- Use clear, concise language
- Make distractors believable but incorrect
- Vary the position of correct answers`;
    case 'TRUE_FALSE':
      return `TRUE/FALSE QUESTIONS:
- Provide clear, unambiguous statements
- Avoid absolute terms when possible
- Make statements specific and testable
- Balance true and false statements across the set`;
    case 'SHORT_ANSWER':
      return `SHORT ANSWER QUESTIONS:
- Ask for specific, concise responses
- Provide clear answer expectations
- Test understanding, not just memorization
- Include key points in explanations`;
    default:
      return '';
  }
}

function getBloomDistribution(difficulty: 'easy' | 'medium' | 'hard'): number[] {
  switch (difficulty) {
    case 'easy':
      return [0.3, 0.4, 0.2, 0.1, 0.0, 0.0]; // Focus on Remember, Understand
    case 'medium':
      return [0.1, 0.3, 0.3, 0.2, 0.1, 0.0]; // Balanced distribution
    case 'hard':
      return [0.0, 0.1, 0.2, 0.3, 0.3, 0.1]; // Focus on Analyze, Evaluate, Create
    default:
      return [0.2, 0.2, 0.2, 0.2, 0.1, 0.1]; // Even distribution
  }
}

function getCognitiveLoadDistribution(difficulty: 'easy' | 'medium' | 'hard'): number[] {
  switch (difficulty) {
    case 'easy':
      return [0.6, 0.3, 0.1]; // Mostly low load
    case 'medium':
      return [0.2, 0.6, 0.2]; // Mostly medium load
    case 'hard':
      return [0.1, 0.3, 0.6]; // Mostly high load
    default:
      return [0.33, 0.34, 0.33]; // Even distribution
  }
}

function getQuestionStyleDistribution(): number[] {
  return [0.25, 0.25, 0.25, 0.25]; // Even distribution across all styles
}

function getVocabularyDistribution(difficulty: 'easy' | 'medium' | 'hard'): number[] {
  switch (difficulty) {
    case 'easy':
      return [0.5, 0.4, 0.1]; // Mostly basic vocabulary
    case 'medium':
      return [0.2, 0.6, 0.2]; // Mostly intermediate vocabulary
    case 'hard':
      return [0.1, 0.3, 0.6]; // Mostly advanced vocabulary
    default:
      return [0.33, 0.34, 0.33]; // Even distribution
  }
}

function getContextTypeDistribution(): number[] {
  return [0.25, 0.25, 0.25, 0.25]; // Even distribution across all context types
}

function selectWeightedRandom<T>(items: T[], weights: number[]): T {
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let random = Math.random() * totalWeight;
  
  for (let i = 0; i < items.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return items[i];
    }
  }
  
  return items[items.length - 1];
}
