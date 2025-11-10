import { redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import { UsageDisplay } from "@/components/usage-display";
import { SubscriptionManagement } from "@/components/subscription-management";
import { getUserTier } from "@/lib/usage/tracking";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const tier = await getUserTier(session.user.id);

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-8">
      <div className="mb-8">
        <h1 className="font-bold text-3xl tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your subscription and view your usage
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <SubscriptionManagement currentTier={tier} />
        </div>
        <div>
          <UsageDisplay />
        </div>
      </div>
    </div>
  );
}
