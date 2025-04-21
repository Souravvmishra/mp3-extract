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
            const matchCategory = category ? q.category === category : true;
            const matchTopic = topic ? q.topic === topic : true;
            const matchDifficulty = difficulty ? q.difficulty === difficulty : true;
            return matchCategory && matchTopic && matchDifficulty;
        });

        const shuffledQuestions = [...filteredQuestions]
            .sort(() => Math.random() - 0.5)
            .slice(0, 10);
        console.log(shuffledQuestions);

        return NextResponse.json(shuffledQuestions);
    } catch (error) {
        console.error('Error fetching questions:', error);
        return NextResponse.json(
            { error: 'Failed to fetch questions' },
            { status: 500 }
        );
    }
}
