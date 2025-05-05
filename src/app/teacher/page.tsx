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
import { LogOut } from "lucide-react";
import { logout } from "@/hooks/lib/authFunctions";

interface UserOption {
    uid: string;
    displayName: string;
    email?: string;
    photoURL?: string;
}

const TeacherDashboard: React.FC = () => {
    const { user, role } = useAuth();
    const [studentIds, setStudentIds] = useState<string[]>([]);
    const [testResults, setTestResults] = useState<TestResult[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [availableStudents, setAvailableStudents] = useState<UserOption[]>([]);
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [isAdding, setIsAdding] = useState(false);

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

    if (loading) return <div className="p-4">Loading...</div>;
    if (role === "student")
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
                <h2 className="text-2xl font-semibold text-red-600 mb-4">Access Denied</h2>
                <p>You do not have permission to view this page.</p>
                <Link href="/student/quadrat">
                    <Button variant="outline">Go to Dashboard</Button>
                </Link>
            </div>
        );

    // Compute stats
    const grouped = testResults.reduce<Record<string, TestResult[]>>((acc, r) => {
        acc[r.userId] ??= [];
        acc[r.userId].push(r);
        return acc;
    }, {});
    const studentStats = Object.entries(grouped).map(([uid, tests]) => {
        const numTests = tests.length;
        const avg = (tests.reduce((s, t) => s + t.score, 0) / numTests).toFixed(2);
        const last = new Date(Math.max(...tests.map((t) => new Date(t.timestamp).getTime())));
        return {
            userId: uid,
            username: tests[0].username || null,
            numTests,
            averageScore: avg,
            lastTestDate: last.toLocaleDateString(),
        };
    });


    return (
        <div className="max-w-4xl mx-auto p-4 space-y-6">
            {/* Teacher Info */}
            <div className="p-4 bg-white rounded-xl shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500">Logged in as</p>
                    <p className="font-medium text-gray-800">
                        {user?.displayName || user?.email}
                    </p>
                    {user?.displayName && (
                        <p className="text-sm text-gray-600">{user?.email}</p>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={logout}
                        className="ml-4 text-xs text-red-600 border-red-200 hover:bg-red-50 "
                    >
                        <LogOut className="mr-1 h-3 w-3" />
                        Log out
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                    >
                        <Link href="/student/quadrat">
                            Student Dashboard
                        </Link>
                    </Button>
                </div>
            </div>


            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
                <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                    <DialogTrigger asChild>
                        <Button>Add Students</Button>
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
                                                prev.includes(u.uid) ? prev.filter((id) => id !== u.uid) : [...prev, u.uid]
                                            );
                                        }}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <Checkbox checked={selectedStudents.includes(u.uid)} />
                                            <Avatar>
                                                {u.photoURL ? <AvatarImage src={u.photoURL} alt={u.displayName} /> : <AvatarFallback>{u.displayName.charAt(0)}</AvatarFallback>}
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span>{u.displayName}</span>
                                                {u.email && <span className="text-xs text-gray-500">{u.email}</span>}
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

            {/* Stats Overview */}
            <div className="space-y-1">
                <p>
                    <strong>Total Students:</strong> {studentIds.length}
                </p>
                <p>
                    <strong>Total Tests:</strong> {testResults.length}
                </p>
            </div>

            {/* Student Stats Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-2 text-left">Student</th>
                            <th className="p-2 text-left"># Tests</th>
                            <th className="p-2 text-left">Avg Score</th>
                            <th className="p-2 text-left">Last Test</th>
                        </tr>
                    </thead>
                    <tbody>
                        {studentStats.map((s) => (
                            <tr key={s.userId} className="hover:bg-gray-50">
                                <td className="p-2">{s.username || s.userId}</td>
                                <td className="p-2">{s.numTests}</td>
                                <td className="p-2">{s.averageScore}</td>
                                <td className="p-2">{s.lastTestDate}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TeacherDashboard;
