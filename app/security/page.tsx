"use client";

import { motion } from "framer-motion";
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  BugIcon,
  CodeIcon,
  LockIcon,
  ServerIcon,
  ShieldIcon,
} from "lucide-react";
import Link from "next/link";

export default function Security() {
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
          <div className="mb-8 flex items-center gap-3">
            <ShieldIcon className="h-8 w-8 text-white" />
            <h1 className="font-bold text-4xl">Security</h1>
          </div>

          <div className="prose prose-invert max-w-none">
            <p className="mb-8 text-gray-400 text-lg">
              Zero Calendar is committed to ensuring the security of our users'
              data. This page outlines our security practices and provides
              information on how to report security vulnerabilities.
            </p>

            <div className="mb-12 grid gap-6 md:grid-cols-2">
              <div className="neo-card p-6">
                <div className="mb-4 flex items-center gap-3">
                  <LockIcon className="h-5 w-5 text-white" />
                  <h3 className="font-bold text-xl">Data Encryption</h3>
                </div>
                <p className="text-gray-400">
                  All data is encrypted in transit using TLS 1.3. Sensitive data
                  at rest is encrypted using industry-standard AES-256
                  encryption.
                </p>
              </div>

              <div className="neo-card p-6">
                <div className="mb-4 flex items-center gap-3">
                  <ServerIcon className="h-5 w-5 text-white" />
                  <h3 className="font-bold text-xl">Infrastructure</h3>
                </div>
                <p className="text-gray-400">
                  Our infrastructure is hosted on secure cloud providers with
                  SOC 2 compliance. We implement network security controls,
                  including firewalls and intrusion detection systems.
                </p>
              </div>

              <div className="neo-card p-6">
                <div className="mb-4 flex items-center gap-3">
                  <CodeIcon className="h-5 w-5 text-white" />
                  <h3 className="font-bold text-xl">Open Source</h3>
                </div>
                <p className="text-gray-400">
                  As an open-source project, our code is publicly available for
                  review. This transparency allows the community to identify and
                  address security issues quickly.
                </p>
              </div>

              <div className="neo-card p-6">
                <div className="mb-4 flex items-center gap-3">
                  <BugIcon className="h-5 w-5 text-white" />
                  <h3 className="font-bold text-xl">Bug Bounty</h3>
                </div>
                <p className="text-gray-400">
                  We maintain a bug bounty program to encourage responsible
                  disclosure of security vulnerabilities. See below for details
                  on how to report issues.
                </p>
              </div>
            </div>

            <h2 className="mt-8 mb-4 font-bold text-2xl">
              Our Security Practices
            </h2>
            <ul className="mt-2 mb-8 list-disc space-y-3 pl-6">
              <li>
                <strong>Authentication:</strong> We implement secure
                authentication mechanisms, including support for multi-factor
                authentication and secure password storage using bcrypt hashing.
              </li>
              <li>
                <strong>Regular Audits:</strong> We conduct regular security
                audits and code reviews to identify and address potential
                vulnerabilities.
              </li>
              <li>
                <strong>Dependency Management:</strong> We regularly update our
                dependencies to ensure we're protected against known
                vulnerabilities.
              </li>
              <li>
                <strong>Access Controls:</strong> We implement strict access
                controls to ensure that only authorized personnel have access to
                sensitive systems and data.
              </li>
              <li>
                <strong>Monitoring:</strong> We maintain comprehensive logging
                and monitoring systems to detect and respond to suspicious
                activities.
              </li>
            </ul>

            <div className="neo-card mb-8 border-yellow-500 border-l-4 p-6">
              <div className="flex items-start gap-3">
                <AlertTriangleIcon className="mt-1 h-6 w-6 flex-shrink-0 text-yellow-500" />
                <div>
                  <h3 className="mb-2 font-bold text-xl">
                    Reporting Security Issues
                  </h3>
                  <p className="mb-4 text-gray-400">
                    We take security issues seriously. If you believe you've
                    found a security vulnerability in Zero Calendar, please
                    report it to us immediately.
                  </p>
                  <p className="text-gray-400">
                    Send details to{" "}
                    <a
                      className="text-white underline"
                      href="mailto:lucknitelol@proton.me"
                    >
                      lucknitelol@proton.me
                    </a>
                    . We ask that you do not publicly disclose the issue until
                    we've had a chance to address it.
                  </p>
                </div>
              </div>
            </div>

            <h2 className="mt-8 mb-4 font-bold text-2xl">
              Self-Hosting Security
            </h2>
            <p>
              If you're self-hosting Zero Calendar, we recommend following these
              security best practices:
            </p>
            <ul className="mt-2 mb-8 list-disc space-y-3 pl-6">
              <li>Keep your server and all dependencies up to date</li>
              <li>Use HTTPS with a valid SSL certificate</li>
              <li>Implement proper firewall rules</li>
              <li>Use strong, unique passwords for all accounts</li>
              <li>Regularly back up your data</li>
              <li>Monitor your server for suspicious activities</li>
              <li>
                Follow the principle of least privilege for all user accounts
              </li>
            </ul>

            <h2 className="mt-8 mb-4 font-bold text-2xl">Security Updates</h2>
            <p>
              We regularly release security updates to address vulnerabilities.
              You can stay informed about these updates by:
            </p>
            <ul className="mt-2 mb-4 list-disc space-y-2 pl-6">
              <li>Following our GitHub repository</li>
              <li>Subscribing to our security mailing list</li>
              <li>Checking our blog for security announcements</li>
            </ul>

            <div className="mt-12 text-center">
              <p className="mb-4 text-gray-400">
                Have questions about our security practices?
              </p>
              <Link
                className="neo-brutalism-white inline-flex items-center justify-center gap-2 rounded-md px-6 py-3 font-medium"
                href="mailto:security@zerocalendar.com"
              >
                Contact Our Security Team
              </Link>
            </div>
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
