import { NextRequest, NextResponse } from "next/server";
import ytdl from "@distube/ytdl-core";

export const maxDuration = 60; // Increase timeout for Vercel
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    // Validate YouTube URL
    if (!ytdl.validateURL(url)) {
      return NextResponse.json(
        { error: "Invalid YouTube URL" },
        { status: 400 }
      );
    }

    // Better agent configuration to avoid bot detection
    const agent = ytdl.createAgent(undefined, {
      localAddress: undefined,
    });

    // Get video info with agent
    const info = await ytdl.getInfo(url, { agent });
    const title = info.videoDetails.title.replace(/[^a-z0-9]/gi, "_");

    // Create a readable stream with better options
    const videoStream = ytdl(url, {
      quality: "highestvideo",
      filter: (format) => format.container === "mp4",
      agent,
      requestOptions: {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      },
    });

    // Collect chunks
    const chunks: Uint8Array[] = [];
    
    for await (const chunk of videoStream) {
      chunks.push(chunk);
    }

    // Combine chunks into a single buffer
    const buffer = Buffer.concat(chunks);

    // Return the video file
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="${title}.mp4"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to download video. YouTube may be blocking automated downloads." },
      { status: 500 }
    );
  }
}
