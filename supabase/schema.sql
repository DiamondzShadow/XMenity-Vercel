-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table for X/Twitter user data
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform_user_id TEXT NOT NULL UNIQUE,
    platform TEXT NOT NULL DEFAULT 'twitter',
    username TEXT NOT NULL,
    display_name TEXT,
    bio TEXT,
    follower_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    post_count INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    profile_image TEXT,
    location TEXT,
    website TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create wallet_x_bindings table for linking wallets to X accounts
CREATE TABLE IF NOT EXISTS wallet_x_bindings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform_user_id TEXT NOT NULL,
    platform_username TEXT NOT NULL,
    wallet_address TEXT NOT NULL,
    date_linked TIMESTAMPTZ DEFAULT NOW(),
    minted BOOLEAN DEFAULT FALSE,
    last_mint_at TIMESTAMPTZ,
    extra_metadata JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique binding per platform user and wallet
    UNIQUE(platform_user_id, wallet_address)
);

-- Create token_mints table for tracking all minting operations
CREATE TABLE IF NOT EXISTS token_mints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform_user_id TEXT NOT NULL,
    wallet_address TEXT NOT NULL,
    recipient_address TEXT NOT NULL,
    token_address TEXT,
    amount TEXT NOT NULL,
    tx_hash TEXT NOT NULL UNIQUE,
    block_number INTEGER,
    gas_used TEXT,
    reason TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create api_keys table for managing API access
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    key TEXT NOT NULL UNIQUE,
    hashed_key TEXT NOT NULL,
    permissions JSONB,
    rate_limit INTEGER DEFAULT 100,
    rate_period INTEGER DEFAULT 3600,
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_platform_user_id ON profiles(platform_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_platform ON profiles(platform);

CREATE INDEX IF NOT EXISTS idx_wallet_bindings_platform_user_id ON wallet_x_bindings(platform_user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_bindings_wallet_address ON wallet_x_bindings(wallet_address);
CREATE INDEX IF NOT EXISTS idx_wallet_bindings_minted ON wallet_x_bindings(minted);
CREATE INDEX IF NOT EXISTS idx_wallet_bindings_active ON wallet_x_bindings(is_active);

CREATE INDEX IF NOT EXISTS idx_token_mints_platform_user_id ON token_mints(platform_user_id);
CREATE INDEX IF NOT EXISTS idx_token_mints_wallet_address ON token_mints(wallet_address);
CREATE INDEX IF NOT EXISTS idx_token_mints_recipient ON token_mints(recipient_address);
CREATE INDEX IF NOT EXISTS idx_token_mints_tx_hash ON token_mints(tx_hash);
CREATE INDEX IF NOT EXISTS idx_token_mints_created_at ON token_mints(created_at);

CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(key);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_wallet_bindings_updated_at ON wallet_x_bindings;
CREATE TRIGGER update_wallet_bindings_updated_at 
    BEFORE UPDATE ON wallet_x_bindings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_api_keys_updated_at ON api_keys;
CREATE TRIGGER update_api_keys_updated_at 
    BEFORE UPDATE ON api_keys 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_x_bindings ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_mints ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Policies for profiles table
CREATE POLICY "Profiles are viewable by everyone" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Profiles can be inserted by service role" ON profiles
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Profiles can be updated by service role" ON profiles
    FOR UPDATE USING (auth.role() = 'service_role');

-- Policies for wallet_x_bindings table
CREATE POLICY "Wallet bindings are viewable by everyone" ON wallet_x_bindings
    FOR SELECT USING (true);

CREATE POLICY "Wallet bindings can be inserted by service role" ON wallet_x_bindings
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Wallet bindings can be updated by service role" ON wallet_x_bindings
    FOR UPDATE USING (auth.role() = 'service_role');

-- Policies for token_mints table
CREATE POLICY "Token mints are viewable by everyone" ON token_mints
    FOR SELECT USING (true);

CREATE POLICY "Token mints can be inserted by service role" ON token_mints
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Policies for api_keys table (admin only)
CREATE POLICY "API keys are only accessible by service role" ON api_keys
    FOR ALL USING (auth.role() = 'service_role');

-- Create view for public statistics
CREATE OR REPLACE VIEW public_stats AS
SELECT 
    COUNT(DISTINCT platform_user_id) as total_users,
    COUNT(DISTINCT wallet_address) as total_wallets,
    COUNT(*) FILTER (WHERE minted = true) as total_minted,
    SUM(CASE WHEN minted THEN 1 ELSE 0 END) as successful_mints
FROM wallet_x_bindings
WHERE is_active = true;

-- Grant access to the view
GRANT SELECT ON public_stats TO anon, authenticated;

-- Create function to get mint stats
CREATE OR REPLACE FUNCTION get_mint_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_mints', COUNT(*),
        'total_amount', COALESCE(SUM(amount::NUMERIC), 0),
        'unique_wallets', COUNT(DISTINCT recipient_address),
        'unique_users', COUNT(DISTINCT platform_user_id),
        'latest_mint', MAX(created_at)
    ) INTO result
    FROM token_mints;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_mint_stats() TO anon, authenticated;

-- Create function to check mint eligibility
CREATE OR REPLACE FUNCTION can_mint(
    p_platform_user_id TEXT,
    p_wallet_address TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    binding_exists BOOLEAN;
    already_minted BOOLEAN;
BEGIN
    -- Check if binding exists and is active
    SELECT EXISTS(
        SELECT 1 FROM wallet_x_bindings 
        WHERE platform_user_id = p_platform_user_id 
        AND wallet_address = p_wallet_address 
        AND is_active = true
    ) INTO binding_exists;
    
    IF NOT binding_exists THEN
        RETURN false;
    END IF;
    
    -- Check if already minted
    SELECT minted INTO already_minted
    FROM wallet_x_bindings 
    WHERE platform_user_id = p_platform_user_id 
    AND wallet_address = p_wallet_address;
    
    RETURN NOT COALESCE(already_minted, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION can_mint(TEXT, TEXT) TO anon, authenticated;

-- Insert sample data for testing (optional)
-- INSERT INTO profiles (platform_user_id, username, display_name, follower_count, is_verified)
-- VALUES ('test_twitter_123456', 'testuser', 'Test User', 1000, false)
-- ON CONFLICT (platform_user_id) DO NOTHING;