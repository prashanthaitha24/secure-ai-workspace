import { auth } from "@clerk/nextjs/server";
import { generateText, Output } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { db } from "@/lib/db";

const summarySchema = z.object({
  summary: z.string().describe("A concise 2-4 sentence summary of the meeting"),
  keyPoints: z.array(z.string()).describe("3-7 key discussion points from the meeting"),
  actionItems: z
    .array(
      z.object({
        text: z.string().describe("The action item description"),
        assignee: z.string().optional().describe("Person responsible, if mentioned"),
        dueDate: z.string().optional().describe("Due date if mentioned, in YYYY-MM-DD format"),
      })
    )
    .describe("Specific action items and tasks identified"),
  decisions: z.array(z.string()).describe("Key decisions made during the meeting"),
});

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { meetingId } = await params;

  const meeting = await db.meeting.findUnique({
    where: { id: meetingId },
    select: {
      id: true,
      title: true,
      status: true,
      workspaceId: true,
      startedAt: true,
      endedAt: true,
      transcript: { select: { segments: true } },
    },
  });

  if (!meeting) return Response.json({ error: "Not found" }, { status: 404 });

  const member = await db.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: meeting.workspaceId, userId } },
  });
  if (!member) return Response.json({ error: "Forbidden" }, { status: 403 });

  // Build transcript text from segments or use placeholder
  let transcriptText = "";
  if (meeting.transcript?.segments) {
    const segments = meeting.transcript.segments as Array<{
      speaker: string;
      text: string;
      startTime: number;
    }>;
    transcriptText = segments.map((s) => `${s.speaker}: ${s.text}`).join("\n");
  } else {
    transcriptText = `[Meeting: ${meeting.title}]\n[No transcript available — generating summary from meeting metadata]`;
  }

  const { output } = await generateText({
    model: anthropic("claude-sonnet-4-6"),
    output: Output.object({ schema: summarySchema }),
    prompt: `You are an expert meeting note-taker for a DevOps/engineering team.
Analyze the following meeting transcript and generate structured notes.

Meeting: ${meeting.title}
Date: ${meeting.startedAt ? new Date(meeting.startedAt).toLocaleString() : "Unknown"}

Transcript:
${transcriptText}

Generate comprehensive meeting notes that a busy engineer would find immediately useful.
Focus on technical decisions, action items, and next steps.`,
  });

  // Upsert summary
  await db.meetingSummary.upsert({
    where: { meetingId },
    create: {
      meetingId,
      summary: output.summary,
      keyPoints: output.keyPoints,
      actionItems: output.actionItems,
      decisions: output.decisions,
    },
    update: {
      summary: output.summary,
      keyPoints: output.keyPoints,
      actionItems: output.actionItems,
      decisions: output.decisions,
    },
  });

  return Response.json(output);
}
