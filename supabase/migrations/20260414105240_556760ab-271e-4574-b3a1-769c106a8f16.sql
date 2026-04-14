
-- Fix distro_configs UPDATE policy
DROP POLICY IF EXISTS "Users can update own configs" ON public.distro_configs;
CREATE POLICY "Users can update own configs"
  ON public.distro_configs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Fix profiles UPDATE policy
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
