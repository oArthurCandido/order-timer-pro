-- Schema for Order Timer Pro
-- Version: 1.0.0

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY,
    full_name TEXT,
    email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Production settings table
CREATE TABLE IF NOT EXISTS production_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item1_name TEXT NOT NULL DEFAULT 'Item 1',
    item1_production_time INTEGER NOT NULL DEFAULT 10,
    item2_name TEXT NOT NULL DEFAULT 'Item 2',
    item2_production_time INTEGER NOT NULL DEFAULT 15,
    working_hours_per_day INTEGER NOT NULL DEFAULT 8,
    start_time TEXT NOT NULL DEFAULT '09:00',
    end_time TEXT NOT NULL DEFAULT '17:00',
    working_days INTEGER[] NOT NULL DEFAULT '{1,2,3,4,5}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id UUID REFERENCES auth.users
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    item1_quantity INTEGER NOT NULL DEFAULT 0,
    item2_quantity INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending',
    total_production_time INTEGER NOT NULL,
    estimated_completion_date TIMESTAMPTZ NOT NULL,
    queue_position INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id UUID REFERENCES auth.users,
    production_start_time TIMESTAMPTZ,
    production_time_accumulated INTEGER DEFAULT 0
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_queue_position ON orders(queue_position);

-- Add RLS policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read for users based on user_id" 
    ON profiles FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users only" 
    ON profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for users based on user_id" 
    ON profiles FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Production Settings policies
CREATE POLICY "Enable read for users based on user_id" 
    ON production_settings FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for authenticated users only" 
    ON production_settings FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for users based on user_id" 
    ON production_settings FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Orders policies
CREATE POLICY "Enable read for users based on user_id" 
    ON orders FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for authenticated users only" 
    ON orders FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for users based on user_id" 
    ON orders FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete for users based on user_id" 
    ON orders FOR DELETE 
    USING (auth.uid() = user_id);

-- Triggers para atualização de timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_production_settings_updated_at
    BEFORE UPDATE ON production_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 