CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
  CREATE TYPE payment_method_enum AS ENUM ('cash', 'card', 'pse');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE TYPE payment_status_enum AS ENUM ('pending', 'paid', 'failed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id int NOT NULL UNIQUE,
  method payment_method_enum NOT NULL,
  status payment_status_enum NOT NULL DEFAULT 'pending',
  token_code char(6) UNIQUE,
  token_used boolean NOT NULL DEFAULT false,
  token_expires_at timestamp,
  created_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT fk_payments_appointment_id FOREIGN KEY (appointment_id) REFERENCES citas(id) ON DELETE CASCADE
);
