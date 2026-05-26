import { NextRequest, NextResponse } from "next/server";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGroq } from "@langchain/groq";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || process.env.GOOGLE_API_KEY;

type Provider = "groq" | "gemini" | "openai" | "anthropic";

type Comment = {
    comment: string;
    author_name: string;
    author_channel: string;
};

function createModel(provider: Provider, apiKey: string): BaseChatModel {
    switch (provider) {
        case "gemini":
            // @ts-ignore
            return new ChatGoogleGenerativeAI({ model: "gemini-2.5-flash", apiKey });
        case "openai":
            return new ChatOpenAI({ model: "gpt-4o-mini", apiKey }) as unknown as BaseChatModel;
        case "anthropic":
            return new ChatAnthropic({ model: "claude-3-5-haiku-20241022", apiKey }) as unknown as BaseChatModel;
        case "groq":
            return new ChatGroq({ model: "openai/gpt-oss-120b", apiKey }) as unknown as BaseChatModel;
        default:
            throw new Error(`Unsupported provider: ${provider}`);
    }
}

export async function POST(req: NextRequest) {
    try {
        const { videoUrl, provider, apiKey } = await req.json();

        if (!videoUrl) {
            return NextResponse.json({ error: "Video URL is required" }, { status: 400 });
        }
        if (!provider || !apiKey) {
            return NextResponse.json({ error: "LLM provider and API key are required" }, { status: 400 });
        }
        if (!["groq", "gemini", "openai", "anthropic"].includes(provider)) {
            return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
        }
        if (!YOUTUBE_API_KEY) {
            return NextResponse.json({ error: "YouTube API key is not configured on the server" }, { status: 500 });
        }

        const videoId = getVideoId(videoUrl);
        if (!videoId) {
            return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
        }

        const comments = await fetchComments(videoId);
        const suggestions = await analyzeComments(comments, provider as Provider, apiKey);

        return NextResponse.json({ videoId, suggestions });
    } catch (error) {
        console.error("Error:", error);
        const message = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}


function getVideoId(url: string): string | null {
    try {
        const parsedUrl = new URL(url);
        const hostname = parsedUrl.hostname;

        if (hostname.includes("youtube.com")) {
            return parsedUrl.searchParams.get("v");
        }
        if (hostname === "youtu.be") {
            return parsedUrl.pathname.substring(1);
        }
        if (parsedUrl.pathname.startsWith("/embed/")) {
            return parsedUrl.pathname.split("/")[2];
        }

        return null;
    } catch (error) {
        console.error("Invalid URL:", error);
        return null;
    }
}


async function fetchComments(videoId: string): Promise<Comment[]> {
    const url = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet,replies&videoId=${videoId}&maxResults=100&order=relevance&key=${YOUTUBE_API_KEY}`;

    const response = await fetch(url);
    if (!response.ok) {
        const errorData = await response.json();
        console.error("YouTube API error:", response.status, errorData);
        throw new Error(`YouTube API error: ${errorData?.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.items.map((item: { snippet: { topLevelComment: { snippet: { textDisplay: string; authorDisplayName: string; authorChannelUrl: string } } } }) => ({
        comment: item.snippet.topLevelComment.snippet.textDisplay,
        author_name: item.snippet.topLevelComment.snippet.authorDisplayName,
        author_channel: item.snippet.topLevelComment.snippet.authorChannelUrl
    }));
}


async function analyzeComments(comments: Comment[], provider: Provider, apiKey: string): Promise<string> {
    const model = createModel(provider, apiKey);

    const prompt = ChatPromptTemplate.fromTemplate(`
        You are an expert in audience engagement and content strategy.
        Extract YouTube comments that suggest new video topics, improvements, or collaborations.
        Return ONLY a JSON array wrapped in \`\`\`json code blocks with this exact structure:
        \`\`\`json
        [
          {{
            "comment": "the comment text",
            "author_name": "commenter name",
            "author_channel": "channel URL"
          }}
        ]
        \`\`\`
        If no such comments exist, return: \`\`\`json\n[]\n\`\`\`

        Here are the comments:
        {comments}
    `);

    const parser = new StringOutputParser();
    const chain = prompt.pipe(model).pipe(parser);
    const result = await chain.invoke({ comments: JSON.stringify(comments) });

    return result;
}
