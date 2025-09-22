/**
 * Diversity Test Suite
 * 
 * This module tests the diversity improvements in the new system
 * by comparing question generation patterns and measuring diversity metrics.
 */

import { generateDiverseQuestionProfiles, createDiversityFirstPrompt, DiversityPromptConfig } from './diversity-first-prompts';

export interface DiversityMetrics {
  bloomLevelDistribution: Record<number, number>;
  cognitiveLoadDistribution: Record<string, number>;
  questionStyleDistribution: Record<string, number>;
  vocabularyLevelDistribution: Record<string, number>;
  contextTypeDistribution: Record<string, number>;
  questionLengthVariation: {
    min: number;
    max: number;
    average: number;
    standardDeviation: number;
  };
  vocabularyDiversity: number; // Unique words / total words
  conceptDiversity: number; // Unique concepts / total questions
}

export function analyzeQuestionDiversity(questions: any[]): DiversityMetrics {
  const metrics: DiversityMetrics = {
    bloomLevelDistribution: {},
    cognitiveLoadDistribution: {},
    questionStyleDistribution: {},
    vocabularyLevelDistribution: {},
    contextTypeDistribution: {},
    questionLengthVariation: {
      min: Infinity,
      max: 0,
      average: 0,
      standardDeviation: 0
    },
    vocabularyDiversity: 0,
    conceptDiversity: 0
  };

  const questionLengths: number[] = [];
  const allWords = new Set<string>();
  const allConcepts = new Set<string>();

  questions.forEach(question => {
    // Analyze Bloom levels
    const bloomLevel = question.bloomLevel || 1;
    metrics.bloomLevelDistribution[bloomLevel] = (metrics.bloomLevelDistribution[bloomLevel] || 0) + 1;

    // Analyze cognitive load
    const cognitiveLoad = question.cognitiveLoad || 'medium';
    metrics.cognitiveLoadDistribution[cognitiveLoad] = (metrics.cognitiveLoadDistribution[cognitiveLoad] || 0) + 1;

    // Analyze question styles
    const questionStyle = question.questionStyle || 'conceptual';
    metrics.questionStyleDistribution[questionStyle] = (metrics.questionStyleDistribution[questionStyle] || 0) + 1;

    // Analyze vocabulary levels
    const vocabularyLevel = question.vocabularyLevel || 'intermediate';
    metrics.vocabularyLevelDistribution[vocabularyLevel] = (metrics.vocabularyLevelDistribution[vocabularyLevel] || 0) + 1;

    // Analyze context types
    const contextType = question.contextType || 'definition';
    metrics.contextTypeDistribution[contextType] = (metrics.contextTypeDistribution[contextType] || 0) + 1;

    // Analyze question length
    const questionText = question.questionText || '';
    const length = questionText.length;
    questionLengths.push(length);
    metrics.questionLengthVariation.min = Math.min(metrics.questionLengthVariation.min, length);
    metrics.questionLengthVariation.max = Math.max(metrics.questionLengthVariation.max, length);

    // Analyze vocabulary diversity
    const words = questionText.toLowerCase().split(/\s+/).filter((word: string) => word.length > 2);
    words.forEach((word: string) => allWords.add(word));

    // Analyze concept diversity (extract key concepts from question text)
    const concepts = extractConceptsFromText(questionText);
    concepts.forEach(concept => allConcepts.add(concept));
  });

  // Calculate average and standard deviation for question lengths
  if (questionLengths.length > 0) {
    metrics.questionLengthVariation.average = questionLengths.reduce((sum, len) => sum + len, 0) / questionLengths.length;
    const variance = questionLengths.reduce((sum, len) => sum + Math.pow(len - metrics.questionLengthVariation.average, 2), 0) / questionLengths.length;
    metrics.questionLengthVariation.standardDeviation = Math.sqrt(variance);
  }

  // Calculate vocabulary diversity
  const totalWords = questions.reduce((sum, q) => {
    const words = (q.questionText || '').toLowerCase().split(/\s+/).filter((word: string) => word.length > 2);
    return sum + words.length;
  }, 0);
  metrics.vocabularyDiversity = totalWords > 0 ? allWords.size / totalWords : 0;

  // Calculate concept diversity
  metrics.conceptDiversity = questions.length > 0 ? allConcepts.size / questions.length : 0;

  return metrics;
}

function extractConceptsFromText(text: string): string[] {
  // Simple concept extraction - look for capitalized words and technical terms
  const words = text.split(/\s+/);
  const concepts: string[] = [];
  
  words.forEach(word => {
    // Remove punctuation and check if it's a potential concept
    const cleanWord = word.replace(/[^\w]/g, '');
    if (cleanWord.length > 3 && /^[A-Z]/.test(cleanWord)) {
      concepts.push(cleanWord.toLowerCase());
    }
  });
  
  return concepts;
}

export function generateDiversityReport(metrics: DiversityMetrics, numQuestions: number): string {
  const report = [];
  
  report.push("=== DIVERSITY ANALYSIS REPORT ===");
  report.push(`Total Questions: ${numQuestions}`);
  report.push("");
  
  // Bloom Taxonomy Distribution
  report.push("BLOOM TAXONOMY DISTRIBUTION:");
  for (let level = 1; level <= 6; level++) {
    const count = metrics.bloomLevelDistribution[level] || 0;
    const percentage = ((count / numQuestions) * 100).toFixed(1);
    const levelNames = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'];
    report.push(`  Level ${level} (${levelNames[level - 1]}): ${count} questions (${percentage}%)`);
  }
  report.push("");
  
  // Cognitive Load Distribution
  report.push("COGNITIVE LOAD DISTRIBUTION:");
  Object.entries(metrics.cognitiveLoadDistribution).forEach(([load, count]) => {
    const percentage = ((count / numQuestions) * 100).toFixed(1);
    report.push(`  ${load.charAt(0).toUpperCase() + load.slice(1)}: ${count} questions (${percentage}%)`);
  });
  report.push("");
  
  // Question Style Distribution
  report.push("QUESTION STYLE DISTRIBUTION:");
  Object.entries(metrics.questionStyleDistribution).forEach(([style, count]) => {
    const percentage = ((count / numQuestions) * 100).toFixed(1);
    report.push(`  ${style.charAt(0).toUpperCase() + style.slice(1)}: ${count} questions (${percentage}%)`);
  });
  report.push("");
  
  // Vocabulary Level Distribution
  report.push("VOCABULARY LEVEL DISTRIBUTION:");
  Object.entries(metrics.vocabularyLevelDistribution).forEach(([level, count]) => {
    const percentage = ((count / numQuestions) * 100).toFixed(1);
    report.push(`  ${level.charAt(0).toUpperCase() + level.slice(1)}: ${count} questions (${percentage}%)`);
  });
  report.push("");
  
  // Context Type Distribution
  report.push("CONTEXT TYPE DISTRIBUTION:");
  Object.entries(metrics.contextTypeDistribution).forEach(([type, count]) => {
    const percentage = ((count / numQuestions) * 100).toFixed(1);
    report.push(`  ${type.charAt(0).toUpperCase() + type.slice(1)}: ${count} questions (${percentage}%)`);
  });
  report.push("");
  
  // Question Length Variation
  report.push("QUESTION LENGTH VARIATION:");
  report.push(`  Minimum: ${metrics.questionLengthVariation.min} characters`);
  report.push(`  Maximum: ${metrics.questionLengthVariation.max} characters`);
  report.push(`  Average: ${metrics.questionLengthVariation.average.toFixed(1)} characters`);
  report.push(`  Standard Deviation: ${metrics.questionLengthVariation.standardDeviation.toFixed(1)} characters`);
  report.push("");
  
  // Diversity Scores
  report.push("DIVERSITY SCORES:");
  report.push(`  Vocabulary Diversity: ${(metrics.vocabularyDiversity * 100).toFixed(1)}% (unique words / total words)`);
  report.push(`  Concept Diversity: ${(metrics.conceptDiversity * 100).toFixed(1)}% (unique concepts / total questions)`);
  report.push("");
  
  // Overall Assessment
  const overallDiversity = calculateOverallDiversityScore(metrics);
  report.push("OVERALL DIVERSITY ASSESSMENT:");
  report.push(`  Score: ${overallDiversity.toFixed(1)}/100`);
  report.push(`  Rating: ${getDiversityRating(overallDiversity)}`);
  
  return report.join('\n');
}

function calculateOverallDiversityScore(metrics: DiversityMetrics): number {
  let score = 0;
  
  // Bloom taxonomy distribution score (0-25 points)
  const bloomDistribution = Object.values(metrics.bloomLevelDistribution);
  const bloomVariance = calculateVariance(bloomDistribution);
  score += Math.max(0, 25 - bloomVariance * 10);
  
  // Cognitive load distribution score (0-20 points)
  const cognitiveDistribution = Object.values(metrics.cognitiveLoadDistribution);
  const cognitiveVariance = calculateVariance(cognitiveDistribution);
  score += Math.max(0, 20 - cognitiveVariance * 8);
  
  // Question style distribution score (0-20 points)
  const styleDistribution = Object.values(metrics.questionStyleDistribution);
  const styleVariance = calculateVariance(styleDistribution);
  score += Math.max(0, 20 - styleVariance * 8);
  
  // Vocabulary diversity score (0-15 points)
  score += Math.min(15, metrics.vocabularyDiversity * 15);
  
  // Concept diversity score (0-10 points)
  score += Math.min(10, metrics.conceptDiversity * 10);
  
  // Length variation score (0-10 points)
  const lengthVariation = metrics.questionLengthVariation.standardDeviation / metrics.questionLengthVariation.average;
  score += Math.min(10, lengthVariation * 20);
  
  return Math.min(100, score);
}

function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  return variance;
}

function getDiversityRating(score: number): string {
  if (score >= 90) return "Excellent - Maximum diversity achieved";
  if (score >= 80) return "Very Good - High diversity with good distribution";
  if (score >= 70) return "Good - Adequate diversity across most dimensions";
  if (score >= 60) return "Fair - Some diversity but room for improvement";
  if (score >= 50) return "Poor - Limited diversity, needs significant improvement";
  return "Very Poor - Minimal diversity, major issues";
}

export function testDiversityFirstSystem(): void {
  console.log("Testing Diversity-First System...");
  
  // Test question profile generation
  const profiles = generateDiverseQuestionProfiles(10, 'medium');
  console.log("Generated question profiles:", profiles.length);
  
  // Test prompt generation
  const config: DiversityPromptConfig = {
    courseCode: 'TEST101',
    courseTitle: 'Test Course',
    topic: 'Test Topic',
    level: 'undergraduate',
    numQuestions: 10,
    questionType: 'MCQ',
    difficulty: 'medium'
  };
  
  const context = "This is a test context with various concepts and ideas for testing diversity.";
  const prompt = createDiversityFirstPrompt(config, context, profiles);
  
  console.log("Generated prompt length:", prompt.length);
  console.log("Prompt contains diversity requirements:", prompt.includes('DIVERSITY REQUIREMENTS'));
  console.log("Prompt contains Bloom taxonomy:", prompt.includes('BLOOM'));
  console.log("Prompt contains cognitive load:", prompt.includes('COGNITIVE LOAD'));
  
  console.log("Diversity-First System test completed successfully!");
}
