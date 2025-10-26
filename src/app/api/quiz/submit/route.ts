import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateChatResponse, ChatMessage } from "@/lib/google-ai";

const GOOGLE_API_KEY = process.env.GOOGLE_AI_API_KEY!;

interface QuizSubmissionRequest {
  quizId: string;
  answers: Array<{
    questionId: string;
    answer: string | string[]; // Allow array for MCQ
  }>;
  timeTaken?: number; // in seconds
}

interface GradedQuestion {
  questionId: string;
  userAnswer: string | string[];
  correctAnswer: string | string[];
  isCorrect: boolean;
  explanation: string;
  points: number;
  earnedPoints: number;
  partiallyCorrect?: boolean;
  // For MCQ: per-option breakdown
  optionDetails?: Array<{ option: string; isCorrect: boolean; userSelected: boolean; score: number }>;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { quizId, answers, timeTaken }: QuizSubmissionRequest = await req.json();

    if (!quizId || !answers || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get user ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get quiz with questions
    const quiz = await (prisma as any).quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Grade answers
    const gradedQuestions: GradedQuestion[] = [];
    let totalScore = 0;
    let maxScore = 0;
    let percentage = 0;

    for (const question of quiz.questions) {
      const userAnswer = answers.find(a => a.questionId === question.id);
      let isCorrect = false;
      let earnedPoints = 0;
      let userAns = userAnswer?.answer ?? '';
      let correctAns = question.correctAnswer;
      let perOptionDetails: Array<{ option: string; isCorrect: boolean; userSelected: boolean; score: number }> | undefined = undefined;

      if (question.questionType === 'MCQ') {
        // Parse correctAns if it's a stringified array
        let correctArr: string[] = [];
        if (Array.isArray(correctAns)) {
          correctArr = correctAns;
        } else if (typeof correctAns === 'string') {
          try {
            correctArr = JSON.parse(correctAns);
          } catch {
            correctArr = correctAns ? [correctAns] : [];
          }
        }
        
        // Clean up correct answers - remove any (TRUE) or (FALSE) labels
        correctArr = correctArr.map(answer => 
          answer.replace(/\s*\(TRUE\)\s*$/i, '').replace(/\s*\(FALSE\)\s*$/i, '').trim()
        );
        
        // User answer as array
        const userArr = Array.isArray(userAns) ? userAns : typeof userAns === 'string' && userAns ? [userAns] : [];
        
        // Clean up user answers - remove any (TRUE) or (FALSE) labels
        const cleanedUserArr = userArr.map(answer => 
          answer.replace(/\s*\(TRUE\)\s*$/i, '').replace(/\s*\(FALSE\)\s*$/i, '').trim()
        );
        
        // New MCQ scoring logic: per-option scoring with negative marking
        // Each question has 5 options (3 true, 2 false)
        // +1 for each correct choice, -1 for each incorrect choice
        // Checked = user thinks it's true, Unchecked = user thinks it's false
        
        // Get all options for this question
        const allOptions = question.options || [];
        
        // Calculate per-option score
        let optionScore = 0;
        const optionDetails: Array<{option: string, isCorrect: boolean, userSelected: boolean, score: number}> = [];
        
        for (const option of allOptions) {
          const isCorrectOption = correctArr.includes(option);
          const userSelected = cleanedUserArr.includes(option);
          
          let optionPoints = 0;
          if (isCorrectOption && userSelected) {
            // Correct: user selected a true option (+1)
            optionPoints = 1;
          } else if (!isCorrectOption && !userSelected) {
            // Correct: user didn't select a false option (+1)
            optionPoints = 1;
          } else if (isCorrectOption && !userSelected) {
            // Incorrect: user didn't select a true option (-1)
            optionPoints = -1;
          } else if (!isCorrectOption && userSelected) {
            // Incorrect: user selected a false option (-1)
            optionPoints = -1;
          }
          
          optionScore += optionPoints;
          optionDetails.push({
            option,
            isCorrect: isCorrectOption,
            userSelected,
            score: optionPoints
          });
        }
        perOptionDetails = optionDetails;
        
        // No question-level logic - use raw option scores directly
        isCorrect = optionScore > 0; // Keep for display purposes only
        earnedPoints = optionScore; // Allow negative points per question
        userAns = cleanedUserArr;
        correctAns = correctArr;
      } else if (question.questionType === 'OBJECTIVE' || question.questionType === 'TRUE_FALSE') {
        // Clean up answers - remove any (TRUE) or (FALSE) labels
        const cleanedUserAns = typeof userAns === 'string' ? 
          userAns.replace(/\s*\(TRUE\)\s*$/i, '').replace(/\s*\(FALSE\)\s*$/i, '').trim() : userAns;
        const cleanedCorrectAns = typeof correctAns === 'string' ? 
          correctAns.replace(/\s*\(TRUE\)\s*$/i, '').replace(/\s*\(FALSE\)\s*$/i, '').trim() : correctAns;
        
        isCorrect = cleanedUserAns === cleanedCorrectAns;
        earnedPoints = isCorrect ? question.points : 0;
        userAns = cleanedUserAns;
        correctAns = cleanedCorrectAns;
      } else if (question.questionType === 'SHORT_ANSWER') {
        // AI grading handled below
        isCorrect = false;
        earnedPoints = 0;
      }

      totalScore += earnedPoints;
      
      // For MCQ questions, max score is 5 points (one per option)
      // For other question types, use the original points
      if (question.questionType === 'MCQ') {
        maxScore += 5; // 5 options per MCQ question
      } else {
      maxScore += question.points;
      }

      gradedQuestions.push({
        questionId: question.id,
        userAnswer: userAns,
        correctAnswer: correctAns,
        isCorrect,
        explanation: question.explanation || '',
        points: question.points,
        earnedPoints,
        optionDetails: perOptionDetails
      });
    }

    percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

    // For short answer questions, use AI to grade if needed
    const shortAnswerQuestions = gradedQuestions.filter(q => 
      quiz.questions.find((question: any) => question.id === q.questionId)?.questionType === 'SHORT_ANSWER'
    );

    if (shortAnswerQuestions.length > 0) {
      // Use AI to grade short answer questions
      // For each question, send a prompt as per the new requirements
      const aiResults: any[] = [];
      for (const q of shortAnswerQuestions) {
        const questionObj = quiz.questions.find((question: any) => question.id === q.questionId);
        const gradingPrompt = `You are an expert grader. Compare the student's answer with the expected answer. If they mean the same thing, mark it correct. Return a JSON like { 'verdict': 'correct' | 'incorrect', 'explanation': '...' }.`;
        const aiInput = {
          question: questionObj?.questionText,
          expected_answer: q.correctAnswer,
          student_answer: q.userAnswer,
          instruction: gradingPrompt
        };
        const messagesForAI: ChatMessage[] = [
          { role: "system", content: gradingPrompt },
          { role: "user", content: JSON.stringify(aiInput) }
        ];
        try {
          const aiResponse = await generateChatResponse(GOOGLE_API_KEY, messagesForAI, {
            maxOutputTokens: 1024,
            temperature: 0.1,
            topK: 40,
            topP: 0.95,
          });
          // Try to extract JSON from the response
          const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const aiGrading = JSON.parse(jsonMatch[0]);
            aiResults.push({ questionId: q.questionId, ...aiGrading });
          } else {
            aiResults.push({ questionId: q.questionId, verdict: 'incorrect', explanation: 'AI did not return a valid response.' });
          }
        } catch (error) {
          aiResults.push({ questionId: q.questionId, verdict: 'incorrect', explanation: 'AI grading failed.' });
        }
      }
      // Update graded questions with AI results
      aiResults.forEach((grade: any) => {
        const questionIndex = gradedQuestions.findIndex(q => q.questionId === grade.questionId);
        if (questionIndex !== -1) {
          gradedQuestions[questionIndex].isCorrect = grade.verdict === 'correct';
          gradedQuestions[questionIndex].earnedPoints = grade.verdict === 'correct' ? gradedQuestions[questionIndex].points : 0;
          gradedQuestions[questionIndex].explanation = grade.explanation || '';
        }
      });
      // Recalculate total score
      totalScore = gradedQuestions.reduce((sum, q) => sum + q.earnedPoints, 0);
      percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    }

    // Store quiz result
    const quizResult = await (prisma as any).quizResult.create({
      data: {
        quizId,
        userId: user.id,
        answers: answers,
        score: totalScore,
        maxScore,
        percentage,
        timeTaken,
        feedback: gradedQuestions
      }
    });

    return NextResponse.json({
      success: true,
      result: {
        id: quizResult.id,
        score: quizResult.score,
        maxScore: quizResult.maxScore,
        percentage: quizResult.percentage,
        timeTaken: quizResult.timeTaken,
        completedAt: quizResult.completedAt,
        questions: gradedQuestions.map(q => ({
          questionId: q.questionId,
          questionText: quiz.questions.find((question: any) => question.id === q.questionId)?.questionText,
          userAnswer: q.userAnswer,
          correctAnswer: q.correctAnswer,
          isCorrect: q.isCorrect,
          partiallyCorrect: q.partiallyCorrect || false,
          explanation: q.explanation,
          points: q.points,
          earnedPoints: q.earnedPoints
        }))
      }
    });

  } catch (error) {
    console.error("Quiz submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit quiz" },
      { status: 500 }
    );
  }
} 