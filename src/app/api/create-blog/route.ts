import { NextResponse } from "next/server";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, } from "@google/generative-ai";

export const maxDuration = 60;
export const dynamic = 'force-dynamic';


// Initialize Gemini API
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment variables");
}

const genAI = new GoogleGenerativeAI(apiKey);

// Configure the model
const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-thinking-exp-1219",
    systemInstruction: "You are a professional SEO content writer with expertise in creating high-ranking, engaging, and informative blog posts. Your goal is to write a blog that ranks on the first page of Google for targeted keywords. Ensure the blog is structured for SEO and optimized for search intent.",
    safetySettings: [
        {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
        },
        {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
        },
        {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
        },
        {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
        },
    ]
});

const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 64,
    responseMimeType: "text/plain",
};

// API route handler
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { keyword, secondaryKeywords, targetAudience, tone, searchIntent, language } = body;

        if (!keyword || !targetAudience || !tone || !searchIntent) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const prompt = `You are a professional SEO content writer with expertise in creating high-ranking, engaging, and informative blog posts. Your goal is to write a blog that ranks on the first page of Google for targeted keywords. Ensure the blog is structured for SEO and optimized for search intent.
Requirements:

    Title:
        Create a compelling and keyword-rich title.
        Include the primary keyword in the title to attract search engine attention.

    Introduction:
        Write an engaging introduction that hooks the reader within the first 100 words.
        Clearly define the problem or topic and explain the value the reader will gain by reading.
        Naturally include the primary keyword in the first 100 words.

    Content Structure:
        Use H1, H2, H3, and H4 headings with target keywords where appropriate.
        Break the content into clear, scannable sections.
        Address the main topic thoroughly and answer all potential user questions.

    Keyword Optimization:
        Focus on one primary keyword and 2-3 secondary keywords.
        Sprinkle keywords naturally throughout the content (avoid keyword stuffing).
        Include keywords in headings, subheadings, and the conclusion.

    Formatting:
        Use bullet points, numbered lists, and short paragraphs to enhance readability.
        Bold important points to make the blog visually appealing.
        Ensure proper internal and external linking strategies for SEO.
            Link to relevant high-authority sources.
            Suggest linking to related pages within the website.

    Engagement Features:
        Include questions or calls to action to encourage readers to interact.
        Suggest potential meta descriptions and featured snippet optimizations.

    Technical SEO:
        Provide a meta title and meta description optimized for click-through rate (CTR).
        Suggest alt text for at least three potential images.
        Ensure content length is between 1500-2500 words to match competitive blogs.

    Content Quality:
        Write with a conversational yet authoritative tone.
        Include statistics, facts, and real-world examples to build credibility.
        Avoid generic content; provide unique insights or actionable advice.

    Call to Action (CTA):
        Conclude the blog with a strong CTA that aligns with the website's goal, such as subscribing, purchasing, or sharing.

    Additional Enhancements:
        Use semantic keywords (LSI) throughout the content.
        Optimize content for featured snippets by including direct answers, numbered steps, or tables where relevant.
        Suggest a FAQ section at the end to cover common queries related to the topic.

Specific Input:

The blog should target the keyword [${keyword}] with secondary keywords [${secondaryKeywords}]. The target audience is [${targetAudience}], and the tone of the blog should be [${tone}]. Focus on [${searchIntent}] search intent. in language ${language}

Final response should be proper markdown as given in below format.
`;

        const chatSession = model.startChat({
            generationConfig,
            history: [
                {
                    role: "user",
                    parts: [{ text: prompt }],
                },
            ],
        });


        const result = await chatSession.sendMessage(prompt);

        console.log(JSON.stringify(result.response));

        // Check if candidates exist and access the desired text
        let response;

        if (result.response.candidates) {
            const content = result.response.candidates[0].content; // Assuming 'content' is inside candidates
            response = (content.parts[1]?.text || content.parts[0]?.text);
        } else {
            response = await result.response.text();
        }

        return NextResponse.json({ content: response });
    } catch (error) {
        console.error("Error generating blog content:", error);
        return NextResponse.json(
            { error: "Failed to generate blog content" },
            { status: 500 }
        );
    }
}
