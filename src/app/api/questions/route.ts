import { questions } from '@/hooks/lib/questions';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const category = searchParams.get('category');
        const topic = searchParams.get('topic');
        const difficulty = searchParams.get('difficulty');

        // Filter based on query params if provided
        const filteredQuestions = questions.filter((q) => {
            // Handle category: if "all", include all categories; otherwise, match specific category
            const matchCategory = category && category !== 'all' ? q.category === category : true;
            // Handle topic: if "all", include all topics; otherwise, match specific topic
            const matchTopic = topic && topic !== 'all' ? q.topic === topic : true;
            // Handle difficulty: match specific difficulty if provided
            const matchDifficulty = difficulty ? q.difficulty === difficulty : true;
            return matchCategory && matchTopic && matchDifficulty;
        });

        // Shuffle and limit to 10 questions
        const shuffledQuestions = [...filteredQuestions]
            .sort(() => Math.random() - 0.5)
            .slice(0, Math.min(10, filteredQuestions.length));

        return NextResponse.json(shuffledQuestions);
    } catch (error) {
        console.error('Error fetching questions:', error);
        return NextResponse.json(
            { error: 'Failed to fetch questions' },
            { status: 500 }
        );
    }
}
