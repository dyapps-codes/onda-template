-- Onda: media station template (radio / podcast / TV / news).

CREATE TABLE public.settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  station_name text NOT NULL DEFAULT 'Onda Local',
  tagline text NOT NULL DEFAULT 'La voz de tu barrio. Programación independiente, 24/7.',
  contact_email text NOT NULL DEFAULT 'hola@example.com',
  contact_phone text,
  timezone text NOT NULL DEFAULT 'Europe/Madrid',
  locale text NOT NULL DEFAULT 'es-ES',
  media_kind text NOT NULL DEFAULT 'radio' CHECK (media_kind IN ('radio', 'podcast', 'tv', 'news')),
  brand_color text NOT NULL DEFAULT '#0ea5e9',
  logo_url text,
  hero_image_url text,
  live_stream_url text,
  live_stream_label text,
  announcement text,
  social_links jsonb NOT NULL DEFAULT '{}'::jsonb,
  notifications_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  image_url text,
  color text NOT NULL DEFAULT '#0ea5e9',
  duration_minutes integer NOT NULL DEFAULT 60 CHECK (duration_minutes > 0),
  category text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  external_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.hosts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  role text,
  bio text,
  photo_url text,
  social_links jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.program_hosts (
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  host_id uuid NOT NULL REFERENCES public.hosts(id) ON DELETE CASCADE,
  PRIMARY KEY (program_id, host_id)
);

CREATE TABLE public.schedule_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  weekday smallint NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL CHECK (end_time > start_time),
  is_live boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  excerpt text,
  body text NOT NULL DEFAULT '',
  image_url text,
  author_host_id uuid REFERENCES public.hosts(id) ON DELETE SET NULL,
  author_name text,
  program_id uuid REFERENCES public.programs(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_featured boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  view_count integer NOT NULL DEFAULT 0,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.media_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL DEFAULT 'audio' CHECK (kind IN ('audio', 'video', 'youtube', 'spotify', 'embed')),
  title text NOT NULL,
  description text,
  url text NOT NULL,
  thumbnail_url text,
  duration_seconds integer,
  program_id uuid REFERENCES public.programs(id) ON DELETE SET NULL,
  host_id uuid REFERENCES public.hosts(id) ON DELETE SET NULL,
  is_featured boolean NOT NULL DEFAULT false,
  published_at timestamptz NOT NULL DEFAULT now(),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.sponsors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  link_url text,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text,
  link_url text,
  link_label text,
  image_url text,
  color text NOT NULL DEFAULT '#0ea5e9',
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
  internal_notes text,
  replied_at timestamptz,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX programs_active_idx ON public.programs (is_active, sort_order, name);
CREATE INDEX hosts_active_idx ON public.hosts (is_active, sort_order, name);
CREATE INDEX schedule_slots_weekday_idx ON public.schedule_slots (weekday, start_time);
CREATE INDEX schedule_slots_program_idx ON public.schedule_slots (program_id);
CREATE INDEX articles_published_idx ON public.articles (status, published_at DESC);
CREATE INDEX articles_program_idx ON public.articles (program_id, published_at DESC);
CREATE INDEX articles_featured_idx ON public.articles (is_featured, published_at DESC);
CREATE INDEX media_items_kind_idx ON public.media_items (kind, published_at DESC);
CREATE INDEX media_items_featured_idx ON public.media_items (is_featured, published_at DESC);
CREATE INDEX banners_active_window_idx ON public.banners (is_active, starts_at, ends_at);
CREATE INDEX contact_messages_status_idx ON public.contact_messages (status, created_at DESC);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_settings_updated_at         BEFORE UPDATE ON public.settings         FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_programs_updated_at         BEFORE UPDATE ON public.programs         FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_hosts_updated_at            BEFORE UPDATE ON public.hosts            FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_articles_updated_at         BEFORE UPDATE ON public.articles         FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_contact_messages_updated_at BEFORE UPDATE ON public.contact_messages FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.settings (id, station_name, tagline, contact_email, brand_color, live_stream_url, live_stream_label, announcement, social_links)
VALUES (1, 'Onda Local', 'La voz de tu barrio · cultura, noticias y música 24/7.', 'hola@onda.example', '#22c55e',
        'https://stream.example.com/live', 'En directo · 24/7',
        'Hoy en directo: especial sobre cine local desde las 19:00.',
        '{"instagram":"https://instagram.com/onda","twitter":"https://twitter.com/onda","spotify":"https://open.spotify.com/show/example"}'::jsonb);

INSERT INTO public.hosts (slug, name, role, bio, photo_url, sort_order) VALUES
  ('lucia-mendez',  'Lucía Méndez',  'Directora · Magazine matinal', 'Periodista y conductora del informativo de la mañana. Voz histórica de la emisora.', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80', 1),
  ('mario-rivas',   'Mario Rivas',   'Productor musical',           'Selector y productor del show nocturno. Especialista en escena indie europea.',  'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&q=80', 2),
  ('sara-okoye',    'Sara Okoye',    'Reportera · Cultura',         'Cubre cultura y eventos locales. Cuenta historias de barrio.',                   'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&q=80', 3);

INSERT INTO public.programs (slug, name, description, color, duration_minutes, category, image_url, sort_order)
VALUES
  ('despierta-onda',     'Despierta Onda',          'Magazine matinal con noticias, agenda local, entrevistas y la mejor música para arrancar el día.', '#22c55e', 120, 'Magazine', 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=900&q=80', 1),
  ('barrio-en-directo',  'Barrio en Directo',       'Reportajes y micro abierto: la calle entra en la radio.',                                        '#f97316',  60, 'Cultura',  'https://images.unsplash.com/photo-1485579149621-3123dd979885?w=900&q=80', 2),
  ('frecuencia-nocturna','Frecuencia Nocturna',     'Sesión musical guiada por Mario Rivas: indie, electrónica y rarezas.',                            '#6366f1',  90, 'Música',   'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=900&q=80', 3),
  ('agenda-cultural',    'Agenda Cultural',         'Lo que pasa esta semana en la ciudad: cine, conciertos, expos y libros.',                         '#a855f7',  30, 'Cultura',  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=900&q=80', 4);

INSERT INTO public.program_hosts (program_id, host_id)
SELECT p.id, h.id
FROM public.programs p, public.hosts h
WHERE
  (p.slug = 'despierta-onda'      AND h.slug IN ('lucia-mendez', 'sara-okoye')) OR
  (p.slug = 'barrio-en-directo'   AND h.slug = 'sara-okoye') OR
  (p.slug = 'frecuencia-nocturna' AND h.slug = 'mario-rivas') OR
  (p.slug = 'agenda-cultural'     AND h.slug = 'sara-okoye');

INSERT INTO public.schedule_slots (program_id, weekday, start_time, end_time, is_live)
SELECT p.id, d.weekday, '08:00'::time, '10:00'::time, true
FROM public.programs p
CROSS JOIN (VALUES (1),(2),(3),(4),(5)) AS d(weekday)
WHERE p.slug = 'despierta-onda';

INSERT INTO public.schedule_slots (program_id, weekday, start_time, end_time, is_live)
SELECT p.id, d.weekday, '12:00'::time, '13:00'::time, true
FROM public.programs p
CROSS JOIN (VALUES (1),(3),(5)) AS d(weekday)
WHERE p.slug = 'barrio-en-directo';

INSERT INTO public.schedule_slots (program_id, weekday, start_time, end_time, is_live)
SELECT p.id, d.weekday, '22:00'::time, '23:30'::time, true
FROM public.programs p
CROSS JOIN (VALUES (4),(5),(6)) AS d(weekday)
WHERE p.slug = 'frecuencia-nocturna';

INSERT INTO public.schedule_slots (program_id, weekday, start_time, end_time, is_live)
SELECT p.id, d.weekday, '14:00'::time, '14:30'::time, true
FROM public.programs p
CROSS JOIN (VALUES (4)) AS d(weekday)
WHERE p.slug = 'agenda-cultural';

INSERT INTO public.articles (slug, title, excerpt, body, image_url, author_name, status, is_featured, published_at, tags)
SELECT
  'cine-local-en-mayo',
  'El cine local toma las pantallas en mayo',
  'Cinco cines independientes lanzan un ciclo conjunto con películas rodadas en el barrio durante los últimos diez años.',
  'Texto completo del artículo. Aquí va el cuerpo del post — soporta saltos de línea y formato simple. Edita desde el panel admin.',
  'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1200&q=80',
  'Sara Okoye', 'published', true, now() - interval '2 days', '["cultura","cine"]'::jsonb;

INSERT INTO public.articles (slug, title, excerpt, body, image_url, author_name, status, is_featured, published_at, tags)
SELECT
  'agenda-conciertos-junio',
  'Los 8 conciertos imprescindibles de junio',
  'Selección de Mario Rivas con la mejor música en directo del mes — desde salas pequeñas hasta el festival de la plaza.',
  'Texto completo. Reemplaza con tu contenido real desde el admin.',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&q=80',
  'Mario Rivas', 'published', false, now() - interval '5 days', '["musica","agenda"]'::jsonb;

INSERT INTO public.articles (slug, title, excerpt, body, image_url, author_name, status, is_featured, published_at, tags)
SELECT
  'taller-radio-vecinal',
  'Abrimos taller de radio vecinal en septiembre',
  'Plazas limitadas para aprender a producir tu propio podcast en nuestros estudios.',
  'Inscripciones abiertas. Si te interesa la radio comunitaria este es tu sitio.',
  'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=1200&q=80',
  'Lucía Méndez', 'published', false, now() - interval '12 days', '["taller","comunidad"]'::jsonb;

INSERT INTO public.media_items (kind, title, description, url, thumbnail_url, duration_seconds, is_featured, published_at, sort_order)
VALUES
  ('youtube', 'Especial 10 años de Onda', 'Documental con voces de presentadores y oyentes que han pasado por la emisora.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=900&q=80', 1820, true,  now() - interval '7 days', 1),
  ('audio',   'Última hora · Reportaje cierre del mercado', 'Audio extraído del directo del miércoles. Entrevistas a vecinos.',          'https://example.com/podcast/episode-12.mp3',           'https://images.unsplash.com/photo-1578357078586-491adf1aa5ba?w=900&q=80',  1240, false, now() - interval '4 days', 2),
  ('spotify', 'Frecuencia Nocturna · Episodio 42', 'Sesión completa con Mario Rivas. Indie + electrónica + descubrimientos.',     'https://open.spotify.com/embed/episode/example', null, 5400, false, now() - interval '10 days', 3);

INSERT INTO public.sponsors (name, logo_url, link_url, sort_order) VALUES
  ('Café del Barrio',   'https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=200&q=80', 'https://example.com', 1),
  ('Librería Letras',   'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=200&q=80',  'https://example.com', 2),
  ('Estudio Pixelado',  'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=200&q=80',  'https://example.com', 3);

INSERT INTO public.banners (title, message, link_url, link_label, color, is_active, sort_order)
VALUES
  ('Apoya la radio comunitaria', 'Hazte socio o socia y ayúdanos a seguir emitiendo independencia.', 'https://example.com/socios', 'Hacerme socio/a', '#22c55e', true, 1);
