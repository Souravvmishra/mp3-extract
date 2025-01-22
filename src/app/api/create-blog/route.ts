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

Example :

---
title: 10 Mistakes You're Making in Virtual Meetings (And How Meet-Man Can Help)
description: Virtual meetings, the unending video calls that somehow manage to feel both rushed and a colossal waste of time. Let's be honest—how many of your meetings actually end with a clear outcome? Or do they just wrap up with a vague “Let's circle back” while everyone quietly groans? If you've been feeling like your meetings are more pain than progress, you're not alone. Most teams fall into the same traps lack of structure, unclear goals, and a shocking amount of silence when someone asks, “Any questions?” This blog dives into the 10 most common mistakes you're probably making in your virtual meetings—and yes, we're looking at you, the one who shows up late and asks for a recap. But don't worry, this isn't just a roast session. We'll also show you how MeetMan, your trusty AI sidekick, can help you clean up your meeting mess and turn them into productive, actionable sessions your team actually looks forward to. Well, maybe not look forward to—let's not get crazy—but at least tolerate without eye-rolls.
image: /images/blog/10-mistakes-you're-making-in-virtual-meetings-and-how-meetman-can-help.webp  
date: "2024-11-25"  
authors:
  - raghav
---

## 10 Mistakes You're Making in Virtual Meetings (And How Meet-Man Can Help)

Let's cut to the chase: your virtual meetings suck. Yeah, we said it. Don't act surprised—you know it's true. They're chaotic, unfocused, and more awkward than a bad first date. Cameras off, mics muted, and that one person who always forgets they're unmuted when they yell at their dog. Sound familiar? And don't even get us started on the lack of agendas, the endless tangents, and the classic “Oh, we're out of time; let's follow up on this later” line.

But hey, it's not entirely your fault. Virtual meetings are tricky, and most of us have been winging it since the dawn of Zoom fatigue. The good news? You don't have to live like this. There are clear, simple ways to fix these issues and make your meetings...dare i say, enjoyable? Okay, maybe not “enjoyable,” but at least less painful. **MeetMan** is here to rescue your meetings from the pit of confusion and inefficiency. But before we get to the solutions, let's talk about the real problem: you. (Don't worry, i'll be gentle.)

---

## 1. No Agenda, No Direction

Picture this: you're sitting in a virtual meeting, and the host starts with, “So, um, I thought we'd just go over a few things today.” Cue the awkward silence. Nobody knows what "things" they're supposed to go over, and half the attendees are already zoning out or checking emails. A meeting without an agenda is like setting out on a road trip without a map—you're just driving aimlessly, hoping you'll end up somewhere useful. Spoiler: you won't.

Agendas are the backbone of productive meetings. They give structure, purpose, and a clear roadmap for what needs to be accomplished. Yet somehow, people skip this crucial step, thinking, “Oh, we'll figure it out as we go.” Nope. What you end up with is a free-for-all where people talk in circles, interrupt each other, and achieve absolutely nothing.

- Let's break it down:

**Why agendas matter**: They create focus. An agenda sets expectations, ensures everyone is prepared, and keeps the meeting on track. Without one, discussions tend to meander, and critical points are overlooked.
**What happens without one**: Meetings drag on, irrelevant topics take over, and people leave feeling like their time was wasted.
**How MeetMan can help**: **MeetMan** can generate an agenda based on the meeting's goals and shared documents, ensuring you're not winging it. It even allows team members to add their input beforehand, so everyone comes prepared.
Start your meetings with a clear, concise agenda. Share it with attendees in advance, and stick to it. This simple step can transform your virtual meetings from chaotic to purposeful. Because let's face it, nobody has time for a meeting that's just a glorified chat session.

---

## 2. Overloading the Calendar

You know that person who says, “Let's have a quick meeting about this,” for every little thing? Yeah, we need to talk about them. Overloading your calendar with unnecessary meetings is one of the quickest ways to kill productivity and morale. When your day is wall-to-wall video calls, when are you supposed to actually get any work done? Spoiler alert: you're not.

Let's not sugarcoat it—most meetings can be replaced with a well-written email. But instead, we cram our calendars with back-to-back calls, leaving no room to breathe, let alone focus. By the time you've hopped from your 9 a.m. to your 10 a.m. to your 11 a.m., you're mentally fried and probably didn't even retain half of what was discussed.

- What's the solution?

**Be ruthless with scheduling**: Before scheduling a meeting, ask yourself, “Is this really necessary? Could this be an email, a Slack message, or a quick update in a shared document?”
**Prioritize deep work**: Protect blocks of uninterrupted time on your calendar for focused work. Meetings should support productivity, not sabotage it.
**Use MeetMan's scheduling insights**: **MeetMan** can analyze your team's calendar to suggest the best times for meetings, minimizing disruptions and avoiding burnout from back-to-back calls.
Let's normalize saying, “This doesn't need to be a meeting.” Your team will thank you, and you might actually have time to do your job.

---

## 3. Talking Without Listening

Ever been in a meeting where one person dominates the conversation, going on and on while everyone else sits there nodding politely (or zoning out)? It's frustrating, right? That's because communication is a two-way street, but too many meetings feel like one-way lectures.

The problem with talking without listening is that it kills collaboration. People stop sharing ideas because they feel unheard, and the meeting turns into a monologue instead of a productive discussion.

- Here's how to fix it:

**Be intentional about inclusion**: Make sure everyone has a chance to contribute. Ask specific team members for their input instead of leaving it open-ended.
**Pause and listen**: Don't just wait for your turn to speak—actually listen to what others are saying. It's amazing how much you can learn when you're not busy planning your next point.
**Leverage MeetMan for real-time feedback**: **MeetMan** can summarize conversations and highlight key points, ensuring nothing gets lost in the shuffle. It can even identify who hasn't spoken yet, prompting better engagement.
A meeting where everyone feels heard is a meeting where collaboration thrives. So, zip it once in a while and give your team the floor.

---

## 4. Inviting the Whole Office

You've seen it before: a meeting invite goes out, and half the company is added to the attendee list. Why? Do all these people really need to be there? Spoiler: they don't. Inviting unnecessary attendees is waste of their life, oh i mean waste of their time:) but also makes the meeting less productive for everyone else.

Here's the deal: more people = more chaos. Discussions take longer, decisions are harder to make, and the meeting loses focus. Plus, let's be honest, most of those extra attendees are just there for “FYI” purposes—they're not actively contributing.

- Here's how to stop the madness:

**Only invite essential participants**: Ask yourself, “Who absolutely needs to be in this meeting to make decisions or provide critical input?” If someone just needs updates, send them the recap instead.
**Use breakout sessions**: If you need input from different groups, consider smaller, focused meetings instead of one giant call.
**MeetMan to the rescue**: **MeetMan** can analyze meeting topics and automatically suggest the most relevant attendees. It can even generate summaries for non-attendees, so they're in the loop without sitting through the meeting.
Your team's time is valuable. Don't waste it by dragging everyone into a meeting that could've been handled by a smaller, more focused group.

---

## 5. Starting Late (And Ending Later)

Here's an another universal truth: if your meeting starts late, it's probably going to run over. And nothing derails productivity faster than a meeting that eats into the next hour because people couldn't get their act together on time.

Starting late sets the tone for disorganization and signals to your team that their time isn't respected. But let's be honest: we've all been guilty of it. You join the call, someone's mic isn't working, someone else is “just grabbing coffee,” and the first 10 minutes are wasted on technical issues and small talk.

- How to fix this perpetual tardiness:

**Set expectations upfront**: Make it clear that meetings will start on time, no exceptions. Latecomers can catch up on the recap.
Prepare in advance: Test your tech, share documents ahead of time, and make sure everyone knows the agenda.
**MeetMan magic**: **MeetMan** automatically sends reminders, organizes pre-meeting materials, and even starts logging key points from the first minute, so there's no excuse to delay.
Time is money, and meetings are expensive. Respect your team's time by starting on time, sticking to the agenda, and wrapping up when you said you would.

---

## 6. Letting the Chat Go Wild

Ah, the chat box: the unofficial afterparty of virtual meetings. It's where you'll find everything from relevant questions to random memes and, occasionally, people venting about the meeting itself (careful there, Brian, everyone can see that). While a lively chat can bring energy to a meeting, it's often more like a noisy side conversation that distracts everyone.

Here's the thing: when the chat becomes a free-for-all, it's not just unproductive—it's chaotic. The person speaking ends up competing for attention, critical points get lost in the shuffle, and before you know it, half the team is discussing lunch plans instead of the task at hand.

- So, what's the fix?

**Set chat guidelines**: At the start of the meeting, clarify how the chat should be used. Is it for questions? Sharing resources? Snarky jokes? (Spoiler: it's probably not the last one.)
**Designate a chat moderator**: This person can keep an eye on the chat, address questions, and flag anything important so the speaker doesn't have to multitask.
**MeetMan to the rescue**: **MeetMan** can sift through chat transcripts and extract key points, action items, and recurring themes, ensuring nothing important is missed amidst the emoji storms.
A well-managed chat can add value to your meeting. But if it's left unchecked, it's just another layer of noise. Keep it focused, and use tools like Meet-Man to ensure the important stuff doesn't slip through the cracks.

---

## 7. Multitasking Mayhem

You know that moment when someone gets asked a question in a meeting, and there's a long pause followed by, “Sorry, could you repeat that? I was on mute.” Translation: they weren't listening because they were multitasking.

Here's the harsh truth: multitasking in meetings isn't a sign of efficiency—it's a symptom of disengagement. When people are busy checking emails, scrolling through Slack, or Googling “best taco spots near me,” they're not fully present. And guess what? It shows. Conversations go in circles, decisions take longer, and important details get missed.

But let's not just blame the multitaskers. If people are zoning out, it's often because the meeting itself isn't engaging. Fixing this starts with making your meetings worth their attention:

**Keep it concise and relevant**: Don't drag people into a 90-minute call for a discussion that could've been handled in 30 minutes. Respect their time.
**Assign roles**: Give attendees a reason to stay engaged by assigning specific roles, like note-taker, timekeeper, or discussion leader.
**Make it interactive**: Encourage questions, ask for input, and use polls or breakout rooms to keep the energy up.
Let **MeetMan** do the heavy lifting: **MeetMan** captures and summarizes key points, so even if someone momentarily zones out, they won't miss the big picture.
Stop trying to juggle tasks during meetings. It's not impressive—it's counterproductive. Give your team a reason to focus, and watch your meetings transform.

---

## 8. Ignoring Body Language (Or Lack Thereof)

Let's talk about virtual body language—or, more accurately, the lack of it. In a physical meeting, you can pick up on subtle cues: nods of agreement, furrowed brows of confusion, or the classic “I'm totally here but secretly texting under the table” posture. In virtual meetings, those cues are harder to read, especially if half the participants have their cameras off.

Here's the problem: when you can't see or interpret body language, it's easy to misread the room. Are people engaged or bored? Are they aligned with the plan, or are they secretly plotting a mutiny? You're left guessing, which can lead to miscommunication and frustration.

- What can you do?

**Encourage cameras-on culture (within reason)**: While nobody loves being on camera 24/7, having faces visible can improve connection and understanding. That said, be empathetic—some days, we all just want to hide behind our profile pictures.
**Read the virtual room**: Pay attention to vocal tones, pauses, and even the chat box for clues about engagement and emotions.
**Leverage MeetMan's sentiment analysis**: **MeetMan** can analyze meeting transcripts and chat logs to identify patterns in tone and sentiment, giving you insights into how your team is really feeling.
Virtual meetings don't have to feel like a game of charades. With a little effort—and the right tools—you can bridge the gap and ensure everyone is on the same page.

---

## 9. The Dreaded Overlap

Let's imagine, you're deep into a meeting, passionately discussing an idea, when suddenly someone interrupts with, “Wait, didn't we talk about this last week?” Ouch. Overlapping discussions are the hallmark of poorly planned meetings, and they're a surefire way to frustrate your team.

Why does this happen? Usually because of poor record-keeping and follow-up. If nobody tracks what was decided in previous meetings, it's easy to fall into the trap of rehashing old topics. Not only is this annoying—it's a colossal waste of time.

- Here's how to break the cycle:

**Keep detailed meeting records**: Assign someone to take notes and capture key decisions and action items. Better yet, let Meet-Man do it for you.
**Start each meeting with a recap**: Spend the first few minutes reviewing what was covered in the last meeting to avoid redundant discussions.
**Create a centralized knowledge hub**: Store meeting notes, project updates, and action plans in one accessible location.
Redundancy has its place (like in data backups), but meetings aren't it. By eliminating overlap, you'll save time and keep your team moving forward.

---

## 10. Skipping Follow-Ups

The meeting ends, everyone logs off, and... nothing happens. Sound familiar? Skipping follow-ups is one of the biggest meeting mistakes out there. Without clear action items and accountability, even the most productive discussions can fizzle into inaction.

**Here's the reality**: meetings are just the starting point. The real work happens afterward. If there's no follow-up, all that brainstorming, decision-making, and planning goes to waste.

- Here's how to avoid the post-meeting black hole, not the hole you're thinking:),

**End with a clear action plan**: Summarize key decisions and assign tasks before the meeting wraps up.
**Send a recap**: Share meeting notes and action items with attendees (and relevant non-attendees) within 24 hours.
**Track progress**: Check in on assigned tasks to ensure follow-through.
**Let MeetMan take the lead**: **MeetMan** can automatically generate meeting summaries, assign tasks, and track progress, taking the hassle out of follow-ups.
Don't let your meetings become one-hit wonders. Follow through, follow up, and watch your team thrive.

---

## Ending Paragraph: My Message Of Love

Alright, we've dragged you through 10 mistakes and the painful truths behind your chaotic, soul-sucking virtual meetings. Let's face it—if this blog hit a little too close to home, it's because you needed to hear it. Don't take it personally; we're all guilty of at least some of these crimes against productivity.

But here's the good news: admitting your flaws is the first step. Yes, your meetings are a mess, your agendas are MIA(not her), and your follow-ups are as rare as a Bollywood movie without a dance. But you're here, reading this blog, which means you care enough to fix it. So give yourself a pat on the back (but not too long, you've got work to do).

And remember, tools like **MeetMan** are here to make you look like the meeting genius you always dreamed of being. With a little help, your team will finally stop rolling their eyes at yet another meeting invite and start showing up prepared, engaged, and maybe even—dare I say it—excited.

Because at the end of the day, meetings aren't inherently evil. They're just a mirror of how we run them. So take control, get your act together, and stop blaming the meeting when the real problem might be…you. (Hey, I warned you this roast would sting!)

But don't worry, you've got this. One step at a time, one tool at a time, one meeting at a time. Now, go out there and be the meeting hero your team didn't know they needed. And if you're feeling overwhelmed, take a break, grab some coffee, and let **MeetMan** handle the heavy lifting.

Here's to smarter meetings and happier teams. You're welcome.
I'll go and rethink my life.

---

## Here are the links to the tools mentioned in the blog:

- [Meet-Man](https://meetman.codestam.com/)
- [Miro](https://miro.com)
- [Zoom](https://zoom.com)
- [Microsoft Teams](https://www.microsoft.com/en-us/microsoft-teams/group-chat-software)
- [Google Workspace](https://workspace.google.com/)
- [Slack](https://slack.com)
- [Notion](https://notion.so)

---

**Connect with Raghav Sharma**:
- [Twitter](https://x.com/ImRaghav_Sharma)  
- [LinkedIn](https://www.linkedin.com/in/im-raghav-sharma-/)

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

        console.log(result.response);

        const response = result.response.candidates ? result.response.candidates[0].content.parts[1].text : await result.response.text()
        return NextResponse.json({ content: response });
    } catch (error) {
        console.error("Error generating blog content:", error);
        return NextResponse.json(
            { error: "Failed to generate blog content" },
            { status: 500 }
        );
    }
}
