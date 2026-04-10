import { auth } from "@clerk/nextjs/server";
import Ably from "ably";

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = new Ably.Rest({ key: process.env.ABLY_API_KEY! });
  const tokenParams = { clientId: userId };
  const tokenRequest = await client.auth.createTokenRequest(tokenParams);

  return Response.json(tokenRequest);
}
