import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <Link className="mr-6 flex items-center space-x-2" href="/">
              <Image
                alt="Bedda Logo"
                className="h-6 w-6"
                height={24}
                priority
                src="/images/bedda-coral-icon-background-transparent.png"
                unoptimized
                width={24}
              />
              <span className="hidden font-bold sm:inline-block">
                bedda.ai
              </span>
            </Link>
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <Link
                className="transition-colors hover:text-foreground/80 text-foreground/60"
                href="/pricing"
              >
                Pricing
              </Link>
              <Link
                className="transition-colors hover:text-foreground/80 text-foreground/60"
                href="/roadmap"
              >
                Roadmap
              </Link>
            </nav>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-2">
            <nav className="flex items-center space-x-2">
              <Button asChild size="sm" variant="ghost">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">Get Started</Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-muted-foreground text-center text-sm leading-loose md:text-left">
            Built with{" "}
            <Link
              className="font-medium underline underline-offset-4"
              href="https://vercel.com/ai"
              target="_blank"
            >
              Vercel AI SDK
            </Link>
            . Open source on{" "}
            <Link
              className="font-medium underline underline-offset-4"
              href="https://github.com/bedda-tech/chat"
              target="_blank"
            >
              GitHub
            </Link>
            .
          </p>
        </div>
      </footer>
    </div>
  );
}
