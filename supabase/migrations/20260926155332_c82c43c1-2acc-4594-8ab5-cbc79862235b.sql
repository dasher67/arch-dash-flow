CREATE TYPE public.staff_role AS ENUM ('admin','staff','viewer');
CREATE TYPE public.order_status AS ENUM ('pending','completed');

CREATE TABLE public.staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  pin text NOT NULL,
  role public.staff_role NOT NULL DEFAULT 'staff',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.staff TO service_role;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.staff_sessions (
  token text PRIMARY KEY,
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '30 days'
);
GRANT ALL ON public.staff_sessions TO service_role;
ALTER TABLE public.staff_sessions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.stock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  colors text[] NOT NULL DEFAULT '{}',
  quantity integer NOT NULL DEFAULT 0,
  unit_price numeric(12,2) NOT NULL DEFAULT 0,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.stock TO service_role;
ALTER TABLE public.stock ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number serial,
  phone text NOT NULL,
  city text NOT NULL,
  items jsonb NOT NULL DEFAULT '[]',
  total numeric(12,2) NOT NULL DEFAULT 0,
  notes text,
  status public.order_status NOT NULL DEFAULT 'pending',
  created_by uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  created_by_name text,
  resolved_by_name text,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.orders TO service_role;
GRANT USAGE ON SEQUENCE public.orders_order_number_seq TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

INSERT INTO public.staff (name, pin, role) VALUES ('Admin','1234','admin');