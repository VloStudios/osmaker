
-- Add CHECK constraint on desktop_environment
ALTER TABLE public.distro_configs
ADD CONSTRAINT chk_desktop_environment
CHECK (desktop_environment IN ('gnome', 'kde', 'xfce', 'i3wm', 'cinnamon'));

-- Add CHECK constraint on theme_style
ALTER TABLE public.distro_configs
ADD CONSTRAINT chk_theme_style
CHECK (theme_style IN ('dark', 'light', 'auto'));

-- Add length constraint on name
ALTER TABLE public.distro_configs
ADD CONSTRAINT chk_name_length
CHECK (char_length(name) <= 50);

-- Validate selected_apps via trigger (allowlist)
CREATE OR REPLACE FUNCTION public.validate_selected_apps()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  app_value TEXT;
  allowed_apps TEXT[] := ARRAY[
    'firefox', 'chromium', 'brave',
    'vscode', 'vim', 'git', 'docker', 'nodejs', 'python3',
    'vlc', 'gimp', 'obs', 'audacity',
    'ufw', 'wireshark', 'nmap', 'keepassxc',
    'htop', 'neofetch', 'tmux', 'curl'
  ];
BEGIN
  IF NEW.selected_apps IS NOT NULL THEN
    FOR app_value IN SELECT jsonb_array_elements_text(NEW.selected_apps)
    LOOP
      IF NOT (app_value = ANY(allowed_apps)) THEN
        RAISE EXCEPTION 'Invalid app: %. Only predefined apps are allowed.', app_value;
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_selected_apps
BEFORE INSERT OR UPDATE ON public.distro_configs
FOR EACH ROW
EXECUTE FUNCTION public.validate_selected_apps();
