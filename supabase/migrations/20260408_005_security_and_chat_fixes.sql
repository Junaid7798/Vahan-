-- Security and chat policy fixes
-- Migration: 20260408_005_security_and_chat_fixes.sql

ALTER TABLE public.chat_participants
ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMP WITH TIME ZONE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_participants_thread_user
ON public.chat_participants(thread_id, user_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_created_at
ON public.chat_messages(thread_id, created_at);

DROP POLICY IF EXISTS "Users can view blurred media" ON public.vehicle_media;
CREATE POLICY "Users can view blurred media"
ON public.vehicle_media FOR SELECT
USING (
  is_blurred = true
  AND EXISTS (
    SELECT 1
    FROM public.vehicle_listings
    WHERE public.vehicle_listings.id = public.vehicle_media.listing_id
      AND public.vehicle_listings.status IN ('published', 'reserved', 'sold')
  )
);

DROP POLICY IF EXISTS "Users can create inquiries" ON public.inquiries;
CREATE POLICY "Users can create inquiries"
ON public.inquiries FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.vehicle_listings
    WHERE public.vehicle_listings.id = public.inquiries.listing_id
      AND public.vehicle_listings.status IN ('published', 'reserved')
  )
);

DROP POLICY IF EXISTS "Users can view own threads" ON public.chat_threads;
CREATE POLICY "Users can view own threads"
ON public.chat_threads FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.chat_participants AS participant
    WHERE participant.thread_id = public.chat_threads.id
      AND participant.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can create support threads" ON public.chat_threads;
CREATE POLICY "Users can create chat threads"
ON public.chat_threads FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated'
  AND (
    thread_type = 'support'
    OR (
      thread_type = 'vehicle'
      AND listing_id IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.vehicle_listings
        WHERE public.vehicle_listings.id = public.chat_threads.listing_id
          AND public.vehicle_listings.status IN ('published', 'reserved', 'sold')
      )
    )
  )
);

DROP POLICY IF EXISTS "Users can view own participation" ON public.chat_participants;
CREATE POLICY "Users can view own participation"
ON public.chat_participants FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own participation" ON public.chat_participants;
CREATE POLICY "Users can update own participation"
ON public.chat_participants FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view messages in own threads" ON public.chat_messages;
CREATE POLICY "Users can view messages in own threads"
ON public.chat_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.chat_participants AS participant
    WHERE participant.thread_id = public.chat_messages.thread_id
      AND participant.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can send messages" ON public.chat_messages;
CREATE POLICY "Users can send messages"
ON public.chat_messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.chat_participants AS participant
    WHERE participant.thread_id = public.chat_messages.thread_id
      AND participant.user_id = auth.uid()
  )
);

UPDATE storage.buckets
SET public = false
WHERE id IN ('vehicle-images', 'voice-notes');

DROP POLICY IF EXISTS "Public can view vehicle images" ON storage.objects;
DROP POLICY IF EXISTS "Auth users can upload vehicle images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete vehicle images" ON storage.objects;

CREATE POLICY "Approved users can view blurred vehicle images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'vehicle-images'
  AND (
    public.is_manager()
    OR EXISTS (
      SELECT 1
      FROM public.vehicle_media
      JOIN public.vehicle_listings ON public.vehicle_listings.id = public.vehicle_media.listing_id
      JOIN public.user_profiles ON public.user_profiles.id = auth.uid()
      WHERE public.vehicle_media.storage_path = storage.objects.name
        AND public.vehicle_media.is_blurred = true
        AND public.vehicle_listings.status IN ('published', 'reserved', 'sold')
        AND public.user_profiles.approval_status = 'approved'
    )
  )
);

CREATE POLICY "Admins can upload vehicle images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'vehicle-images'
  AND public.is_admin()
);

CREATE POLICY "Admins can delete vehicle images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'vehicle-images'
  AND public.is_admin()
);

DROP POLICY IF EXISTS "Public can view voice notes" ON storage.objects;
DROP POLICY IF EXISTS "Auth users can upload voice notes" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own voice notes" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete any voice notes" ON storage.objects;

CREATE POLICY "Thread participants can view voice notes"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'voice-notes'
  AND (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.chat_messages
      JOIN public.chat_participants
        ON public.chat_participants.thread_id = public.chat_messages.thread_id
      WHERE public.chat_messages.voice_note_path = storage.objects.name
        AND public.chat_participants.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can upload own voice notes"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'voice-notes'
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own voice notes"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'voice-notes'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.is_admin()
  )
);
