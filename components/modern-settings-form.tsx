"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormDescription,
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
      toast({
        title: "Error",
        description: "You must be logged in to save preferences",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          preferences: values,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save preferences");
      }

      setTheme(values.theme);

      toast({
        title: "Settings saved",
        description: "Your preferences have been updated successfully",
      });
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to save your preferences",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with user profile and back button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/calendar" prefetch>
            <Button
              className="h-10 w-10 rounded-lg border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08]"
              size="icon"
              variant="ghost"
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="font-bold text-3xl tracking-tight">Settings</h1>
            <p className="mt-1 text-white/50">
              Manage your calendar preferences and integrations
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className="h-10 w-10 overflow-hidden rounded-full border border-white/[0.08] bg-white/[0.08] p-0 hover:bg-white/[0.12]"
              size="icon"
              variant="ghost"
            >
              {userImage ? (
                <img
                  alt={userName}
                  className="h-full w-full object-cover"
                  src={userImage || "/placeholder.svg"}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 font-semibold text-sm text-white">
                  {userName?.[0] || "U"}
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
                <p className="font-semibold text-sm text-white">{userName}</p>
                <p className="text-white/50 text-xs">{userEmail}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/[0.08]" />
            <DropdownMenuItem className="cursor-pointer rounded-lg text-white/80 hover:text-white focus:bg-white/[0.08] focus:text-white">
              Profile
            </DropdownMenuItem>
            <Link href="/calendar" prefetch>
              <DropdownMenuItem className="cursor-pointer rounded-lg text-white/80 hover:text-white focus:bg-white/[0.08] focus:text-white">
                Calendar
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator className="bg-white/[0.08]" />
            <DropdownMenuItem
              className="cursor-pointer rounded-lg text-red-400 hover:text-red-300 focus:bg-white/[0.08] focus:text-red-300"
              onClick={async () => {
                await authClient.signOut();
                window.location.href = "/";
              }}
            >
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Calendar Preferences */}
        <div className="feature-card h-fit rounded-2xl p-6">
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="font-bold text-xl">Appearance</h2>
              <p className="text-sm text-white/50">
                Customize how your calendar looks
              </p>
            </div>

            <Form {...form}>
              <form
                className="space-y-6"
                onSubmit={form.handleSubmit(onSubmit)}
              >
                {/* Theme */}
                <FormField
                  control={form.control}
                  name="theme"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-white/90">
                        Theme
                      </FormLabel>
                      <Select
                        defaultValue={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          setTheme(value);
                        }}
                      >
                        <FormControl>
                          <SelectTrigger className="h-10 rounded-lg border-white/[0.08] bg-white/[0.04]">
                            <SelectValue placeholder="Select a theme" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="glass border-white/[0.08]">
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="system">System</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-white/40 text-xs">
                        Choose your preferred theme
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Default View */}
                <FormField
                  control={form.control}
                  name="defaultView"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-white/90">
                        Default View
                      </FormLabel>
                      <Select
                        defaultValue={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="h-10 rounded-lg border-white/[0.08] bg-white/[0.04]">
                            <SelectValue placeholder="Select default view" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="glass border-white/[0.08]">
                          <SelectItem value="month">Month</SelectItem>
                          <SelectItem value="week">Week</SelectItem>
                          <SelectItem value="day">Day</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-white/40 text-xs">
                        Choose your default calendar view
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="showWeekends"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-white/[0.08] bg-white/[0.02] p-3 transition-colors hover:bg-white/[0.04]">
                      <div className="space-y-0.5">
                        <FormLabel className="cursor-pointer text-sm text-white/90">
                          Show Weekends
                        </FormLabel>
                        <FormDescription className="text-white/40 text-xs">
                          Display weekend days
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="showWeekNumbers"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-white/[0.08] bg-white/[0.02] p-3 transition-colors hover:bg-white/[0.04]">
                      <div className="space-y-0.5">
                        <FormLabel className="cursor-pointer text-sm text-white/90">
                          Show Week Numbers
                        </FormLabel>
                        <FormDescription className="text-white/40 text-xs">
                          Display week numbers
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <Button
                  className="h-10 w-full rounded-lg bg-white font-medium text-black hover:bg-white/90"
                  disabled={isLoading}
                  type="submit"
                >
                  {isLoading ? "Saving..." : "Save Appearance"}
                </Button>
              </form>
            </Form>
          </div>
        </div>

        {/* Time & Events Settings */}
        <div className="feature-card h-fit rounded-2xl p-6">
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="font-bold text-xl">Time & Events</h2>
              <p className="text-sm text-white/50">
                Configure time and event defaults
              </p>
            </div>

            <Form {...form}>
              <form
                className="space-y-6"
                onSubmit={form.handleSubmit(onSubmit)}
              >
                <FormField
                  control={form.control}
                  name="timezone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-white/90">
                        Timezone
                      </FormLabel>
                      <Select
                        defaultValue={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="h-10 rounded-lg border-white/[0.08] bg-white/[0.04]">
                            <SelectValue placeholder="Select your timezone" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="glass max-h-[200px] border-white/[0.08]">
                          {Intl.supportedValuesOf("timeZone")
                            .slice(0, 50)
                            .map((timezone) => (
                              <SelectItem key={timezone} value={timezone}>
                                {timezone.replace(/_/g, " ")}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Default Duration */}
                <FormField
                  control={form.control}
                  name="defaultDuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-white/90">
                        Default Event Duration
                      </FormLabel>
                      <Select
                        defaultValue={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="h-10 rounded-lg border-white/[0.08] bg-white/[0.04]">
                            <SelectValue placeholder="Select default duration" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="glass border-white/[0.08]">
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                          <SelectItem value="90">1.5 hours</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-white/40 text-xs">
                        Default duration for new events
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  className="h-10 w-full rounded-lg bg-white font-medium text-black hover:bg-white/90"
                  disabled={isLoading}
                  type="submit"
                >
                  {isLoading ? "Saving..." : "Save Time Settings"}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </div>

      <div className="feature-card rounded-2xl p-6">
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="font-bold text-xl">Calendar Integrations</h2>
            <p className="text-sm text-white/50">
              Connect and manage your calendar services
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Google Calendar */}
            <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.04]">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.06]">
                  <svg
                    className="h-5 w-5"
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
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold text-sm text-white/90">
                    Google Calendar
                  </h3>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    {userProvider === "google" ? (
                      <>
                        <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                        <span className="text-white/70 text-xs">Connected</span>
                      </>
                    ) : (
                      <>
                        <div className="h-1.5 w-1.5 rounded-full bg-white/30" />
                        <span className="text-white/50 text-xs">
                          Not Connected
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Microsoft/Outlook - Coming Soon */}
            <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.01] p-4 opacity-50">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04]">
                  <svg
                    className="h-5 w-5 opacity-60"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M1 1h10v10H1z" fill="#f25022" />
                    <path d="M1 13h10v10H1z" fill="#00a4ef" />
                    <path d="M13 1h10v10H13z" fill="#7fba00" />
                    <path d="M13 13h10v10H13z" fill="#ffb900" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold text-sm text-white/50">
                    Outlook Calendar
                  </h3>
                  <span className="rounded-full border border-white/[0.08] bg-white/[0.06] px-2 py-0.5 text-white/40 text-xs">
                    Coming Soon
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
