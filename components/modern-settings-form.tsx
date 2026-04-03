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
import { useTheme } from "next-themes";
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

const formSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
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

const NAV_ITEMS: { id: SettingsSection; label: string; icon: React.ElementType }[] = [
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
  const { setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<SettingsSection>("appearance");

  const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      theme: initialPreferences.theme || "system",
      defaultView: initialPreferences.defaultView || "month",
      showWeekends: initialPreferences.showWeekends !== false,
      showWeekNumbers: initialPreferences.showWeekNumbers,
      defaultDuration: initialPreferences.defaultDuration || "60",
      timezone: initialPreferences.timezone || detectedTimezone,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!userId) {
      toast({ title: "Error", description: "You must be logged in", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, preferences: values }),
      });

      if (!response.ok) throw new Error("Failed to save preferences");
      setTheme(values.theme);
      toast({ title: "Settings saved", description: "Your preferences have been updated" });
    } catch {
      toast({ title: "Error", description: "Failed to save preferences", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Navigation Rail */}
      <div className="flex w-[220px] flex-shrink-0 flex-col border-r border-white/[0.06]">
        <div className="border-b border-white/[0.06] p-5">
          <Link className="flex items-center gap-2.5 text-white/50 transition-colors hover:text-white/80" href="/calendar">
            <ArrowLeftIcon className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">Back to Calendar</span>
          </Link>
          <h1 className="mt-4 text-lg font-bold tracking-tight">Settings</h1>
        </div>

        <nav className="flex-1 space-y-0.5 p-3">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              className={cn(
                "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-medium transition-all",
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
        <div className="border-t border-white/[0.06] p-3">
          <div className="flex items-center gap-2.5 rounded-xl px-3 py-2">
            <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full">
              {userImage ? (
                <img alt={userName} className="h-full w-full object-cover" src={userImage} />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500/40 to-blue-600/40 text-xs font-semibold text-white">
                  {userName?.[0] || "U"}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-white/80">{userName}</p>
              <p className="truncate text-[10px] text-white/30">{userEmail}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-8 py-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              {/* Appearance Section */}
              {activeSection === "appearance" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-base font-bold">Appearance</h2>
                    <p className="mt-1 text-xs text-white/40">Customize how your calendar looks</p>
                  </div>

                  <div className="liquid-glass-subtle space-y-5 rounded-2xl p-5">
                    <FormField
                      control={form.control}
                      name="theme"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel className="text-xs font-medium text-white/70">Theme</FormLabel>
                            <Select
                              defaultValue={field.value}
                              onValueChange={(v) => { field.onChange(v); setTheme(v); }}
                            >
                              <FormControl>
                                <SelectTrigger className="h-8 w-32 rounded-lg border-white/[0.06] bg-white/[0.03] text-[11px]">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="liquid-glass-elevated rounded-xl border-white/[0.08]">
                                <SelectItem value="light">Light</SelectItem>
                                <SelectItem value="dark">Dark</SelectItem>
                                <SelectItem value="system">System</SelectItem>
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
                      name="defaultView"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel className="text-xs font-medium text-white/70">Default View</FormLabel>
                            <Select defaultValue={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger className="h-8 w-32 rounded-lg border-white/[0.06] bg-white/[0.03] text-[11px]">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="liquid-glass-elevated rounded-xl border-white/[0.08]">
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
                          <div className="flex items-center justify-between">
                            <div>
                              <FormLabel className="text-xs font-medium text-white/70">Show Weekends</FormLabel>
                              <p className="text-[10px] text-white/30">Display Saturday and Sunday</p>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
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
                          <div className="flex items-center justify-between">
                            <div>
                              <FormLabel className="text-xs font-medium text-white/70">Week Numbers</FormLabel>
                              <p className="text-[10px] text-white/30">Show week number in calendar</p>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button
                    className="h-9 w-full rounded-xl bg-white text-xs font-medium text-black hover:bg-white/90"
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
                    <h2 className="text-base font-bold">Time & Events</h2>
                    <p className="mt-1 text-xs text-white/40">Configure time and event defaults</p>
                  </div>

                  <div className="liquid-glass-subtle space-y-5 rounded-2xl p-5">
                    <FormField
                      control={form.control}
                      name="timezone"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <div>
                              <FormLabel className="text-xs font-medium text-white/70">Timezone</FormLabel>
                              <p className="text-[10px] text-white/30">Detected: {detectedTimezone}</p>
                            </div>
                            <Select defaultValue={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger className="h-8 w-48 rounded-lg border-white/[0.06] bg-white/[0.03] text-[11px]">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="liquid-glass-elevated max-h-[200px] rounded-xl border-white/[0.08]">
                                {Intl.supportedValuesOf("timeZone").map((tz) => (
                                  <SelectItem key={tz} value={tz}>{tz.replace(/_/g, " ")}</SelectItem>
                                ))}
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
                          <div className="flex items-center justify-between">
                            <div>
                              <FormLabel className="text-xs font-medium text-white/70">Default Duration</FormLabel>
                              <p className="text-[10px] text-white/30">For newly created events</p>
                            </div>
                            <Select defaultValue={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger className="h-8 w-32 rounded-lg border-white/[0.06] bg-white/[0.03] text-[11px]">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="liquid-glass-elevated rounded-xl border-white/[0.08]">
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
                    className="h-9 w-full rounded-xl bg-white text-xs font-medium text-black hover:bg-white/90"
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
                <h2 className="text-base font-bold">Integrations</h2>
                <p className="mt-1 text-xs text-white/40">Connect and manage calendar services</p>
              </div>

              <div className="space-y-3">
                <div className="liquid-glass-subtle flex items-center justify-between rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03]">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-white/80">Google Calendar</p>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        {userProvider === "google" ? (
                          <>
                            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                            <span className="text-[10px] text-emerald-400/80">Connected</span>
                          </>
                        ) : (
                          <>
                            <div className="h-1.5 w-1.5 rounded-full bg-white/20" />
                            <span className="text-[10px] text-white/30">Not connected</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {userProvider === "google" && (
                    <span className="rounded-lg bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium text-emerald-400">Active</span>
                  )}
                </div>

                <div className="liquid-glass-subtle flex items-center justify-between rounded-2xl p-4 opacity-40">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03]">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 1h10v10H1z" fill="#f25022" />
                        <path d="M1 13h10v10H1z" fill="#00a4ef" />
                        <path d="M13 1h10v10H13z" fill="#7fba00" />
                        <path d="M13 13h10v10H13z" fill="#ffb900" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-white/50">Outlook Calendar</p>
                      <span className="text-[10px] text-white/25">Coming soon</span>
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
                <h2 className="text-base font-bold">Account</h2>
                <p className="mt-1 text-xs text-white/40">Manage your account</p>
              </div>

              <div className="liquid-glass-subtle rounded-2xl p-5">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-2xl ring-2 ring-white/[0.08]">
                    {userImage ? (
                      <img alt={userName} className="h-full w-full object-cover" src={userImage} />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500/30 to-blue-600/30 text-lg font-bold text-white">
                        {userName?.[0] || "U"}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white/90">{userName}</p>
                    <p className="mt-0.5 text-xs text-white/40">{userEmail}</p>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      <span className="text-[10px] text-white/40">Signed in with Google</span>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                className="h-9 w-full rounded-xl border border-red-500/20 bg-red-500/10 text-xs font-medium text-red-400 hover:bg-red-500/20"
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
