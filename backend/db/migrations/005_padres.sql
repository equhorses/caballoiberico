-- Control de procedencia: en los cruces se exige la documentación de los padres (nº en su libro oficial o en C-IBERICO).
ALTER TABLE horses ADD COLUMN IF NOT EXISTS sire_registry TEXT;
ALTER TABLE horses ADD COLUMN IF NOT EXISTS dam_registry TEXT;
