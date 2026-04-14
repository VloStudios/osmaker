DROP POLICY IF EXISTS "Anyone can view wallpapers" ON storage.objects;

CREATE POLICY "Users can view own wallpapers"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'wallpapers'
  AND auth.uid() IS NOT NULL
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can update own wallpapers" ON storage.objects;
CREATE POLICY "Users can update own wallpapers"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'wallpapers'
  AND auth.uid() IS NOT NULL
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'wallpapers'
  AND auth.uid() IS NOT NULL
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::public.app_role));