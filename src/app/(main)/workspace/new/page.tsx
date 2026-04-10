import { NewWorkspaceForm } from "@/components/workspace/new-workspace-form";
import { ShieldCheck } from "lucide-react";

export default function NewWorkspacePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold">SecureAI</span>
          </div>
          <h1 className="text-xl font-semibold">Create a workspace</h1>
          <p className="text-sm text-muted-foreground mt-1">
            A workspace is a shared space for your team.
          </p>
        </div>
        <NewWorkspaceForm />
      </div>
    </div>
  );
}
