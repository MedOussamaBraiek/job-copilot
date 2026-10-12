"use client";

import Link from "next/link";
import { Show, UserButton, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export const AppHeader = () => {
  const { user } = useUser();
  const isAdmin = user?.publicMetadata?.role === "admin";

  return (
    <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur">
      <div className="container mx-auto flex items-center justify-between p-4">
        <Link href="/" className="text-2xl font-bold">
          Job Copilot
        </Link>

        <Show when="signed-out">
          <Button variant="outline" size="sm" render={<Link href="/sign-in" />} nativeButton={false}>
            Sign in
          </Button>
        </Show>

        <Show when="signed-in">
          <div className="flex items-center gap-4">
            {isAdmin && (
              <Link href="/admin" className="text-sm text-gray-600 hover:text-gray-900">
                Admin
              </Link>
            )}
            <UserButton />
          </div>
        </Show>
      </div>
    </header>
  );
};
