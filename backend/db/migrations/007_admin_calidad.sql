-- Certificado de Calidad "vivo" (nivel I–V, sin estrellas) y control total de la presidencia.
-- Las estrellas ámbar y la Lista Laureada pasan a ser datos del ejemplar, editables por la presidencia.
ALTER TABLE horses ADD COLUMN IF NOT EXISTS amber_stars INT NOT NULL DEFAULT 0;
ALTER TABLE horses ADD COLUMN IF NOT EXISTS laureado BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE horses ADD COLUMN IF NOT EXISTS external_owner TEXT;   -- titular sin cuenta en la web (alta hecha por la presidencia)
ALTER TABLE horses ADD COLUMN IF NOT EXISTS admin_notes TEXT;      -- notas internas, nunca públicas
UPDATE horses h SET amber_stars = COALESCE((SELECT MAX(c.amber_stars) FROM certificates c WHERE c.horse_id = h.id), 0)
 WHERE amber_stars = 0;
UPDATE horses SET laureado = TRUE WHERE amber_stars >= 3;
