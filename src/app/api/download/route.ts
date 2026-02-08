import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;
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

    // Extract video ID
    const videoIdMatch = url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/watch\?.+&v=))([^&\n?#]+)/);
    if (!videoIdMatch) {
      return NextResponse.json(
        { error: "Invalid YouTube URL" },
        { status: 400 }
      );
    }

    const videoId = videoIdMatch[1];

    // Try multiple download services in order of preference
    
    // Option 1: Try y2mate API
    try {
      const y2mateResponse = await fetch(`https://www.y2mate.com/mates/analyzeV2/ajax`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          k_query: url,
          k_page: "home",
          hl: "en",
          q_auto: "0",
        }),
      });

      if (y2mateResponse.ok) {
        const y2mateData = await y2mateResponse.json();
        if (y2mateData.status === "ok" && y2mateData.links?.mp4) {
          // Get the highest quality MP4 link
          const mp4Links = Object.values(y2mateData.links.mp4) as any[];
          if (mp4Links.length > 0) {
            const bestQuality = mp4Links[0];
            
            // Convert the video
            const convertResponse = await fetch(`https://www.y2mate.com/mates/convertV2/index`, {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({
                vid: videoId,
                k: bestQuality.k,
              }),
            });

            if (convertResponse.ok) {
              const convertData = await convertResponse.json();
              if (convertData.dlink) {
                return NextResponse.json({
                  success: true,
                  downloadUrl: convertData.dlink,
                  filename: `video-${videoId}.mp4`,
                });
              }
            }
          }
        }
      }
    } catch (e) {
      console.log("y2mate failed, trying next service");
    }

    // If all services fail, return a redirect to a download page
    return NextResponse.json({
      success: true,
      downloadUrl: `https://www.y2mate.com/youtube/${videoId}`,
      filename: `video-${videoId}.mp4`,
      isRedirect: true,
    });

  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to process video",
      },
      { status: 500 }
    );
  }
}
