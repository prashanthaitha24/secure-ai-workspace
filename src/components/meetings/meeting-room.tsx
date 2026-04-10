"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Loader2, Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MeetingRoomProps {
  meetingId: string;
  workspaceId: string;
  userId: string;
  userName: string;
}

export function MeetingRoom({
  meetingId,
  workspaceId,
  userId,
  userName,
}: MeetingRoomProps) {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);

  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL!;

  const fetchToken = useCallback(async () => {
    setJoining(true);
    setError(null);
    try {
      const res = await fetch(`/api/meetings/${meetingId}/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identity: userId, name: userName }),
      });
      if (!res.ok) throw new Error("Failed to get meeting token");
      const data = await res.json();
      setToken(data.token);
      setJoined(true);

      // Mark meeting as LIVE
      await fetch(`/api/meetings/${meetingId}/start`, { method: "POST" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join meeting");
    } finally {
      setJoining(false);
    }
  }, [meetingId, userId, userName]);

  const handleDisconnect = useCallback(async () => {
    setJoined(false);
    setToken(null);
    // End the meeting if host
    await fetch(`/api/meetings/${meetingId}/end`, { method: "POST" });
  }, [meetingId]);

  if (joined && token) {
    return (
      <div className="h-full flex flex-col">
        <LiveKitRoom
          video={true}
          audio={true}
          token={token}
          serverUrl={livekitUrl}
          data-lk-theme="default"
          style={{ height: "100%" }}
          onDisconnected={handleDisconnect}
        >
          <VideoConference />
          <RoomAudioRenderer />
        </LiveKitRoom>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
      <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
        <Video className="h-8 w-8 text-primary" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Ready to join?</h2>
        <p className="text-muted-foreground text-sm">
          You&apos;ll join with your camera and microphone on.
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-md px-4 py-2 text-sm">
          {error}
        </div>
      )}

      <Button
        size="lg"
        onClick={fetchToken}
        disabled={joining}
        className="min-w-32 gap-2"
      >
        {joining ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Joining...
          </>
        ) : (
          <>
            <Video className="h-4 w-4" />
            Join Meeting
          </>
        )}
      </Button>
    </div>
  );
}
