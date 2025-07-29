-- Add unique constraint for addresses table to prevent duplicates
ALTER TABLE addresses ADD CONSTRAINT addresses_unique_key 
UNIQUE (zipcode, prefecture, city, COALESCE(town, ''));