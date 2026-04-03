"use client";

import { motion } from "framer-motion";
import { ArrowLeft, CalendarIcon } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function SignInForm() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/calendar";

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      setIsLoading(true);
      await authClient.signIn.social({
        provider: "google",
        callbackURL: callbackUrl,
      });
    } catch (_err) {
      setError("Failed to sign in. Please try again.");
      setIsLoading(false);
    }
  };

  const errorMessage = searchParams.get("error");

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-6 text-foreground">
      <div className="grid-background pointer-events-none fixed inset-0 z-0" />

      <div className="relative z-10 w-full max-w-md">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
        >
          <Link
            className="group inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white"
            href="/"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back
          </Link>
        </motion.div>

        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="mb-6 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.06]">
              <CalendarIcon className="h-6 w-6 text-white" strokeWidth={2} />
            </div>
          </div>
          <h1 className="mb-2 font-bold text-3xl">Sign in to Zero</h1>
          <p className="text-sm text-white/50">
            Continue with your Google account
          </p>
        </motion.div>

        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
          initial={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          {(error || errorMessage) && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-200 text-sm">
              {error || errorMessage}
            </div>
          )}

          <motion.button
            className="flex h-12 w-full items-center justify-center gap-3 rounded-xl bg-white font-medium text-black text-sm transition-all hover:bg-white/95 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLoading}
            onClick={handleGoogleSignIn}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
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
                <span>Continue with Google</span>
              </>
            )}
          </motion.button>

          <p className="pt-2 text-center text-white/40 text-xs">
            By continuing, you agree to our{" "}
            <Link
              className="underline transition-colors hover:text-white/60"
              href="/terms"
            >
              Terms
            </Link>{" "}
            and{" "}
            <Link
              className="underline transition-colors hover:text-white/60"
              href="/privacy"
            >
              Privacy Policy
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
