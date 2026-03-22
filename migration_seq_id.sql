-- Add seq_id column for sequential numeric IDs per document type
ALTER TABLE documents ADD COLUMN seq_id INTEGER;
