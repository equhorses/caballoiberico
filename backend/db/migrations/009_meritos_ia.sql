-- Resultados deportivos leídos por la IA desde el documento oficial (el titular no tiene que escribirlos)
ALTER TABLE sport_merits ADD COLUMN IF NOT EXISTS ai_extracted JSONB;
ALTER TABLE sport_merits ADD COLUMN IF NOT EXISTS ai_warning TEXT;
