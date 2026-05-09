import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Terminal, Cpu, Shield, Layers, Zap, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MatrixRain } from "@/components/MatrixRain";
import heroBg from "@/assets/hero-bg.jpg";

const features = [
  { icon: Layers, title: "Choose Your Desktop", desc: "GNOME, KDE, XFCE, i3wm — pick your environment" },
  { icon: Cpu, title: "Select Your Apps", desc: "Curate your perfect app collection from 200+ packages" },
  { icon: Shield, title: "Security First", desc: "Hardened configs, firewall rules, encrypted by default" },
  { icon: Zap, title: "Custom Themes", desc: "Design your own look — wallpapers, colors, icons" },
  { icon: Terminal, title: "Shell Config", desc: "Pre-configured terminal with your favorite shell" },
  { icon: Download, title: "Export .zip", desc: "Compile the .iso on your own machine" },
];

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden">
      <MatrixRain />

      {/* Hero */}
      <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url(${heroBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center max-w-4xl"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse-glow" />
            Debian-based • Fully Customizable
          </div>

          <h1 className="font-display text-5xl sm:text-7xl font-bold leading-tight mb-6">
            <span className="text-foreground">Build Your</span>
            <br />
            <span className="text-primary glow-text text-orange-600 font-sans">Dream Distro</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 font-light">
            Forge a custom Debian-based Linux distribution tailored to your workflow.
            Choose apps, design themes, upload wallpapers — export as a bootable .ISO.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 glow-box text-lg px-8 py-6"
              onClick={() => navigate("/auth?mode=signup")}
            >
              <Terminal className="mr-2 h-5 w-5" />
              Start Building
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary/30 text-primary hover:bg-primary/10 text-lg px-8 py-6"
              onClick={() => navigate("/auth")}
            >
              Sign In
            </Button>
          </div>

          <div className="mt-8 font-mono text-sm text-muted-foreground">
            <span className="text-primary">$</span> sudo distroforge --build --interactive
            <span className="border-r-2 border-primary ml-1 animate-blink">&nbsp;</span>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="relative z-10 py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="font-display text-3xl sm:text-4xl font-bold text-center mb-16"
          >
            How It <span className="text-primary glow-text text-orange-600 font-sans">Works</span>
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group rounded-xl border border-border bg-card/50 p-6 backdrop-blur-sm hover:glow-border transition-all duration-300"
              >
                <f.icon className="h-10 w-10 text-primary mb-4 group-hover:animate-pulse-glow" />
                <h3 className="font-display text-lg font-semibold mb-2 text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-24 px-4">
        <div className="container mx-auto max-w-2xl text-center">
          <div className="rounded-2xl border border-primary/20 bg-card/80 p-12 backdrop-blur-sm glow-box">
            <h2 className="font-display text-3xl font-bold mb-4">
              Ready to <span className="text-primary glow-text text-orange-600 font-sans">Forge</span>?
            </h2>
            <p className="text-muted-foreground mb-8">
              Create your account and start building your perfect Linux distro in minutes.
            </p>
            <Button
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 glow-box"
              onClick={() => navigate("/auth?mode=signup")}
            >
              Create Free Account
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 py-8 px-4">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>© 2026 DistroForge. Built with 💚 for the Linux community.</p>
        </div>
      </footer>
    </div>
  );
}
