import { questions } from '../../../hooks/lib/questions';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // Replicate Python's random.sample logic
        const shuffledQuestions = [...questions]
            .sort(() => Math.random() - 0.5)
            .slice(0, 10);

        return NextResponse.json(shuffledQuestions);
    } catch (error) {
        console.error('Error fetching questions:', error);
        return NextResponse.json(
            { error: 'Failed to fetch questions' },
            { status: 500 }
        );
    }
}
