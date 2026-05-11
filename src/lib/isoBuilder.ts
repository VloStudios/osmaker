import JSZip from "jszip";

export type FirmwareTarget = "bios" | "uefi" | "both";

export interface DistroBuildConfig {
  distroName: string;
  desktopEnvironment: string;
  selectedApps: string[];
  wallpaperUrls: string[];
  designDescription: string;
  themeStyle: string;
  firmware: FirmwareTarget;
}

/**
 * Debian live-build based INSTALLER ISO builder.
 *
 * Produces a bundle of `live-build` config files + a `build.sh` wrapper.
 * Runs on any Debian / Ubuntu / Debian-derivative host with `live-build` installed.
 *
 * Output ISO is a hybrid (BIOS + UEFI) bootable image with the Debian Installer
 * (graphical + text) included. Booting the ISO lets the end user INSTALL the
 * customized OS to disk — it is not just a live session. The live system is
 * still present as a recovery / try-before-install mode.
 */

// DE -> Debian package list
const DE_PACKAGES: Record<string, string[]> = {
  gnome: ["task-gnome-desktop", "gdm3"],
  kde: ["task-kde-desktop", "sddm"],
  xfce: ["task-xfce-desktop", "lightdm", "lightdm-gtk-greeter"],
  i3wm: ["i3", "i3status", "i3lock", "dmenu", "suckless-tools", "lightdm", "lightdm-gtk-greeter", "xserver-xorg", "xinit"],
  cinnamon: ["task-cinnamon-desktop", "lightdm", "lightdm-gtk-greeter"],
  mate: ["task-mate-desktop", "lightdm", "lightdm-gtk-greeter"],
  lxqt: ["task-lxqt-desktop", "sddm"],
};

// App id -> Debian apt package(s)
const APP_PACKAGES: Record<string, string> = {
  firefox: "firefox-esr",
  chromium: "chromium",
  brave: "", // not in Debian repos, handled via post-install hook
  vscode: "", // not in Debian repos, handled via post-install hook
  vim: "vim",
  git: "git",
  docker: "docker.io docker-compose",
  nodejs: "nodejs npm",
  python3: "python3 python3-pip python3-venv",
  vlc: "vlc",
  gimp: "gimp",
  obs: "obs-studio",
  audacity: "audacity",
  ufw: "ufw",
  wireshark: "wireshark",
  nmap: "nmap",
  keepassxc: "keepassxc",
  htop: "htop",
  neofetch: "neofetch",
  tmux: "tmux",
  curl: "curl",
};

const safeSlug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "custom-distro";

function packageList(cfg: DistroBuildConfig): string[] {
  const base = [
    "linux-image-amd64",
    "live-boot",
    "systemd-sysv",
    "network-manager",
    "sudo",
    "nano",
    "bash-completion",
    "ca-certificates",
    "locales",
    "console-setup",
    "keyboard-configuration",
    "firmware-linux-free",
    "task-laptop",
    // Required so the installed system is bootable after Debian Installer copies the live fs to disk
    "grub-pc",
    "grub-efi-amd64",
    "os-prober",
  ];
  const de = DE_PACKAGES[cfg.desktopEnvironment] ?? DE_PACKAGES.xfce;
  const apps = cfg.selectedApps
    .flatMap((id) => (APP_PACKAGES[id] ?? "").split(/\s+/))
    .filter(Boolean);
  return Array.from(new Set([...base, ...de, ...apps])).sort();
}

function buildPackagesListFile(cfg: DistroBuildConfig): string {
  // live-build picks up files in config/package-lists/*.list.chroot
  return packageList(cfg).join("\n") + "\n";
}

function buildAutoConfig(cfg: DistroBuildConfig): string {
  const slug = safeSlug(cfg.distroName);
  // config/auto/config — runs `lb config` with our desired flags.
  // --debian-installer live  => embeds the Debian Installer (graphical + text)
  //                              that installs the live filesystem to disk.
  // --debian-installer-gui true => enables the graphical installer entry.
  return `#!/bin/sh
set -e

lb config noauto \\
  --mode debian \\
  --distribution bookworm \\
  --architectures amd64 \\
  --binary-images iso-hybrid \\
  --archive-areas "main contrib non-free non-free-firmware" \\
  --apt-indices false \\
  --apt-recommends true \\
  --debian-installer live \\
  --debian-installer-gui true \\
  --debian-installer-distribution bookworm \\
  --bootloaders "syslinux,grub-efi" \\
  --iso-application "${cfg.distroName}" \\
  --iso-publisher "${cfg.distroName} (built with Lovable DistroForge)" \\
  --iso-volume "${slug.toUpperCase().replace(/-/g, "_")}" \\
  --memtest none \\
  "\${@}"
`;
}

function buildPreseed(cfg: DistroBuildConfig): string {
  const slug = safeSlug(cfg.distroName);
  // Sensible defaults; user is still prompted for partitioning, user account, etc.
  return `# Preseed for ${cfg.distroName}
# Placed at config/includes.installer/preseed.cfg
d-i debian-installer/locale string en_US.UTF-8
d-i keyboard-configuration/xkb-keymap select us
d-i netcfg/choose_interface select auto
d-i netcfg/get_hostname string ${slug}
d-i netcfg/get_domain string local
d-i mirror/country string manual
d-i mirror/http/hostname string deb.debian.org
d-i mirror/http/directory string /debian
d-i clock-setup/utc boolean true
d-i time/zone string UTC
d-i clock-setup/ntp boolean true
tasksel tasksel/first multiselect standard
d-i pkgsel/upgrade select full-upgrade
popularity-contest popularity-contest/participate boolean false
d-i grub-installer/only_debian boolean true
d-i grub-installer/with_other_os boolean true
d-i finish-install/reboot_in_progress note
`;
}

function buildHookCustomize(cfg: DistroBuildConfig): string {
  const slug = safeSlug(cfg.distroName);
  const wantsBrave = cfg.selectedApps.includes("brave");
  const wantsVscode = cfg.selectedApps.includes("vscode");

  let extras = "";
  if (wantsBrave) {
    extras += `
# --- Brave browser (third-party repo) ---
apt-get install -y curl gpg apt-transport-https
curl -fsSLo /usr/share/keyrings/brave-browser-archive-keyring.gpg https://brave-browser-apt-release.s3.brave.com/brave-browser-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/brave-browser-archive-keyring.gpg] https://brave-browser-apt-release.s3.brave.com/ stable main" > /etc/apt/sources.list.d/brave-browser-release.list
apt-get update
apt-get install -y brave-browser || echo "WARN: brave install failed"
`;
  }
  if (wantsVscode) {
    extras += `
# --- VS Code (Microsoft repo) ---
apt-get install -y wget gpg apt-transport-https
wget -qO- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > /usr/share/keyrings/packages.microsoft.gpg
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/packages.microsoft.gpg] https://packages.microsoft.com/repos/code stable main" > /etc/apt/sources.list.d/vscode.list
apt-get update
apt-get install -y code || echo "WARN: vscode install failed"
`;
  }

  // Display manager autostart based on DE
  let dm = "lightdm";
  if (cfg.desktopEnvironment === "gnome") dm = "gdm3";
  else if (cfg.desktopEnvironment === "kde" || cfg.desktopEnvironment === "lxqt") dm = "sddm";

  return `#!/bin/sh
# config/hooks/normal/9000-customize.hook.chroot
# Runs inside the chroot during live-build's 'binary' stage.
set -e

echo "==> Customizing ${cfg.distroName}..."

# /etc/os-release branding
cat > /etc/os-release <<'EOF'
NAME="${cfg.distroName}"
PRETTY_NAME="${cfg.distroName}"
ID=${slug}
ID_LIKE=debian
VERSION_ID="1"
HOME_URL="https://lovable.dev"
EOF

# Hostname
echo "${slug}" > /etc/hostname

# Theme hint file
echo "${cfg.themeStyle}" > /etc/distro-theme

# Enable display manager + NetworkManager
systemctl enable ${dm}.service || true
systemctl enable NetworkManager.service || true
systemctl set-default graphical.target || true
${extras}
echo "==> Customization complete."
`;
}

function buildBuildScript(cfg: DistroBuildConfig): string {
  const slug = safeSlug(cfg.distroName);
  return `#!/usr/bin/env bash
# Build script for "${cfg.distroName}"
# Generated by Lovable DistroForge
#
# Builds a Debian-based live ISO using live-build.
#
# REQUIREMENTS (Debian / Ubuntu / Mint / MX / Pop!_OS / etc.):
#   sudo apt update
#   sudo apt install -y live-build debootstrap squashfs-tools xorriso isolinux \\
#                       syslinux-common syslinux-efi grub-pc-bin grub-efi-amd64-bin \\
#                       mtools dosfstools
#
# USAGE:
#   unzip ${slug}-build.zip
#   cd ${slug}-build
#   sudo ./build.sh
#
# Output: ./live-image-amd64.hybrid.iso

set -euo pipefail

PROFILE_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "\${PROFILE_DIR}"

if [ "\$EUID" -ne 0 ]; then
  echo "ERROR: run as root (sudo ./build.sh)"
  exit 1
fi

if ! command -v lb >/dev/null 2>&1; then
  echo "ERROR: live-build is not installed."
  echo "  sudo apt install -y live-build debootstrap squashfs-tools xorriso \\\\"
  echo "      isolinux syslinux-common syslinux-efi grub-pc-bin grub-efi-amd64-bin \\\\"
  echo "      mtools dosfstools"
  exit 1
fi

echo "==> Cleaning previous build..."
lb clean --purge || true

echo "==> Configuring live-build..."
chmod +x auto/config
lb config

echo "==> Building ISO for ${cfg.distroName} (this takes 15-40 minutes)..."
lb build 2>&1 | tee build.log

ISO=\$(ls -1 *.iso 2>/dev/null | head -n1 || true)
if [ -n "\$ISO" ]; then
  NEW_NAME="${slug}-\$(date +%Y.%m.%d)-amd64.iso"
  mv "\$ISO" "\$NEW_NAME"
  echo ""
  echo "✓ Done! ISO: \${PROFILE_DIR}/\$NEW_NAME"
  ls -lh "\$NEW_NAME"
else
  echo "ERROR: no ISO produced — check build.log"
  exit 1
fi
`;
}

function buildReadme(cfg: DistroBuildConfig): string {
  const slug = safeSlug(cfg.distroName);
  return `# ${cfg.distroName} — Debian Installer ISO Build Bundle

This bundle is a complete **\`live-build\`** configuration that produces a
Debian-based **installer ISO** matching your DistroForge configuration.

When the ISO boots, the user gets a boot menu with:

1. **Live** — try ${cfg.distroName} without installing
2. **Graphical Install** — install ${cfg.distroName} to disk (recommended)
3. **Install** — text-mode installer

The installer copies the customized live filesystem (your DE, apps, branding,
wallpapers) onto the target disk and installs GRUB. The end result is a real,
disk-installed OS — not just a live session.

## What's inside

- \`build.sh\` — one-command build entrypoint (run with sudo on any Debian-based host)
- \`auto/config\` — \`lb config\` flags (Debian Bookworm, amd64, hybrid ISO, d-i live)
- \`config/package-lists/custom.list.chroot\` — every apt package to install
- \`config/hooks/normal/9000-customize.hook.chroot\` — branding, services, third-party repos
- \`config/includes.chroot/\` — files copied into the installed system (wallpapers, os-release)
- \`config/includes.installer/preseed.cfg\` — installer defaults (locale, timezone, hostname)
- \`wallpapers/\` — your uploaded wallpapers (also baked into the ISO)

## Build it

You can build on **Debian, Ubuntu, Linux Mint, MX, Pop!_OS, Kali**, or any
Debian-derivative with root access (bare metal, VM, or container):

\`\`\`bash
sudo apt update
sudo apt install -y live-build debootstrap squashfs-tools xorriso \\
    isolinux syslinux-common syslinux-efi \\
    grub-pc-bin grub-efi-amd64-bin mtools dosfstools
    
unzip ${slug}-build.zip
cd ${slug}-build
sudo ./build.sh
\`\`\`

The output \`${slug}-YYYY.MM.DD-amd64.iso\` is a hybrid installer ISO — flash
with \`dd\`, \`balenaEtcher\`, \`Ventoy\`, or \`Rufus\`, then boot the target
machine and pick **Graphical Install**.

## Configuration summary

- **Base:** Debian 12 (Bookworm), amd64, hybrid BIOS+UEFI installer
- **Desktop environment:** ${cfg.desktopEnvironment}
- **Theme style:** ${cfg.themeStyle}
- **Apps:** ${cfg.selectedApps.join(", ") || "(none)"}
- **Wallpapers:** ${cfg.wallpaperUrls.length}
${cfg.designDescription ? `\n**Design notes:**\n> ${cfg.designDescription}\n` : ""}
---
Generated by Lovable DistroForge.
`;
}

function buildOsRelease(cfg: DistroBuildConfig): string {
  const slug = safeSlug(cfg.distroName);
  return `NAME="${cfg.distroName}"
PRETTY_NAME="${cfg.distroName}"
ID=${slug}
ID_LIKE=debian
VERSION_ID="1"
HOME_URL="https://lovable.dev"
`;
}

async function fetchAsBlob(url: string): Promise<Blob | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.blob();
  } catch {
    return null;
  }
}

export async function generateBuildBundle(cfg: DistroBuildConfig): Promise<Blob> {
  const slug = safeSlug(cfg.distroName);
  const zip = new JSZip();
  const root = zip.folder(`${slug}-build`)!;

  // Top-level files
  root.file("build.sh", buildBuildScript(cfg), { unixPermissions: 0o755 });
  root.file("README.md", buildReadme(cfg));

  // auto/config — the lb config invocation
  const auto = root.folder("auto")!;
  auto.file("config", buildAutoConfig(cfg), { unixPermissions: 0o755 });

  // config/package-lists/custom.list.chroot
  const pkgLists = root.folder("config/package-lists")!;
  pkgLists.file("custom.list.chroot", buildPackagesListFile(cfg));

  // config/hooks/normal/9000-customize.hook.chroot
  const hooks = root.folder("config/hooks/normal")!;
  hooks.file("9000-customize.hook.chroot", buildHookCustomize(cfg), { unixPermissions: 0o755 });

  // config/includes.chroot — files copied into the live root filesystem
  const includes = root.folder("config/includes.chroot")!;
  includes.folder("etc")!.file("os-release", buildOsRelease(cfg));

  // config/includes.installer — files copied alongside the Debian Installer on the ISO
  const installer = root.folder("config/includes.installer")!;
  installer.file("preseed.cfg", buildPreseed(cfg));

  // Wallpapers: download from signed URLs and bundle into the ISO
  if (cfg.wallpaperUrls.length > 0) {
    const wpInIso = includes.folder(`usr/share/backgrounds/${slug}`)!;
    const wpLocal = root.folder("wallpapers")!;
    let i = 0;
    for (const url of cfg.wallpaperUrls) {
      const blob = await fetchAsBlob(url);
      if (!blob) continue;
      const extMatch = url.match(/\.(png|jpe?g|webp|gif|bmp)/i);
      const ext = (extMatch?.[1] ?? "jpg").toLowerCase();
      const name = `wallpaper-${++i}.${ext}`;
      const buf = await blob.arrayBuffer();
      wpInIso.file(name, buf);
      wpLocal.file(name, buf);
    }
  }

  return await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const bundleFilename = (distroName: string) => `${safeSlug(distroName)}-build.zip`;
