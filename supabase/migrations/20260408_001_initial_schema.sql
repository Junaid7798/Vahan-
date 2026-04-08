-- Vehicle Inventory Portal - Initial Schema
-- Migration: 20260408_001_initial_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    phone VARCHAR(20),
    city VARCHAR(100),
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    approval_status VARCHAR(20) NOT NULL DEFAULT 'pending_approval',
    can_view_financials BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vehicles table (physical vehicle attributes)
CREATE TABLE public.vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vin VARCHAR(17) UNIQUE,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL,
    variant VARCHAR(100),
    color VARCHAR(50),
    mileage INTEGER,
    fuel_type VARCHAR(50),
    transmission VARCHAR(50),
    body_type VARCHAR(50),
    registration_year INTEGER,
    location VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vehicle listings (sellable inventory entries)
CREATE TABLE public.vehicle_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    
    -- Financial fields (hidden from normal users)
    procurement_price DECIMAL(12,2),
    target_selling_price DECIMAL(12,2),
    extra_spend DECIMAL(12,2) DEFAULT 0,
    maintenance_cost DECIMAL(10,2) DEFAULT 0,
    documentation_cost DECIMAL(10,2) DEFAULT 0,
    transport_cost DECIMAL(10,2) DEFAULT 0,
    other_cost DECIMAL(10,2) DEFAULT 0,
    
    -- Internal notes
    internal_notes TEXT,
    condition_notes TEXT,
    highlights TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE,
    sold_at TIMESTAMP WITH TIME ZONE
);

-- Vehicle media
CREATE TABLE public.vehicle_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES vehicle_listings(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    media_type VARCHAR(20) NOT NULL DEFAULT 'image',
    is_blurred BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seller submissions (outside sellers submit vehicles)
CREATE TABLE public.seller_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_name VARCHAR(100) NOT NULL,
    seller_phone VARCHAR(20) NOT NULL,
    seller_email VARCHAR(255),
    vehicle_make VARCHAR(100),
    vehicle_model VARCHAR(100),
    vehicle_year INTEGER,
    vehicle_variant VARCHAR(100),
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inquiries
CREATE TABLE public.inquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES vehicle_listings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject VARCHAR(200),
    message TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reservation requests
CREATE TABLE public.reservation_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES vehicle_listings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Waitlist (for reserved vehicles)
CREATE TABLE public.reservation_waitlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES vehicle_listings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'waiting',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Resale requests
CREATE TABLE public.resale_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES vehicle_listings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT,
    expected_timeline VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat threads
CREATE TABLE public.chat_threads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thread_type VARCHAR(20) NOT NULL DEFAULT 'support',
    listing_id UUID REFERENCES vehicle_listings(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat participants
CREATE TABLE public.chat_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thread_id UUID NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat messages
CREATE TABLE public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thread_id UUID NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message_type VARCHAR(20) NOT NULL DEFAULT 'text',
    content TEXT,
    voice_note_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity logs
CREATE TABLE public.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_listings_status ON vehicle_listings(status);
CREATE INDEX idx_listings_vehicle ON vehicle_listings(vehicle_id);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_approval ON user_profiles(approval_status);
CREATE INDEX idx_inquiries_listing ON inquiries(listing_id);
CREATE INDEX idx_inquiries_user ON inquiries(user_id);
CREATE INDEX idx_reservation_requests_listing ON reservation_requests(listing_id);
CREATE INDEX idx_waitlist_listing ON reservation_waitlist(listing_id);
CREATE INDEX idx_resale_requests_listing ON resale_requests(listing_id);
CREATE INDEX idx_chat_threads_listing ON chat_threads(listing_id);
CREATE INDEX idx_chat_messages_thread ON chat_messages(thread_id);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at
    BEFORE UPDATE ON public.vehicles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicle_listings_updated_at
    BEFORE UPDATE ON public.vehicle_listings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seller_submissions_updated_at
    BEFORE UPDATE ON public.seller_submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inquiries_updated_at
    BEFORE UPDATE ON public.inquiries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservation_requests_updated_at
    BEFORE UPDATE ON public.reservation_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resale_requests_updated_at
    BEFORE UPDATE ON public.resale_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_threads_updated_at
    BEFORE UPDATE ON public.chat_threads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();