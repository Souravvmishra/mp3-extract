import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface GenerateFeedbackRequest {
    testData: string;
}

interface GenerateFeedbackResponse {
    feedback: string;
}

export async function POST(req: Request) {
    try {
        const { testData } = (await req.json()) as GenerateFeedbackRequest;

        const prompt = `
You are an experienced tutor analyzing a student's test responses to provide constructive feedback. Your task is to:
- Identify Strengths: Highlight areas where the student performed well.
- Identify Weaknesses: Point out areas where the student struggled.
- Provide Actionable Suggestions: Offer advice for improvement.
- Encourage and Motivate: End with positive reinforcement.
Test Data: ${testData}
    `;

        // Initialize the GoogleGenerativeAI instance (let's get ready to rock this!)
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Generate feedback content using our animated prompt!
        const result = await model.generateContent([prompt]);
        const feedback = result.response.text().trim();

        return NextResponse.json<GenerateFeedbackResponse>({ feedback });
    } catch (error) {
        console.error("Error generating feedback:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
