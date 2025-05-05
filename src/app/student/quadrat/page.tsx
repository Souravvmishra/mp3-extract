"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { addDoc, collection } from "firebase/firestore";
import { db } from "@/hooks/lib/firebaseConfig";
import { toast } from "@/hooks/use-toast";
import StartScreen from "@/components/main-start-page";
import QuizScreen from "@/components/QuizScreen";
import ResultScreen from "@/components/ResultScreen";
import { TestState, Response } from "@/hooks/lib/types";
import { Question } from "@/hooks/lib/questions";

const TestPage: React.FC = () => {
    const [state, setState] = useState<TestState>({
        isStarted: false,
        isCompleted: false,
        currentQuestion: 0,
        score: 0,
        selectedQuestions: [],
        responses: [],
        selectedAnswer: "",
        timeLeft: 30,
        startTime: Date.now(),
        questionStartTime: Date.now(),
        testResultId: undefined,
    });

    const [metadata, setMetadata] = useState({
        category: '',
        topic: '',
        difficulty: ''
    });

    const { user } = useAuth();

    // Timer effect
    useEffect(() => {
        if (state.isStarted && !state.isCompleted) {
            const timer = setInterval(() => {
                setState((prev) => ({
                    ...prev,
                    timeLeft: prev.timeLeft > 0 ? prev.timeLeft - 1 : 0,
                }));
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [state.isStarted, state.isCompleted]);

    // Auto-submit when time runs out
    useEffect(() => {
        if (state.timeLeft === 0 && state.isStarted && !state.isCompleted) {
            handleSubmit();
        }
    }, [state.timeLeft]);

    const startTest = async (category: string, topic: string, difficulty: string) => {
        try {
            const params = new URLSearchParams({ category, topic, difficulty });
            const res = await fetch(`/api/questions?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch questions");
            const data: Question[] = await res.json();
            const randomQuestions = data.sort(() => Math.random() - 0.5).slice(0, 10);
            setMetadata({ category, topic, difficulty });
            setState((prev) => ({
                ...prev,
                isStarted: true,
                selectedQuestions: randomQuestions,
                currentQuestion: 0,
                responses: [],
                score: 0,
                timeLeft: 30,
                isCompleted: false,
                startTime: Date.now(),
                questionStartTime: Date.now(),
            }));
        } catch (error) {
            console.error("Error starting test:", error);
            toast({
                title: "Error",
                description: "Failed to fetch questions. Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleAnswerChange = (value: string) => {
        setState((prev) => ({ ...prev, selectedAnswer: value }));
    };

    const handleSubmit = async () => {
        const currentQ = state.selectedQuestions[state.currentQuestion];
        const isCorrect = state.selectedAnswer === currentQ.correct_answer;
        const timeSpent = Math.round((Date.now() - state.questionStartTime) / 1000);
        const newResponse: Response = {
            question: currentQ.question,
            correct_answer: currentQ.correct_answer,
            user_answer: state.selectedAnswer || "Time's up!",
            timeSpent,
            isCorrect,
        };
        const newResponses = [...state.responses, newResponse];

        if (state.currentQuestion < state.selectedQuestions.length - 1) {
            setState((prev) => ({
                ...prev,
                currentQuestion: prev.currentQuestion + 1,
                responses: newResponses,
                score: isCorrect ? prev.score + 1 : prev.score,
                selectedAnswer: "",
                timeLeft: 30,
                questionStartTime: Date.now(),
            }));
        } else {
            const finalScore = isCorrect ? state.score + 1 : state.score;
            const totalTime = Math.round((Date.now() - state.startTime) / 1000);

            try {
                const testData = {
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
                    metadata
                };
                const docRef = await addDoc(collection(db, "test_results"), testData);
                setState((prev) => ({
                    ...prev,
                    responses: newResponses,
                    score: finalScore,
                    isStarted: false,
                    isCompleted: true,
                    testResultId: docRef.id,
                }));
            } catch (error) {
                console.error("Error saving test results:", error);
                toast({
                    title: "Error",
                    description: "Failed to save test results.",
                    variant: "destructive",
                });
                setState((prev) => ({
                    ...prev,
                    responses: newResponses,
                    score: finalScore,
                    isStarted: false,
                    isCompleted: true,
                }));
            }
        }
    };

    const retryQuiz = () => {
        setState((prev) => ({
            ...prev,
            isStarted: false,
            isCompleted: false,
            currentQuestion: 0,
            score: 0,
            selectedQuestions: [],
            responses: [],
            selectedAnswer: "",
            timeLeft: 30,
            startTime: Date.now(),
            questionStartTime: Date.now(),
            testResultId: undefined,
        }));
    };

    const goBack = () => {
        setState((prev) => ({ ...prev, isStarted: false, isCompleted: false }));
    };

    if (!state.isStarted && !state.isCompleted) {
        return (
            <div className="max-w-xl mx-auto p-4 space-y-4">
                <StartScreen onStart={startTest} />
            </div>
        );
    }

    if (state.isCompleted) {
        return (
            <ResultScreen
                responses={state.responses}
                score={state.score}
                total={state.selectedQuestions.length}
                testResultId={state.testResultId}
                onRetry={retryQuiz}
                goBack={goBack}
            />
        );
    }

    const currentQ = state.selectedQuestions[state.currentQuestion];
    const progress = (state.currentQuestion / state.selectedQuestions.length) * 100;
    
    return currentQ ? (
        <QuizScreen
            question={currentQ}
            currentIndex={state.currentQuestion}
            total={state.selectedQuestions.length}
            timeLeft={state.timeLeft}
            progress={progress}
            selectedAnswer={state.selectedAnswer}
            onAnswerChange={handleAnswerChange}
            onSubmit={handleSubmit}
        />
    ) : null;

};

export default TestPage;
