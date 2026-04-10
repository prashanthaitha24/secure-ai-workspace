import Ably from "ably";

let ablyClient: Ably.Realtime | null = null;

export function getAblyClient(): Ably.Realtime {
  if (!ablyClient) {
    ablyClient = new Ably.Realtime({
      authUrl: "/api/ably-auth",
      authMethod: "POST",
    });
  }
  return ablyClient;
}

export function getAblyServerClient(): Ably.Rest {
  return new Ably.Rest({ key: process.env.ABLY_API_KEY! });
}

export const CHANNEL_NAMES = {
  workspace: (workspaceId: string) => `workspace:${workspaceId}`,
  channel: (channelId: string) => `channel:${channelId}`,
  meeting: (meetingId: string) => `meeting:${meetingId}`,
  presence: (workspaceId: string) => `presence:${workspaceId}`,
} as const;

export const EVENTS = {
  MESSAGE_CREATED: "message.created",
  MESSAGE_UPDATED: "message.updated",
  MESSAGE_DELETED: "message.deleted",
  MEETING_STARTED: "meeting.started",
  MEETING_ENDED: "meeting.ended",
  TRANSCRIPT_UPDATED: "transcript.updated",
  SUMMARY_READY: "summary.ready",
} as const;
