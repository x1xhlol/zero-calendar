"use client";

import { AlertCircleIcon, CheckIcon, RefreshCwIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function GoogleCalendarSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch("/api/calendars/google-list");
        if (!response.ok) {
          setIsConnected(false);
          return;
        }

        const data = await response.json();
        setIsConnected(Boolean(data.connected));
      } catch (error) {
        console.error("Error checking Google Calendar connection:", error);
        setIsConnected(false);
      }
    };

    checkConnection();
  }, []);

  const handleSync = async () => {
    if (!isConnected) {
      toast({
        title: "Google Calendar not connected",
        description: "Please connect your Google Calendar first",
        variant: "destructive",
      });
      return;
    }

    setIsSyncing(true);
    setSyncStatus("idle");

    try {
      const response = await fetch("/api/calendar/sync", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to sync with Google Calendar");
      }

      setSyncStatus("success");
      toast({
        title: "Sync successful",
        description: "Your calendar has been synced with Google Calendar",
      });

      setTimeout(() => {
        setSyncStatus("idle");
      }, 3000);
    } catch (error: any) {
      setSyncStatus("error");
      toast({
        title: "Sync failed",
        description: error.message || "Failed to sync with Google Calendar",
        variant: "destructive",
      });

      setTimeout(() => {
        setSyncStatus("idle");
      }, 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isConnected) {
    return (
      <Button
        className="flex items-center gap-2 opacity-70"
        disabled
        size="sm"
        variant="outline"
      >
        <AlertCircleIcon className="h-4 w-4" />
        Google Calendar not connected
      </Button>
    );
  }

  return (
    <Button
      className={`flex items-center gap-2 ${
        syncStatus === "success"
          ? "border-green-200 bg-green-50 text-green-700"
          : syncStatus === "error"
            ? "border-red-200 bg-red-50 text-red-700"
            : ""
      }`}
      disabled={isSyncing}
      onClick={handleSync}
      size="sm"
      variant="outline"
    >
      {isSyncing ? (
        <RefreshCwIcon className="h-4 w-4 animate-spin" />
      ) : syncStatus === "success" ? (
        <CheckIcon className="h-4 w-4 text-green-600" />
      ) : syncStatus === "error" ? (
        <AlertCircleIcon className="h-4 w-4 text-red-600" />
      ) : (
        <RefreshCwIcon className="h-4 w-4" />
      )}
      {isSyncing
        ? "Syncing..."
        : syncStatus === "success"
          ? "Sync complete"
          : syncStatus === "error"
            ? "Sync failed"
            : "Sync with Google Calendar"}
    </Button>
  );
}
