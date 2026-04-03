"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface ThemeToggleProps {
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "outline" | "ghost";
}

export function ThemeToggle({
  variant = "ghost",
  size = "icon",
  className = "",
}: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        className={`h-9 w-9 rounded-md ${className}`}
        disabled
        size={size}
        variant={variant}
      />
    );
  }

  return (
    <Button
      aria-label="Toggle theme"
      className={`h-9 w-9 rounded-md ${className}`}
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      size={size}
      variant={variant}
    >
      {theme === "dark" ? (
        <SunIcon className="h-4 w-4 transition-all" />
      ) : (
        <MoonIcon className="h-4 w-4 transition-all" />
      )}
    </Button>
  );
}
