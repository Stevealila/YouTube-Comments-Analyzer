"use client";

import { useState } from "react";
import he from "he";

type Provider = "groq" | "gemini" | "openai" | "anthropic";

interface Comment {
    comment: string;
    author_name: string;
    author_channel: string;
}

const PROVIDER_LABELS: Record<Provider, string> = {
    groq: "Groq (GPT-OSS 120B)",
    gemini: "Google Gemini 2.5 Flash",
    openai: "OpenAI GPT-4o Mini",
    anthropic: "Anthropic Claude 3.5 Haiku",
};

const PROVIDER_KEY_LINKS: Record<Provider, string> = {
    groq: "https://console.groq.com/keys",
    gemini: "https://aistudio.google.com/api-keys",
    openai: "https://platform.openai.com/api-keys",
    anthropic: "https://console.anthropic.com/settings/api-keys",
};

function parseComments(raw: string): Comment[] {
    const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) return JSON.parse(jsonMatch[1].trim());
    try {
        return JSON.parse(raw.trim());
    } catch {
        const arrayMatch = raw.match(/\[[\s\S]*\]/);
        if (arrayMatch) return JSON.parse(arrayMatch[0]);
    }
    throw new Error("Could not parse AI response — try again or switch providers");
}

const YouTubeTool = () => {
    const [provider, setProvider] = useState<Provider>("gemini");
    const [apiKey, setApiKey] = useState("");
    const [showKey, setShowKey] = useState(false);
    const [videoUrl, setVideoUrl] = useState("");
    const [suggestions, setSuggestions] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const canAnalyze = !loading && apiKey.trim() !== "" && videoUrl.trim() !== "";

    const handleFetchComments = async () => {
        setLoading(true);
        setError(null);
        setSuggestions([]);
        setStatus("Fetching comments from YouTube...");

        try {
            const response = await fetch("/api/yt", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ videoUrl, provider, apiKey }),
            });

            setStatus("Analyzing with AI...");
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to fetch comments");

            setStatus("Parsing suggestions...");
            let dataArray = parseComments(data.suggestions);

            dataArray = dataArray.map((item) => ({
                ...item,
                comment: he.decode(item.comment).replace(/<br\s*\/?>/gi, "\n"),
            }));

            setSuggestions(dataArray);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred");
        } finally {
            setLoading(false);
            setStatus(null);
        }
    };

    return (
        <div className="max-w-2xl mx-auto my-10 p-6 bg-white shadow-lg rounded-lg">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-center">
                YouTube Comment Tool
            </h1>

            <p className="text-gray-600 text-center mb-6 italic">
                Analyzes viewer feedback to uncover potential video topics, improvements, and collaboration opportunities.
            </p>

            {/* Step 1: LLM Configuration */}
            <div className="mb-5 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm font-semibold text-gray-700 mb-3">Step 1 — Choose your LLM provider</p>

                <div className="grid grid-cols-2 gap-2 mb-3">
                    {(Object.keys(PROVIDER_LABELS) as Provider[]).map((p) => (
                        <button
                            key={p}
                            onClick={() => { setProvider(p); setApiKey(""); }}
                            className={`text-left px-3 py-2 rounded-md border text-sm transition-colors ${
                                provider === p
                                    ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-400"
                            }`}
                        >
                            {PROVIDER_LABELS[p]}
                        </button>
                    ))}
                </div>

                <div className="relative">
                    <input
                        type={showKey ? "text" : "password"}
                        placeholder={`Enter your ${PROVIDER_LABELS[provider].split(" ")[0]} API key`}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="border p-3 w-full rounded-md pr-20 text-sm font-mono"
                        autoComplete="off"
                    />
                    <button
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
                    >
                        {showKey ? "Hide" : "Show"}
                    </button>
                </div>

                <a
                    href={PROVIDER_KEY_LINKS[provider]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:underline mt-1 inline-block"
                >
                    Get a free {PROVIDER_LABELS[provider].split(" ")[0]} API key →
                </a>
            </div>

            {/* Step 2: YouTube URL */}
            <div className="mb-2">
                <p className="text-sm font-semibold text-gray-700 mb-2">Step 2 — Enter a YouTube video URL</p>
                <div className="flex flex-col sm:flex-row gap-2">
                    <input
                        type="text"
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        className="border p-3 w-full rounded-md"
                    />
                    <button
                        onClick={handleFetchComments}
                        disabled={!canAnalyze}
                        className="bg-blue-500 text-white p-3 rounded-md min-w-[120px] hover:bg-blue-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {loading ? "Analyzing..." : "Analyze"}
                    </button>
                </div>
            </div>

            {!apiKey.trim() && (
                <p className="text-amber-600 text-xs mt-1">Enter your API key above to enable analysis.</p>
            )}

            {status && <p className="text-blue-500 mt-3 animate-pulse text-sm">{status}</p>}
            {error && <p className="text-red-500 mt-3 text-sm">{error}</p>}

            {suggestions.length > 0 && (
                <div className="mt-6">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-800 bg-blue-100 px-4 py-2 rounded-md shadow-md border-l-4 border-blue-500">
                        📌 Content Suggestions
                    </h2>

                    <div className="mt-3 space-y-3">
                        {suggestions.map((item, index) => (
                            <div key={index} className="p-4 bg-gray-100 rounded-lg shadow-md">
                                <p className="text-gray-800 whitespace-pre-line">{`"${item.comment}"`}</p>
                                <a
                                    href={item.author_channel}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 text-sm hover:underline"
                                >
                                    - {item.author_name}
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {suggestions.length === 0 && !loading && !error && videoUrl && (
                <p className="text-gray-500 text-sm mt-4 text-center">No actionable suggestions found in the comments.</p>
            )}
        </div>
    );
};

export default YouTubeTool;
