import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";

export default function TermsOfService() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pt-20 pb-12 px-4">
      <div className="container mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Button
            variant="ghost"
            className="mb-6 text-muted-foreground hover:text-foreground"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <div className="flex items-center gap-3 mb-8">
            <FileText className="h-8 w-8 text-primary" />
            <h1 className="font-display text-3xl font-bold text-foreground">Terms of Service</h1>
          </div>

          <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
            <p className="text-sm">Last updated: May 17, 2026</p>

            <section className="rounded-xl border border-border bg-card/60 p-6 backdrop-blur-sm space-y-4">
              <h2 className="font-display text-xl font-semibold text-foreground">1. Service Description</h2>
              <p>
                DistroForge is a web-based tool that lets you configure a custom Debian-based Linux distribution
                by selecting desktop environments, applications, themes, wallpapers, and bootloader settings.
                The actual ISO compilation and image building happens on your own machine using the configuration
                files we generate — DistroForge does not host, build, or distribute ISO files.
              </p>
            </section>

            <section className="rounded-xl border border-border bg-card/60 p-6 backdrop-blur-sm space-y-4">
              <h2 className="font-display text-xl font-semibold text-foreground">2. Account & Eligibility</h2>
              <p>
                You must create an account to use the builder and save configurations. You may sign up with email
                and password or Google OAuth. You must be at least 13 years old to use the service. You are
                responsible for keeping your account credentials secure.
              </p>
            </section>

            <section className="rounded-xl border border-border bg-card/60 p-6 backdrop-blur-sm space-y-4">
              <h2 className="font-display text-xl font-semibold text-foreground">3. User Content</h2>
              <p>
                You retain ownership of your distro configurations and uploaded wallpapers. By uploading wallpapers,
                you grant us a limited license to store and serve them to you as part of your configuration.
                You may delete your configurations or your entire account at any time from the Account page.
                Deleting your account will permanently remove all your stored configs, profile data, and uploaded files.
              </p>
            </section>

            <section className="rounded-xl border border-border bg-card/60 p-6 backdrop-blur-sm space-y-4">
              <h2 className="font-display text-xl font-semibold text-foreground">4. Acceptable Use</h2>
              <p>You agree not to:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Use DistroForge to generate configs for illegal activities.</li>
                <li>Attempt to access other users' data or admin-only areas.</li>
                <li>Upload malicious files, malware, or content that violates copyright law.</li>
                <li>Abuse the service through automated scraping, bots, or excessive API requests.</li>
              </ul>
            </section>

            <section className="rounded-xl border border-border bg-card/60 p-6 backdrop-blur-sm space-y-4">
              <h2 className="font-display text-xl font-semibold text-foreground">5. No Warranty</h2>
              <p>
                DistroForge is provided "as is" without warranties of any kind. We do not guarantee that the
                generated configurations will produce a working ISO on every hardware configuration. You are
                responsible for testing and verifying compatibility on your own systems.
              </p>
            </section>

            <section className="rounded-xl border border-border bg-card/60 p-6 backdrop-blur-sm space-y-4">
              <h2 className="font-display text-xl font-semibold text-foreground">6. Termination</h2>
              <p>
                We reserve the right to suspend or terminate accounts that violate these terms. You may terminate
                your own account at any time via the Account settings page.
              </p>
            </section>

            <section className="rounded-xl border border-border bg-card/60 p-6 backdrop-blur-sm space-y-4">
              <h2 className="font-display text-xl font-semibold text-foreground">7. Changes</h2>
              <p>
                We may update these Terms from time to time. Continued use of the service after changes
                constitutes acceptance of the updated terms.
              </p>
            </section>

            <section className="rounded-xl border border-border bg-card/60 p-6 backdrop-blur-sm space-y-4">
              <h2 className="font-display text-xl font-semibold text-foreground">8. Contact</h2>
              <p>
                For questions about these Terms, contact vlostudios@protonmail.com.
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
