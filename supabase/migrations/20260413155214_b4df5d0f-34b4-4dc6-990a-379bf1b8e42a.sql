
-- Create update_updated_at function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Distro configurations table
CREATE TABLE public.distro_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'My Custom Distro',
  desktop_environment TEXT NOT NULL DEFAULT 'gnome',
  selected_apps JSONB NOT NULL DEFAULT '[]'::jsonb,
  wallpaper_urls TEXT[] DEFAULT '{}',
  design_description TEXT,
  theme_style TEXT DEFAULT 'dark',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'building', 'ready', 'failed')),
  iso_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.distro_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own configs" ON public.distro_configs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own configs" ON public.distro_configs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own configs" ON public.distro_configs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own configs" ON public.distro_configs FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_distro_configs_updated_at BEFORE UPDATE ON public.distro_configs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- User roles for admin access
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Admin policies for analytics
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all configs" ON public.distro_configs FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Storage bucket for wallpapers
INSERT INTO storage.buckets (id, name, public) VALUES ('wallpapers', 'wallpapers', true);

CREATE POLICY "Anyone can view wallpapers" ON storage.objects FOR SELECT USING (bucket_id = 'wallpapers');
CREATE POLICY "Authenticated users can upload wallpapers" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'wallpapers' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete own wallpapers" ON storage.objects FOR DELETE USING (bucket_id = 'wallpapers' AND auth.uid()::text = (storage.foldername(name))[1]);
