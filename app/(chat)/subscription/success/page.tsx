import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SubscriptionSuccessPage() {
  return (
    <div className="container flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Subscription Successful!</CardTitle>
          <CardDescription>
            Your subscription has been activated
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm">
            Thank you for subscribing! Your account has been upgraded and you
            now have access to all the features of your plan.
          </p>
          <p className="text-muted-foreground text-sm">
            You can view your usage and manage your subscription in your
            settings.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 sm:flex-row">
          <Button asChild className="w-full">
            <Link href="/">Start Chatting</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/settings">View Settings</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
