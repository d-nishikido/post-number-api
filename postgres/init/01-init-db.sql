-- Initialize the database for Post Number API
-- This script runs automatically when the PostgreSQL container starts

-- Create extensions if they don't exist
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Create addresses table
CREATE TABLE IF NOT EXISTS addresses (
    id SERIAL PRIMARY KEY,
    zipcode VARCHAR(7) NOT NULL,
    prefecture VARCHAR(50) NOT NULL,
    city VARCHAR(100) NOT NULL,
    town VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create import_logs table
CREATE TABLE IF NOT EXISTS import_logs (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    import_date TIMESTAMP WITH TIME ZONE NOT NULL,
    record_count INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failed', 'in_progress')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_addresses_zipcode ON addresses(zipcode);
CREATE INDEX IF NOT EXISTS idx_addresses_prefecture ON addresses(prefecture);
CREATE INDEX IF NOT EXISTS idx_addresses_pref_city ON addresses(prefecture, city);
CREATE INDEX IF NOT EXISTS idx_addresses_town_gin ON addresses USING gin(town gin_trgm_ops);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for addresses table
DROP TRIGGER IF EXISTS update_addresses_updated_at ON addresses;
CREATE TRIGGER update_addresses_updated_at
    BEFORE UPDATE ON addresses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for development/testing
INSERT INTO addresses (zipcode, prefecture, city, town) VALUES
    ('1000001', '東京都', '千代田区', '千代田'),
    ('1000002', '東京都', '千代田区', '皇居外苑'),
    ('1000003', '東京都', '千代田区', '一ツ橋'),
    ('1000004', '東京都', '千代田区', '大手町'),
    ('1000005', '東京都', '千代田区', '丸の内'),
    ('5410041', '大阪府', '大阪市中央区', '北浜'),
    ('5410042', '大阪府', '大阪市中央区', '今橋'),
    ('5410043', '大阪府', '大阪市中央区', '高麗橋'),
    ('2310001', '神奈川県', '横浜市中区', '太田町'),
    ('2310002', '神奈川県', '横浜市中区', '海岸通')
ON CONFLICT (zipcode, prefecture, city, town) DO NOTHING;

-- Create a view for address search with full-text search capabilities
CREATE OR REPLACE VIEW address_search AS
SELECT 
    id,
    zipcode,
    prefecture,
    city,
    town,
    prefecture || city || COALESCE(town, '') as full_address,
    created_at,
    updated_at
FROM addresses;

-- Grant permissions (in case we add specific users later)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;