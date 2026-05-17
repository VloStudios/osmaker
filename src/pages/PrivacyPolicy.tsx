import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield } from "lucide-react";

export default function PrivacyPolicy() {
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
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="font-display text-3xl font-bold text-foreground">Privacy Policy</h1>
          </div>

          <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
            <p className="text-sm">Last updated: May 17, 2026</p>

            <section className="rounded-xl border border-border bg-card/60 p-6 backdrop-blur-sm space-y-4">
              <h2 className="font-display text-xl font-semibold text-foreground">1. What We Collect</h2>
              <p>When you create an account, we store:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong className="text-foreground">Email address</strong> — required for authentication and account recovery.</li>
                <li><strong className="text-foreground">Display name</strong> — optional; shown in your profile.</li>
                <li><strong className="text-foreground">Distro configurations</strong> — desktop environment, selected apps, theme, wallpapers, design notes, and build status.</li>
                <li><strong className="text-foreground">Wallpaper images</strong> — only if you choose to upload your own.</li>
              </ul>
              <p>We do not collect payment information, browsing history, or third-party tracking data.</p>
            </section>

            <section className="rounded-xl border border-border bg-card/60 p-6 backdrop-blur-sm space-y-4">
              <h2 className="font-display text-xl font-semibold text-foreground">2. How We Use Your Data</h2>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>To authenticate you and keep your session secure.</li>
                <li>To save and display your distro configurations across sessions.</li>
                <li>To send account-related emails: signup verification and password reset.</li>
                <li>Aggregate usage stats (e.g., popular desktop environments) are visible only to the site admin — never tied to individual users.</li>
              </ul>
            </section>

            <section className="rounded-xl border border-border bg-card/60 p-6 backdrop-blur-sm space-y-4">
              <h2 className="font-display text-xl font-semibold text-foreground">3. Cookies & Authentication</h2>
              <p>
                We use session cookies managed by our authentication provider to keep you signed in.
                These are functional cookies required for the service to work. We do not use tracking
                or advertising cookies. No third-party analytics scripts are loaded on this site.
              </p>
            </section>

            <section className="rounded-xl border border-border bg-card/60 p-6 backdrop-blur-sm space-y-4">
              <h2 className="font-display text-xl font-semibold text-foreground">4. Data Sharing</h2>
              <p>
                We do not sell, rent, or share your personal data with any third parties.
                Your data is stored securely via Lovable Cloud. Wallpaper uploads are stored in
                our private file storage bucket and are only accessible to your own account.
              </p>
            </section>

            <section className="rounded-xl border border-border bg-card/60 p-6 backdrop-blur-sm space-y-4">
              <h2 className="font-display text-xl font-semibold text-foreground">5. Security</h2>
              <p>
                We use Row Level Security (RLS) on all database tables, meaning your data is isolated
                from other users. Only you (and the site admin for support purposes) can access your records.
                Passwords are hashed and managed by our authentication provider — we never store plain-text passwords.
              </p>
            </section>

            <section className="rounded-xl border border-border bg-card/60 p-6 backdrop-blur-sm space-y-4">
              <h2 className="font-display text-xl font-semibold text-foreground">6. Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Access and update your profile information.</li>
                <li>Delete your distro configurations individually.</li>
                <li>Permanently delete your entire account and all associated data via the Account page.</li>
              </ul>
            </section>

            <section className="rounded-xl border border-border bg-card/60 p-6 backdrop-blur-sm space-y-4">
              <h2 className="font-display text-xl font-semibold text-foreground">7. Changes</h2>
              <p>
                If we make material changes to this Privacy Policy, we will update the date above.
                Significant changes may also be communicated by email.
              </p>
            </section>

            <section className="rounded-xl border border-border bg-card/60 p-6 backdrop-blur-sm space-y-4">
              <h2 className="font-display text-xl font-semibold text-foreground">8. Contact</h2>
              <p>
                For privacy-related questions or data requests, contact vlostudios@protonmail.com.
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
