"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Timer, Loader2 } from "lucide-react";
import { Question } from "@/hooks/lib/questions";
import { Skeleton } from "@/components/ui/skeleton";

interface QuizScreenProps {
    question: Question | null;
    currentIndex: number;
    total: number;
    timeLeft: number;
    progress: number;
    selectedAnswer: string;
    onAnswerChange: (value: string) => void;
    onSubmit: () => void;
    isLoading: boolean;
}

const QuizScreen: React.FC<QuizScreenProps> = ({
    question,
    currentIndex,
    total,
    timeLeft,
    progress,
    selectedAnswer,
    onAnswerChange,
    onSubmit,
    isLoading,
}) => {


    return (
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
                            <span className={`font-mono ${timeLeft <= 10 ? "text-red-600" : ""}`}>
                                {timeLeft}s
                            </span>
                        </motion.div>
                    </div>
                    <Progress value={progress} className="h-1 mb-6" />

                    {isLoading ? (
                        <div className="space-y-6">
                            <Skeleton className="h-6 w-3/4 mb-8" />
                            <div className="space-y-4">
                                {[1, 2, 3, 4].map((idx) => (
                                    <div key={idx} className="flex items-center space-x-2">
                                        <Skeleton className="h-4 w-4 rounded-full" />
                                        <Skeleton className="h-10 w-full rounded-lg" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : question ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                            <p className="text-lg font-medium">{question.question}</p>
                            <RadioGroup value={selectedAnswer} onValueChange={onAnswerChange} className="space-y-2">
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
                    ) : (
                        <div className="flex justify-center items-center py-12">
                            <p className="text-gray-500">No question available</p>
                        </div>
                    )}

                    <Button
                        onClick={onSubmit}
                        disabled={isLoading || !question || !selectedAnswer}
                        className="w-full mt-6 disabled:opacity-50"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Loading...
                            </>
                        ) : (
                            "Next Question"
                        )}
                    </Button>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default QuizScreen;
