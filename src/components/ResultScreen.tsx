"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Trophy, CheckCircle2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import FeedbackForm from "@/components/feedback-form";
import { Response } from "@/hooks/lib/types";

interface ResultScreenProps {
    responses: Response[];
    score: number;
    total: number;
    testResultId?: string;
    onRetry: () => void;
    goBack: () => void;
}

const ResultScreen: React.FC<ResultScreenProps> = ({
    responses,
    score,
    total,
    testResultId,
    onRetry,
    goBack,
}) => {
    const router = useRouter();
    const [showFeedback, setShowFeedback] = useState(false);

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
                                        {response.isCorrect ? (
                                            <CheckCircle2 className="w-5 h-5 mt-1 flex-shrink-0" />
                                        ) : (
                                            <XCircle className="w-5 h-5 text-red-600 mt-1 flex-shrink-0" />
                                        )}
                                        <div className="flex-1 text-sm">
                                            <p className="font-medium">{response.question}</p>
                                            <p className="text-gray-600">Your answer: {response.user_answer}</p>
                                            {!response.isCorrect && (
                                                <p className="text-green-600">Correct answer: {response.correct_answer}</p>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                            <div className="space-y-3">
                                <Button onClick={() => setShowFeedback(true)} className="w-full">
                                    Share Feedback
                                </Button>
                                <Button onClick={onRetry} variant="outline" className="w-full">
                                    Try Again
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => router.push("/quadrat/result")}
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

export default ResultScreen;
