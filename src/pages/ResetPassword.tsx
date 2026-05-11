import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Terminal } from "lucide-react";
import { toast } from "sonner";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase fires PASSWORD_RECOVERY when the recovery token in the URL hash is processed.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    if (password !== confirm) return toast.error("Passwords do not match");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated — signing you in");
    navigate("/builder");
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 pt-16">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="rounded-2xl border border-border bg-card/80 p-8 backdrop-blur-sm glow-box">
          <div className="flex items-center gap-2 mb-6">
            <Terminal className="h-6 w-6 text-primary" />
            <h1 className="font-display text-2xl font-bold">Set a new password</h1>
          </div>
          {!ready ? (
            <p className="text-sm text-muted-foreground">
              Open the password reset link from your email to continue.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="pw" className="text-muted-foreground">New password</Label>
                <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 bg-muted border-border focus:border-primary" required minLength={6} />
              </div>
              <div>
                <Label htmlFor="pw2" className="text-muted-foreground">Confirm password</Label>
                <Input id="pw2" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
                  className="mt-1 bg-muted border-border focus:border-primary" required minLength={6} />
              </div>
              <Button type="submit" disabled={loading}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-box">
                {loading ? "Updating..." : "Update password"}
              </Button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
