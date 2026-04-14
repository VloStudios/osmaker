import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Monitor, Package, Image, Paintbrush, Download, ChevronRight, ChevronLeft,
  Check, Upload, X, Terminal
} from "lucide-react";

const STEPS = [
  { id: "basics", label: "Basics", icon: Monitor },
  { id: "apps", label: "Apps", icon: Package },
  { id: "wallpaper", label: "Wallpaper", icon: Image },
  { id: "design", label: "Design", icon: Paintbrush },
  { id: "export", label: "Export", icon: Download },
];

const DESKTOP_ENVS = [
  { id: "gnome", name: "GNOME", desc: "Modern, polished, beginner-friendly" },
  { id: "kde", name: "KDE Plasma", desc: "Highly customizable, feature-rich" },
  { id: "xfce", name: "XFCE", desc: "Lightweight, fast, traditional" },
  { id: "i3wm", name: "i3wm", desc: "Tiling window manager for power users" },
  { id: "cinnamon", name: "Cinnamon", desc: "Classic desktop, familiar feel" },
];

const APP_CATEGORIES: Record<string, { name: string; apps: { id: string; name: string; desc: string }[] }> = {
  browsers: {
    name: "🌐 Browsers",
    apps: [
      { id: "firefox", name: "Firefox", desc: "Privacy-focused browser" },
      { id: "chromium", name: "Chromium", desc: "Open-source Chrome base" },
      { id: "brave", name: "Brave", desc: "Ad-blocking browser" },
    ],
  },
  dev: {
    name: "💻 Development",
    apps: [
      { id: "vscode", name: "VS Code", desc: "Popular code editor" },
      { id: "vim", name: "Vim", desc: "Terminal text editor" },
      { id: "git", name: "Git", desc: "Version control" },
      { id: "docker", name: "Docker", desc: "Containerization" },
      { id: "nodejs", name: "Node.js", desc: "JavaScript runtime" },
      { id: "python3", name: "Python 3", desc: "Programming language" },
    ],
  },
  media: {
    name: "🎬 Media",
    apps: [
      { id: "vlc", name: "VLC", desc: "Media player" },
      { id: "gimp", name: "GIMP", desc: "Image editor" },
      { id: "obs", name: "OBS Studio", desc: "Streaming/recording" },
      { id: "audacity", name: "Audacity", desc: "Audio editor" },
    ],
  },
  security: {
    name: "🔒 Security",
    apps: [
      { id: "ufw", name: "UFW", desc: "Firewall manager" },
      { id: "wireshark", name: "Wireshark", desc: "Network analyzer" },
      { id: "nmap", name: "Nmap", desc: "Network scanner" },
      { id: "keepassxc", name: "KeePassXC", desc: "Password manager" },
    ],
  },
  utils: {
    name: "🔧 Utilities",
    apps: [
      { id: "htop", name: "htop", desc: "Process viewer" },
      { id: "neofetch", name: "Neofetch", desc: "System info" },
      { id: "tmux", name: "tmux", desc: "Terminal multiplexer" },
      { id: "curl", name: "curl", desc: "Data transfer tool" },
    ],
  },
};

export default function Builder() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Config state
  const [distroName, setDistroName] = useState("My Custom Distro");
  const [de, setDe] = useState("gnome");
  const [selectedApps, setSelectedApps] = useState<string[]>(["firefox", "git", "vim", "htop"]);
  const [wallpaperUrls, setWallpaperUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [designDesc, setDesignDesc] = useState("");
  const [themeStyle, setThemeStyle] = useState("dark");

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  const toggleApp = (id: string) => {
    setSelectedApps((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const handleWallpaperUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} is not an image`);
          continue;
        }
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 5MB)`);
          continue;
        }
        const path = `${user.id}/${Date.now()}-${file.name}`;
        const { error } = await supabase.storage.from("wallpapers").upload(path, file);
        if (error) throw error;
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from("wallpapers")
          .createSignedUrl(path, 60 * 60); // 1 hour expiry
        if (signedUrlError || !signedUrlData?.signedUrl) throw signedUrlError || new Error("Failed to get signed URL");
        setWallpaperUrls((prev) => [...prev, signedUrlData.signedUrl]);
      }
      toast.success("Wallpapers uploaded!");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeWallpaper = (url: string) => {
    setWallpaperUrls((prev) => prev.filter((u) => u !== url));
  };

  const handleExport = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("distro_configs").insert({
        user_id: user.id,
        name: distroName,
        desktop_environment: de,
        selected_apps: selectedApps,
        wallpaper_urls: wallpaperUrls,
        design_description: designDesc,
        theme_style: themeStyle,
        status: "building",
      });
      if (error) throw error;
      toast.success("Build queued! Your ISO will be ready soon.", {
        description: "In a production environment, this would trigger an ISO build pipeline.",
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-16">
        <Terminal className="h-8 w-8 text-primary animate-pulse-glow" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setStep(i)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                i === step
                  ? "bg-primary text-primary-foreground glow-box"
                  : i < step
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <s.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="rounded-2xl border border-border bg-card/80 p-8 backdrop-blur-sm"
          >
            {/* Step 0: Basics */}
            {step === 0 && (
              <div className="space-y-6">
                <h2 className="font-display text-2xl font-bold">
                  Name & <span className="text-primary">Desktop Environment</span>
                </h2>
                <div>
                  <Label className="text-muted-foreground">Distro Name</Label>
                  <Input
                    value={distroName}
                    onChange={(e) => setDistroName(e.target.value)}
                    placeholder="HackerOS"
                    className="mt-1 bg-muted border-border focus:border-primary"
                    maxLength={50}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {DESKTOP_ENVS.map((env) => (
                    <button
                      key={env.id}
                      onClick={() => setDe(env.id)}
                      className={`rounded-xl border p-4 text-left transition-all ${
                        de === env.id
                          ? "border-primary bg-primary/10 glow-border"
                          : "border-border bg-muted hover:border-primary/30"
                      }`}
                    >
                      <p className="font-semibold text-foreground">{env.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{env.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 1: Apps */}
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="font-display text-2xl font-bold">
                  Select <span className="text-primary">Default Apps</span>
                </h2>
                <p className="text-sm text-muted-foreground">
                  {selectedApps.length} apps selected
                </p>
                {Object.entries(APP_CATEGORIES).map(([key, cat]) => (
                  <div key={key}>
                    <h3 className="font-semibold mb-2 text-foreground">{cat.name}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {cat.apps.map((app) => (
                        <button
                          key={app.id}
                          onClick={() => toggleApp(app.id)}
                          className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                            selectedApps.includes(app.id)
                              ? "border-primary bg-primary/10"
                              : "border-border bg-muted hover:border-primary/30"
                          }`}
                        >
                          <div className={`flex h-5 w-5 items-center justify-center rounded border ${
                            selectedApps.includes(app.id) ? "border-primary bg-primary" : "border-muted-foreground"
                          }`}>
                            {selectedApps.includes(app.id) && <Check className="h-3 w-3 text-primary-foreground" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{app.name}</p>
                            <p className="text-xs text-muted-foreground">{app.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Step 2: Wallpaper */}
            {step === 2 && (
              <div className="space-y-6">
                <h2 className="font-display text-2xl font-bold">
                  Upload <span className="text-primary">Wallpapers</span>
                </h2>
                <div className="rounded-xl border-2 border-dashed border-border p-8 text-center hover:border-primary/50 transition-colors">
                  <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-3">
                    Drag & drop or click to upload wallpapers (max 5MB each)
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleWallpaperUpload}
                    className="hidden"
                    id="wallpaper-upload"
                  />
                  <Button
                    variant="outline"
                    className="border-primary/30 text-primary hover:bg-primary/10"
                    onClick={() => document.getElementById("wallpaper-upload")?.click()}
                    disabled={uploading}
                  >
                    {uploading ? "Uploading..." : "Choose Files"}
                  </Button>
                </div>
                {wallpaperUrls.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {wallpaperUrls.map((url) => (
                      <div key={url} className="relative group rounded-lg overflow-hidden border border-border">
                        <img src={url} alt="wallpaper" className="w-full h-32 object-cover" />
                        <button
                          onClick={() => removeWallpaper(url)}
                          className="absolute top-2 right-2 rounded-full bg-background/80 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Design */}
            {step === 3 && (
              <div className="space-y-6">
                <h2 className="font-display text-2xl font-bold">
                  Describe Your <span className="text-primary">Design</span>
                </h2>
                <div>
                  <Label className="text-muted-foreground">Theme Style</Label>
                  <div className="grid grid-cols-3 gap-3 mt-2">
                    {["dark", "light", "auto"].map((s) => (
                      <button
                        key={s}
                        onClick={() => setThemeStyle(s)}
                        className={`rounded-lg border p-3 text-sm capitalize transition-all ${
                          themeStyle === s
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-muted text-muted-foreground hover:border-primary/30"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Design Description</Label>
                  <Textarea
                    value={designDesc}
                    onChange={(e) => setDesignDesc(e.target.value)}
                    placeholder="Describe your ideal look: colors, icon pack, dock style, transparency, animations..."
                    className="mt-1 bg-muted border-border focus:border-primary min-h-[150px]"
                    maxLength={1000}
                  />
                  <p className="text-xs text-muted-foreground mt-1">{designDesc.length}/1000</p>
                </div>
              </div>
            )}

            {/* Step 4: Export */}
            {step === 4 && (
              <div className="space-y-6 text-center">
                <h2 className="font-display text-2xl font-bold">
                  Build Your <span className="text-primary glow-text">.ISO</span>
                </h2>
                <div className="rounded-xl border border-border bg-muted p-6 text-left font-mono text-sm space-y-1">
                  <p><span className="text-primary">distro_name:</span> {distroName}</p>
                  <p><span className="text-primary">desktop:</span> {de}</p>
                  <p><span className="text-primary">apps:</span> [{selectedApps.join(", ")}]</p>
                  <p><span className="text-primary">wallpapers:</span> {wallpaperUrls.length} uploaded</p>
                  <p><span className="text-primary">theme:</span> {themeStyle}</p>
                  {designDesc && <p><span className="text-primary">design:</span> "{designDesc.slice(0, 80)}..."</p>}
                </div>
                <Button
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 glow-box"
                  onClick={handleExport}
                  disabled={saving}
                >
                  <Download className="mr-2 h-5 w-5" />
                  {saving ? "Queuing Build..." : "Build & Export .ISO"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Your configuration will be saved and the build process will begin.
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Nav buttons */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            className="border-border text-muted-foreground hover:text-primary hover:border-primary/30"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
          {step < STEPS.length - 1 && (
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
