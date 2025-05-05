"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Brain, ChevronRight, BarChart3, BookOpen, LogOut, FileQuestion } from "lucide-react";

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Separator } from "./ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

// Custom Components
import GetOverallFeedbackButton from '@/components/get-over-all-feedback';
import GetStrongWeakFeedbackButton from '@/components/get-strong-weak-feedback';

// Utilities
import { logout } from "@/hooks/lib/authFunctions";
import { Difficulty, QuantTopic, VerbalTopic } from "@/hooks/lib/questions";
import { useAuth } from "@/providers/AuthProvider";

interface StartScreenProps {
    onStart: (category: string, topic: string, difficulty: Difficulty) => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
    const router = useRouter();
    const { role } = useAuth();
    // State management
    const [activeTab, setActiveTab] = useState("challenge");
    const [category, setCategory] = useState<string | null>(null);
    const [topic, setTopic] = useState<string | null>(null);
    const [difficulty, setDifficulty] = useState<Difficulty | null>(null);

    // Topic options based on selected category
    const getTopicOptions = () => {
        if (category === "all") {
            return [{ value: "all", label: "All Topics" }];
        } else if (category === "Quant") {
            return [
                { value: "all", label: "All Quant Topics" },
                ...Object.values(QuantTopic).map((t) => ({ value: t, label: t })),
            ];
        } else if (category === "Verbal") {
            return [
                { value: "all", label: "All Verbal Topics" },
                ...Object.values(VerbalTopic).map((t) => ({ value: t, label: t })),
            ];
        }
        return [];
    };

    // Handle category change
    const handleCategoryChange = (value: string) => {
        setCategory(value);
        if (value === "all") {
            setTopic("all"); // Automatically set topic to "all" for mixed categories
        } else {
            setTopic(null); // Reset topic for specific category selection
        }
    };

    // Handle start button click
    const handleStart = () => {
        if (category && topic && difficulty) {
            onStart(category, topic, difficulty);
        } else {
            // Check which fields are missing
            if (!category) {
                alert("Please select a category before starting!");
            } else if (!topic) {
                alert("Please select a topic before starting!");
            } else if (!difficulty) {
                alert("Please select a difficulty level before starting!");
            }
        }
    };

    // Check if ready to start
    const isReadyToStart = category && topic && difficulty;

    return (
        <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen flex items-center justify-center p-4 bg-neutral-90 dark:bg-neutral-900"
        >
            <Card className="w-full max-w-lg shadow-lg">
                <CardHeader className="space-y-1 text-center pb-2">
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="flex justify-center mb-2"
                    >
                        <div className="p-3 rounded-full bg-primary/10 text-primary">
                            <Brain className="w-8 h-8" />
                        </div>
                    </motion.div>
                    <CardTitle className="text-2xl font-bold">Quadrat</CardTitle>
                    <CardDescription className="text-neutral-900">Challenge yourself or browse resources</CardDescription>
                </CardHeader>

                <Tabs defaultValue="challenge" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="px-6">
                        <TabsList className="grid grid-cols-2 w-full mb-4">
                            <TabsTrigger value="challenge">Challenge</TabsTrigger>
                            <TabsTrigger value="resources">Resources</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="challenge" className="mt-0">
                        <CardContent className="space-y-4 pt-2">
                            <div className="bg-primary/5 p-3 rounded-lg mb-4 text-center">
                                <p className="text-sm font-medium">Quick Knowledge Challenge</p>
                                <p className="text-xs text-neutral-900">10 questions • 30 seconds each</p>
                            </div>

                            <div className="space-y-3">
                                <Select onValueChange={handleCategoryChange}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Quant">Quant</SelectItem>
                                        <SelectItem value="Verbal">Verbal</SelectItem>
                                        <SelectItem value="all">All Categories</SelectItem>
                                    </SelectContent>
                                </Select>

                                {category && category !== "all" && (
                                    <Select
                                        value={topic ?? undefined}
                                        onValueChange={(value) => setTopic(value)}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select Topic" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {getTopicOptions().map((top) => (
                                                <SelectItem key={top.value} value={top.value}>
                                                    {top.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}

                                <Select onValueChange={(value) => setDifficulty(value as Difficulty)}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select Difficulty" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="easy">Easy</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="hard">Hard</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button
                                onClick={handleStart}
                                className="w-full"
                                disabled={!isReadyToStart}
                            >
                                {isReadyToStart ? "Begin Challenge" : "Complete Selections Above"}
                                <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        </CardContent>
                    </TabsContent>

                    <TabsContent value="resources" className="mt-0">
                        <CardContent className="space-y-3 pt-2">
                            <Link href="/student/flash-cards" className="block">
                                <Button variant="outline" className="w-full flex justify-between items-center">
                                    <div className="flex items-center">
                                        <BookOpen className="mr-2 h-4 w-4" />
                                        <span>View Flash Cards</span>
                                    </div>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </Link>

                            <a href="https://ak0601-doubt-solver.hf.space/" target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" className="w-full flex justify-between items-center">
                                    <div className="flex items-center">
                                        <FileQuestion className="mr-2 h-4 w-4" />
                                        <span>Doubt Solver</span>
                                    </div>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </a>

                            <Button
                                variant="outline"
                                onClick={() => router.push('/student/quadrat/result')}
                                className="w-full flex justify-between items-center"
                            >
                                <div className="flex items-center">
                                    <BarChart3 className="mr-2 h-4 w-4" />
                                    <span>View Reports</span>
                                </div>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </CardContent>
                    </TabsContent>
                </Tabs>

                <CardFooter className="flex flex-col space-y-3 pt-0">
                    <Separator className="my-2" />

                    <div className="grid grid-cols-2 gap-2 w-full">
                        <GetOverallFeedbackButton />
                        <GetStrongWeakFeedbackButton />
                    </div>

                    <Button variant="destructive" onClick={logout} className="w-full flex items-center justify-center">
                        <LogOut className="mr-2 h-4 w-4" />
                        Log out
                    </Button>
                    {role === 'teacher' && <Button variant="outline" className="w-full flex items-center justify-center">
                        <Link href="/teacher">
                            Go to Teacher Dashboard
                        </Link>
                    </Button>}
            </CardFooter>
        </Card>
        </motion.div >
    );
};

export default StartScreen;
