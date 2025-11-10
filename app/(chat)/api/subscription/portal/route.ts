import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import {
  createBillingPortalSession,
  getCustomerByEmail,
} from "@/lib/stripe";

export async function POST(_req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const customer = await getCustomerByEmail(session.user.email);

    if (!customer) {
      return NextResponse.json(
        { error: "No subscription found" },
        { status: 404 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const portalSession = await createBillingPortalSession({
      customerId: customer.id,
      returnUrl: `${baseUrl}/settings`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error("Error creating portal session:", error);
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 }
    );
  }
}
