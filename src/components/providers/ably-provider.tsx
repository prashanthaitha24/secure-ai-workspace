"use client";

import * as Ably from "ably";
import { AblyProvider, ChannelProvider } from "ably/react";
import { useMemo } from "react";

interface AblyRealtimeProviderProps {
  children: React.ReactNode;
}

export function AblyRealtimeProvider({ children }: AblyRealtimeProviderProps) {
  const client = useMemo(
    () =>
      new Ably.Realtime({
        authUrl: "/api/ably-auth",
        authMethod: "POST",
      }),
    []
  );

  return <AblyProvider client={client}>{children}</AblyProvider>;
}
