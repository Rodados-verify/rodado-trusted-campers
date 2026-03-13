
-- Create storage bucket for solicitud photos
INSERT INTO storage.buckets (id, name, public) VALUES ('solicitud-fotos', 'solicitud-fotos', true);

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload own photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'solicitud-fotos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to read own photos
CREATE POLICY "Users can read own photos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'solicitud-fotos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow public read for published photos
CREATE POLICY "Public can read solicitud photos"
ON storage.objects FOR SELECT TO anon
USING (bucket_id = 'solicitud-fotos');

-- Allow users to delete own photos
CREATE POLICY "Users can delete own photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'solicitud-fotos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow admins full access
CREATE POLICY "Admins full access to solicitud photos"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'solicitud-fotos' AND public.has_role(auth.uid(), 'admin'));
