import { motion } from "framer-motion";
import { ArrowLeft, CalendarIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import SignInForm from "@/components/sign-in-form";
import { getCurrentAuthUser } from "@/lib/auth-server";

export default async function SignIn() {
  const user = await getCurrentAuthUser();

  if (user) {
    redirect("/calendar");
  }

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

        <SignInForm />
      </div>
    </div>
  );
}
