"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRightIcon, Check } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const ease = [0.16, 1, 0.3, 1] as const;

const STEPS = [
  {
    num: "01",
    title: "Connect",
    text: "Link your Google Calendar in one click. Zero syncs bi-directionally so everything stays in harmony.",
  },
  {
    num: "02",
    title: "Speak",
    text: '"Meet with Sarah tomorrow at 3pm" — Zero parses your intent and creates the event. No forms.',
  },
  {
    num: "03",
    title: "Optimize",
    text: "AI analyzes your patterns, detects conflicts, and finds open slots so your calendar works for you.",
  },
];

const CAPABILITIES = [
  {
    title: "AI Scheduling",
    text: "Learns your patterns. Optimizes automatically. Creates events from plain English.",
  },
  {
    title: "Conflict Detection",
    text: "Real-time analysis catches overlaps before they happen and suggests alternatives.",
  },
  {
    title: "Calendar Analytics",
    text: "Meeting hours, busiest days, and scheduling patterns — all at a glance.",
  },
  {
    title: "Instant Search",
    text: "Find any event across years of history in milliseconds by title, person, or location.",
  },
];

const PRICING_FEATURES = [
  "AI-powered scheduling",
  "Natural language events",
  "Google Calendar sync",
  "Conflict detection",
  "Calendar analytics",
  "Unlimited events",
  "Instant search",
  "Time slot finder",
];

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      viewBox="0 0 24 24"
    >
      <rect height="18" rx="2" width="18" x="3" y="4" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function FloatingNav({ scrolled }: { scrolled: boolean }) {
  return (
    <motion.header
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-5 right-0 left-0 z-50 flex justify-center px-6"
      initial={{ y: -40, opacity: 0 }}
      transition={{ duration: 0.8, ease }}
    >
      <nav
        className={`relative w-full max-w-2xl rounded-full border px-5 py-2.5 backdrop-blur-2xl transition-all duration-700 ${
          scrolled
            ? "border-white/[0.1] bg-background/90 shadow-[0_2px_40px_rgba(0,0,0,0.35)]"
            : "border-white/[0.06] bg-background/70"
        }`}
      >
        <div className="flex items-center justify-between">
          <Link className="flex items-center gap-2" href="/">
            <div className="flex h-6 w-6 items-center justify-center rounded-md border border-white/[0.1] bg-white/[0.05]">
              <CalendarIcon className="h-3 w-3 text-white/80" />
            </div>
            <span className="text-[13px] font-medium tracking-tight text-white/90">
              Zero
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              className="hidden text-[13px] text-white/35 transition-colors duration-300 hover:text-white/70 md:block"
              href="/auth/signin"
            >
              Sign in
            </Link>
            <Link
              className="rounded-full bg-white/95 px-3.5 py-1.5 text-[13px] font-medium text-black transition-all duration-300 hover:bg-white"
              href="/auth/signin"
            >
              Get Started
            </Link>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-0 hidden items-center justify-center md:flex">
          <div className="pointer-events-auto flex items-center gap-6">
            {["How it works", "Features", "Pricing"].map((item) => (
              <Link
                className="text-[13px] text-white/35 transition-colors duration-300 hover:text-white/70"
                href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                key={item}
              >
                {item}
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </motion.header>
  );
}

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.6], [1, 0.97]);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <div className="relative min-h-screen bg-background text-foreground selection:bg-white/10">
      <FloatingNav scrolled={scrolled} />

      {/* ────────────────────── Hero ────────────────────── */}
      <section className="relative" ref={heroRef}>
        <motion.div
          className="flex min-h-[100svh] flex-col items-center justify-center px-6"
          style={{ opacity: heroOpacity, scale: heroScale }}
        >
          <div className="mx-auto max-w-3xl text-center">
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3.5 py-1.5"
              initial={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.8, delay: 0.1, ease }}
            >
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
              <span className="text-[12px] font-medium text-white/45">
                Now in public beta
              </span>
            </motion.div>

            <motion.h1
              animate={{ opacity: 1, y: 0 }}
              className="text-[clamp(2.8rem,7vw,5.5rem)] font-semibold leading-[0.92] tracking-[-0.04em]"
              initial={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.9, delay: 0.2, ease }}
            >
              <span className="text-white">Calendar that</span>
              <br />
              <span className="text-white/30">thinks ahead</span>
            </motion.h1>

            <motion.p
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto mt-7 max-w-[26rem] text-[15px] leading-[1.7] text-white/40"
              initial={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.8, delay: 0.35, ease }}
            >
              Zero learns your habits, resolves conflicts, and creates events
              from plain language — so you spend less time organizing and more
              time creating.
            </motion.p>

            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="mt-10 flex items-center justify-center gap-3"
              initial={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.8, delay: 0.5, ease }}
            >
              <Link
                className="group inline-flex items-center gap-2 rounded-full bg-white/95 px-5 py-2.5 text-[13px] font-medium text-black transition-all duration-300 hover:bg-white"
                href="/auth/signin"
              >
                Start for free
                <ArrowRightIcon className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
              <Link
                className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] px-5 py-2.5 text-[13px] font-medium text-white/50 transition-all duration-300 hover:border-white/[0.14] hover:text-white/75"
                href="#features"
              >
                See how it works
              </Link>
            </motion.div>
          </div>
        </motion.div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* ────────────────────── How it works ────────────────────── */}
      <section className="relative px-6 pt-20 pb-32" id="how-it-works">
        <div className="mx-auto max-w-5xl">
          <motion.div
            className="mb-16"
            initial={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.7, ease }}
            viewport={{ once: true, margin: "-80px" }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.2em] text-white/25">
              How it works
            </p>
            <h2 className="max-w-lg text-[clamp(1.6rem,3.5vw,2.5rem)] font-semibold leading-[1.15] tracking-[-0.025em] text-white/90">
              Three steps to a smarter calendar.
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {STEPS.map((step, idx) => (
              <motion.div
                className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 transition-colors duration-500 hover:border-white/[0.1] hover:bg-white/[0.04]"
                initial={{ opacity: 0, y: 20 }}
                key={step.num}
                transition={{ duration: 0.6, delay: idx * 0.1, ease }}
                viewport={{ once: true, margin: "-50px" }}
                whileInView={{ opacity: 1, y: 0 }}
              >
                <span className="mb-5 block font-mono text-[11px] text-white/20">
                  {step.num}
                </span>
                <h3 className="mb-2 text-[17px] font-medium text-white/85 transition-colors duration-500 group-hover:text-white">
                  {step.title}
                </h3>
                <p className="text-[14px] leading-[1.65] text-white/40 transition-colors duration-500 group-hover:text-white/55">
                  {step.text}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────────── Capabilities bento ────────────────────── */}
      <section className="relative px-6 py-32" id="features">
        <div className="mx-auto max-w-5xl">
          <motion.div
            className="mb-16"
            initial={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.7, ease }}
            viewport={{ once: true, margin: "-80px" }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.2em] text-white/25">
              Capabilities
            </p>
            <h2 className="max-w-lg text-[clamp(1.6rem,3.5vw,2.5rem)] font-semibold leading-[1.15] tracking-[-0.025em] text-white/90">
              Built for the way
              <br />
              <span className="text-white/30">you actually work.</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {CAPABILITIES.map((cap, idx) => (
              <motion.div
                className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-10 transition-all duration-500 hover:border-white/[0.1] hover:bg-white/[0.04]"
                initial={{ opacity: 0, y: 20 }}
                key={cap.title}
                transition={{ duration: 0.6, delay: idx * 0.08, ease }}
                viewport={{ once: true, margin: "-50px" }}
                whileInView={{ opacity: 1, y: 0 }}
              >
                <h3 className="mb-3 text-[18px] font-medium tracking-[-0.01em] text-white/85 transition-colors duration-500 group-hover:text-white">
                  {cap.title}
                </h3>
                <p className="max-w-sm text-[14px] leading-[1.7] text-white/40 transition-colors duration-500 group-hover:text-white/55">
                  {cap.text}
                </p>
                <div className="pointer-events-none absolute -right-6 -bottom-6 h-32 w-32 rounded-full bg-white/[0.02] opacity-0 blur-2xl transition-opacity duration-700 group-hover:opacity-100" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────────── Full-width feature band ────────────────────── */}
      <section className="relative overflow-hidden border-y border-white/[0.04]">
        <div className="mx-auto grid max-w-5xl grid-cols-1 md:grid-cols-2">
          <motion.div
            className="flex flex-col justify-center px-6 py-20 md:px-12 md:py-28"
            initial={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.7, ease }}
            viewport={{ once: true, margin: "-80px" }}
            whileInView={{ opacity: 1, x: 0 }}
          >
            <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.2em] text-white/25">
              Intelligence
            </p>
            <h2 className="mb-4 text-[clamp(1.5rem,3vw,2.2rem)] font-semibold leading-[1.15] tracking-[-0.02em] text-white/90">
              Talk to your calendar
            </h2>
            <p className="max-w-sm text-[14px] leading-[1.7] text-white/40">
              Tell Zero what you need in plain language. It understands context,
              duration, preferences, and time zones — then creates the perfect
              event in seconds.
            </p>
            <Link
              className="group mt-8 inline-flex w-fit items-center gap-2 text-[13px] font-medium text-white/50 transition-colors duration-300 hover:text-white/80"
              href="/auth/signin"
            >
              Try it now
              <ArrowRightIcon className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
          </motion.div>
          <motion.div
            className="flex items-center justify-center border-t border-white/[0.04] bg-white/[0.015] px-6 py-20 md:border-t-0 md:border-l md:px-12 md:py-28"
            initial={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.7, delay: 0.1, ease }}
            viewport={{ once: true, margin: "-80px" }}
            whileInView={{ opacity: 1, x: 0 }}
          >
            <div className="w-full max-w-xs space-y-3">
              {[
                { msg: "Schedule a team standup every Monday at 9am", align: "self-end" },
                { msg: "Done — recurring event created on your work calendar.", align: "self-start" },
                { msg: "Move my dentist appointment to next Thursday", align: "self-end" },
                { msg: "Moved to Thursday, March 27 at 2:00 PM.", align: "self-start" },
              ].map((bubble, i) => (
                <motion.div
                  className={`flex ${bubble.align === "self-end" ? "justify-end" : "justify-start"}`}
                  initial={{ opacity: 0, y: 10 }}
                  key={bubble.msg}
                  transition={{ duration: 0.5, delay: 0.2 + i * 0.12, ease }}
                  viewport={{ once: true }}
                  whileInView={{ opacity: 1, y: 0 }}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[13px] leading-[1.5] ${
                      bubble.align === "self-end"
                        ? "rounded-br-md bg-white/[0.08] text-white/60"
                        : "rounded-bl-md border border-white/[0.06] bg-white/[0.03] text-white/45"
                    }`}
                  >
                    {bubble.msg}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ────────────────────── Pricing ────────────────────── */}
      <section className="relative px-6 py-32" id="pricing">
        <div className="mx-auto max-w-4xl">
          <motion.div
            className="mb-16"
            initial={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.7, ease }}
            viewport={{ once: true, margin: "-80px" }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.2em] text-white/25">
              Pricing
            </p>
            <h2 className="max-w-md text-[clamp(1.6rem,3.5vw,2.5rem)] font-semibold leading-[1.15] tracking-[-0.025em] text-white/90">
              Simple and transparent.
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* Free */}
            <motion.div
              className="group relative rounded-2xl border border-white/[0.07] bg-white/[0.025] p-10 transition-all duration-500 hover:border-white/[0.12]"
              initial={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.6, ease }}
              viewport={{ once: true, margin: "-50px" }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <div className="mb-6 flex items-center justify-between">
                <p className="text-[12px] font-medium uppercase tracking-[0.15em] text-white/30">
                  Free
                </p>
                <span className="rounded-full border border-white/[0.1] bg-white/[0.05] px-2.5 py-1 text-[11px] font-medium text-white/45">
                  Forever
                </span>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-[3.2rem] font-semibold tracking-[-0.04em] text-white">
                  $0
                </span>
                <span className="text-[14px] text-white/25">/month</span>
              </div>
              <p className="mt-2 text-[14px] leading-[1.7] text-white/35">
                Every feature, always free. Bring your own OpenRouter API key.
              </p>

              <div className="mt-8 space-y-3">
                {PRICING_FEATURES.map((f) => (
                  <div className="flex items-center gap-2.5" key={f}>
                    <div className="flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.04]">
                      <Check
                        className="h-2.5 w-2.5 text-white/50"
                        strokeWidth={2.5}
                      />
                    </div>
                    <span className="text-[13px] text-white/45">{f}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2.5">
                  <div className="flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.04]">
                    <Check
                      className="h-2.5 w-2.5 text-white/50"
                      strokeWidth={2.5}
                    />
                  </div>
                  <span className="text-[13px] text-white/45">
                    BYO API key
                    <span className="ml-1 text-white/25">(configurable in settings)</span>
                  </span>
                </div>
              </div>

              <Link
                className="group/btn mt-10 flex w-full items-center justify-center gap-2 rounded-full bg-white/95 py-3 text-[13px] font-medium text-black transition-all duration-300 hover:bg-white"
                href="/auth/signin"
              >
                Get started
                <ArrowRightIcon className="h-3.5 w-3.5 transition-transform duration-300 group-hover/btn:translate-x-0.5" />
              </Link>
            </motion.div>

            {/* Pro */}
            <motion.div
              className="relative rounded-2xl border border-white/[0.05] bg-white/[0.015] p-10"
              initial={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: 0.1, ease }}
              viewport={{ once: true, margin: "-50px" }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <div className="mb-6 flex items-center justify-between">
                <p className="text-[12px] font-medium uppercase tracking-[0.15em] text-white/25">
                  Pro
                </p>
                <span className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-white/30">
                  Coming soon
                </span>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-[3.2rem] font-semibold tracking-[-0.04em] text-white/45">
                  TBD
                </span>
                <span className="text-[14px] text-white/20">/month</span>
              </div>
              <p className="mt-2 text-[14px] leading-[1.7] text-white/25">
                For teams and power users. API key included.
              </p>

              <div className="mt-8 space-y-3">
                {[
                  "Everything in Free",
                  "API key included",
                  "Team collaboration",
                  "Priority support",
                  "Custom integrations",
                  "API access",
                  "Advanced analytics",
                  "Custom branding",
                ].map((f) => (
                  <div className="flex items-center gap-2.5" key={f}>
                    <div className="flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.02]">
                      <Check
                        className="h-2.5 w-2.5 text-white/22"
                        strokeWidth={2.5}
                      />
                    </div>
                    <span className="text-[13px] text-white/25">{f}</span>
                  </div>
                ))}
              </div>

              <div className="mt-10 w-full cursor-not-allowed rounded-full border border-white/[0.06] bg-white/[0.03] py-3 text-center text-[13px] font-medium text-white/25">
                Coming soon
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ────────────────────── CTA ────────────────────── */}
      <section className="px-6 py-32">
        <motion.div
          className="mx-auto max-w-xl text-center"
          initial={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.7, ease }}
          viewport={{ once: true, margin: "-80px" }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-[clamp(1.6rem,3.5vw,2.5rem)] font-semibold leading-[1.15] tracking-[-0.025em] text-white">
            Ready to start?
          </h2>
          <p className="mx-auto mt-4 max-w-xs text-[14px] leading-[1.7] text-white/35">
            Join professionals using Zero to take back control of their time.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              className="group inline-flex items-center gap-2 rounded-full bg-white/95 px-6 py-3 text-[13px] font-medium text-black transition-all duration-300 hover:bg-white"
              href="/auth/signin"
            >
              Start free trial
              <ArrowRightIcon className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ────────────────────── Footer ────────────────────── */}
      <footer className="border-t border-white/[0.04] px-6 py-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded border border-white/[0.08] bg-white/[0.04]">
              <CalendarIcon className="h-2.5 w-2.5 text-white/60" />
            </div>
            <span className="text-[13px] font-medium text-white/45">Zero</span>
          </div>

          <div className="flex items-center gap-5">
            {[
              { label: "Privacy", href: "/privacy" },
              { label: "Terms", href: "/terms" },
              { label: "Security", href: "/security" },
            ].map((link) => (
              <Link
                className="text-[12px] text-white/22 transition-colors duration-300 hover:text-white/45"
                href={link.href}
                key={link.label}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <p className="text-[12px] text-white/18">
            &copy; {new Date().getFullYear()} Zero
          </p>
        </div>
      </footer>
    </div>
  );
}
