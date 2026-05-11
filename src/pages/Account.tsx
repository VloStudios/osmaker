import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Terminal, User as UserIcon, Lock, Trash2, LogOut } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Account() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPw, setChangingPw] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setDisplayName(data?.display_name ?? ""));
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    const { error } = await supabase.from("profiles")
      .update({ display_name: displayName }).eq("user_id", user.id);
    setSavingProfile(false);
    if (error) toast.error(error.message);
    else toast.success("Profile updated");
  };

  const changePassword = async () => {
    if (newPassword.length < 6) return toast.error("Password must be at least 6 characters");
    if (newPassword !== confirmPassword) return toast.error("Passwords do not match");
    setChangingPw(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPw(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Password updated");
      setNewPassword(""); setConfirmPassword("");
    }
  };

  const deleteAccount = async () => {
    setDeleting(true);
    const { error } = await supabase.functions.invoke("delete-account");
    if (error) {
      setDeleting(false);
      return toast.error("Failed to delete account");
    }
    await supabase.auth.signOut();
    toast.success("Account deleted");
    navigate("/");
  };

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-16">
        <Terminal className="h-8 w-8 text-primary animate-pulse-glow" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12 px-4">
      <div className="container mx-auto max-w-2xl">
        <h1 className="font-display text-3xl font-bold mb-8 text-foreground">
          My <span className="text-primary glow-text">Account</span>
        </h1>

        {/* Profile */}
        <section className="rounded-xl border border-border bg-card/80 p-6 mb-6 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-4">
            <UserIcon className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-semibold">Profile</h2>
          </div>
          <div className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input value={user.email ?? ""} disabled className="mt-1" />
            </div>
            <div>
              <Label htmlFor="displayName">Display name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button onClick={saveProfile} disabled={savingProfile}>
              {savingProfile ? "Saving..." : "Save profile"}
            </Button>
          </div>
        </section>

        {/* Password */}
        <section className="rounded-xl border border-border bg-card/80 p-6 mb-6 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-semibold">Change password</h2>
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newPw">New password</Label>
              <Input id="newPw" type="password" value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="confirmPw">Confirm new password</Label>
              <Input id="confirmPw" type="password" value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1" />
            </div>
            <Button onClick={changePassword} disabled={changingPw}>
              {changingPw ? "Updating..." : "Update password"}
            </Button>
          </div>
        </section>

        {/* Sign out */}
        <section className="rounded-xl border border-border bg-card/80 p-6 mb-6 backdrop-blur-sm">
          <Button variant="outline" onClick={() => { signOut(); navigate("/"); }}>
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </section>

        {/* Danger zone */}
        <section className="rounded-xl border border-destructive/40 bg-destructive/5 p-6 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-4">
            <Trash2 className="h-5 w-5 text-destructive" />
            <h2 className="font-display text-lg font-semibold text-destructive">Danger zone</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Permanently delete your account and all your distro configurations. This cannot be undone.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={deleting}>
                {deleting ? "Deleting..." : "Delete my account"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete account?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete your account, profile, and all your distro
                  configurations. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={deleteAccount}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Yes, delete everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </section>
      </div>
    </div>
  );
}
