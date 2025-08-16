-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create users table
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    wallet_address TEXT UNIQUE NOT NULL,
    display_name TEXT,
    email TEXT,
    platform TEXT DEFAULT 'twitter',
    platform_id TEXT,
    platform_username TEXT,
    platform_handle TEXT,
    followers INTEGER DEFAULT 0,
    platform_verified BOOLEAN DEFAULT FALSE,
    profile_image TEXT,
    bio TEXT,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tokens table
CREATE TABLE tokens (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    symbol TEXT NOT NULL,
    contract_address TEXT UNIQUE,
    total_supply TEXT,
    current_price TEXT,
    creator_wallet TEXT NOT NULL,
    creator_id UUID REFERENCES users(id),
    verified BOOLEAN DEFAULT FALSE,
    description TEXT,
    logo_url TEXT,
    website_url TEXT,
    telegram_url TEXT,
    social_url TEXT,
    discord_url TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    metrics JSONB DEFAULT '{}',
    milestones JSONB DEFAULT '[]',
    trading_volume TEXT DEFAULT '0',
    market_cap TEXT DEFAULT '0',
    holders_count INTEGER DEFAULT 0,
    price_change_24h DECIMAL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create analytics table
CREATE TABLE analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    token_id TEXT REFERENCES tokens(id),
    period TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metrics JSONB DEFAULT '{}',
    price_data JSONB DEFAULT '{}',
    volume_data JSONB DEFAULT '{}',
    holder_data JSONB DEFAULT '{}'
);

-- Create events table for tracking
CREATE TABLE events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_type TEXT NOT NULL,
    event_data JSONB DEFAULT '{}',
    user_id UUID REFERENCES users(id),
    token_id TEXT REFERENCES tokens(id),
    session_id TEXT,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tx_hash TEXT UNIQUE NOT NULL,
    token_id TEXT REFERENCES tokens(id),
    from_address TEXT NOT NULL,
    to_address TEXT NOT NULL,
    amount TEXT NOT NULL,
    transaction_type TEXT NOT NULL, -- 'buy', 'sell', 'transfer', 'mint'
    price_per_token TEXT,
    total_value TEXT,
    gas_fee TEXT,
    block_number BIGINT,
    block_timestamp TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'failed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_tokens table for tracking user holdings
CREATE TABLE user_tokens (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    token_id TEXT REFERENCES tokens(id),
    balance TEXT DEFAULT '0',
    average_buy_price TEXT DEFAULT '0',
    total_invested TEXT DEFAULT '0',
    realized_pnl TEXT DEFAULT '0',
    unrealized_pnl TEXT DEFAULT '0',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, token_id)
);

-- Create notifications table
CREATE TABLE notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL, -- 'info', 'success', 'warning', 'error'
    read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_wallet_address ON users(wallet_address);
CREATE INDEX idx_tokens_creator_wallet ON tokens(creator_wallet);
CREATE INDEX idx_tokens_symbol ON tokens(symbol);
CREATE INDEX idx_tokens_contract_address ON tokens(contract_address);
CREATE INDEX idx_tokens_created_at ON tokens(created_at);
CREATE INDEX idx_analytics_token_id ON analytics(token_id);
CREATE INDEX idx_analytics_period ON analytics(period);
CREATE INDEX idx_analytics_timestamp ON analytics(timestamp);
CREATE INDEX idx_events_event_type ON events(event_type);
CREATE INDEX idx_events_timestamp ON events(timestamp);
CREATE INDEX idx_transactions_token_id ON transactions(token_id);
CREATE INDEX idx_transactions_from_address ON transactions(from_address);
CREATE INDEX idx_transactions_to_address ON transactions(to_address);
CREATE INDEX idx_transactions_tx_hash ON transactions(tx_hash);
CREATE INDEX idx_user_tokens_user_id ON user_tokens(user_id);
CREATE INDEX idx_user_tokens_token_id ON user_tokens(token_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tokens_updated_at BEFORE UPDATE ON tokens 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies (you can customize these based on your needs)
-- Users can read and update their own profile
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text OR wallet_address = auth.jwt()->>'wallet_address');

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text OR wallet_address = auth.jwt()->>'wallet_address');

-- Tokens are publicly readable, creators can update their own tokens
CREATE POLICY "Tokens are publicly readable" ON tokens
    FOR SELECT USING (is_public = true);

CREATE POLICY "Creators can update their own tokens" ON tokens
    FOR UPDATE USING (creator_wallet = auth.jwt()->>'wallet_address');

-- Analytics are publicly readable
CREATE POLICY "Analytics are publicly readable" ON analytics
    FOR SELECT USING (true);

-- Events can be inserted by authenticated users
CREATE POLICY "Authenticated users can insert events" ON events
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Transactions are publicly readable
CREATE POLICY "Transactions are publicly readable" ON transactions
    FOR SELECT USING (true);

-- User tokens are private to the user
CREATE POLICY "Users can view their own token holdings" ON user_tokens
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Notifications are private to the user
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid()::text = user_id::text);
