import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Users, HardDrive, Activity, Terminal } from "lucide-react";

interface Stats {
  totalUsers: number;
  totalBuilds: number;
  buildsByStatus: Record<string, number>;
  popularDEs: Record<string, number>;
  popularApps: Record<string, number>;
  recentBuilds: Array<{ name: string; desktop_environment: string; status: string; created_at: string }>;
}

export default function Analytics() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    loadStats();
  }, [user]);

  const loadStats = async () => {
    try {
      // Get user's own configs (non-admins see their own data)
      const { data: configs } = await supabase.from("distro_configs").select("*");
      const { data: profiles } = await supabase.from("profiles").select("id");

      const buildsByStatus: Record<string, number> = {};
      const popularDEs: Record<string, number> = {};
      const popularApps: Record<string, number> = {};

      (configs || []).forEach((c) => {
        buildsByStatus[c.status] = (buildsByStatus[c.status] || 0) + 1;
        popularDEs[c.desktop_environment] = (popularDEs[c.desktop_environment] || 0) + 1;
        const apps = Array.isArray(c.selected_apps) ? c.selected_apps : [];
        apps.forEach((a: any) => {
          const appName = String(a);
          popularApps[appName] = (popularApps[appName] || 0) + 1;
        });
      });

      setStats({
        totalUsers: profiles?.length || 0,
        totalBuilds: configs?.length || 0,
        buildsByStatus,
        popularDEs,
        popularApps,
        recentBuilds: (configs || [])
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 10)
          .map((c) => ({
            name: c.name,
            desktop_environment: c.desktop_environment,
            status: c.status,
            created_at: c.created_at,
          })),
      });
    } catch (err) {
      console.error("Failed to load stats", err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-16">
        <Terminal className="h-8 w-8 text-primary animate-pulse-glow" />
      </div>
    );
  }

  if (!stats) return null;

  const topApps = Object.entries(stats.popularApps)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const maxAppCount = topApps.length > 0 ? topApps[0][1] : 1;

  return (
    <div className="min-h-screen pt-20 pb-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <h1 className="font-display text-3xl font-bold mb-8">
          <span className="text-primary glow-text">Analytics</span> Dashboard
        </h1>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { icon: Users, label: "Total Users", value: stats.totalUsers },
            { icon: HardDrive, label: "Total Builds", value: stats.totalBuilds },
            { icon: Activity, label: "Active Builds", value: stats.buildsByStatus["building"] || 0 },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="rounded-xl border border-border bg-card/80 p-6 backdrop-blur-sm"
            >
              <s.icon className="h-8 w-8 text-primary mb-3" />
              <p className="text-3xl font-bold text-foreground">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Popular DEs */}
          <div className="rounded-xl border border-border bg-card/80 p-6">
            <h3 className="font-display text-lg font-semibold mb-4 text-foreground">Desktop Environments</h3>
            <div className="space-y-3">
              {Object.entries(stats.popularDEs).map(([de, count]) => (
                <div key={de} className="flex items-center gap-3">
                  <span className="text-sm font-mono text-primary w-24 uppercase">{de}</span>
                  <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all"
                      style={{ width: `${(count / stats.totalBuilds) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-8 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Popular Apps */}
          <div className="rounded-xl border border-border bg-card/80 p-6">
            <h3 className="font-display text-lg font-semibold mb-4 text-foreground">Top Apps</h3>
            <div className="space-y-3">
              {topApps.map(([app, count]) => (
                <div key={app} className="flex items-center gap-3">
                  <span className="text-sm font-mono text-primary w-24">{app}</span>
                  <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-accent h-full rounded-full transition-all"
                      style={{ width: `${(count / maxAppCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-8 text-right">{count}</span>
                </div>
              ))}
              {topApps.length === 0 && (
                <p className="text-sm text-muted-foreground">No data yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent builds */}
        <div className="mt-6 rounded-xl border border-border bg-card/80 p-6">
          <h3 className="font-display text-lg font-semibold mb-4 text-foreground">Recent Builds</h3>
          {stats.recentBuilds.length === 0 ? (
            <p className="text-sm text-muted-foreground">No builds yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="pb-2 text-left font-medium">Name</th>
                    <th className="pb-2 text-left font-medium">Desktop</th>
                    <th className="pb-2 text-left font-medium">Status</th>
                    <th className="pb-2 text-left font-medium">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentBuilds.map((b, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="py-2 text-foreground font-mono">{b.name}</td>
                      <td className="py-2 text-muted-foreground uppercase">{b.desktop_environment}</td>
                      <td className="py-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs ${
                          b.status === "ready" ? "bg-primary/20 text-primary" :
                          b.status === "building" ? "bg-accent/20 text-accent" :
                          b.status === "failed" ? "bg-destructive/20 text-destructive" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="py-2 text-muted-foreground">
                        {new Date(b.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
