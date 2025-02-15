"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/lib/firebaseConfig';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { useAuth } from '@/providers/AuthProvider';
import { Loader, Trophy, Clock, Brain, TrendingUp, ChevronDown, ChevronUp, Monitor, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Legend
} from 'recharts';
import { useRouter } from 'next/navigation';
import GenerateFeedbackButton from '@/components/feedback-btn';

export interface Response {
    question: string;
    correct_answer: string;
    user_answer: string;
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

const ResultsHistory: React.FC = () => {
    const { user } = useAuth();
    const [results, setResults] = useState<TestResult[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [selectedResult, setSelectedResult] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchResults = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const q = query(
                    collection(db, 'test_results'),
                    where('userId', '==', user.uid),
                    orderBy('timestamp', 'desc')
                );
                const querySnapshot = await getDocs(q);
                const data: TestResult[] = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...(doc.data() as Omit<TestResult, 'id'>),
                }));
                setResults(data);
            } catch (error) {
                console.error('Error fetching test results:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [user]);

    const calculateStats = () => {
        if (results.length === 0) return null;

        const totalTests = results.length;
        const averageScore = results.reduce((acc, curr) => acc + (curr.score / curr.totalQuestions) * 100, 0) / totalTests;
        const bestScore = Math.max(...results.map(r => (r.score / r.totalQuestions) * 100));
        const averageTime = results.reduce((acc, curr) => acc + curr.averageTimePerQuestion, 0) / totalTests;

        return { totalTests, averageScore, bestScore, averageTime };
    };

    const prepareGraphData = () => {
        return results.map((result, index) => ({
            id: index,
            date: new Date(result.timestamp).toLocaleDateString(),
            scorePercentage: (result.score / result.totalQuestions) * 100,
            averageTime: result.averageTimePerQuestion,
            totalTime: result.totalTime
        })).reverse();
    };

    const stats = calculateStats();
    const graphData = prepareGraphData();

    if (!user) {
        return (
            <Card className="w-full max-w-md mx-auto my-6">
                <CardContent className="p-6">
                    <div className="text-center space-y-4">
                        <Brain className="w-12 h-12 mx-auto text-gray-400" />
                        <h3 className="text-lg font-semibold">Sign In Required</h3>
                        <p className="text-gray-600">Please log in to view your test history and track your progress.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <Loader className="w-8 h-8 animate-spin text-green-600" />
            </div>
        );
    }

    return (
        <div className="w-full max-w-6xl mx-auto my-6 space-y-6 p-4">
            <CardHeader className="px-0 flex flex-row gap-4 items-center">
                <Button variant={'outline'} size={'icon'} onClick={() => router.back()}>
                    <ArrowLeft className='w-4 h-4 ' />
                </Button>
                <CardTitle className="text-2xl font-bold">Your Learning Journey</CardTitle>
            </CardHeader>

            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="bg-white">
                        <CardContent className="p-4 text-center">
                            <Trophy className="w-8 h-8 mx-auto text-yellow-500 mb-2" />
                            <p className="text-sm text-gray-600">Tests Completed</p>
                            <p className="text-2xl font-bold">{stats.totalTests}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-white">
                        <CardContent className="p-4 text-center">
                            <Brain className="w-8 h-8 mx-auto text-blue-500 mb-2" />
                            <p className="text-sm text-gray-600">Average Score</p>
                            <p className="text-2xl font-bold">{stats.averageScore.toFixed(1)}%</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-white">
                        <CardContent className="p-4 text-center">
                            <TrendingUp className="w-8 h-8 mx-auto text-green-500 mb-2" />
                            <p className="text-sm text-gray-600">Best Score</p>
                            <p className="text-2xl font-bold">{stats.bestScore.toFixed(1)}%</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-white">
                        <CardContent className="p-4 text-center">
                            <Clock className="w-8 h-8 mx-auto text-purple-500 mb-2" />
                            <p className="text-sm text-gray-600">Avg Time/Question</p>
                            <p className="text-2xl font-bold">{stats.averageTime.toFixed(1)}s</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            <Card className="bg-white">
                <CardContent className="p-6">
                    <Tabs defaultValue="progress" className="space-y-4">
                        <TabsList>
                            <TabsTrigger value="progress">Progress Over Time</TabsTrigger>
                            <TabsTrigger value="time">Time Analysis</TabsTrigger>
                        </TabsList>

                        <TabsContent value="progress" className="space-y-4">
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={graphData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis domain={[0, 100]} />
                                        <Tooltip />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="scorePercentage"
                                            name="Score %"
                                            stroke="#22c55e"
                                            strokeWidth={2}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </TabsContent>

                        <TabsContent value="time" className="space-y-4">
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={graphData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="averageTime" name="Avg Time (s)" fill="#8b5cf6" />
                                        <Bar dataKey="totalTime" name="Total Time (s)" fill="#3b82f6" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            <Card className="bg-white">
                <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Detailed History</h3>
                    {results.length === 0 ? (
                        <div className="text-center py-8">
                            <Brain className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                            <p className="text-gray-600">No test results yet. Take your first test to start tracking your progress!</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {results.map((result) => (
                                <div key={result.timestamp} className="border rounded-lg p-3">
                                    <Button
                                        variant="ghost"
                                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
                                        onClick={() => setSelectedResult(selectedResult === result.timestamp ? null : result.timestamp)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="text-left">
                                                <p className="font-medium">
                                                    {new Date(result.timestamp).toLocaleDateString()} at {new Date(result.timestamp).toLocaleTimeString()}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    Score: {((result.score / result.totalQuestions) * 100).toFixed(1)}%
                                                </p>
                                            </div>
                                        </div>
                                        {selectedResult === result.timestamp ? (
                                            <ChevronUp className="w-5 h-5" />
                                        ) : (
                                            <ChevronDown className="w-5 h-5" />
                                        )}
                                    </Button>

                                    {selectedResult === result.timestamp && (
                                        <div className="p-4 border-t bg-gray-50">
                                            <div className="space-y-4">
                                                <div>
                                                    <p className="text-sm text-gray-600 mb-2">Score Progress</p>
                                                    <Progress
                                                        value={(result.score / result.totalQuestions) * 100}
                                                        className="h-2"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                    <div>
                                                        <p className="text-gray-600">Total Questions</p>
                                                        <p className="font-medium">{result.totalQuestions}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-600">Correct Answers</p>
                                                        <p className="font-medium">{result.score}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-600">Total Time</p>
                                                        <p className="font-medium">{result.totalTime}s</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-600">Avg Time/Question</p>
                                                        <p className="font-medium">{result.averageTimePerQuestion.toFixed(1)}s</p>
                                                    </div>
                                                </div>
                                                <div className="mt-4">
                                                    <p className="text-sm font-medium mb-2">Device Information</p>
                                                    <div className="flex items-center justify-between gap-2 text-sm text-gray-600">
                                                        <div>
                                                            <Monitor className="w-4 h-4" />
                                                            <span>{result.deviceInfo.platform} - {result.deviceInfo.language}</span>
                                                        </div>
                                                        <GenerateFeedbackButton data={JSON.stringify(result)} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default ResultsHistory;
