"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import GetOverallFeedbackButton from '@/components/get-over-all-feedback';
import GetStrongWeakFeedbackButton from '@/components/get-strong-weak-feedback';
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { motion } from "framer-motion";
import { Brain } from "lucide-react";
import { logout } from "@/hooks/lib/authFunctions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Category, Difficulty, QuantTopic, VerbalTopic } from "@/hooks/lib/questions";

interface StartScreenProps {
    onStart: (category: Category, topic: string, difficulty: Difficulty) => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
    const router = useRouter();

    // State management
    const [category, setCategory] = useState<Category | null>(null);
    const [topic, setTopic] = useState<string | null>(null);
    const [difficulty, setDifficulty] = useState<Difficulty | null>(null);

    const handleStart = () => {
        if (category && topic && difficulty) {
            onStart(category, topic, difficulty);
        } else {
            alert("Please select category, topic and difficulty before starting!");
        }
    };

    // Topic options based on selected category
    const getTopicOptions = () => {
        if (category === Category.Quant) {
            return Object.values(QuantTopic);
        }
        if (category === Category.Verbal) {
            return Object.values(VerbalTopic);
        }
        return [];
    };

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

                    {/* Category Selector */}
                    <Select onValueChange={(value) => {
                        setCategory(value as Category);
                        setTopic(null); // Reset topic when category changes
                    }}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.values(Category).map((cat) => (
                                <SelectItem key={cat} value={cat}>
                                    {cat}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Topic Selector */}
                    <Select
                        value={topic ?? undefined}
                        onValueChange={(value) => setTopic(value)}
                        disabled={!category}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Topic" />
                        </SelectTrigger>
                        <SelectContent>
                            {getTopicOptions().map((top) => (
                                <SelectItem key={top} value={top}>
                                    {top}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Difficulty Selector */}
                    <Select onValueChange={(value) => setDifficulty(value as Difficulty)}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Difficulty" />
                        </SelectTrigger>
                        <SelectContent>
                            {['easy', 'medium', 'hard'].map((level) => (
                                <SelectItem key={level} value={level}>
                                    {level}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Start Button */}
                    <Button onClick={handleStart} className="w-full">
                        Begin Challenge
                    </Button>

                    {/* Other Actions */}
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
    );
};

export default StartScreen;
