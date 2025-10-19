"use client";

// import Image from "next/image";
import { User } from "lucide-react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { memo } from "react";
import { SidebarToggle } from "@/components/sidebar-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { guestRegex } from "@/lib/constants";
import { PlusIcon } from "./icons";
import { toast } from "./toast";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { VisibilitySelector, type VisibilityType } from "./visibility-selector";

function PureChatHeader({
  chatId,
  selectedVisibilityType,
  isReadonly,
}: {
  chatId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
}) {
  const router = useRouter();
  const { data, status } = useSession();
  const { setTheme, resolvedTheme } = useTheme();

  const isGuest = guestRegex.test(data?.user?.email ?? "");

  return (
    <header className="sticky top-0 flex items-center gap-2 bg-background px-2 py-1.5 md:px-2">
      <SidebarToggle />

      {!isReadonly && (
        <VisibilitySelector
          chatId={chatId}
          className="order-1 ml-auto"
          selectedVisibilityType={selectedVisibilityType}
        />
      )}

      {/* New Chat Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            className="order-2 ml-auto h-8 cursor-pointer px-2 md:ml-0 md:h-fit md:px-2"
            onClick={() => {
              router.push("/");
              router.refresh();
            }}
            variant="outline"
          >
            <PlusIcon />
            <span className="sr-only">New Chat</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>New Chat</TooltipContent>
      </Tooltip>

      {/* User Avatar Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {status === "loading" ? (
            <Button className="order-3 size-8 rounded-full p-0" variant="ghost">
              <div className="size-6 animate-pulse rounded-full bg-zinc-500/30" />
            </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="order-3 h-8 w-8 cursor-pointer"
                  data-testid="header-user-nav-button"
                  variant="outline"
                >
                  <User className="h-8 w-8" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>User Menu</TooltipContent>
            </Tooltip>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-56"
          data-testid="header-user-nav-menu"
        >
          <DropdownMenuItem
            className="cursor-pointer"
            data-testid="header-user-nav-item-theme"
            onSelect={() =>
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }
          >
            {`Toggle ${resolvedTheme === "light" ? "dark" : "light"} mode`}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild data-testid="header-user-nav-item-auth">
            <button
              className="w-full cursor-pointer"
              onClick={() => {
                if (status === "loading") {
                  toast({
                    type: "error",
                    description:
                      "Checking authentication status, please try again!",
                  });

                  return;
                }

                if (isGuest) {
                  router.push("/login");
                } else {
                  signOut({
                    redirectTo: "/",
                  });
                }
              }}
              type="button"
            >
              {isGuest ? "Login to your account" : "Sign out"}
            </button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  return (
    prevProps.chatId === nextProps.chatId &&
    prevProps.selectedVisibilityType === nextProps.selectedVisibilityType &&
    prevProps.isReadonly === nextProps.isReadonly
  );
});
