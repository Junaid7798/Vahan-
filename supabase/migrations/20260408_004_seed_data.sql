-- Seed Data for Vehicle Inventory Portal
-- Migration: 20260408_004_seed_data.sql
-- Note: Run this after setting up Supabase Auth

-- Create a demo admin user (for testing, will need actual Supabase auth)
-- This creates a placeholder - in production you'd use Supabase dashboard or CLI to create users

-- Create an admin profile (user must already exist in auth.users)
-- Example: INSERT INTO public.user_profiles (id, full_name, role, approval_status, can_view_financials)
-- VALUES ('admin-user-uuid', 'Admin User', 'admin', 'approved', true);

-- Create sample vehicles
INSERT INTO public.vehicles (id, vin, make, model, year, variant, color, mileage, fuel_type, transmission, body_type, location)
VALUES 
    (uuid_generate_v4(), '1HGBH41JXMN109186', 'Maruti Suzuki', 'Swift', 2023, 'VXI', 'White', 15000, 'Petrol', 'Automatic', 'Hatchback', 'Delhi'),
    (uuid_generate_v4(), '2HGBH41JXMN109187', 'Hyundai', 'Creta', 2022, 'SX', 'Black', 35000, 'Petrol', 'Manual', 'SUV', 'Mumbai'),
    (uuid_generate_v4(), '3HGBH41JXMN109188', 'Honda', 'City', 2023, 'V', 'Silver', 20000, 'Petrol', 'Automatic', 'Sedan', 'Bangalore'),
    (uuid_generate_v4(), '4HGBH41JXMN109189', 'Toyota', 'Innova', 2021, 'VX', 'Grey', 55000, 'Diesel', 'Manual', 'MPV', 'Chennai'),
    (uuid_generate_v4(), '5HGBH41JXMN109190', 'Kia', 'Seltos', 2022, 'GTX', 'Red', 28000, 'Petrol', 'Automatic', 'SUV', 'Hyderabad')
ON CONFLICT (vin) DO NOTHING;

-- Create sample listings for the vehicles
-- Note: In production, you'd use actual vehicle IDs
DO $$
DECLARE
    v_vehicle_id UUID;
    v_listing_id UUID;
BEGIN
    -- Get first vehicle
    SELECT id INTO v_vehicle_id FROM vehicles LIMIT 1;
    
    IF v_vehicle_id IS NOT NULL THEN
        INSERT INTO public.vehicle_listings (
            vehicle_id, status, procurement_price, target_selling_price,
            extra_spend, maintenance_cost, documentation_cost, transport_cost, other_cost,
            internal_notes, condition_notes, highlights, published_at
        ) VALUES (
            v_vehicle_id, 'published', 550000, 680000,
            25000, 5000, 15000, 5000, 5000,
            'Excellent condition, single owner, all service records available',
            'Minor scratches on rear bumper, all tires in good condition',
            'Android infotainment, alloy wheels, reverse camera',
            NOW() - INTERVAL '30 days'
        ) RETURNING id INTO v_listing_id;
        
        -- Add sample media
        INSERT INTO public.vehicle_media (listing_id, storage_path, media_type, is_blurred, display_order)
        VALUES 
            (v_listing_id, 'samples/sample-1.jpg', 'image', false, 1),
            (v_listing_id, 'samples/sample-2.jpg', 'image', false, 2),
            (v_listing_id, 'samples/sample-3.jpg', 'image', true, 3);
    END IF;
END $$;

-- Create activity log for system setup
INSERT INTO public.activity_logs (action, entity_type, details)
VALUES 
    ('system_initialized', 'system', '{"message": "Vehicle Inventory Portal initialized", "version": "1.0.0"}'),
    ('seed_data_loaded', 'system', '{"message": "Initial seed data loaded", "tables": ["vehicles", "vehicle_listings"]}');

-- Function to create user profile automatically on signup
-- This trigger fires when a new user is created in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, full_name, role, approval_status, can_view_financials)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        'user',
        'pending_approval',
        false
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto-creating user profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to approve user (admin only)
CREATE OR REPLACE FUNCTION public.approve_user(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.user_profiles
    SET approval_status = 'approved'
    WHERE id = user_uuid;
    
    INSERT INTO public.activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (auth.uid(), 'user_approved', 'user_profiles', user_uuid, '{"status": "approved"}');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update user role (admin only)
CREATE OR REPLACE FUNCTION public.update_user_role(user_uuid UUID, new_role VARCHAR(20))
RETURNS VOID AS $$
BEGIN
    UPDATE public.user_profiles
    SET role = new_role
    WHERE id = user_uuid;
    
    INSERT INTO public.activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (auth.uid(), 'role_changed', 'user_profiles', user_uuid, jsonb_build_object('new_role', new_role));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to grant financial view access (admin only)
CREATE OR REPLACE FUNCTION public.toggle_financials_access(user_uuid UUID, can_view BOOLEAN)
RETURNS VOID AS $$
BEGIN
    UPDATE public.user_profiles
    SET can_view_financials = can_view
    WHERE id = user_uuid;
    
    INSERT INTO public.activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (auth.uid(), 'financials_access_changed', 'user_profiles', user_uuid, jsonb_build_object('can_view', can_view));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;