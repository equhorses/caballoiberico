-- Pre-valoración automática y gratuita: el titular sube un vídeo y una foto de perfil y la IA responde al momento.
-- Es una orientación, no un certificado. Límite de uso por titular para controlar el coste.
CREATE TABLE IF NOT EXISTS prevaluations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id),
  horse_name  TEXT NOT NULL,
  breed       TEXT,
  birth_date  DATE NOT NULL,
  stage       TEXT,
  photo_url   TEXT,
  video_url   TEXT NOT NULL,
  result      JSONB,
  score       NUMERIC(5,1),
  level       INT,
  models      TEXT,
  error       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS prevaluations_user_idx ON prevaluations(user_id, created_at);
