"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { useAuth } from '@/providers/AuthProvider';
import { Timer, Brain, CheckCircle2, XCircle, Trophy } from 'lucide-react';
import { db } from '../../hooks/lib/firebaseConfig';
import { addDoc, collection } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import FeedbackForm from '@/components/feedback-form';
import { logout } from '../../hooks/lib/authFunctions';
import GetOverallFeedbackButton from '@/components/get-over-all-feedback';
import GetStrongWeakFeedbackButton from '@/components/get-strong-weak-feedback';

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
    questions: {
        question: string;
        correct_answer: string;
    }[];
    deviceInfo: {
        userAgent: string;
        platform: string;
        language: string;
    };
}

interface Question {
    question: string;
    option_1: string;
    option_2: string;
    option_3: string;
    option_4: string;
    correct_answer: string;
}

interface Response {
    question: string;
    correct_answer: string;
    user_answer: string;
    timeSpent: number;
    isCorrect: boolean;
}

/* --------------------------------------------------------------------------
   StartScreen Component
-------------------------------------------------------------------------- */
interface StartScreenProps {
    onStart: () => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
    const router = useRouter();
    return (
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="h-screen flex items-center justify-center p-4"
        >
            <Card className="w-full max-w-lg">
                <CardContent className="p-6 text-center space-y-4">
                    <motion.div>
                        <Brain className="w-12 h-12 mx-auto" />
                    </motion.div>
                    <h2 className="text-2xl font-bold">Quick Knowledge Check</h2>
                    <p className="text-gray-600">10 questions • 30 seconds each</p>
                    <Button onClick={onStart} className="w-full">
                        Begin Challenge
                    </Button>
                    <Button variant={'outline'} onClick={() => router.push('/quadrat/result')} className="w-full">
                        Report
                    </Button>
                    <Button variant={'destructive'} onClick={logout} className="w-full">
                        Log out
                    </Button>
                    <GetOverallFeedbackButton />
                    <GetStrongWeakFeedbackButton />
                </CardContent>
            </Card>
        </motion.div>
    )
};

/* --------------------------------------------------------------------------
   TestQuestion Component
-------------------------------------------------------------------------- */
interface TestQuestionProps {
    question: Question;
    currentIndex: number;
    total: number;
    timeLeft: number;
    progress: number;
    selectedAnswer: string;
    onAnswerChange: (value: string) => void;
    onSubmit: () => void;
}

const TestQuestion: React.FC<TestQuestionProps> = ({
    question,
    currentIndex,
    total,
    timeLeft,
    progress,
    selectedAnswer,
    onAnswerChange,
    onSubmit,
}) => (
    <motion.div
        key={currentIndex}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-screen p-4 flex items-center justify-center"
    >
        <Card className="w-full max-w-2xl">
            <CardContent className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <span className="text-sm font-medium">
                        Question {currentIndex + 1}/{total}
                    </span>
                    <motion.div
                        key={timeLeft}
                        initial={{ scale: 1.2 }}
                        animate={{ scale: 1 }}
                        className="flex items-center gap-2"
                    >
                        <Timer className="w-4 h-4" />
                        <span className={`font-mono ${timeLeft <= 10 ? 'text-red-600' : ''}`}>
                            {timeLeft}s
                        </span>
                    </motion.div>
                </div>
                <Progress value={progress} className="h-1 mb-6" />
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    <p className="text-lg font-medium">{question.question}</p>
                    <RadioGroup
                        value={selectedAnswer}
                        onValueChange={onAnswerChange}
                        className="space-y-2"
                    >
                        <AnimatePresence>
                            {[question.option_1, question.option_2, question.option_3, question.option_4].map(
                                (option, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="flex items-center p-3 rounded-lg hover:bg-gray-50"
                                    >
                                        <RadioGroupItem value={option} id={`option-${idx}`} />
                                        <Label htmlFor={`option-${idx}`} className="ml-2 flex-1 cursor-pointer">
                                            {option}
                                        </Label>
                                    </motion.div>
                                )
                            )}
                        </AnimatePresence>
                    </RadioGroup>
                </motion.div>
                <Button
                    onClick={onSubmit}
                    disabled={!selectedAnswer}
                    className="w-full mt-6 disabled:opacity-50"
                >
                    Next Question
                </Button>
            </CardContent>
        </Card>
    </motion.div>
);

/* --------------------------------------------------------------------------
   ResultScreen Component
-------------------------------------------------------------------------- */
interface ResultScreenProps {
    responses: Response[];
    score: number;
    total: number;
    testResultId?: string;
    onRetry: () => void;
    goBack: () => void;
}

const ResultScreen: React.FC<ResultScreenProps> = ({ responses, score, total, testResultId, onRetry, goBack }) => {
    const router = useRouter();
    const [showFeedback, setShowFeedback] = useState<boolean>(false);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen p-4 flex items-center justify-center"
        >
            <Card className="w-full max-w-2xl">
                <CardContent className="p-6">
                    {!showFeedback ? (
                        <>
                            <div className="text-center mb-6">
                                <Trophy className="w-12 h-12 mx-auto text-yellow-500 mb-4" />
                                <h2 className="text-2xl font-bold mb-2">Challenge Complete!</h2>
                                <Alert className="mb-6">
                                    <div className="text-xl font-semibold">
                                        Score: {score}/{total}
                                    </div>
                                </Alert>
                            </div>
                            <div className="grid grid-cols-1 gap-3 mb-6">
                                {responses.map((response, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ x: -20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                                    >
                                        {response.user_answer === response.correct_answer ? (
                                            <CheckCircle2 className="w-5 h-5 mt-1 flex-shrink-0" />
                                        ) : (
                                            <XCircle className="w-5 h-5 text-red-600 mt-1 flex-shrink-0" />
                                        )}
                                        <div className="flex-1 text-sm">
                                            <p className="font-medium">{response.question}</p>
                                            <p className="text-gray-600">Your answer: {response.user_answer}</p>
                                            {response.user_answer !== response.correct_answer && (
                                                <p className="text-green-600">Correct answer: {response.correct_answer}</p>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                            <div className="space-y-3">
                                <Button
                                    onClick={() => setShowFeedback(true)}
                                    className="w-full"
                                >
                                    Share Feedback
                                </Button>
                                <Button
                                    onClick={onRetry}
                                    variant="outline"
                                    className="w-full"
                                >
                                    Try Again
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => router.push('/quadrat/result')}
                                    className="w-full"
                                >
                                    View Reports
                                </Button>
                            </div>
                        </>
                    ) : (
                        <FeedbackForm
                            score={score}
                            total={total}
                            testResultId={testResultId}
                            onSubmit={goBack}
                            onSkip={goBack}
                        />
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
};

/* --------------------------------------------------------------------------
   Main TestPage Component
-------------------------------------------------------------------------- */
const TestPage = () => {
    const [state, setState] = useState({
        isStarted: false,
        isCompleted: false,
        currentQuestion: 0,
        score: 0,
        questions: [] as Question[],
        selectedQuestions: [] as Question[],
        responses: [] as Response[],
        selectedAnswer: '',
        timeLeft: 30,
        startTime: Date.now(),
        questionStartTime: Date.now(),
        testResultId: undefined as string | undefined,
    });
    const { user } = useAuth();

    // Fetch questions on mount
    useEffect(() => {
        fetch('/api/questions')
            .then((res) => res.json())
            .then((data) => setState((s) => ({ ...s, questions: data })))
            .catch(console.error);
    }, []);

    // Countdown timer
    useEffect(() => {
        if (state.isStarted && !state.isCompleted) {
            const timer = setInterval(() => {
                setState((s) => ({
                    ...s,
                    timeLeft: s.timeLeft > 0 ? s.timeLeft - 1 : 0,
                }));
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [state.isStarted, state.isCompleted]);

    // Auto-submit when timer reaches 0
    useEffect(() => {
        if (state.timeLeft === 0 && state.isStarted && !state.isCompleted) handleSubmit();
    }, [state.timeLeft]);

    const startTest = () => {
        const randomQuestions = state.questions
            .sort(() => Math.random() - 0.5)
            .slice(0, 10);
        setState((s) => ({
            ...s,
            isStarted: true,
            selectedQuestions: randomQuestions,
            currentQuestion: 0,
            responses: [],
            score: 0,
            timeLeft: 30,
            isCompleted: false,
            startTime: Date.now(),
            questionStartTime: Date.now(),
            testResultId: undefined,
        }));
    };

    const handleSubmit = async () => {
        const currentQ = state.selectedQuestions[state.currentQuestion];
        const isCorrect = state.selectedAnswer === currentQ?.correct_answer;
        const timeSpent = Math.round((Date.now() - state.questionStartTime) / 1000);

        const newResponses = [
            ...state.responses,
            {
                question: currentQ?.question,
                correct_answer: currentQ?.correct_answer,
                user_answer: state.selectedAnswer || "Time's up!",
                timeSpent,
                isCorrect,
            },
        ];

        if (state.currentQuestion < state.selectedQuestions.length - 1) {
            setState((s) => ({
                ...s,
                currentQuestion: s.currentQuestion + 1,
                responses: newResponses,
                score: isCorrect ? s.score + 1 : s.score,
                selectedAnswer: '',
                timeLeft: 30,
                questionStartTime: Date.now(),
            }));
        } else {
            const finalScore = isCorrect ? state.score + 1 : state.score;
            const totalTime = Math.round((Date.now() - state.startTime) / 1000);
            try {
                const testData: TestResult = {
                    userId: user?.uid,
                    username: user?.displayName,
                    email: user?.email,
                    timestamp: new Date().toISOString(),
                    responses: newResponses,
                    score: finalScore,
                    totalQuestions: state.selectedQuestions.length,
                    totalTime,
                    averageTimePerQuestion: totalTime / state.selectedQuestions.length,
                    questions: state.selectedQuestions.map((q) => ({
                        question: q.question,
                        correct_answer: q.correct_answer,
                    })),
                    deviceInfo: {
                        userAgent: navigator.userAgent,
                        platform: navigator.platform,
                        language: navigator.language,
                    },
                };
                // console.log(testData)

                // Save to Firebase
                const docRef = await addDoc(collection(db, 'test_results'), testData);

                setState((s) => ({
                    ...s,
                    responses: newResponses,
                    score: finalScore,
                    isStarted: false,
                    isCompleted: true,
                    testResultId: docRef.id,
                }));
            } catch (error) {
                console.error('Error saving test:', error);
                toast({
                    title: "Error",
                    description: "Failed to save test results. Your score may not be recorded.",
                    variant: "destructive",
                });

                setState((s) => ({
                    ...s,
                    responses: newResponses,
                    score: finalScore,
                    isStarted: false,
                    isCompleted: true,
                }));
            }
        }
    };

    // Render the appropriate component based on state
    if (!state.isStarted && !state.isCompleted) {
        return <StartScreen onStart={startTest} />;
    }

    if (state.isCompleted) {
        return (
            <ResultScreen
                responses={state.responses}
                score={state.score}
                total={state.selectedQuestions.length}
                testResultId={state.testResultId}
                onRetry={startTest}
                goBack={() => setState({ ...state, isStarted: false, isCompleted: false })}
            />
        );
    }

    const currentQ = state.selectedQuestions[state.currentQuestion];
    const progress = (state.currentQuestion / state.selectedQuestions.length) * 100;

    return (
        <TestQuestion
            question={currentQ}
            currentIndex={state.currentQuestion}
            total={state.selectedQuestions.length}
            timeLeft={state.timeLeft}
            progress={progress}
            selectedAnswer={state.selectedAnswer}
            onAnswerChange={(value) => setState((s) => ({ ...s, selectedAnswer: value }))}
            onSubmit={handleSubmit}
        />
    );
};

export default TestPage;
