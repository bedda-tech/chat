"use client";

import Image from "next/image";
import Link from "next/link";
import type { User } from "next-auth";
import { RocketIcon } from "@/components/icons";
import { SidebarHistory } from "@/components/sidebar-history";
import { SidebarUserNav } from "@/components/sidebar-user-nav";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function AppSidebar({ user }: { user: User | undefined }) {
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar className="group-data-[side=left]:border-r-0">
      <SidebarHeader>
        <SidebarMenu>
          <Link
            className="flex flex-row items-center"
            href="/"
            onClick={() => {
              setOpenMobile(false);
            }}
          >
            <Image
              alt="Bedda Logo"
              className="h-8 w-8 shrink-0"
              height={32}
              priority
              src="/images/bedda-coral-icon-background-transparent.png"
              unoptimized
              width={32}
            />
            <span className="cursor-pointer rounded-md px-2 font-semibold text-lg hover:bg-muted">
              bedda.ai
            </span>
          </Link>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarHistory user={user} />
        <div className="mt-auto">
          <SidebarGroup>
            <SidebarGroupLabel>Docs</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link
                      href="/roadmap"
                      onClick={() => {
                        setOpenMobile(false);
                      }}
                    >
                      <RocketIcon />
                      <span>Roadmap</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>
      </SidebarContent>
      <SidebarFooter>{user && <SidebarUserNav user={user} />}</SidebarFooter>
    </Sidebar>
  );
}
