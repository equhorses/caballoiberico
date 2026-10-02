-- Ajustes de la presidencia (clave/valor)
CREATE TABLE IF NOT EXISTS settings (
  key        text PRIMARY KEY,
  value      jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
-- De inicio, el Certificado de Calidad lo expide la presidencia a mano tras revisar
INSERT INTO settings(key, value) VALUES ('auto_issue_quality', 'false'::jsonb) ON CONFLICT (key) DO NOTHING;
