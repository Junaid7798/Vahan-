-- Seller submission schema upgrade for portal parity
-- Migration: 20260411_001_seller_submission_upgrade.sql

ALTER TABLE public.seller_submissions
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS location VARCHAR(120),
    ADD COLUMN IF NOT EXISTS mileage INTEGER,
    ADD COLUMN IF NOT EXISTS asking_price DECIMAL(12,2),
    ADD COLUMN IF NOT EXISTS linked_listing_id UUID REFERENCES public.vehicle_listings(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS media_paths JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS seller_submissions_user_id_idx
    ON public.seller_submissions (user_id);

CREATE INDEX IF NOT EXISTS seller_submissions_status_idx
    ON public.seller_submissions (status);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'seller_submissions'
          AND policyname = 'Users can view own seller submissions'
    ) THEN
        CREATE POLICY "Users can view own seller submissions"
        ON public.seller_submissions FOR SELECT
        USING (user_id = auth.uid());
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'seller_submissions'
          AND policyname = 'Users can update own editable seller submissions'
    ) THEN
        CREATE POLICY "Users can update own editable seller submissions"
        ON public.seller_submissions FOR UPDATE
        USING (
            user_id = auth.uid()
            AND linked_listing_id IS NULL
            AND status IN ('pending', 'changes_requested')
        )
        WITH CHECK (
            user_id = auth.uid()
            AND linked_listing_id IS NULL
            AND status IN ('pending', 'changes_requested')
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'seller_submissions'
          AND policyname = 'Users can delete own editable seller submissions'
    ) THEN
        CREATE POLICY "Users can delete own editable seller submissions"
        ON public.seller_submissions FOR DELETE
        USING (
            user_id = auth.uid()
            AND linked_listing_id IS NULL
            AND status IN ('pending', 'changes_requested')
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'seller_submissions'
          AND policyname = 'Staff can view all seller submissions'
    ) THEN
        CREATE POLICY "Staff can view all seller submissions"
        ON public.seller_submissions FOR SELECT
        USING (public.is_manager());
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'seller_submissions'
          AND policyname = 'Staff can manage seller submissions'
    ) THEN
        CREATE POLICY "Staff can manage seller submissions"
        ON public.seller_submissions FOR ALL
        USING (public.is_manager())
        WITH CHECK (public.is_manager());
    END IF;
END $$;
