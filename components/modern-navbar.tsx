"use client";

import { motion } from "framer-motion";
import {
  CalendarIcon,
  LogOutIcon,
  SettingsIcon,
  Sparkles,
  UserIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export function ModernNavbar() {
  const { data: session } = authClient.useSession();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { href: "/calendar", label: "Calendar", icon: CalendarIcon },
    { href: "/settings", label: "Settings", icon: SettingsIcon },
  ];

  return (
    <motion.header
      animate={{ y: 0, opacity: 1 }}
      className={cn(
        "fixed top-0 right-0 left-0 z-50 transition-all duration-500 ease-in-out",
        isScrolled ? "py-3" : "py-4"
      )}
      initial={{ y: -100, opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="container mx-auto max-w-7xl px-6">
        <div
          className={cn(
            "glass-nav rounded-full border border-white/[0.08] backdrop-blur-xl transition-all duration-500",
            isScrolled ? "px-5 py-2.5" : "px-6 py-3"
          )}
        >
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link
              className="group flex items-center gap-2.5"
              href="/calendar"
              prefetch
            >
              <div className="relative">
                <div
                  className={cn(
                    "flex items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.06] transition-all duration-500 group-hover:bg-white/[0.1]",
                    isScrolled ? "h-7 w-7" : "h-8 w-8"
                  )}
                >
                  <CalendarIcon
                    className={cn(
                      "text-white transition-all duration-500",
                      isScrolled ? "h-3.5 w-3.5" : "h-4 w-4"
                    )}
                    strokeWidth={2}
                  />
                </div>
              </div>
              <span
                className={cn(
                  "font-semibold text-white transition-all duration-500",
                  isScrolled ? "text-sm" : "text-base"
                )}
              >
                Zero
              </span>
            </Link>

            {/* Navigation */}
            <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-2 md:flex">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link href={item.href} key={item.href} prefetch>
                    <Button
                      className={cn(
                        "relative rounded-full transition-all duration-300",
                        isScrolled ? "h-8 px-3 text-xs" : "h-9 px-4 text-sm",
                        isActive
                          ? "bg-white/[0.12] text-white"
                          : "text-white/60 hover:bg-white/[0.08] hover:text-white"
                      )}
                      size="sm"
                      variant="ghost"
                    >
                      <Icon
                        className={cn(
                          "mr-1.5",
                          isScrolled ? "h-3 w-3" : "h-3.5 w-3.5"
                        )}
                      />
                      {item.label}
                      {isActive && (
                        <motion.div
                          className="absolute inset-0 -z-10 rounded-full bg-white/[0.08]"
                          layoutId="active-nav"
                          transition={{
                            type: "spring",
                            bounce: 0.2,
                            duration: 0.6,
                          }}
                        />
                      )}
                    </Button>
                  </Link>
                );
              })}
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-2">
              <Button
                className={cn(
                  "hidden items-center gap-1.5 rounded-full text-white/60 transition-all duration-300 hover:bg-white/[0.08] hover:text-white md:flex",
                  isScrolled ? "h-8 px-3 text-xs" : "h-9 px-3 text-sm"
                )}
                size="sm"
                variant="ghost"
              >
                <Sparkles
                  className={cn(isScrolled ? "h-3 w-3" : "h-3.5 w-3.5")}
                />
                <span>AI</span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    className={cn(
                      "overflow-hidden rounded-full border border-white/[0.08] bg-white/[0.08] transition-all duration-300 hover:bg-white/[0.12]",
                      isScrolled ? "h-8 w-8" : "h-9 w-9"
                    )}
                    size="icon"
                    variant="ghost"
                  >
                    {session?.user?.image ? (
                      <img
                        alt={session.user.name || "User"}
                        className="h-full w-full object-cover"
                        src={session.user.image || "/placeholder.svg"}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 font-semibold text-sm text-white">
                        {session?.user?.name?.[0] || (
                          <UserIcon className="h-4 w-4" />
                        )}
                      </div>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="glass mt-2 w-56 rounded-xl border-white/[0.08] p-1 shadow-xl"
                >
                  <DropdownMenuLabel className="px-3 py-2">
                    <div className="flex flex-col space-y-1">
                      <p className="font-semibold text-sm text-white">
                        {session?.user?.name || "User"}
                      </p>
                      <p className="text-white/50 text-xs">
                        {session?.user?.email || ""}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/[0.08]" />
                  <DropdownMenuItem className="cursor-pointer rounded-lg text-white/80 hover:text-white focus:bg-white/[0.08] focus:text-white">
                    <UserIcon className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer rounded-lg text-white/80 hover:text-white focus:bg-white/[0.08] focus:text-white"
                    onClick={() => (window.location.href = "/settings")}
                  >
                    <SettingsIcon className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/[0.08]" />
                  <DropdownMenuItem
                    className="cursor-pointer rounded-lg text-red-400 hover:text-red-300 focus:bg-white/[0.08] focus:text-red-300"
                    onClick={async () => {
                      await authClient.signOut();
                      window.location.href = "/";
                    }}
                  >
                    <LogOutIcon className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
