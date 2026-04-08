-- Storage Buckets for Vehicle Inventory Portal
-- Migration: 20260408_003_storage_buckets.sql

-- Enable storage
-- Note: This is managed via Supabase dashboard or CLI
-- Below are the SQL representations

-- Insert storage bucket for vehicle images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types, created_at, updated_at)
VALUES (
    'vehicle-images',
    'vehicle-images',
    true,
    10485760, -- 10MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert storage bucket for voice notes
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types, created_at, updated_at)
VALUES (
    'voice-notes',
    'voice-notes',
    true,
    5242880, -- 5MB
    ARRAY['audio/mpeg', 'audio/mp3', 'audio/webm', 'audio/ogg', 'audio/wav'],
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for vehicle-images bucket

-- Anyone can view vehicle images
CREATE POLICY "Public can view vehicle images"
ON storage.objects FOR SELECT
USING (bucket_id = 'vehicle-images');

-- Authenticated users can upload vehicle images
CREATE POLICY "Auth users can upload vehicle images"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'vehicle-images' 
    AND auth.role() = 'authenticated'
);

-- Admins can delete vehicle images
CREATE POLICY "Admins can delete vehicle images"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'vehicle-images'
    AND EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Storage policies for voice-notes bucket

-- Anyone can view voice notes
CREATE POLICY "Public can view voice notes"
ON storage.objects FOR SELECT
USING (bucket_id = 'voice-notes');

-- Authenticated users can upload voice notes
CREATE POLICY "Auth users can upload voice notes"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'voice-notes' 
    AND auth.role() = 'authenticated'
);

-- Users can delete their own voice notes
CREATE POLICY "Users can delete own voice notes"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'voice-notes'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Admins can delete any voice notes
CREATE POLICY "Admins can delete any voice notes"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'voice-notes'
    AND EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);