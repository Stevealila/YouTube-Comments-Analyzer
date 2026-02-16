# YouTube Comments Analyzer

Ever wonder what your audience is really asking for? The YouTube Comments Analyzer scans viewer comments to surface content suggestions, improvement ideas, and collaboration opportunities — so you can focus on creating what your audience actually wants.

## Problem Solved

Reading through hundreds of YouTube comments to find actionable feedback is tedious. This tool addresses that by:

1. **Extracting Content Ideas**: Automatically identifies comments suggesting new video topics.
2. **Surfacing Improvements**: Finds viewer feedback on what could be better.
3. **Spotting Collaborations**: Highlights comments mentioning potential partnerships or collaborations.

## Situations Where This Tool Can Save You

1. **Content Planning**: Quickly discover what your audience wants to see next.
2. **Audience Engagement**: Identify and respond to viewers who are actively contributing ideas.
3. **Channel Growth**: Make data-driven decisions about your content strategy based on real viewer feedback.
4. **Competitive Research**: Analyze comments on any public YouTube video to understand audience sentiment.

## Installation and Setup

### Prerequisites

- Node.js 20 or higher
- A [Google API key](https://aistudio.google.com/api-keys) with **YouTube Data API v3** and **Generative Language API** enabled

### Step-by-Step Installation

1. **Clone the Repository**

   ```bash
   git clone https://github.com/Stevealila/YouTube-Comments-Analyzer.git
   cd YouTube-Comments-Analyzer
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Set Up Environment Variables**

   Copy the example env file and fill in your API key:

   ```bash
   cp .env.example .env
   ```

   Then edit `.env` and add your `GOOGLE_API_KEY`.

### Running the Application Locally

```bash
npm run dev
```

Then open your browser at `http://localhost:3000`.

## Usage

1. **Enter the YouTube Video URL**

   In the input field, paste the URL of the YouTube video you want to analyze.

2. **Analyze**

   Click the "Analyze" button. The tool will fetch the video's comments, run them through Google Gemini, and display content suggestions with links to the original commenters.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

## Acknowledgments

- [Google](https://ai.google.dev/) for Gemini.
- [LangChain](https://www.langchain.com/) for the AI chain framework.
- [Next.js](https://nextjs.org/) for the web application framework.
