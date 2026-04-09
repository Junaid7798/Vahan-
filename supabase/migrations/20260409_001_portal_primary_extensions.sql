-- Portal primary extensions for Supabase-first mode
-- Migration: 20260409_001_portal_primary_extensions.sql

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS preferred_locale VARCHAR(5) NOT NULL DEFAULT 'en';

ALTER TABLE public.vehicle_listings
ADD COLUMN IF NOT EXISTS stock_id VARCHAR(32);

ALTER TABLE public.chat_messages
ADD COLUMN IF NOT EXISTS voice_duration INTEGER;

CREATE UNIQUE INDEX IF NOT EXISTS idx_vehicle_listings_stock_id
ON public.vehicle_listings(stock_id)
WHERE stock_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.app_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    default_locale VARCHAR(5) NOT NULL DEFAULT 'en',
    manager_financial_access BOOLEAN NOT NULL DEFAULT FALSE,
    notify_inquiries BOOLEAN NOT NULL DEFAULT TRUE,
    notify_reservations BOOLEAN NOT NULL DEFAULT TRUE,
    notify_seller_submissions BOOLEAN NOT NULL DEFAULT TRUE,
    notify_resale_requests BOOLEAN NOT NULL DEFAULT TRUE,
    notify_chats BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT app_settings_singleton CHECK (id = 1)
);

INSERT INTO public.app_settings (
    id,
    default_locale,
    manager_financial_access,
    notify_inquiries,
    notify_reservations,
    notify_seller_submissions,
    notify_resale_requests,
    notify_chats
)
VALUES (1, 'en', FALSE, TRUE, TRUE, TRUE, TRUE, TRUE)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view app settings" ON public.app_settings;
CREATE POLICY "Admins can view app settings"
ON public.app_settings FOR SELECT
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update app settings" ON public.app_settings;
CREATE POLICY "Admins can update app settings"
ON public.app_settings FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Managers can manage vehicles" ON public.vehicles;
CREATE POLICY "Managers can manage vehicles"
ON public.vehicles FOR ALL
USING (public.is_manager())
WITH CHECK (public.is_manager());

DROP POLICY IF EXISTS "Managers can manage listings" ON public.vehicle_listings;
CREATE POLICY "Managers can manage listings"
ON public.vehicle_listings FOR ALL
USING (public.is_manager())
WITH CHECK (public.is_manager());

DROP POLICY IF EXISTS "Managers can update inquiries" ON public.inquiries;
CREATE POLICY "Managers can update inquiries"
ON public.inquiries FOR UPDATE
USING (public.is_manager())
WITH CHECK (public.is_manager());

DROP POLICY IF EXISTS "Managers can view all inquiries" ON public.inquiries;
CREATE POLICY "Managers can view all inquiries"
ON public.inquiries FOR SELECT
USING (public.is_manager());

DROP POLICY IF EXISTS "Managers can view all reservations" ON public.reservation_requests;
CREATE POLICY "Managers can view all reservations"
ON public.reservation_requests FOR SELECT
USING (public.is_manager());

DROP POLICY IF EXISTS "Managers can update reservations" ON public.reservation_requests;
CREATE POLICY "Managers can update reservations"
ON public.reservation_requests FOR UPDATE
USING (public.is_manager())
WITH CHECK (public.is_manager());

DROP POLICY IF EXISTS "Managers can view all waitlist" ON public.reservation_waitlist;
CREATE POLICY "Managers can view all waitlist"
ON public.reservation_waitlist FOR SELECT
USING (public.is_manager());

DROP POLICY IF EXISTS "Managers can manage waitlist" ON public.reservation_waitlist;
CREATE POLICY "Managers can manage waitlist"
ON public.reservation_waitlist FOR ALL
USING (public.is_manager())
WITH CHECK (public.is_manager());

DROP POLICY IF EXISTS "Managers can view all resale requests" ON public.resale_requests;
CREATE POLICY "Managers can view all resale requests"
ON public.resale_requests FOR SELECT
USING (public.is_manager());

DROP POLICY IF EXISTS "Managers can update resale requests" ON public.resale_requests;
CREATE POLICY "Managers can update resale requests"
ON public.resale_requests FOR UPDATE
USING (public.is_manager())
WITH CHECK (public.is_manager());

DROP POLICY IF EXISTS "Managers can manage chat threads" ON public.chat_threads;
CREATE POLICY "Managers can manage chat threads"
ON public.chat_threads FOR UPDATE
USING (public.is_manager())
WITH CHECK (public.is_manager());

DROP POLICY IF EXISTS "Managers can view all threads" ON public.chat_threads;
CREATE POLICY "Managers can view all threads"
ON public.chat_threads FOR SELECT
USING (public.is_manager());

DROP POLICY IF EXISTS "Managers can manage chat participants" ON public.chat_participants;
CREATE POLICY "Managers can manage chat participants"
ON public.chat_participants FOR ALL
USING (public.is_manager())
WITH CHECK (public.is_manager());

DROP POLICY IF EXISTS "Managers can view all messages" ON public.chat_messages;
CREATE POLICY "Managers can view all messages"
ON public.chat_messages FOR SELECT
USING (public.is_manager());

DROP POLICY IF EXISTS "Managers can delete messages" ON public.chat_messages;
CREATE POLICY "Managers can delete messages"
ON public.chat_messages FOR DELETE
USING (public.is_manager());

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (
        id,
        full_name,
        phone,
        city,
        preferred_locale,
        role,
        approval_status,
        can_view_financials
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.raw_user_meta_data->>'phone',
        NEW.raw_user_meta_data->>'city',
        COALESCE(NEW.raw_user_meta_data->>'preferred_locale', 'en'),
        'user',
        'pending_approval',
        false
    )
    ON CONFLICT (id) DO UPDATE
    SET
        full_name = EXCLUDED.full_name,
        phone = COALESCE(EXCLUDED.phone, public.user_profiles.phone),
        city = COALESCE(EXCLUDED.city, public.user_profiles.city),
        preferred_locale = COALESCE(EXCLUDED.preferred_locale, public.user_profiles.preferred_locale);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.promote_user_by_email(target_email TEXT, target_role VARCHAR(20), target_financials BOOLEAN)
RETURNS VOID AS $$
DECLARE
    target_user_id UUID;
BEGIN
    SELECT id INTO target_user_id
    FROM auth.users
    WHERE email = target_email
    LIMIT 1;

    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'No auth user found for %', target_email;
    END IF;

    UPDATE public.user_profiles
    SET
        role = target_role,
        approval_status = 'approved',
        can_view_financials = target_financials
    WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
