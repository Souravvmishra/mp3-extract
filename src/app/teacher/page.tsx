"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
import {
    collection,
    query,
    where,
    getDocs,
    writeBatch,
    doc,
} from "firebase/firestore";
import { db } from "@/hooks/lib/firebaseConfig";
import { toast } from "@/hooks/use-toast";
import { TestResult } from "../student/quadrat/result/page";

// shadcn/ui components
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandItem,
} from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Download, LogOut, Search, Users } from "lucide-react";
import { logout } from "@/hooks/lib/authFunctions";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";

interface UserOption {
    uid: string;
    displayName: string;
    email?: string;
    photoURL?: string;
}

interface StudentStat {
    userId: string;
    username: string | null;
    email: string | null;
    photoURL?: string;
    numTests: number;
    averageScore: number;
    lastTestDate: string;
    lastTestTimestamp: number;
    scoreHistory: { date: string, score: number }[];
    progressTrend: number; // positive = improving, negative = declining
    topicBreakdown: Record<string, { score: number, count: number }>;
    categoryBreakdown: Record<string, { score: number, count: number }>;
    difficultyBreakdown: Record<string, { score: number, count: number }>;
}

const TeacherDashboard: React.FC = () => {
    const { user, role } = useAuth();
    const [studentIds, setStudentIds] = useState<string[]>([]);
    const [testResults, setTestResults] = useState<TestResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [studentStats, setStudentStats] = useState<StudentStat[]>([]);
    const [filteredStats, setFilteredStats] = useState<StudentStat[]>([]);

    // Modal state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [availableStudents, setAvailableStudents] = useState<UserOption[]>([]);
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [isAdding, setIsAdding] = useState(false);

    // Filter state
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState<"name" | "score" | "tests" | "recent">("recent");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
    const [selectedDates, setSelectedDates] = useState<{ from: Date | undefined; to: Date | undefined }>({
        from: undefined,
        to: undefined,
    });

    // Analytics state
    const [classAverage, setClassAverage] = useState(0);
    const [topPerformers, setTopPerformers] = useState<StudentStat[]>([]);
    const [needHelp, setNeedHelp] = useState<StudentStat[]>([]);
    const [mostActiveStudents, setMostActiveStudents] = useState<StudentStat[]>([]);
    const [classTrends, setClassTrends] = useState<{ date: string, average: number }[]>([]);
    const [topicBreakdown, setTopicBreakdown] = useState<{ name: string, value: number, color: string }[]>([]);
    const [categoryBreakdown, setCategoryBreakdown] = useState<{ name: string, value: number, color: string }[]>([]);
    const [difficultyBreakdown, setDifficultyBreakdown] = useState<{ name: string, value: number, color: string }[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<StudentStat | null>(null);

    // 1) Load existing student mappings
    useEffect(() => {
        if (!user?.uid) return;
        (async () => {
            try {
                const snap = await getDocs(
                    query(collection(db, "teacher_students"), where("teacherId", "==", user.uid))
                );
                setStudentIds(snap.docs.map((d) => d.data().studentId));
            } catch {
                toast({ title: "Error", description: "Could not load your students.", variant: "destructive" });
            }
        })();
    }, [user]);

    // 2) Load all user options (students) excluding already assigned
    useEffect(() => {
        if (!isAddModalOpen) return;
        (async () => {
            try {
                const snap = await getDocs(
                    query(collection(db, "userRoles"), where("role", "==", "student"))
                );
                const users: UserOption[] = snap.docs
                    .map((d) => ({
                        uid: d.id,
                        displayName: d.data().displayName || d.id,
                        email: d.data().email,
                        photoURL: d.data().photoURL,
                    }))
                    .filter((u) => !studentIds.includes(u.uid)); // exclude repeats
                setAvailableStudents(users);
            } catch {
                toast({ title: "Error", description: "Could not load student list.", variant: "destructive" });
            }
        })();
    }, [isAddModalOpen, studentIds]);

    // 3) Load test results
    useEffect(() => {
        if (studentIds.length === 0) {
            setLoading(false);
            return;
        }
        (async () => {
            try {
                const chunks: string[][] = [];
                for (let i = 0; i < studentIds.length; i += 10) chunks.push(studentIds.slice(i, i + 10));
                const all: TestResult[] = [];
                for (const chunk of chunks) {
                    const snap = await getDocs(
                        query(collection(db, "test_results"), where("userId", "in", chunk))
                    );
                    snap.docs.forEach((d) => all.push(d.data() as TestResult));
                }
                setTestResults(all);

                // Process the test stats
                computeStats(all);
            } catch {
                toast({ title: "Error", description: "Could not load test results.", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        })();
    }, [studentIds]);

    // 4) Assign selected students
    const handleAddStudents = async () => {
        if (selectedStudents.length === 0) {
            toast({ title: "Error", description: "Select at least one student.", variant: "destructive" });
            return;
        }
        setIsAdding(true);
        try {
            const batch = writeBatch(db);
            selectedStudents.forEach((sid) => {
                const ref = doc(collection(db, "teacher_students"));
                batch.set(ref, { teacherId: user!.uid, studentId: sid });
            });
            await batch.commit();
            setStudentIds((prev) => [...prev, ...selectedStudents]);
            toast({ title: "Success", description: "Students assigned." });
            setSelectedStudents([]);
            setIsAddModalOpen(false);
        } catch {
            toast({ title: "Error", description: "Failed to add students.", variant: "destructive" });
        } finally {
            setIsAdding(false);
        }
    };

    // Calculate statistics from test results
    const computeStats = (results: TestResult[]) => {
        const grouped = results.reduce<Record<string, TestResult[]>>((acc, r) => {
            acc[r.userId] ??= [];
            acc[r.userId].push(r);
            return acc;
        }, {});

        const stats: StudentStat[] = Object.entries(grouped).map(([uid, tests]) => {
            // Sort by date, newest first
            const sortedTests = [...tests].sort((a, b) =>
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );

            const numTests = tests.length;
            const totalScore = tests.reduce((s, t) => s + t.score, 0);
            const averageScore = numTests > 0 ? totalScore / numTests : 0;
            const lastTest = sortedTests[0];
            const lastTestDate = new Date(lastTest.timestamp);

            // Calculate score history
            const scoreHistory = sortedTests.reverse().map(test => ({
                date: new Date(test.timestamp).toLocaleDateString(),
                score: test.score
            }));

            // Calculate progress trend (last 5 tests)
            const recentTests = sortedTests.slice(0, Math.min(5, sortedTests.length)).reverse();
            let progressTrend = 0;
            if (recentTests.length > 1) {
                const firstScore = recentTests[0].score;
                const lastScore = recentTests[recentTests.length - 1].score;
                progressTrend = lastScore - firstScore;
            }

            // Topic breakdown
            const topicBreakdown: Record<string, { score: number, count: number }> = {};
            const categoryBreakdown: Record<string, { score: number, count: number }> = {};
            const difficultyBreakdown: Record<string, { score: number, count: number }> = {};

            tests.forEach(test => {
                if (test.metadata) {
                    // Process topic
                    const topic = test.metadata.topic || 'Unknown';
                    topicBreakdown[topic] = topicBreakdown[topic] || { score: 0, count: 0 };
                    topicBreakdown[topic].score += test.score;
                    topicBreakdown[topic].count += 1;

                    // Process category
                    const category = test.metadata.category || 'Unknown';
                    categoryBreakdown[category] = categoryBreakdown[category] || { score: 0, count: 0 };
                    categoryBreakdown[category].score += test.score;
                    categoryBreakdown[category].count += 1;

                    // Process difficulty
                    const difficulty = test.metadata.difficulty || 'Unknown';
                    difficultyBreakdown[difficulty] = difficultyBreakdown[difficulty] || { score: 0, count: 0 };
                    difficultyBreakdown[difficulty].score += test.score;
                    difficultyBreakdown[difficulty].count += 1;
                }
            });

            // Average out the scores in breakdowns
            Object.keys(topicBreakdown).forEach(key => {
                if (topicBreakdown[key].count > 0) {
                    topicBreakdown[key].score /= topicBreakdown[key].count;
                }
            });

            Object.keys(categoryBreakdown).forEach(key => {
                if (categoryBreakdown[key].count > 0) {
                    categoryBreakdown[key].score /= categoryBreakdown[key].count;
                }
            });

            Object.keys(difficultyBreakdown).forEach(key => {
                if (difficultyBreakdown[key].count > 0) {
                    difficultyBreakdown[key].score /= difficultyBreakdown[key].count;
                }
            });

            return {
                userId: uid,
                username: lastTest.username || uid.substring(0, 8),
                email: lastTest.email,
                photoURL: lastTest.deviceInfo?.platform === 'MacIntel' ? '/images/avatar1.png' : '/images/avatar2.png',
                numTests,
                averageScore,
                lastTestDate: lastTestDate.toLocaleDateString(),
                lastTestTimestamp: lastTestDate.getTime(),
                scoreHistory,
                progressTrend,
                topicBreakdown,
                categoryBreakdown,
                difficultyBreakdown
            };
        });

        setStudentStats(stats);
        setFilteredStats(stats);

        // Calculate class analytics
        const overallAvg = stats.reduce((sum, student) => sum + student.averageScore, 0) / (stats.length || 1);
        setClassAverage(parseFloat(overallAvg.toFixed(2)));

        // Get top performers
        const top = [...stats].sort((a, b) => b.averageScore - a.averageScore).slice(0, 5);
        setTopPerformers(top);

        // Get students who need help (low scores or negative trends)
        const struggling = [...stats]
            .filter(s => s.averageScore < 70 || s.progressTrend < -10)
            .sort((a, b) => a.averageScore - b.averageScore)
            .slice(0, 5);
        setNeedHelp(struggling);

        // Get most active students
        const active = [...stats].sort((a, b) => b.numTests - a.numTests).slice(0, 5);
        setMostActiveStudents(active);

        // Generate class trends (average score by date)
        const dateScores: Record<string, { total: number, count: number }> = {};
        results.forEach(result => {
            const date = new Date(result.timestamp).toLocaleDateString();
            if (!dateScores[date]) dateScores[date] = { total: 0, count: 0 };
            dateScores[date].total += result.score;
            dateScores[date].count += 1;
        });

        const trends = Object.entries(dateScores)
            .map(([date, data]) => ({
                date,
                average: parseFloat((data.total / data.count).toFixed(2))
            }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        setClassTrends(trends);

        // Generate topic/category/difficulty breakdowns
        const allTopics = new Set<string>();
        const allCategories = new Set<string>();
        const allDifficulties = new Set<string>();

        results.forEach(result => {
            if (result.metadata) {
                if (result.metadata.topic) allTopics.add(result.metadata.topic);
                if (result.metadata.category) allCategories.add(result.metadata.category);
                if (result.metadata.difficulty) allDifficulties.add(result.metadata.difficulty);
            }
        });

        // Calculate average scores by topic
        const topicScores: Record<string, { total: number, count: number }> = {};
        const categoryScores: Record<string, { total: number, count: number }> = {};
        const difficultyScores: Record<string, { total: number, count: number }> = {};

        results.forEach(result => {
            if (result.metadata) {
                const topic = result.metadata.topic || 'Unknown';
                if (!topicScores[topic]) topicScores[topic] = { total: 0, count: 0 };
                topicScores[topic].total += result.score;
                topicScores[topic].count += 1;

                const category = result.metadata.category || 'Unknown';
                if (!categoryScores[category]) categoryScores[category] = { total: 0, count: 0 };
                categoryScores[category].total += result.score;
                categoryScores[category].count += 1;

                const difficulty = result.metadata.difficulty || 'Unknown';
                if (!difficultyScores[difficulty]) difficultyScores[difficulty] = { total: 0, count: 0 };
                difficultyScores[difficulty].total += result.score;
                difficultyScores[difficulty].count += 1;
            }
        });

        // Convert to chart format with colors
        const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

        const topicChart = Object.entries(topicScores).map(([name, data], index) => ({
            name,
            value: parseFloat((data.total / data.count).toFixed(2)),
            color: colors[index % colors.length]
        }));
        setTopicBreakdown(topicChart);

        const categoryChart = Object.entries(categoryScores).map(([name, data], index) => ({
            name,
            value: parseFloat((data.total / data.count).toFixed(2)),
            color: colors[index % colors.length]
        }));
        setCategoryBreakdown(categoryChart);

        const difficultyChart = Object.entries(difficultyScores).map(([name, data], index) => ({
            name,
            value: parseFloat((data.total / data.count).toFixed(2)),
            color: colors[index % colors.length]
        }));
        setDifficultyBreakdown(difficultyChart);
    };

    // Apply filters
    useEffect(() => {
        let filtered = [...studentStats];

        // Search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(s =>
                (s.username && s.username.toLowerCase().includes(term)) ||
                (s.email && s.email.toLowerCase().includes(term))
            );
        }

        // Date filter
        if (selectedDates.from || selectedDates.to) {
            filtered = filtered.filter(s => {
                const testDate = new Date(s.lastTestDate).getTime();
                const fromCheck = selectedDates.from ? testDate >= selectedDates.from.getTime() : true;
                const toCheck = selectedDates.to ? testDate <= selectedDates.to.getTime() : true;
                return fromCheck && toCheck;
            });
        }

        // Apply sorting
        filtered.sort((a, b) => {
            switch (sortBy) {
                case "name":
                    return (a.username || "").localeCompare(b.username || "");
                case "score":
                    return a.averageScore - b.averageScore;
                case "tests":
                    return a.numTests - b.numTests;
                case "recent":
                default:
                    return a.lastTestTimestamp - b.lastTestTimestamp;
            }
        });

        // Apply sort direction
        if (sortDirection === "desc") {
            filtered.reverse();
        }

        setFilteredStats(filtered);
    }, [studentStats, searchTerm, sortBy, sortDirection, selectedDates]);

    // Export data to CSV
    const exportToCSV = () => {
        const headers = "Student Name,Email,Tests Taken,Average Score,Last Test Date\n";
        const rows = filteredStats.map(s =>
            `"${s.username || s.userId}","${s.email || ''}",${s.numTests},${s.averageScore.toFixed(2)},"${s.lastTestDate}"`
        ).join('\n');

        const csv = headers + rows;
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `student-performance-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();

        URL.revokeObjectURL(url);
        toast({ title: "Success", description: "CSV file downloaded." });
    };

    // View student details
    const viewStudentDetails = (student: StudentStat) => {
        setSelectedStudent(student);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="w-16 h-16 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                <p className="mt-4 text-lg">Loading dashboard data...</p>
            </div>
        );
    }

    if (role === "student") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
                <h2 className="text-2xl font-semibold text-red-600 mb-4">Access Denied</h2>
                <p>You do not have permission to view this page.</p>
                <Link href="/student/quadrat">
                    <Button variant="outline">Go to Dashboard</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-4 space-y-6">
            {/* Teacher Info */}
            <div className="p-4 bg-white rounded-xl shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                        {user?.photoURL ? (
                            <AvatarImage src={user.photoURL} alt={user.displayName || ""} />
                        ) : (
                            <AvatarFallback>{(user?.displayName || "T")[0]}</AvatarFallback>
                        )}
                    </Avatar>
                    <div>
                        <p className="text-sm text-gray-500">Logged in as</p>
                        <p className="font-medium text-gray-800">
                            {user?.displayName || user?.email}
                        </p>
                        {user?.displayName && (
                            <p className="text-sm text-gray-600">{user?.email}</p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={logout}
                        className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                    >
                        <LogOut className="mr-1 h-3 w-3" />
                        Log out
                    </Button>
                    <Button variant="outline" size="sm">
                        <Link href="/student/quadrat">Student Dashboard</Link>
                    </Button>
                </div>
            </div>

            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={exportToCSV}>
                        <Download className="mr-2 h-4 w-4" />
                        Export Data
                    </Button>
                    <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Users className="mr-2 h-4 w-4" />
                                Add Students
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Assign Students</DialogTitle>
                                <DialogDescription>Select students to assign</DialogDescription>
                            </DialogHeader>
                            <Command>
                                <CommandInput placeholder="Search students..." />
                                <CommandList>
                                    <CommandEmpty>No students found.</CommandEmpty>
                                    {availableStudents.map((u) => (
                                        <CommandItem
                                            key={u.uid}
                                            onSelect={() => {
                                                setSelectedStudents((prev) =>
                                                    prev.includes(u.uid)
                                                        ? prev.filter((id) => id !== u.uid)
                                                        : [...prev, u.uid]
                                                );
                                            }}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <Checkbox checked={selectedStudents.includes(u.uid)} />
                                                <Avatar>
                                                    {u.photoURL ? (
                                                        <AvatarImage src={u.photoURL} alt={u.displayName} />
                                                    ) : (
                                                        <AvatarFallback>{u.displayName.charAt(0)}</AvatarFallback>
                                                    )}
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span>{u.displayName}</span>
                                                    {u.email && (
                                                        <span className="text-xs text-gray-500">{u.email}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandList>
                            </Command>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="outline" disabled={isAdding}>
                                        Cancel
                                    </Button>
                                </DialogClose>
                                <Button onClick={handleAddStudents} disabled={isAdding}>
                                    {isAdding ? "Adding…" : "Assign"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid grid-cols-2 lg:grid-cols-4 mb-4">
                    <TabsTrigger value="overview">Class Overview</TabsTrigger>
                    <TabsTrigger value="students">Student List</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                    {selectedStudent && <TabsTrigger value="student-detail">Student Detail</TabsTrigger>}
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {/* Class Stats Card */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg">Class Stats</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Total Students</span>
                                        <span className="font-medium">{studentIds.length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Total Tests</span>
                                        <span className="font-medium">{testResults.length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Class Average</span>
                                        <span className="font-medium">{classAverage}%</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Tests This Week</span>
                                        <span className="font-medium">
                                            {testResults.filter(t => {
                                                const testDate = new Date(t.timestamp);
                                                const now = new Date();
                                                const weekAgo = new Date(now.setDate(now.getDate() - 7));
                                                return testDate >= weekAgo;
                                            }).length}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Top Performers Card */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg">Top Performers</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {topPerformers.slice(0, 3).map((student, i) => (
                                        <div key={student.userId + i} className="flex items-center gap-2">
                                            <span className="text-sm font-medium w-4">{i + 1}.</span>
                                            <Avatar className="h-6 w-6">
                                                {student.photoURL ? (
                                                    <AvatarImage src={student.photoURL} alt={student.username || ""} />
                                                ) : (
                                                    <AvatarFallback>{(student.username || "S")[0]}</AvatarFallback>
                                                )}
                                            </Avatar>
                                            <span className="text-sm truncate">{student.username}</span>
                                            <span className="ml-auto text-sm font-medium">{student.averageScore.toFixed(1)}%</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                            {/* <CardFooter className="pt-0">
                                <Button variant="ghost" size="sm" className="w-full text-xs" >
                                    View All
                                </Button>
                            </CardFooter> */}
                        </Card>

                        {/* Needs Improvement Card */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg">Needs Help</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {needHelp.slice(0, 3).map((student, i) => (
                                        <div key={student.userId + i} className="flex items-center gap-2">
                                            <Avatar className="h-6 w-6">
                                                {student.photoURL ? (
                                                    <AvatarImage src={student.photoURL} alt={student.username || ""} />
                                                ) : (
                                                    <AvatarFallback>{(student.username || "S")[0]}</AvatarFallback>
                                                )}
                                            </Avatar>
                                            <span className="text-sm truncate">{student.username}</span>
                                            <span className="ml-auto text-sm font-medium text-red-500">{student.averageScore.toFixed(1)}%</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                            {/* <CardFooter className="pt-0">
                                <Button variant="ghost" size="sm" className="w-full text-xs" >
                                    View All
                                </Button>
                            </CardFooter> */}
                        </Card>

                        {/* Recent Activity Card */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg">Most Active</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {mostActiveStudents.slice(0, 3).map((student, i) => (
                                        <div key={student.userId + i} className="flex items-center gap-2">
                                            <Avatar className="h-6 w-6">
                                                {student.photoURL ? (
                                                    <AvatarImage src={student.photoURL} alt={student.username || ""} />
                                                ) : (
                                                    <AvatarFallback>{(student.username || "S")[0]}</AvatarFallback>
                                                )}
                                            </Avatar>
                                            <span className="text-sm truncate">{student.username}</span>
                                            <span className="ml-auto text-sm font-medium">{student.numTests} tests</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                            {/* <CardFooter className="pt-0">
                                <Button variant="ghost" size="sm" className="w-full text-xs" >
                                    View All
                                </Button>
                            </CardFooter> */}
                        </Card>
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* Class Performance Trend */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Class Performance Trend</CardTitle>
                                <CardDescription>Average test scores over time</CardDescription>
                            </CardHeader>
                            <CardContent className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={classTrends}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis domain={[0, 100]} />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="average" stroke="#8884d8" name="Avg. Score" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Topic Performance */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Performance by Topic</CardTitle>
                                <CardDescription>Average scores across topics</CardDescription>
                            </CardHeader>
                            <CardContent className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={topicBreakdown}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis domain={[0, 100]} />
                                        <Tooltip />
                                        <Bar dataKey="value" name="Avg. Score">
                                            {topicBreakdown.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Tests */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Tests</CardTitle>
                            <CardDescription>Latest test submissions from students</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="py-2 px-3 text-left">Student</th>
                                            <th className="py-2 px-3 text-left">Date</th>
                                            <th className="py-2 px-3 text-left">Topic</th>
                                            <th className="py-2 px-3 text-left">Score</th>
                                            <th className="py-2 px-3 text-left">Time Spent</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {testResults
                                            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                                            .slice(0, 5)
                                            .map((test, i) => (
                                                <tr key={i} className="border-b hover:bg-gray-50">
                                                    <td className="py-2 px-3">{test.username || test.userId.substring(0, 8)}</td>
                                                    <td className="py-2 px-3">{new Date(test.timestamp).toLocaleDateString()}</td>
                                                    <td className="py-2 px-3">{test.metadata?.topic || "General"}</td>
                                                    <td className="py-2 px-3">
                                                        <span className={`font-medium ${test.score >= 70 ? "text-green-600" : "text-red-600"}`}>
                                                            {test.score}%
                                                        </span>
                                                    </td>
                                                    <td className="py-2 px-3">{Math.round(test.totalTime / 60)} min</td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Students Tab */}
                <TabsContent value="students">
                    <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
                        <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between mb-4">
                            <div className="flex gap-2 items-center">
                                <div className="relative flex-1 md:w-64">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Search students..."
                                        className="pl-8"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="flex items-center">
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {selectedDates.from ? (
                                                selectedDates.to ? (
                                                    <>
                                                        {format(selectedDates.from, "MMM d")} - {format(selectedDates.to, "MMM d")}
                                                    </>
                                                ) : (
                                                    format(selectedDates.from, "MMM d")
                                                )
                                            ) : (
                                                <span>Filter by date</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="range"
                                            selected={selectedDates}
                                            onSelect={(range) => setSelectedDates({ from: range?.from, to: range?.to || undefined })}
                                            initialFocus
                                        />
                                        <div className="flex justify-end p-2 border-t">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setSelectedDates({ from: undefined, to: undefined })}
                                            >
                                                Reset
                                            </Button>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="flex gap-2">
                                <div>
                                    <Select value={sortBy} onValueChange={(val: "name" | "score" | "tests" | "recent") => setSortBy(val)}>
                                        <SelectTrigger className="w-32">
                                            <SelectValue placeholder="Sort by" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="name">Name</SelectItem>
                                            <SelectItem value="score">Score</SelectItem>
                                            <SelectItem value="tests">Tests</SelectItem>
                                            <SelectItem value="recent">Recent</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Select value={sortDirection} onValueChange={(val: "asc" | "desc") => setSortDirection(val)}>
                                        <SelectTrigger className="w-24">
                                            <SelectValue placeholder="Order" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="asc">Asc</SelectItem>
                                            <SelectItem value="desc">Desc</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b bg-gray-50">
                                        <th className="py-2 px-4 text-left">Student</th>
                                        <th className="py-2 px-4 text-left">Tests</th>
                                        <th className="py-2 px-4 text-left">Avg. Score</th>
                                        <th className="py-2 px-4 text-left">Trend</th>
                                        <th className="py-2 px-4 text-left">Last Test</th>
                                        <th className="py-2 px-4 text-left">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStats.map((student) => (
                                        <tr key={student.userId} className="border-b hover:bg-gray-50">
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-8 w-8">
                                                        {student.photoURL ? (
                                                            <AvatarImage src={student.photoURL} alt={student.username || ""} />
                                                        ) : (
                                                            <AvatarFallback>{(student.username || "S")[0]}</AvatarFallback>
                                                        )}
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-medium">{student.username}</div>
                                                        {student.email && <div className="text-xs text-gray-500">{student.email}</div>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">{student.numTests}</td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <span className={`${student.averageScore >= 70 ? "text-green-600" : "text-red-600"} font-medium`}>
                                                        {student.averageScore.toFixed(1)}%
                                                    </span>
                                                    <Progress
                                                        value={student.averageScore}
                                                        className={`h-2 w-16 ${student.averageScore >= 80
                                                            ? "bg-green-500"
                                                            : student.averageScore >= 70
                                                                ? "bg-green-400"
                                                                : student.averageScore >= 60
                                                                    ? "bg-yellow-500"
                                                                    : "bg-red-500"
                                                            }`}
                                                    />
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`${student.progressTrend > 0 ? "text-green-600" : student.progressTrend < 0 ? "text-red-600" : "text-gray-500"}`}>
                                                    {student.progressTrend > 0 ? "↑" : student.progressTrend < 0 ? "↓" : "→"}
                                                    {Math.abs(student.progressTrend).toFixed(1)}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">{student.lastTestDate}</td>
                                            <td className="py-3 px-4">
                                                <Button variant="ghost" size="sm" onClick={() => viewStudentDetails(student)}>
                                                    Details
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </TabsContent>

                {/* Analytics Tab */}
                <TabsContent value="analytics">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* Performance by Topic */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Topic Performance</CardTitle>
                                <CardDescription>Average score by topic</CardDescription>
                            </CardHeader>
                            <CardContent className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={topicBreakdown}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis domain={[0, 100]} />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="value" name="Avg. Score">
                                            {topicBreakdown.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Performance by Category */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Category Performance</CardTitle>
                                <CardDescription>Average score by category</CardDescription>
                            </CardHeader>
                            <CardContent className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={categoryBreakdown}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={80}
                                            label
                                        >
                                            {categoryBreakdown.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => `${value}%`} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* Performance by Difficulty */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Difficulty Performance</CardTitle>
                                <CardDescription>Average score by difficulty level</CardDescription>
                            </CardHeader>
                            <CardContent className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={difficultyBreakdown}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis domain={[0, 100]} />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="value" name="Avg. Score">
                                            {difficultyBreakdown.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Class Performance Trend */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Performance Over Time</CardTitle>
                                <CardDescription>Class average by date</CardDescription>
                            </CardHeader>
                            <CardContent className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={classTrends}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis domain={[0, 100]} />
                                        <Tooltip />
                                        <Legend />
                                        <Line type="monotone" dataKey="average" stroke="#8884d8" name="Avg. Score" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Performance Rankings */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Student Rankings</CardTitle>
                            <CardDescription>Based on average test scores</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {[...studentStats]
                                    .sort((a, b) => b.averageScore - a.averageScore)
                                    .map((student, index) => (
                                        <div
                                            key={student.userId}
                                            className={`flex items-center p-3 rounded-lg border ${index < 3 ? "bg-amber-50 border-amber-200" : "bg-gray-50"
                                                }`}
                                        >
                                            <div className={`w-8 h-8 flex items-center justify-center rounded-full mr-3 font-medium ${index === 0 ? "bg-yellow-400 text-white" :
                                                index === 1 ? "bg-gray-300 text-gray-800" :
                                                    index === 2 ? "bg-amber-700 text-white" :
                                                        "bg-gray-200 text-gray-700"
                                                }`}>
                                                {index + 1}
                                            </div>
                                            <Avatar className="h-10 w-10 mr-3">
                                                {student.photoURL ? (
                                                    <AvatarImage src={student.photoURL} alt={student.username || ""} />
                                                ) : (
                                                    <AvatarFallback>{(student.username || "S")[0]}</AvatarFallback>
                                                )}
                                            </Avatar>
                                            <div className="flex-1">
                                                <div className="font-medium truncate">{student.username}</div>
                                                <div className="text-xs text-gray-500">{student.numTests} tests taken</div>
                                            </div>
                                            <div className="text-lg font-semibold">
                                                {student.averageScore.toFixed(1)}%
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Student Detail Tab */}
                {selectedStudent && (
                    <TabsContent value="student-detail">
                        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
                            <div className="flex flex-col md:flex-row gap-6 items-start">
                                <div className="flex flex-col items-center">
                                    <Avatar className="h-20 w-20 mb-2">
                                        {selectedStudent.photoURL ? (
                                            <AvatarImage src={selectedStudent.photoURL} alt={selectedStudent.username || ""} />
                                        ) : (
                                            <AvatarFallback className="text-2xl">{(selectedStudent.username || "S")[0]}</AvatarFallback>
                                        )}
                                    </Avatar>
                                    <h2 className="text-xl font-bold">{selectedStudent.username}</h2>
                                    {selectedStudent.email && <p className="text-gray-500">{selectedStudent.email}</p>}
                                </div>

                                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <div className="text-sm text-gray-500">Tests Taken</div>
                                        <div className="text-2xl font-bold">{selectedStudent.numTests}</div>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <div className="text-sm text-gray-500">Average Score</div>
                                        <div className={`text-2xl font-bold ${selectedStudent.averageScore >= 70 ? "text-green-600" : "text-red-600"
                                            }`}>
                                            {selectedStudent.averageScore.toFixed(1)}%
                                        </div>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <div className="text-sm text-gray-500">Progress Trend</div>
                                        <div className={`text-2xl font-bold flex items-center ${selectedStudent.progressTrend > 0 ? "text-green-600" :
                                            selectedStudent.progressTrend < 0 ? "text-red-600" :
                                                "text-gray-600"
                                            }`}>
                                            {selectedStudent.progressTrend > 0 ? "↑" :
                                                selectedStudent.progressTrend < 0 ? "↓" : "→"}
                                            {Math.abs(selectedStudent.progressTrend).toFixed(1)}
                                        </div>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <div className="text-sm text-gray-500">Last Test</div>
                                        <div className="text-lg font-bold">{selectedStudent.lastTestDate}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            {/* Performance Trend Chart */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Performance History</CardTitle>
                                    <CardDescription>Test scores over time</CardDescription>
                                </CardHeader>
                                <CardContent className="h-72">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={selectedStudent.scoreHistory}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" />
                                            <YAxis domain={[0, 100]} />
                                            <Tooltip />
                                            <Legend />
                                            <Line type="monotone" dataKey="score" stroke="#8884d8" name="Score" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            {/* Topic Performance */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Topic Strengths</CardTitle>
                                    <CardDescription>Performance by subject area</CardDescription>
                                </CardHeader>
                                <CardContent className="h-72">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={Object.entries(selectedStudent.topicBreakdown).map(([name, data]) => ({
                                                name,
                                                score: data.score
                                            }))}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis domain={[0, 100]} />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="score" fill="#8884d8" name="Avg. Score" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Test History */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Test History</CardTitle>
                                <CardDescription>All tests taken by this student</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="py-2 px-3 text-left">Date</th>
                                                <th className="py-2 px-3 text-left">Topic</th>
                                                <th className="py-2 px-3 text-left">Category</th>
                                                <th className="py-2 px-3 text-left">Difficulty</th>
                                                <th className="py-2 px-3 text-left">Score</th>
                                                <th className="py-2 px-3 text-left">Time</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {testResults
                                                .filter(test => test.userId === selectedStudent.userId)
                                                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                                                .map((test, i) => (
                                                    <tr key={i} className="border-b hover:bg-gray-50">
                                                        <td className="py-2 px-3">{new Date(test.timestamp).toLocaleDateString()}</td>
                                                        <td className="py-2 px-3">{test.metadata?.topic || "General"}</td>
                                                        <td className="py-2 px-3">{test.metadata?.category || "N/A"}</td>
                                                        <td className="py-2 px-3">{test.metadata?.difficulty || "N/A"}</td>
                                                        <td className="py-2 px-3">
                                                            <span className={`font-medium ${test.score >= 70 ? "text-green-600" : "text-red-600"}`}>
                                                                {test.score}%
                                                            </span>
                                                        </td>
                                                        <td className="py-2 px-3">{Math.round(test.totalTime / 60)} min</td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
};

export default TeacherDashboard;
