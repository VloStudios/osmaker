
-- 1. Fix wallpaper INSERT policy to enforce folder ownership
DROP POLICY IF EXISTS "Authenticated users can upload wallpapers" ON storage.objects;
CREATE POLICY "Authenticated users can upload wallpapers"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'wallpapers'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- 2. Add UPDATE policy for wallpapers scoped to owner
CREATE POLICY "Users can update own wallpapers"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'wallpapers'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- 3. Add explicit restrictive policies on user_roles to prevent privilege escalation
CREATE POLICY "Only admins can insert roles"
ON public.user_roles FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update roles"
ON public.user_roles FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete roles"
ON public.user_roles FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));
