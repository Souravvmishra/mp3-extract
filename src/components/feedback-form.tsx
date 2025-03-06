// FeedbackForm.tsx
"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { db } from '@/lib/firebaseConfig';
import { addDoc, collection } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';

export interface FeedbackData {
    userId: string | undefined;
    username: string | null | undefined;
    email: string | null | undefined;
    timestamp: string;
    rating: number;
    difficulty: string;
    comments: string;
    testResultId?: string;
    score?: number;
    totalQuestions?: number;
}

export interface FeedbackFormProps {
    score: number;
    total: number;
    testResultId?: string;
    onSubmit: () => void;
    onSkip: () => void;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({
    score,
    total,
    testResultId,
    onSubmit,
    onSkip
}) => {
    const { user } = useAuth();
    const [rating, setRating] = useState<number>(0);
    const [difficulty, setDifficulty] = useState<string>('');
    const [comments, setComments] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const handleSubmit = async (): Promise<void> => {
        setIsSubmitting(true);
        try {
            const feedbackData: FeedbackData = {
                userId: user?.uid,
                username: user?.displayName,
                email: user?.email,
                timestamp: new Date().toISOString(),
                rating,
                difficulty,
                comments,
                testResultId,
                score,
                totalQuestions: total
            };

            await addDoc(collection(db, 'feedback'), feedbackData);
            toast({
                title: "Feedback submitted",
                description: "Thank you for your feedback!",
            });
            onSubmit();
        } catch (error) {
            console.error('Error submitting feedback:', error);
            toast({
                title: "Error",
                description: "Failed to submit feedback. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                <h3 className="text-lg font-semibold">Share Your Feedback</h3>
            </div>

            <div className="space-y-4">
                <div>
                    <Label htmlFor="rating">How would you rate this quiz? (1-5)</Label>
                    <div className="flex gap-2 mt-2">
                        {[1, 2, 3, 4, 5].map((value) => (
                            <Button
                                key={value}
                                type="button"
                                variant={rating === value ? "default" : "outline"}
                                className="w-10 h-10 p-0"
                                onClick={() => setRating(value)}
                            >
                                {value}
                            </Button>
                        ))}
                    </div>
                </div>

                <div>
                    <Label htmlFor="difficulty">How was the difficulty level?</Label>
                    <RadioGroup
                        value={difficulty}
                        onValueChange={setDifficulty}
                        className="mt-2 space-y-2"
                    >
                        {['Too Easy', 'Just Right', 'Too Difficult'].map((option) => (
                            <div key={option} className="flex items-center p-2 rounded-lg hover:bg-gray-50">
                                <RadioGroupItem value={option} id={`difficulty-${option}`} />
                                <Label htmlFor={`difficulty-${option}`} className="ml-2 cursor-pointer">
                                    {option}
                                </Label>
                            </div>
                        ))}
                    </RadioGroup>
                </div>

                <div>
                    <Label htmlFor="comments">Additional Comments</Label>
                    <Textarea
                        id="comments"
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        placeholder="Share your thoughts about the quiz..."
                        className="mt-2 min-h-24"
                    />
                </div>

                <div className="flex gap-3 pt-2">
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || rating === 0 || !difficulty}
                        className="flex-1"
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={onSkip}
                        className="flex-1"
                    >
                        Skip
                    </Button>
                </div>
            </div>
        </motion.div>
    );
};

export default FeedbackForm;
