-- Schema for Order Timer Pro
-- Version: 1.0.0

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users NOT NULL,
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Production settings table
CREATE TABLE IF NOT EXISTS production_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users NOT NULL,
    default_production_time INTEGER NOT NULL DEFAULT 15, -- tempo em minutos
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users NOT NULL,
    customer_name TEXT NOT NULL,
    description TEXT,
    queue_position INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'waiting', -- waiting, in_production, paused, completed, cancelled
    production_start_time TIMESTAMPTZ,
    production_end_time TIMESTAMPTZ,
    total_production_time INTEGER, -- tempo total em segundos
    paused_time INTEGER DEFAULT 0, -- tempo total em pausa em segundos
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
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
CREATE POLICY "Users can view own profile" 
    ON profiles FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" 
    ON profiles FOR UPDATE 
    USING (auth.uid() = user_id);

-- Production Settings policies
CREATE POLICY "Users can view own settings" 
    ON production_settings FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" 
    ON production_settings FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" 
    ON production_settings FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Orders policies
CREATE POLICY "Users can view own orders" 
    ON orders FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders" 
    ON orders FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own orders" 
    ON orders FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own orders" 
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