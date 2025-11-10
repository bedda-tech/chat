import Link from "next/link";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SubscriptionCanceledPage() {
  return (
    <div className="container flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
            <XCircle className="h-6 w-6 text-orange-600" />
          </div>
          <CardTitle className="text-2xl">Subscription Canceled</CardTitle>
          <CardDescription>
            You canceled the subscription process
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm">
            No charges were made to your account. You can upgrade to a paid plan
            anytime from your settings.
          </p>
          <p className="text-muted-foreground text-sm">
            If you have questions about our plans or pricing, feel free to
            contact support.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 sm:flex-row">
          <Button asChild className="w-full">
            <Link href="/">Continue with Free Plan</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/pricing">View Pricing</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
