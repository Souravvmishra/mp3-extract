import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the API key and services
const apiKey = process.env.GEMINI_API_KEY || "";
if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in the environment variables.");
}

const genAI = new GoogleGenerativeAI(apiKey);

// Define the generative model
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro",
    systemInstruction: `
        You are the social media expert of a Fortune 50 company. Your task is to find clips from the given audio that can be used as marketing reels. 
        You will be given an MP3 file and must return the timestamps ("from" and "up to") that can be used as marketing material. 
        The clips should be interesting enough to grab people's attention. Focus on quality over quantity.
        Return only the timestamps with reasons for selection. Provide nothing extra. The response should be proper markdown separted by new lines - very important!
    `,
});

const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
    responseMimeType: "text/plain",
};

// API handler
export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided." }, { status: 400 });
        }

        // Convert the File to a base64 string
        const buffer = Buffer.from(await file.arrayBuffer());
        const base64AudioFile = buffer.toString("base64");

        const chatSession = model.startChat({
            generationConfig,
            history: [
                {
                    role: "user",
                    parts: [
                        {
                            text: `
                                You are the social media expert of a Fortune 50 company. Your task is to find clips from the given audio that can be used as marketing reels.
                                You will be given an MP3 file and must return the timestamps ("from" and "up to") that can be used as marketing material. 
                                Focus on quality over quantity. Provide timestamps only with reasons. No extra details.\n The response should be proper markdown separted by new lines - very important!
                            `,
                        },
                    ],
                },
                {
                    role: "model",
                    parts: [
                        {
                            text: `
                                Understood. Please provide the MP3 file. I will analyze it and return the timestamps for the most interesting clips suitable for marketing reels. 
                                Focus will be on quality over quantity, providing only the timestamps with reasons.\n The response should be proper markdown separted by new lines - very important!
                            `,
                        },
                    ],
                },
                {
                    role: "user",
                    parts: [
                        {
                            inlineData: {
                                mimeType: "audio/mp3",
                                data: base64AudioFile,
                            },
                        },
                    ],
                },
            ],
        });

        const result = await chatSession.sendMessage("Analyze the audio file and return the timestamps as instructed. The response should be proper markdown separted by new lines - very important!");

        // Extract and log the result
        const responseText = await result.response.text();
        console.log("Generated Timestamps:", responseText);

        // Return the result
        return NextResponse.json({ summary: responseText });
    } catch (error) {
        console.error("Error handling Gemini upload:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
