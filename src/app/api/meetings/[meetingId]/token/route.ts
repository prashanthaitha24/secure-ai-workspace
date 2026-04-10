import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { AccessToken } from "livekit-server-sdk";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { meetingId } = await params;
  const body = await req.json();
  const { identity, name } = body as { identity: string; name: string };

  const meeting = await db.meeting.findUnique({
    where: { id: meetingId },
    select: { id: true, workspaceId: true, status: true },
  });
  if (!meeting) return Response.json({ error: "Not found" }, { status: 404 });
  if (meeting.status === "CANCELLED" || meeting.status === "ENDED") {
    return Response.json({ error: "Meeting is not active" }, { status: 400 });
  }

  const member = await db.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: meeting.workspaceId, userId } },
  });
  if (!member) return Response.json({ error: "Forbidden" }, { status: 403 });

  const at = new AccessToken(
    process.env.LIVEKIT_API_KEY!,
    process.env.LIVEKIT_API_SECRET!,
    { identity, name, ttl: "4h" }
  );
  at.addGrant({ roomJoin: true, room: meetingId, canPublish: true, canSubscribe: true });

  const token = await at.toJwt();

  // Record participant
  await db.meetingParticipant.upsert({
    where: { meetingId_userId: { meetingId, userId } },
    create: { meetingId, userId },
    update: { joinedAt: new Date() },
  });

  return Response.json({ token });
}
