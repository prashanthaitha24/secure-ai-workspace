import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { meetingId } = await params;

  const meeting = await db.meeting.findUnique({ where: { id: meetingId } });
  if (!meeting) return Response.json({ error: "Not found" }, { status: 404 });

  if (meeting.status === "SCHEDULED") {
    await db.meeting.update({
      where: { id: meetingId },
      data: { status: "LIVE", startedAt: new Date() },
    });
  }

  return Response.json({ ok: true });
}
