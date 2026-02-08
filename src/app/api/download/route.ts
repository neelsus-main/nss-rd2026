import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

// Alternative approach: Use a third-party API or redirect to download services
// YouTube blocks automated scrapers. Options:
// 1. Use RapidAPI YouTube downloader APIs
// 2. Use cobalt.tools API (free, open source)
// 3. Host your own yt-dlp service

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    // Extract video ID
    const videoIdMatch = url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/watch\?.+&v=))([^&\n?#]+)/);
    if (!videoIdMatch) {
      return NextResponse.json(
        { error: "Invalid YouTube URL" },
        { status: 400 }
      );
    }

    const videoId = videoIdMatch[1];

    // Option 1: Use cobalt.tools API (free, no auth needed)
    const cobaltResponse = await fetch("https://api.cobalt.tools/api/json", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        url: url,
        vCodec: "h264",
        vQuality: "720",
        aFormat: "mp3",
        isAudioOnly: false,
      }),
    });

    if (!cobaltResponse.ok) {
      throw new Error("Failed to fetch video from cobalt.tools");
    }

    const cobaltData = await cobaltResponse.json();

    if (cobaltData.status === "redirect" || cobaltData.status === "stream") {
      // Return the download URL
      return NextResponse.json({
        success: true,
        downloadUrl: cobaltData.url,
        filename: `video-${videoId}.mp4`,
      });
    }

    throw new Error("Could not retrieve download link");

  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to process video. YouTube has strict bot protection. Consider using the YouTube app or browser extensions instead.",
        suggestion: "Due to YouTube's Terms of Service and bot protection, automated downloads are unreliable. Try: 1) Browser extensions, 2) Official YouTube Premium downloads, 3) Self-hosted yt-dlp"
      },
      { status: 500 }
    );
  }
}
