-- RLS Policies for Vehicle Inventory Portal
-- Migration: 20260408_002_rls_policies.sql

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservation_waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resale_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- =====================
-- USER PROFILES POLICIES
-- =====================

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
ON public.user_profiles FOR SELECT
USING (auth.uid() = id);

-- Users can update their own profile (except role/approval_status)
CREATE POLICY "Users can update own profile"
ON public.user_profiles FOR UPDATE
USING (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "Admins can view all profiles"
ON public.user_profiles FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Admins can update user roles and approval status
CREATE POLICY "Admins can update user roles"
ON public.user_profiles FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is manager
CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = 'admin'
    ) OR EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = 'manager'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================
-- VEHICLES POLICIES
-- =====================

-- All authenticated users can read vehicles
CREATE POLICY "Authenticated users can view vehicles"
ON public.vehicles FOR SELECT
USING (auth.role() = 'authenticated');

-- Only admins can insert/update/delete vehicles
CREATE POLICY "Admins can manage vehicles"
ON public.vehicles FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- =====================
-- VEHICLE LISTINGS POLICIES
-- =====================

-- Users can view published listings (without financial data)
CREATE POLICY "Users can view published listings"
ON public.vehicle_listings FOR SELECT
USING (
    auth.role() = 'authenticated' 
    AND status IN ('published', 'reserved', 'sold')
);

-- Managers can view all listings including draft
CREATE POLICY "Managers can view all listings"
ON public.vehicle_listings FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
);

-- Admins can manage all listings
CREATE POLICY "Admins can manage listings"
ON public.vehicle_listings FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- =====================
-- VEHICLE MEDIA POLICIES
-- =====================

-- Users can view blurred media only
CREATE POLICY "Users can view blurred media"
ON public.vehicle_media FOR SELECT
USING (
    auth.role() = 'authenticated'
    OR is_blurred = true
);

-- Admins/Managers can view all media
CREATE POLICY "Managers can view all media"
ON public.vehicle_media FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
);

-- Admins can manage media
CREATE POLICY "Admins can manage media"
ON public.vehicle_media FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- =====================
-- SELLER SUBMISSIONS POLICIES
-- =====================

-- Public can create submissions (no auth required for initial submission)
CREATE POLICY "Anyone can create seller submissions"
ON public.seller_submissions FOR INSERT
WITH CHECK (true);

-- Admins can view all submissions
CREATE POLICY "Admins can view all submissions"
ON public.seller_submissions FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Admins can update submissions
CREATE POLICY "Admins can update submissions"
ON public.seller_submissions FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- =====================
-- INQUIRIES POLICIES
-- =====================

-- Users can view their own inquiries
CREATE POLICY "Users can view own inquiries"
ON public.inquiries FOR SELECT
USING (user_id = auth.uid());

-- Users can create inquiries for published listings
CREATE POLICY "Users can create inquiries"
ON public.inquiries FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.vehicle_listings
        WHERE id = listing_id AND status IN ('published', 'reserved')
    )
);

-- Admins can view all inquiries
CREATE POLICY "Admins can view all inquiries"
ON public.inquiries FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Admins can update inquiry status
CREATE POLICY "Admins can update inquiries"
ON public.inquiries FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- =====================
-- RESERVATION REQUESTS POLICIES
-- =====================

-- Users can view their own reservation requests
CREATE POLICY "Users can view own reservations"
ON public.reservation_requests FOR SELECT
USING (user_id = auth.uid());

-- Users can create reservation requests for published listings
CREATE POLICY "Users can create reservations"
ON public.reservation_requests FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can cancel their own pending reservations
CREATE POLICY "Users can cancel own reservations"
ON public.reservation_requests FOR UPDATE
USING (
    user_id = auth.uid() 
    AND status = 'pending'
);

-- Admins can view all reservation requests
CREATE POLICY "Admins can view all reservations"
ON public.reservation_requests FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Admins can update reservation status
CREATE POLICY "Admins can update reservations"
ON public.reservation_requests FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- =====================
-- RESERVATION WAITLIST POLICIES
-- =====================

-- Users can view their own waitlist entries
CREATE POLICY "Users can view own waitlist"
ON public.reservation_waitlist FOR SELECT
USING (user_id = auth.uid());

-- Users can join waitlist for reserved vehicles
CREATE POLICY "Users can join waitlist"
ON public.reservation_waitlist FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Admins can view all waitlist entries
CREATE POLICY "Admins can view all waitlist"
ON public.reservation_waitlist FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Admins can manage waitlist
CREATE POLICY "Admins can manage waitlist"
ON public.reservation_waitlist FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- =====================
-- RESALE REQUESTS POLICIES
-- =====================

-- Users can view their own resale requests
CREATE POLICY "Users can view own resale requests"
ON public.resale_requests FOR SELECT
USING (user_id = auth.uid());

-- Users can create resale requests
CREATE POLICY "Users can create resale requests"
ON public.resale_requests FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can cancel their own pending resale requests
CREATE POLICY "Users can cancel own resale requests"
ON public.resale_requests FOR UPDATE
USING (
    user_id = auth.uid() 
    AND status = 'pending'
);

-- Admins can view all resale requests
CREATE POLICY "Admins can view all resale requests"
ON public.resale_requests FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Admins can update resale request status
CREATE POLICY "Admins can update resale requests"
ON public.resale_requests FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- =====================
-- CHAT THREADS POLICIES
-- =====================

-- Users can view threads they're participants in
CREATE POLICY "Users can view own threads"
ON public.chat_threads FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.chat_participants
        WHERE thread_id = id AND user_id = auth.uid()
    )
);

-- Users can create support threads
CREATE POLICY "Users can create support threads"
ON public.chat_threads FOR INSERT
WITH CHECK (thread_type = 'support');

-- Admins can view all threads
CREATE POLICY "Admins can view all threads"
ON public.chat_threads FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Admins can manage threads
CREATE POLICY "Admins can manage threads"
ON public.chat_threads FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- =====================
-- CHAT PARTICIPANTS POLICIES
-- =====================

-- Users can view their own participant records
CREATE POLICY "Users can view own participation"
ON public.chat_participants FOR SELECT
USING (user_id = auth.uid());

-- Users can join threads
CREATE POLICY "Users can join threads"
ON public.chat_participants FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Admins can manage participants
CREATE POLICY "Admins can manage participants"
ON public.chat_participants FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- =====================
-- CHAT MESSAGES POLICIES
-- =====================

-- Users can view messages in threads they're participants in
CREATE POLICY "Users can view messages in own threads"
ON public.chat_messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.chat_participants
        WHERE thread_id = thread_id AND user_id = auth.uid()
    )
);

-- Users can send messages in threads they're participants in
CREATE POLICY "Users can send messages"
ON public.chat_messages FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.chat_participants
        WHERE thread_id = thread_id AND user_id = auth.uid()
    )
);

-- Admins can view all messages
CREATE POLICY "Admins can view all messages"
ON public.chat_messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Admins can delete messages
CREATE POLICY "Admins can delete messages"
ON public.chat_messages FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- =====================
-- ACTIVITY LOGS POLICIES
-- =====================

-- Users can view their own activity logs
CREATE POLICY "Users can view own activity"
ON public.activity_logs FOR SELECT
USING (user_id = auth.uid());

-- System can insert activity logs (via trigger or service role)
CREATE POLICY "Service role can manage activity logs"
ON public.activity_logs FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Admins can view all activity logs
CREATE POLICY "Admins can view all activity"
ON public.activity_logs FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);