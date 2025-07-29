#!/bin/bash

# CSV Import Script for Post Number API
# This script imports the utf_ken_all.csv file into PostgreSQL

set -e

# Configuration
CSV_FILE="${1:-docs/utf_ken_all.csv}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-post_number_api}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if CSV file exists
if [ ! -f "$CSV_FILE" ]; then
    print_error "CSV file not found: $CSV_FILE"
    print_info "Please ensure the utf_ken_all.csv file is in the docs/ directory"
    exit 1
fi

print_info "Starting CSV import process..."
print_info "CSV file: $CSV_FILE"
print_info "Database: $DB_NAME on $DB_HOST:$DB_PORT"

# Check if PostgreSQL is accessible
if ! PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" >/dev/null 2>&1; then
    print_error "Cannot connect to PostgreSQL database"
    print_info "Make sure PostgreSQL is running and accessible"
    exit 1
fi

# Create temporary table for raw CSV data
print_info "Creating temporary table for CSV import..."
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<EOF
CREATE TEMP TABLE temp_csv_import (
    jis_code VARCHAR(5),
    old_zipcode VARCHAR(5),
    zipcode VARCHAR(7),
    prefecture_kana VARCHAR(50),
    city_kana VARCHAR(50),
    town_kana VARCHAR(100),
    prefecture VARCHAR(50),
    city VARCHAR(100),
    town VARCHAR(200),
    partial_match CHAR(1),
    koaza_exist CHAR(1),
    chome_exist CHAR(1),
    multiple_town CHAR(1),
    update_status CHAR(1),
    update_reason CHAR(1)
);
EOF

# Import CSV data
print_info "Importing CSV data into temporary table..."
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<EOF
\copy temp_csv_import FROM '$CSV_FILE' WITH (FORMAT csv, ENCODING 'SHIFT_JIS');
EOF

# Insert data into addresses table with deduplication
print_info "Processing and inserting data into addresses table..."
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<EOF
-- Log the import start
INSERT INTO import_logs (filename, import_date, record_count, status)
VALUES ('$CSV_FILE', CURRENT_TIMESTAMP, (SELECT COUNT(*) FROM temp_csv_import), 'in_progress');

-- Insert data with deduplication
INSERT INTO addresses (zipcode, prefecture, city, town)
SELECT DISTINCT
    zipcode,
    prefecture,
    city,
    CASE 
        WHEN town = '以下に掲載がない場合' THEN NULL
        WHEN town = '' THEN NULL
        ELSE town
    END as town
FROM temp_csv_import
WHERE zipcode IS NOT NULL
  AND prefecture IS NOT NULL
  AND city IS NOT NULL
  AND LENGTH(zipcode) = 7
ON CONFLICT (zipcode, prefecture, city, COALESCE(town, '')) DO NOTHING;

-- Update import log with success status
UPDATE import_logs 
SET status = 'success', 
    record_count = (SELECT COUNT(*) FROM addresses)
WHERE id = (SELECT MAX(id) FROM import_logs);

-- Show statistics
SELECT 
    'Total addresses in database: ' || COUNT(*) as result
FROM addresses
UNION ALL
SELECT 
    'Unique zipcodes: ' || COUNT(DISTINCT zipcode) as result
FROM addresses
UNION ALL
SELECT 
    'Unique prefectures: ' || COUNT(DISTINCT prefecture) as result
FROM addresses;
EOF

print_info "CSV import completed successfully!"
print_info "Check the import_logs table for detailed information"

# Cleanup
print_info "Cleaning up temporary table..."
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "DROP TABLE IF EXISTS temp_csv_import;"

print_info "Import process finished!"
EOF