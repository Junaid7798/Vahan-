-- Reservation guardrails
-- Migration: 20260410_001_reservation_guardrails.sql

CREATE UNIQUE INDEX IF NOT EXISTS idx_reservation_requests_listing_user_active
ON public.reservation_requests(listing_id, user_id)
WHERE status IN ('pending', 'approved');

CREATE UNIQUE INDEX IF NOT EXISTS idx_reservation_waitlist_listing_user_waiting
ON public.reservation_waitlist(listing_id, user_id)
WHERE status = 'waiting';
