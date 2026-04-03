"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeftIcon,
  ClockIcon,
  LogOutIcon,
  PaletteIcon,
  PlugIcon,
  UserIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

/** Opaque menu surface (settings selects sit over glass cards; avoid see-through popovers). */
const settingsSelectContent =
  "rounded-xl border border-white/[0.14] !bg-[#101010] text-popover-foreground shadow-2xl ring-1 ring-white/12";
const settingsSelectTrigger =
  "h-10 w-full rounded-xl border-white/[0.1] bg-white/[0.07] px-3 text-xs hover:bg-white/[0.1] md:h-8 md:rounded-lg md:text-[11px]";
const settingsCard = "liquid-glass-subtle space-y-5 rounded-2xl p-4 md:p-5";
const settingsRow =
  "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between";

const formSchema = z.object({
  defaultView: z.enum(["month", "week", "day"]),
  showWeekends: z.boolean(),
  showWeekNumbers: z.boolean(),
  defaultDuration: z.enum(["30", "60", "90"]),
  timezone: z.string().default("UTC"),
});

interface ModernSettingsFormProps {
  initialPreferences: any;
  userEmail: string;
  userId: string;
  userImage: string;
  userName: string;
  userProvider: string;
}

type SettingsSection = "appearance" | "time" | "integrations" | "account";

const NAV_ITEMS: {
  id: SettingsSection;
  label: string;
  icon: React.ElementType;
}[] = [
  { id: "appearance", label: "Appearance", icon: PaletteIcon },
  { id: "time", label: "Time & Events", icon: ClockIcon },
  { id: "integrations", label: "Integrations", icon: PlugIcon },
  { id: "account", label: "Account", icon: UserIcon },
];

export function ModernSettingsForm({
  initialPreferences,
  userId,
  userEmail,
  userName,
  userImage,
  userProvider,
}: ModernSettingsFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeSection, setActiveSection] =
    useState<SettingsSection>("appearance");

  const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      defaultView: initialPreferences.defaultView || "month",
      showWeekends: initialPreferences.showWeekends !== false,
      showWeekNumbers: initialPreferences.showWeekNumbers,
      defaultDuration: initialPreferences.defaultDuration || "60",
      timezone: initialPreferences.timezone || detectedTimezone,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!userId) {
      toast({
        title: "Error",
        description: "You must be logged in",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, preferences: values }),
      });

      if (!response.ok) {
        throw new Error("Failed to save preferences");
      }
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to save preferences",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col overflow-hidden md:h-screen md:flex-row">
      {/* Navigation Rail */}
      <div className="flex flex-shrink-0 flex-col border-white/[0.06] border-b md:w-[220px] md:border-r md:border-b-0">
        <div className="border-white/[0.06] border-b px-4 pt-5 pb-4 md:p-5">
          <Link
            className="flex items-center gap-2.5 text-white/50 transition-colors hover:text-white/80"
            href="/calendar"
          >
            <ArrowLeftIcon className="h-4 w-4 md:h-3.5 md:w-3.5" />
            <span className="font-medium text-xs">Back to Calendar</span>
          </Link>
          <div className="mt-4 flex items-start justify-between gap-3 md:block">
            <div>
              <h1 className="font-bold text-xl tracking-tight md:text-lg">
                Settings
              </h1>
              <p className="mt-1 text-white/35 text-xs md:hidden">
                Personalize Zero for smaller screens and daily flow.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 md:hidden">
              <div className="h-7 w-7 flex-shrink-0 overflow-hidden rounded-full">
                {userImage ? (
                  <img
                    alt={userName}
                    className="h-full w-full object-cover"
                    src={userImage}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500/40 to-blue-600/40 font-semibold text-white text-xs">
                    {userName?.[0] || "U"}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="max-w-[7rem] truncate font-medium text-[11px] text-white/80">
                  {userName}
                </p>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex gap-2 overflow-x-auto px-4 py-3 md:flex-1 md:flex-col md:space-y-0.5 md:overflow-visible md:p-3">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              className={cn(
                "flex flex-shrink-0 items-center gap-2.5 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-left font-medium text-xs transition-all md:w-full",
                activeSection === id
                  ? "liquid-glass-subtle text-white"
                  : "text-white/40 hover:bg-white/[0.03] hover:text-white/60"
              )}
              key={id}
              onClick={() => setActiveSection(id)}
              type="button"
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </nav>

        {/* User Card */}
        <div className="hidden border-white/[0.06] border-t p-3 md:block">
          <div className="flex items-center gap-2.5 rounded-xl px-3 py-2">
            <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full">
              {userImage ? (
                <img
                  alt={userName}
                  className="h-full w-full object-cover"
                  src={userImage}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500/40 to-blue-600/40 font-semibold text-white text-xs">
                  {userName?.[0] || "U"}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-white/80 text-xs">
                {userName}
              </p>
              <p className="truncate text-[10px] text-white/30">{userEmail}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:px-6 md:px-8 md:py-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              {/* Appearance Section */}
              {activeSection === "appearance" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-bold text-lg md:text-base">
                      Appearance
                    </h2>
                    <p className="mt-1 text-sm text-white/40 md:text-xs">
                      Customize how your calendar looks
                    </p>
                  </div>

                  <div className={settingsCard}>
                    <FormField
                      control={form.control}
                      name="defaultView"
                      render={({ field }) => (
                        <FormItem>
                          <div className={settingsRow}>
                            <FormLabel className="font-medium text-sm text-white/70 md:text-xs">
                              Default View
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger
                                  className={cn(
                                    settingsSelectTrigger,
                                    "sm:w-36 md:w-32"
                                  )}
                                >
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent
                                className={cn(
                                  settingsSelectContent,
                                  "max-h-[280px]"
                                )}
                              >
                                <SelectItem value="month">Month</SelectItem>
                                <SelectItem value="week">Week</SelectItem>
                                <SelectItem value="day">Day</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="h-px bg-white/[0.04]" />

                    <FormField
                      control={form.control}
                      name="showWeekends"
                      render={({ field }) => (
                        <FormItem>
                          <div className={settingsRow}>
                            <div>
                              <FormLabel className="font-medium text-sm text-white/70 md:text-xs">
                                Show Weekends
                              </FormLabel>
                              <p className="text-white/30 text-xs md:text-[10px]">
                                Display Saturday and Sunday
                              </p>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </div>
                        </FormItem>
                      )}
                    />

                    <div className="h-px bg-white/[0.04]" />

                    <FormField
                      control={form.control}
                      name="showWeekNumbers"
                      render={({ field }) => (
                        <FormItem>
                          <div className={settingsRow}>
                            <div>
                              <FormLabel className="font-medium text-sm text-white/70 md:text-xs">
                                Week Numbers
                              </FormLabel>
                              <p className="text-white/30 text-xs md:text-[10px]">
                                Show week number in calendar
                              </p>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button
                    className="h-11 w-full rounded-2xl bg-white font-medium text-black text-sm hover:bg-white/90 md:h-9 md:rounded-xl md:text-xs"
                    disabled={isLoading}
                    type="submit"
                  >
                    {isLoading ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              )}

              {/* Time & Events Section */}
              {activeSection === "time" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-bold text-lg md:text-base">
                      Time & Events
                    </h2>
                    <p className="mt-1 text-sm text-white/40 md:text-xs">
                      Configure time and event defaults
                    </p>
                  </div>

                  <div className={settingsCard}>
                    <FormField
                      control={form.control}
                      name="timezone"
                      render={({ field }) => (
                        <FormItem>
                          <div className={settingsRow}>
                            <div>
                              <FormLabel className="font-medium text-sm text-white/70 md:text-xs">
                                Timezone
                              </FormLabel>
                              <p className="text-white/30 text-xs md:text-[10px]">
                                Detected: {detectedTimezone}
                              </p>
                            </div>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger
                                  className={cn(
                                    settingsSelectTrigger,
                                    "sm:w-64 md:w-48"
                                  )}
                                >
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent
                                className={cn(
                                  settingsSelectContent,
                                  "max-h-[55dvh] min-w-[var(--anchor-width)] sm:max-w-none"
                                )}
                              >
                                {Intl.supportedValuesOf("timeZone").map(
                                  (tz) => (
                                    <SelectItem key={tz} value={tz}>
                                      {tz.replace(/_/g, " ")}
                                    </SelectItem>
                                  )
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="h-px bg-white/[0.04]" />

                    <FormField
                      control={form.control}
                      name="defaultDuration"
                      render={({ field }) => (
                        <FormItem>
                          <div className={settingsRow}>
                            <div>
                              <FormLabel className="font-medium text-sm text-white/70 md:text-xs">
                                Default Duration
                              </FormLabel>
                              <p className="text-white/30 text-xs md:text-[10px]">
                                For newly created events
                              </p>
                            </div>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger
                                  className={cn(
                                    settingsSelectTrigger,
                                    "sm:w-36 md:w-32"
                                  )}
                                >
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent
                                className={cn(
                                  settingsSelectContent,
                                  "max-h-[280px]"
                                )}
                              >
                                <SelectItem value="30">30 min</SelectItem>
                                <SelectItem value="60">1 hour</SelectItem>
                                <SelectItem value="90">1.5 hours</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button
                    className="h-11 w-full rounded-2xl bg-white font-medium text-black text-sm hover:bg-white/90 md:h-9 md:rounded-xl md:text-xs"
                    disabled={isLoading}
                    type="submit"
                  >
                    {isLoading ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              )}
            </form>
          </Form>

          {/* Integrations Section */}
          {activeSection === "integrations" && (
            <div className="space-y-6">
              <div>
                <h2 className="font-bold text-lg md:text-base">Integrations</h2>
                <p className="mt-1 text-sm text-white/40 md:text-xs">
                  Connect and manage calendar services
                </p>
              </div>

              <div className="space-y-3">
                <div className="liquid-glass-subtle flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03]">
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-white/80 text-xs">
                        Google Calendar
                      </p>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        {userProvider === "google" ? (
                          <>
                            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                            <span className="text-[10px] text-emerald-400/80">
                              Connected
                            </span>
                          </>
                        ) : (
                          <>
                            <div className="h-1.5 w-1.5 rounded-full bg-white/20" />
                            <span className="text-[10px] text-white/30">
                              Not connected
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {userProvider === "google" && (
                    <span className="w-fit rounded-lg bg-emerald-500/10 px-2.5 py-1 font-medium text-[10px] text-emerald-400">
                      Active
                    </span>
                  )}
                </div>

                <div className="liquid-glass-subtle flex flex-col gap-4 rounded-2xl p-4 opacity-40 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03]">
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M1 1h10v10H1z" fill="#f25022" />
                        <path d="M1 13h10v10H1z" fill="#00a4ef" />
                        <path d="M13 1h10v10H13z" fill="#7fba00" />
                        <path d="M13 13h10v10H13z" fill="#ffb900" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-white/50 text-xs">
                        Outlook Calendar
                      </p>
                      <span className="text-[10px] text-white/25">
                        Coming soon
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Account Section */}
          {activeSection === "account" && (
            <div className="space-y-6">
              <div>
                <h2 className="font-bold text-lg md:text-base">Account</h2>
                <p className="mt-1 text-sm text-white/40 md:text-xs">
                  Manage your account
                </p>
              </div>

              <div className="liquid-glass-subtle rounded-2xl p-4 md:p-5">
                <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                  <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-2xl ring-2 ring-white/[0.08]">
                    {userImage ? (
                      <img
                        alt={userName}
                        className="h-full w-full object-cover"
                        src={userImage}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500/30 to-blue-600/30 font-bold text-lg text-white">
                        {userName?.[0] || "U"}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-white/90">
                      {userName}
                    </p>
                    <p className="mt-0.5 text-white/40 text-xs">{userEmail}</p>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      <span className="text-[10px] text-white/40">
                        Signed in with Google
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                className="h-11 w-full rounded-2xl border border-red-500/20 bg-red-500/10 font-medium text-red-400 text-sm hover:bg-red-500/20 md:h-9 md:rounded-xl md:text-xs"
                onClick={async () => {
                  await authClient.signOut();
                  window.location.href = "/";
                }}
                variant="ghost"
              >
                <LogOutIcon className="mr-2 h-3.5 w-3.5" />
                Sign Out
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
