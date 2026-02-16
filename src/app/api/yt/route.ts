import { NextRequest, NextResponse } from "next/server"
// @ts-ignore
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { StringOutputParser } from "@langchain/core/output_parsers"
import { ChatPromptTemplate } from "@langchain/core/prompts"

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY

type Comment = {
    comment: string
    author_name: string
    author_channel: string
}


export async function POST(req: NextRequest) {
    try {
        const { videoUrl } = await req.json()
        if (!videoUrl) {
            return NextResponse.json({ error: "Video URL is required" }, { status: 400 })
        }

        const videoId = getVideoId(videoUrl)
        if (!videoId) {
            return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 })
        }

        const comments = await fetchComments(videoId)
        const suggestions = await analyzeComments(comments)

        return NextResponse.json({ videoId, suggestions })
    } catch (error) {
        console.error("Error:", error)
        const message = error instanceof Error ? error.message : "Internal Server Error"
        return NextResponse.json({ error: message }, { status: 500 })
    }
}


function getVideoId(url: string): string | null {
    try {
        const parsedUrl = new URL(url)
        const hostname = parsedUrl.hostname

        if (hostname.includes("youtube.com")) {
            return parsedUrl.searchParams.get("v")
        }
        if (hostname === "youtu.be") {
            return parsedUrl.pathname.substring(1)
        }
        if (parsedUrl.pathname.startsWith("/embed/")) {
            return parsedUrl.pathname.split("/")[2]
        }

        return null
    } catch (error) {
        console.error("Invalid URL:", error)
        return null
    }
}


async function fetchComments(videoId: string): Promise<Comment[]> {
    const url = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet,replies&videoId=${videoId}&maxResults=100&order=relevance&key=${GOOGLE_API_KEY}`

    const response = await fetch(url)
    if (!response.ok) {
        const errorData = await response.json()
        console.error("YouTube API error:", response.status, errorData)
        throw new Error(`YouTube API error: ${errorData?.error?.message || response.statusText}`)
    }

    const data = await response.json()
    return data.items.map((item: { snippet: { topLevelComment: { snippet: { textDisplay: string; authorDisplayName: string; authorChannelUrl: string } } } }) => ({
        comment: item.snippet.topLevelComment.snippet.textDisplay,
        author_name: item.snippet.topLevelComment.snippet.authorDisplayName,
        author_channel: item.snippet.topLevelComment.snippet.authorChannelUrl
    }))
}


async function analyzeComments(comments: Comment[]): Promise<string> { 
    const model = new ChatGoogleGenerativeAI({ model: "gemini-2.5-flash", apiKey: GOOGLE_API_KEY })

    const prompt = ChatPromptTemplate.fromTemplate(`
        You are an expert in audience engagement and content strategy.
        Extract YouTube comments that suggest new video topics, improvements, or collaborations.
        If no such comments exist, return an empty array.

        Here are the comments:
        {comments}
    `)

    const parser = new StringOutputParser()
    const chain = prompt.pipe(model).pipe(parser)
    const result = await chain.invoke({ comments: JSON.stringify(comments) })

    return result
}
