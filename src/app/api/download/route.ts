import { NextRequest, NextResponse } from "next/server";
import ytdl from "@distube/ytdl-core";

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

    // Get video info
    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title.replace(/[^a-z0-9]/gi, "_");

    // Create a readable stream
    const videoStream = ytdl(url, {
      quality: "highest",
      filter: "videoandaudio",
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
      { error: error instanceof Error ? error.message : "Failed to download video" },
      { status: 500 }
    );
  }
}
