-- Pre-valoración: orientación del nivel probable con un vídeo, gratis o a precio reducido en el lanzamiento.
ALTER TABLE service_requests DROP CONSTRAINT IF EXISTS service_requests_service_check;
ALTER TABLE service_requests ADD CONSTRAINT service_requests_service_check
  CHECK (service IN ('ORIGEN','CALIDAD','CAMBIO_NOMBRE','CAMBIO_TITULARIDAD','LAUREADA','YEGUADA','PREVALORACION'));
