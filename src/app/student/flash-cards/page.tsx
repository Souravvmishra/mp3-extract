"use client"

import { useState, useEffect, JSX } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    ChevronRight,
    ChevronLeft,
    RotateCw,
    LucideFlipHorizontal,
    ArrowLeft
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import ReactMarkdown from 'react-markdown';

// Flashcard types
interface Flashcard {
    Front: string;
    Back: string;
}

type ApiResponse = Flashcard[] | { message: string };

// Component state
interface FlashcardState {
    isFlipped: boolean;
    currentIndex: number;
    animating: boolean;
    flashcards: Flashcard[];
    loading: boolean;
    error: string | null;
}

export default function Flashcards(): JSX.Element {
    const [state, setState] = useState<FlashcardState>({
        isFlipped: false,
        currentIndex: 0,
        animating: false,
        flashcards: [],
        loading: true,
        error: null
    });

    const { isFlipped, currentIndex, animating, flashcards, loading, error } = state;
    const router = useRouter();
    const { user } = useAuth();
    const userEmail = user?.email ?? '';

    // Fetch flashcards from API
    const fetchFlashcards = async (): Promise<void> => {
        setState(prev => ({ ...prev, loading: true, error: null, flashcards: [] }));
        try {
            const response = await fetch(
                `https://ak0601-feedback-api.hf.space/generate_flashcards?email=${encodeURIComponent(
                    userEmail
                )}`,
                {
                    method: 'POST',
                    headers: { Accept: 'application/json' }
                }
            );

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data: ApiResponse = await response.json();

            if ('message' in data) {
                // API returned an error message
                setState(prev => ({ ...prev, error: data.message, loading: false }));
            } else {
                // Successful data
                setState(prev => ({ ...prev, flashcards: data, loading: false }));
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setState(prev => ({
                ...prev,
                error: errorMessage,
                flashcards: [
                    { Front: "Probability is expressed as a number between what two values?", Back: "0 and 1" },
                    { Front: "What\'s the area of a triangle with a base of 'b' and a height of 'h'?", Back: "(1/2) * b * h" },
                    { Front: "In the equation y = mx + b, what does 'm' represent?", Back: "Slope" },
                    { Front: "SOH CAH TOA defines ratios in what type of triangle?", Back: "Right triangle" },
                    { Front: "What symbol denotes the intersection of two sets?", Back: "∩" }
                ],
                loading: false
            }));
        }
    };

    // Navigation handlers
    const handleFlip = (): void => {
        setState(prev => ({ ...prev, animating: true, isFlipped: !prev.isFlipped }));
    };

    const handleNext = (): void => {
        if (currentIndex < flashcards.length - 1) {
            setState(prev => ({ ...prev, animating: true, isFlipped: false }));
            setTimeout(() => {
                setState(prev => ({ ...prev, currentIndex: prev.currentIndex + 1 }));
            }, 150);
        }
    };

    const handlePrev = (): void => {
        if (currentIndex > 0) {
            setState(prev => ({ ...prev, animating: true, isFlipped: false }));
            setTimeout(() => {
                setState(prev => ({ ...prev, currentIndex: prev.currentIndex - 1 }));
            }, 150);
        }
    };

    // End animations after flip or change
    useEffect(() => {
        const timer = setTimeout(() => {
            setState(prev => ({ ...prev, animating: false }));
        }, 300);
        return () => clearTimeout(timer);
    }, [isFlipped, currentIndex]);

    // Keyboard navigation and initial fetch
    useEffect(() => {
        fetchFlashcards();

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === ' ' || e.key === 'Enter') handleFlip();
            else if (e.key === 'ArrowRight' || e.key === 'n') handleNext();
            else if (e.key === 'ArrowLeft' || e.key === 'p') handlePrev();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 w-full">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-4" />
                <p className="text-gray-600">Loading flashcards...</p>
            </div>
        );
    }

    const current = flashcards[currentIndex];

    return (
        <div className="w-full max-w-md mx-auto p-4">
            <CardHeader className="px-0 flex  gap-4">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <CardTitle className="text-2xl font-bold">Study Flashcards</CardTitle>
            </CardHeader>

            <div className="flex justify-between  mb-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchFlashcards}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                >
                    <RotateCw size={14} /> Refresh
                </Button>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 border border-red-200 flex items-center gap-2">
                    <span className="font-medium"></span> {error}
                </div>
            )}

            {flashcards.length > 0 ? (
                <>
                    <div className="h-1 w-full bg-gray-200 rounded-full mb-4">
                        <div
                            className="h-1 bg-blue-500 rounded-full transition-all duration-300"
                            style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
                        />
                    </div>

                    <div className="relative w-full h-64 perspective">
                        <Card
                            className={`w-full h-full absolute shadow-lg transition-all duration-300 ${animating ? 'pointer-events-none' : 'hover:shadow-xl'} border-2 ${isFlipped ? 'border-blue-400' : 'border-gray-200'
                                }`}
                            style={{
                                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                                transformStyle: 'preserve-3d'
                            }}
                            onClick={handleFlip}
                        >
                            {/* Front */}
                            <div
                                className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-white rounded-lg"
                                style={{ backfaceVisibility: 'hidden' }}
                            >
                                <ReactMarkdown className="text-lg font-medium text-center mb-4">{current.Front}</ReactMarkdown>
                                <div className="text-blue-500 text-sm flex items-center gap-1 mt-auto">
                                    <LucideFlipHorizontal size={16} /> Tap to flip card
                                </div>
                            </div>

                            {/* Back */}
                            <div
                                className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-blue-50 rounded-lg"
                                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                            >
                                <ReactMarkdown className="text-lg text-center mb-4">{current.Back}</ReactMarkdown>
                                <div className="text-blue-500 text-sm flex items-center gap-1 mt-auto">
                                    <LucideFlipHorizontal size={16} /> Tap to flip back
                                </div>
                            </div>
                        </Card>
                    </div>

                    <div className="flex items-center justify-between mt-6">
                        <Button
                            variant="outline"
                            onClick={handlePrev}
                            disabled={currentIndex === 0}
                            className={`flex items-center gap-1 ${currentIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                        >
                            <ChevronLeft size={16} /> Previous
                        </Button>

                        <div className="text-sm bg-gray-100 px-3 py-1 rounded-full">
                            Card {currentIndex + 1} of {flashcards.length}
                        </div>

                        <Button
                            variant="outline"
                            onClick={handleNext}
                            disabled={currentIndex === flashcards.length - 1}
                            className={`flex items-center gap-1 ${currentIndex === flashcards.length - 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'
                                }`}
                        >
                            Next <ChevronRight size={16} />
                        </Button>
                    </div>
                </>
            ) : (
                <div className="p-6 bg-gray-50 text-gray-600 rounded-lg text-center">
                    <div className="mb-2 text-lg">No flashcards available</div>
                    <Button onClick={fetchFlashcards} className="mt-2">
                        Try again
                    </Button>
                </div>
            )}
        </div>
    );
}
