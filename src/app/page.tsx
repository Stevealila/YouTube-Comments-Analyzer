"use client";

import { useState } from "react";
import he from "he";

interface Comment {
    comment: string;
    author_name: string;
    author_channel: string;
}

const YouTubeTool = () => {
    const [videoUrl, setVideoUrl] = useState("");
    const [suggestions, setSuggestions] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFetchComments = async () => {
        setLoading(true);
        setError(null);
        setSuggestions([]);
        setStatus("Fetching comments from YouTube...");

        try {
            const response = await fetch("/api/yt", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ videoUrl }),
            });

            setStatus("Processing response...");
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to fetch comments");

            setStatus("Parsing AI suggestions...");
            const extractedJson = data.suggestions.split("```json")[1].split("```")[0];
            let dataArray: Comment[] = JSON.parse(extractedJson);

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
            <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-center">
                YouTube Comment Tool
            </h1>

            <p className="text-gray-600 text-center mb-6 italic">
                This tool analyzes viewer feedback to uncover potential video topics, improvements, and collaboration opportunities.
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
                <input
                    type="text"
                    placeholder="Enter YouTube Video URL"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="border p-3 w-full rounded-md"
                />
                <button
                    onClick={handleFetchComments}
                    className="bg-blue-500 text-white p-3 rounded-md min-w-[120px] hover:bg-blue-600 transition-colors"
                    disabled={loading}
                >
                    {loading ? "Fetching..." : "Analyze"}
                </button>
            </div>

            {status && <p className="text-blue-500 mt-2 animate-pulse">{status}</p>}
            {error && <p className="text-red-500 mt-2">{error}</p>}

            {suggestions.length > 0 && (
                <div className="mt-6">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-800 bg-blue-100 px-4 py-2 rounded-md shadow-md border-l-4 border-blue-500">
                        📌 Content Suggestions
                    </h2>

                    <div className="mt-3 space-y-3">
                        {suggestions.map((item, index) => (
                            <div key={index} className="p-4 bg-gray-100 rounded-lg shadow-md">
                                <p className="text-gray-800 whitespace-pre-line">{"\"" + item.comment + "\""}</p>
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
        </div>
    );
};

export default YouTubeTool;