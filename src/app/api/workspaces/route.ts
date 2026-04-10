import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(2).max(80),
  slug: z
    .string()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9-]+$/),
  description: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await db.workspace.findUnique({
    where: { slug: parsed.data.slug },
  });
  if (existing) {
    return Response.json(
      { error: "A workspace with that URL already exists. Choose a different name." },
      { status: 409 }
    );
  }

  const workspace = await db.$transaction(async (tx) => {
    const ws = await tx.workspace.create({
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        description: parsed.data.description,
        ownerId: userId,
      },
    });

    // Add creator as owner
    await tx.workspaceMember.create({
      data: { workspaceId: ws.id, userId, role: "OWNER" },
    });

    // Seed default channels
    await tx.channel.createMany({
      data: [
        { workspaceId: ws.id, name: "general", type: "PUBLIC", createdById: userId },
        { workspaceId: ws.id, name: "incidents", type: "PUBLIC", createdById: userId },
        { workspaceId: ws.id, name: "deployments", type: "PUBLIC", createdById: userId },
      ],
    });

    return ws;
  });

  return Response.json(workspace, { status: 201 });
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const memberships = await db.workspaceMember.findMany({
    where: { userId },
    include: {
      workspace: {
        select: { id: true, name: true, slug: true, logoUrl: true },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  return Response.json(memberships.map((m) => m.workspace));
}
