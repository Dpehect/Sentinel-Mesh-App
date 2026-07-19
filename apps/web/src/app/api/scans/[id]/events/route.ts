import { demo } from "@/lib/demo";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (process.env.DEMO_MODE !== "false") {
    const encoder = new TextEncoder();
    let progress = 10;
    const stream = new ReadableStream({
      async start(controller) {
        const stages = ["queued", "cloning", "scanning", "finalizing", "complete"];
        for (const stage of stages) {
          progress = stage === "complete" ? 100 : Math.min(92, progress + 20);
          const payload = {
            id,
            status: stage === "complete" ? "complete" : "scanning",
            stage,
            progress,
            logs: [`Demo stage: ${stage}`],
            result: stage === "complete" ? demo : undefined
          };
          controller.enqueue(encoder.encode(`event: scan\ndata: ${JSON.stringify(payload)}\n\n`));
          await new Promise((resolve) => setTimeout(resolve, 550));
        }
        controller.close();
      }
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive"
      }
    });
  }

  const response = await fetch(`${process.env.WORKER_URL ?? "http://localhost:4010"}/jobs/${id}/events`, {
    cache: "no-store",
    headers: { accept: "text/event-stream" }
  });

  return new Response(response.body, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("content-type") ?? "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no"
    }
  });
}
