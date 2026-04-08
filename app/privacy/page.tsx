"use client";

import { motion } from "framer-motion";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

export default function PrivacyPolicy() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a] text-white">
      {/* Decorative background elements */}
      <div className="noise-filter pointer-events-none fixed inset-0 opacity-20" />

      {/* Header */}
      <header className="relative z-10 border-white/10 border-b py-6">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center">
            <Link
              className="flex items-center gap-2 text-gray-400 transition-colors hover:text-white"
              href="/"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span>Back to home</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <motion.main
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 py-12 md:py-16"
        initial={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto max-w-3xl px-4 md:px-6">
          <h1 className="mb-8 font-bold text-4xl">Privacy Policy</h1>

          <div className="prose prose-invert max-w-none">
            <p className="mb-8 text-gray-400 text-lg">
              Last updated: May 11, 2025
            </p>

            <h2 className="mt-8 mb-4 font-bold text-2xl">Introduction</h2>
            <p>
              Zero Calendar ("we", "our", or "us") is committed to protecting
              your privacy. This Privacy Policy explains how we collect, use,
              disclose, and safeguard your information when you use our calendar
              application and website (collectively, the "Service").
            </p>
            <p>
              Please read this Privacy Policy carefully. By accessing or using
              the Service, you acknowledge that you have read, understood, and
              agree to be bound by all the terms of this Privacy Policy.
            </p>

            <h2 className="mt-8 mb-4 font-bold text-2xl">
              Information We Collect
            </h2>
            <p>
              We collect information that you provide directly to us when you:
            </p>
            <ul className="mt-2 mb-4 list-disc space-y-2 pl-6">
              <li>Create an account</li>
              <li>Use the calendar features</li>
              <li>Connect third-party services</li>
              <li>Contact our support team</li>
              <li>Respond to surveys or communications</li>
            </ul>
            <p>This information may include:</p>
            <ul className="mt-2 mb-4 list-disc space-y-2 pl-6">
              <li>Personal identifiers (name, email address)</li>
              <li>
                Authentication information (excluding passwords, which are
                securely hashed)
              </li>
              <li>Calendar data (events, schedules, preferences)</li>
              <li>Usage data and analytics</li>
            </ul>

            <h2 className="mt-8 mb-4 font-bold text-2xl">
              How We Use Your Information
            </h2>
            <p>We use the information we collect to:</p>
            <ul className="mt-2 mb-4 list-disc space-y-2 pl-6">
              <li>Provide, maintain, and improve the Service</li>
              <li>Process and complete transactions</li>
              <li>Send you technical notices, updates, and support messages</li>
              <li>Respond to your comments, questions, and requests</li>
              <li>Develop new features and services</li>
              <li>Monitor and analyze trends, usage, and activities</li>
              <li>
                Detect, investigate, and prevent fraudulent transactions and
                other illegal activities
              </li>
              <li>Personalize and improve your experience</li>
            </ul>

            <h2 className="mt-8 mb-4 font-bold text-2xl">
              Data Storage and Security
            </h2>
            <p>
              As an open-source application, Zero Calendar can be self-hosted,
              which means your data may be stored on your own servers or with a
              hosting provider of your choice. For our hosted version, we use
              industry-standard security measures to protect your data.
            </p>
            <p>
              We implement appropriate technical and organizational measures to
              protect the security of your personal information. However, please
              be aware that no method of transmission over the Internet or
              method of electronic storage is 100% secure.
            </p>

            <h2 className="mt-8 mb-4 font-bold text-2xl">
              Third-Party Services
            </h2>
            <p>
              Zero Calendar may integrate with third-party services, such as
              Google Calendar. When you connect these services, you may be
              allowing us to access information from those services. The
              information we receive depends on the settings and privacy
              policies of those third-party services.
            </p>

            <h2 className="mt-8 mb-4 font-bold text-2xl">
              Your Rights and Choices
            </h2>
            <p>You have several rights regarding your personal information:</p>
            <ul className="mt-2 mb-4 list-disc space-y-2 pl-6">
              <li>
                Access and update your information through your account settings
              </li>
              <li>Request deletion of your data</li>
              <li>Opt out of marketing communications</li>
              <li>Choose whether to connect third-party services</li>
            </ul>
            <p>
              If you're hosting Zero Calendar yourself, you have complete
              control over your data and can manage it according to your own
              policies.
            </p>

            <h2 className="mt-8 mb-4 font-bold text-2xl">
              Changes to This Privacy Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. We will
              notify you of any changes by posting the new Privacy Policy on
              this page and updating the "Last updated" date.
            </p>
            <p>
              You are advised to review this Privacy Policy periodically for any
              changes. Changes to this Privacy Policy are effective when they
              are posted on this page.
            </p>

            <h2 className="mt-8 mb-4 font-bold text-2xl">Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please
              contact us at:
            </p>
            <p className="mt-2">
              <a
                className="text-white underline"
                href="mailto:privacy@zerocalendar.com"
              >
                privacy@zerocalendar.com
              </a>
            </p>
          </div>
        </div>
      </motion.main>

      {/* Footer */}
      <footer className="relative z-10 border-white/10 border-t py-6">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Zero Calendar. Open Source under
            MIT License.
          </div>
        </div>
      </footer>
    </div>
  );
}
