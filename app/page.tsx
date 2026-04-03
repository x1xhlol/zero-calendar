"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRightIcon,
  BarChart3,
  Brain,
  CalendarIcon,
  Check,
  Clock,
  GitBranch,
  Globe,
  Keyboard,
  Lock,
  MessageSquare,
  Search,
  Sparkles,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  useEffect(() => {
    const handleScroll = () => {
      const heroHeight = window.innerHeight * 0.7;
      setIsScrolled(window.scrollY > heroHeight);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="grid-background pointer-events-none fixed inset-0 z-0" />

      <motion.header
        animate={{ y: 0, opacity: 1 }}
        className={`fixed left-1/2 z-50 -translate-x-1/2 transition-all duration-500 ease-in-out ${
          isScrolled ? "top-3" : "top-6"
        } w-[calc(100%-2rem)] max-w-6xl`}
        initial={{ y: -100, opacity: 0 }}
        style={{
          maxWidth: isScrolled ? "56rem" : "72rem",
        }}
        transition={{ duration: 0.6 }}
      >
        <div
          className={`glass-nav rounded-full border border-white/[0.08] backdrop-blur-xl transition-all duration-500 ease-in-out ${
            isScrolled ? "px-5 py-2.5" : "px-6 py-3"
          }`}
        >
          <div className="flex items-center justify-between">
            <Link className="group flex items-center gap-2.5" href="/">
              <div className="relative">
                <div
                  className={`flex items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.06] transition-all duration-500 ease-in-out group-hover:bg-white/[0.1] ${
                    isScrolled ? "h-7 w-7" : "h-8 w-8"
                  }`}
                >
                  <CalendarIcon
                    className={`text-white transition-all duration-500 ease-in-out ${
                      isScrolled ? "h-3.5 w-3.5" : "h-4 w-4"
                    }`}
                    strokeWidth={2}
                  />
                </div>
              </div>
              <span
                className={`font-semibold text-white transition-all duration-500 ease-in-out ${
                  isScrolled ? "text-sm" : "text-base"
                }`}
              >
                Zero
              </span>
            </Link>

            <nav
              className={`absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 transition-all duration-500 ease-in-out md:flex ${
                isScrolled ? "gap-6 opacity-90" : "gap-8 opacity-100"
              }`}
            >
              {["Features", "Pricing", "Docs"].map((item) => (
                <Link
                  className={`font-medium text-white/60 transition-all duration-300 hover:text-white ${
                    isScrolled ? "text-xs" : "text-sm"
                  }`}
                  href={`#${item.toLowerCase()}`}
                  key={item}
                >
                  {item}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <Link
                className={`hidden px-3 py-1.5 font-medium text-white/60 transition-all duration-500 ease-in-out hover:text-white md:block ${
                  isScrolled ? "text-xs" : "text-sm"
                }`}
                href="/auth/signin"
              >
                Sign in
              </Link>
              <Link
                className={`rounded-full bg-white font-medium text-black transition-all duration-500 ease-in-out hover:bg-white/90 ${
                  isScrolled ? "px-3.5 py-1.5 text-xs" : "px-4 py-1.5 text-sm"
                }`}
                href="/auth/signin"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </motion.header>
      {/* </CHANGE> */}

      <section
        className="relative flex min-h-screen items-center justify-center px-6 pt-32 pb-20"
        ref={containerRef}
      >
        <motion.div
          className="container mx-auto max-w-5xl"
          style={{ opacity, scale }}
        >
          <div className="space-y-8 text-center">
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto inline-flex"
              initial={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="glass inline-flex items-center gap-2 rounded-full border border-white/[0.08] px-3 py-1.5">
                <Sparkles className="h-3.5 w-3.5 text-white/80" />
                <span className="font-medium text-white/80 text-xs">
                  AI-Powered Scheduling
                </span>
              </div>
            </motion.div>

            <motion.h1
              animate={{ opacity: 1, y: 0 }}
              className="font-bold text-6xl leading-none tracking-tighter md:text-7xl lg:text-8xl"
              initial={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Calendar that
              <br />
              <span className="text-white">thinks ahead</span>
            </motion.h1>

            <motion.p
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto max-w-2xl text-lg text-white/50 leading-relaxed md:text-xl"
              initial={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              Zero learns your patterns and optimizes your schedule
              automatically.
              <br />
              Spend less time organizing. More time creating.
            </motion.p>

            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center gap-3 pt-4 sm:flex-row"
              initial={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Link
                className="group flex items-center gap-2 rounded-full bg-white px-6 py-3 font-medium text-black text-sm transition-all hover:bg-white/90"
                href="/auth/signin"
              >
                Start Free Trial
                <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                className="btn-glass flex items-center gap-2 rounded-full px-6 py-3 font-medium text-sm"
                href="#features"
              >
                <GitBranch className="h-4 w-4" />
                View on GitHub
              </Link>
            </motion.div>

            <motion.div
              animate={{ opacity: 1 }}
              className="pt-12 text-sm text-white/40"
              initial={{ opacity: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              Trusted by 10,000+ professionals worldwide
            </motion.div>
          </div>
        </motion.div>
      </section>

      <section className="relative px-6 py-32" id="features">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            className="mb-16 space-y-3 text-center"
            initial={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <h2 className="font-bold text-4xl tracking-tight md:text-5xl">
              Built for modern teams
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-white/50">
              Everything you need to take control of your time
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              {
                icon: Sparkles,
                title: "AI Intelligence",
                desc: "Learns your patterns and optimizes automatically",
                badge: "Smart",
              },
              {
                icon: Lock,
                title: "Privacy First",
                desc: "Your data never leaves your devices",
                badge: "Secure",
              },
              {
                icon: Zap,
                title: "Lightning Fast",
                desc: "Real-time sync across all platforms",
                badge: "Fast",
              },
            ].map((feature, idx) => (
              <div
                className="feature-card group cursor-pointer rounded-2xl p-8"
                key={idx}
              >
                <div className="relative space-y-6">
                  <div className="flex items-start justify-between">
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] transition-all duration-300 group-hover:border-white/[0.15] group-hover:bg-white/[0.08]">
                      <feature.icon
                        className="h-6 w-6 text-white/90"
                        strokeWidth={1.5}
                      />
                    </div>
                    <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 font-medium text-white/50 text-xs transition-all group-hover:bg-white/[0.08] group-hover:text-white/70">
                      {feature.badge}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <h3 className="font-semibold text-white/95 text-xl transition-colors group-hover:text-white">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-white/50 leading-relaxed transition-colors group-hover:text-white/60">
                      {feature.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* </CHANGE> */}
        </div>
      </section>

      <section
        className="relative border-white/[0.06] border-t px-6 py-32"
        id="pricing"
      >
        <div className="container mx-auto max-w-6xl">
          <motion.div
            className="mb-16 space-y-3 text-center"
            initial={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <h2 className="font-bold text-4xl tracking-tight md:text-5xl">
              Simple, transparent pricing
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-white/50">
              Get started for free during beta. No credit card required.
            </p>
          </motion.div>

          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
            <div className="pricing-card group relative rounded-3xl p-10">
              <div className="absolute top-8 right-8">
                <span className="rounded-full border border-white/[0.15] bg-white/[0.1] px-3 py-1.5 font-medium text-white text-xs backdrop-blur-sm">
                  Beta
                </span>
              </div>

              <div className="space-y-8">
                <div className="space-y-4">
                  <h3 className="font-bold text-2xl text-white/95">Free</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-6xl text-white tracking-tighter">
                      $0
                    </span>
                    <span className="text-lg text-white/40">/month</span>
                  </div>
                  <p className="text-sm text-white/50">
                    Everything free while in beta
                  </p>
                </div>

                <div className="space-y-4 pt-2">
                  {[
                    "AI-powered scheduling",
                    "Natural language events",
                    "Google Calendar sync",
                    "Smart conflict detection",
                    "Calendar analytics",
                    "Instant search",
                    "Time slot finder",
                    "Unlimited events",
                  ].map((feature, idx) => (
                    <div
                      className="group/item flex items-center gap-3"
                      key={idx}
                    >
                      <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.08] transition-all group-hover/item:bg-white/[0.12]">
                        <Check
                          className="h-3 w-3 text-white/80"
                          strokeWidth={2.5}
                        />
                      </div>
                      <span className="text-sm text-white/60 transition-colors group-hover/item:text-white/80">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                <Link
                  className="group/btn mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 font-semibold text-black text-sm transition-all hover:bg-white/90"
                  href="/auth/signin"
                >
                  Get Started
                  <ArrowRightIcon className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                </Link>
              </div>
            </div>

            <div className="pricing-card relative rounded-3xl p-10 opacity-70">
              <div className="absolute top-8 right-8">
                <span className="rounded-full border border-white/[0.12] bg-white/[0.08] px-3 py-1.5 font-medium text-white/70 text-xs backdrop-blur-sm">
                  Coming Soon
                </span>
              </div>

              <div className="space-y-8">
                <div className="space-y-4">
                  <h3 className="font-bold text-2xl text-white/80">Pro</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-6xl text-white/70 tracking-tighter">
                      TBA
                    </span>
                  </div>
                  <p className="text-sm text-white/40">
                    Advanced features for power users
                  </p>
                </div>

                <div className="space-y-4 pt-2">
                  {[
                    "Everything in Free",
                    "Advanced AI features",
                    "Team collaboration",
                    "Priority support",
                    "Custom integrations",
                    "Advanced analytics",
                    "API access",
                    "Custom branding",
                  ].map((feature, idx) => (
                    <div className="flex items-center gap-3" key={idx}>
                      <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04]">
                        <Check
                          className="h-3 w-3 text-white/40"
                          strokeWidth={2.5}
                        />
                      </div>
                      <span className="text-sm text-white/40">{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  className="mt-8 w-full cursor-not-allowed rounded-full border border-white/[0.08] bg-white/[0.06] px-6 py-3.5 font-semibold text-sm text-white/40"
                  disabled
                >
                  Coming Soon
                </button>
              </div>
            </div>
          </div>
          {/* </CHANGE> */}
        </div>
      </section>
      {/* </CHANGE> */}

      <section className="relative border-white/[0.06] border-t px-6 py-32">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            className="mb-16 space-y-3 text-center"
            initial={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <div className="glass mb-4 inline-flex items-center gap-2 rounded-full border border-white/[0.08] px-3 py-1.5">
              <Keyboard className="h-3.5 w-3.5 text-white/60" />
              <span className="font-medium text-white/60 text-xs uppercase tracking-wider">
                Productivity
              </span>
            </div>
            <h2 className="font-bold text-4xl tracking-tight md:text-5xl">
              Work at the speed of thought
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-white/50">
              Seamless integration with your existing workflow
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="feature-card-large group rounded-2xl p-10">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.06] transition-all duration-300 group-hover:border-white/[0.15] group-hover:bg-white/[0.1]">
                    <Globe
                      className="h-6 w-6 text-white/90"
                      strokeWidth={1.5}
                    />
                  </div>
                  <h3 className="font-semibold text-2xl text-white/95">
                    Google Calendar Sync
                  </h3>
                </div>
                <p className="text-[15px] text-white/50 leading-relaxed">
                  Bi-directional sync keeps everything in perfect harmony.
                  Changes made anywhere appear everywhere instantly. Full
                  control over calendar visibility and organization.
                </p>
              </div>
            </div>

            <div className="feature-card-large group rounded-2xl p-10">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.06] transition-all duration-300 group-hover:border-white/[0.15] group-hover:bg-white/[0.1]">
                    <BarChart3
                      className="h-6 w-6 text-white/90"
                      strokeWidth={1.5}
                    />
                  </div>
                  <h3 className="font-semibold text-2xl text-white/95">
                    Calendar Analytics
                  </h3>
                </div>
                <p className="text-[15px] text-white/50 leading-relaxed">
                  Gain insights into your time usage patterns. Track meeting
                  hours, identify your busiest days, and optimize your schedule
                  with comprehensive analytics and reporting.
                </p>
              </div>
            </div>
          </div>
          {/* </CHANGE> */}
        </div>
      </section>

      <section className="relative border-white/[0.06] border-t px-6 py-32">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            className="mb-16 space-y-3 text-center"
            initial={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <div className="glass mb-4 inline-flex items-center gap-2 rounded-full border border-white/[0.08] px-3 py-1.5">
              <Brain className="h-3.5 w-3.5 text-white/60" />
              <span className="font-medium text-white/60 text-xs uppercase tracking-wider">
                Intelligence
              </span>
            </div>
            <h2 className="font-bold text-4xl tracking-tight md:text-5xl">
              Talk to your calendar
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-white/50">
              Natural language processing meets intelligent scheduling
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {[
              {
                icon: MessageSquare,
                title: "Natural Language Events",
                desc: "Just say 'Meet with Sarah tomorrow at 3pm' and Zero creates it instantly. No forms, no clicking.",
                feature: "AI Parsing",
              },
              {
                icon: Brain,
                title: "Smart Conflict Detection",
                desc: "Zero analyzes your schedule in real-time and warns you about overlaps before they happen.",
                feature: "Proactive",
              },
              {
                icon: Search,
                title: "Instant Search",
                desc: "Find any event across years of history in milliseconds. Search by title, person, or location.",
                feature: "Fast",
              },
              {
                icon: Clock,
                title: "Time Slot Finder",
                desc: "Tell Zero how long you need, and it finds all available slots that match your preferences.",
                feature: "Automated",
              },
            ].map((item, idx) => (
              <div
                className="feature-card-large group rounded-2xl p-8"
                key={idx}
              >
                <div className="flex items-start gap-5">
                  <div className="flex-shrink-0">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.06] transition-all duration-300 group-hover:border-white/[0.15] group-hover:bg-white/[0.1]">
                      <item.icon
                        className="h-7 w-7 text-white/90"
                        strokeWidth={1.5}
                      />
                    </div>
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="font-semibold text-white/95 text-xl leading-snug">
                        {item.title}
                      </h3>
                      <span className="whitespace-nowrap rounded-full border border-white/[0.08] bg-white/[0.06] px-2.5 py-1 font-medium text-white/50 text-xs">
                        {item.feature}
                      </span>
                    </div>
                    <p className="text-[15px] text-white/50 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* </CHANGE> */}
        </div>
      </section>

      <section className="relative px-6 py-32">
        <div className="container mx-auto max-w-3xl">
          <motion.div
            className="feature-card-large group rounded-3xl p-12 text-center"
            initial={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <div className="space-y-6">
              <h2 className="font-bold text-4xl text-white/95 tracking-tight md:text-5xl">
                Ready to get started?
              </h2>
              <p className="mx-auto max-w-xl text-lg text-white/50 leading-relaxed">
                Join thousands of professionals using Zero to master their time
              </p>
              <div className="flex flex-col items-center justify-center gap-3 pt-4 sm:flex-row">
                <Link
                  className="group/btn flex items-center gap-2 rounded-full bg-white px-7 py-3.5 font-semibold text-black text-sm transition-all hover:bg-white/90"
                  href="/auth/signin"
                >
                  Start Free Trial
                  <ArrowRightIcon className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                </Link>
                <Link
                  className="btn-glass flex items-center gap-2 rounded-full px-7 py-3.5 font-semibold text-sm"
                  href="https://github.com"
                  target="_blank"
                >
                  <GitBranch className="h-4 w-4" />
                  View on GitHub
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="relative border-white/[0.06] border-t px-6 py-12">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded border border-white/[0.08] bg-white/[0.06]">
                <CalendarIcon
                  className="h-3.5 w-3.5 text-white"
                  strokeWidth={2}
                />
              </div>
              <span className="font-semibold text-sm text-white">Zero</span>
            </div>

            <div className="flex items-center gap-6 text-sm text-white/40">
              <Link
                className="transition-colors hover:text-white/60"
                href="/privacy"
              >
                Privacy
              </Link>
              <Link
                className="transition-colors hover:text-white/60"
                href="/terms"
              >
                Terms
              </Link>
              <Link
                className="transition-colors hover:text-white/60"
                href="/security"
              >
                Security
              </Link>
            </div>

            <div className="text-sm text-white/40">
              &copy; {new Date().getFullYear()} Zero. MIT License.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
