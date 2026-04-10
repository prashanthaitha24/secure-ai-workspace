import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Zap, Lock, Bot } from "lucide-react";

export default async function HomePage() {
  const { userId } = await auth();

  if (userId) {
    const membership = await db.workspaceMember.findFirst({
      where: { userId },
      orderBy: { joinedAt: "asc" },
      select: { workspaceId: true },
    });
    redirect(membership ? `/workspace/${membership.workspaceId}` : "/workspace/new");
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-semibold">SecureAI</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" render={<Link href="/sign-in" />}>
            Sign in
          </Button>
          <Button size="sm" render={<Link href="/sign-up" />}>
            Get started
          </Button>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center gap-8 py-20">
        <div className="space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
            <ShieldCheck className="h-3.5 w-3.5" />
            Built for DevOps &amp; SRE teams
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Secure AI workspace for
            <br />
            <span className="text-primary">engineering teams</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Encrypted chat, AI-powered meeting notes, video calls, and incident
            collaboration — all in one secure platform.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button size="lg" render={<Link href="/sign-up" />}>
            Start for free
          </Button>
          <Button size="lg" variant="outline" render={<Link href="/sign-in" />}>
            Sign in
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 max-w-3xl w-full">
          {[
            {
              icon: Lock,
              title: "Encrypted by default",
              description:
                "TLS 1.3 in transit, AES-256 at rest. Immutable audit logs for every action.",
            },
            {
              icon: Bot,
              title: "AI meeting notes",
              description:
                "Automatic transcripts, summaries, and action items after every call.",
            },
            {
              icon: Zap,
              title: "Built for incidents",
              description:
                "Incident channels, on-call integrations, and SRE-aware AI assistant.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="p-4 rounded-lg border border-border bg-card text-left"
            >
              <feature.icon className="h-5 w-5 text-primary mb-2" />
              <h3 className="font-semibold text-sm">{feature.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
