import { Question } from "./questions";

export interface Response {
    question: string;
    correct_answer: string;
    user_answer: string;
    timeSpent: number;
    isCorrect: boolean;
}

export interface TestResult {
    userId: string | undefined;
    username: string | null | undefined;
    email: string | null | undefined;
    timestamp: string;
    responses: Response[];
    score: number;
    totalQuestions: number;
    totalTime: number;
    averageTimePerQuestion: number;
    questions: { question: string; correct_answer: string }[];
    deviceInfo: { userAgent: string; platform: string; language: string };
}

export interface TestState {
    isStarted: boolean;
    isCompleted: boolean;
    currentQuestion: number;
    score: number;
    selectedQuestions: Question[];
    responses: Response[];
    selectedAnswer: string;
    timeLeft: number;
    startTime: number;
    questionStartTime: number;
    testResultId?: string;
}
