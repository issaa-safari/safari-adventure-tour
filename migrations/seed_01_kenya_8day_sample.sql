-- Seed: Kenya 8 Days / 7 Nights — two sample quotes (English + Arabic)
-- Run in Supabase SQL Editor AFTER group_17.
--
-- Creates:
--   • 2 clients  (James Thornton / EN, Mohammed Al-Rashidi / AR)
--   • 2 requests linked to those clients
--   • 2 quotes, each with a fully-populated version:
--       - Version A: language = 'en'  (English itinerary + Arabic fallback)
--       - Version B: language = 'ar'  (same content, Arabic rendered by default)
--   • 8 days of itinerary per version with EN + AR titles/notes
--   • 2 travellers per version
--   • 20 price lines per version (typical Kenya bike tour pricing)

DO $$
DECLARE
  v_admin_id      uuid;
  v_client_en_id  uuid;
  v_client_ar_id  uuid;
  v_request_en_id uuid;
  v_request_ar_id uuid;
  v_quote_en_id   uuid;
  v_quote_ar_id   uuid;
  v_ver_en_id     uuid;
  v_ver_ar_id     uuid;
  v_co_snap       jsonb := '{}'::jsonb;
  v_pol_snap      jsonb := '{}'::jsonb;
  v_markup        numeric := 25;
  v_band_id       uuid;
  v_band_snap     jsonb := '{}'::jsonb;

BEGIN

  -- ── Admin user (needed for created_by FK) ─────────────────────────────────
  SELECT id INTO v_admin_id FROM auth.users LIMIT 1;
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'No auth.users row found. Log in to the app at least once first.';
  END IF;

  -- ── Company settings snapshot ─────────────────────────────────────────────
  SELECT
    jsonb_build_object(
      'company_name',       company_name,
      'brand_name',         brand_name,
      'email',              email,
      'phone',              phone,
      'whatsapp',           whatsapp,
      'website',            website,
      'address',            address,
      'country',            country,
      'currency_primary',   currency_primary,
      'currency_secondary', currency_secondary,
      'logo_url',           logo_url
    ),
    jsonb_build_object(
      'deposit_percent',      deposit_percent,
      'balance_due_days',     balance_due_days,
      'cancellation_61_plus', cancellation_61_plus,
      'cancellation_42_60',   cancellation_42_60,
      'cancellation_28_41',   cancellation_28_41,
      'cancellation_0_27',    cancellation_0_27
    ),
    coalesce(default_markup_percent, 25)
  INTO v_co_snap, v_pol_snap, v_markup
  FROM company_settings LIMIT 1;

  -- ── Default age band (adult) ──────────────────────────────────────────────
  SELECT id, to_jsonb(traveller_age_bands.*)
  INTO v_band_id, v_band_snap
  FROM traveller_age_bands
  WHERE is_active = true
  ORDER BY sort_order
  LIMIT 1;

  -- ── Clients ───────────────────────────────────────────────────────────────
  INSERT INTO clients (
    first_name, last_name, email, phone, country,
    preferred_language, language
  ) VALUES (
    'James', 'Thornton',
    'james.thornton.sample@example.com', '+447700900123', 'United Kingdom',
    'en', 'en'
  ) RETURNING id INTO v_client_en_id;

  INSERT INTO clients (
    first_name, last_name, email, phone, country,
    preferred_language, language
  ) VALUES (
    'محمد', 'الرشيدي',
    'mohammed.alrashidi.sample@example.com', '+966501234567', 'Saudi Arabia',
    'ar', 'ar'
  ) RETURNING id INTO v_client_ar_id;

  -- ── Requests ──────────────────────────────────────────────────────────────
  INSERT INTO requests (
    client_id, stage, source, travelers_adults,
    preferred_start_date, client_question
  ) VALUES (
    v_client_en_id, 'working_on', 'direct', 2,
    '2025-09-15',
    'Interested in the Kenya bike adventure — 8 days covering Nairobi, Naivasha, Nakuru, Eldoret, and back.'
  ) RETURNING id INTO v_request_en_id;

  INSERT INTO requests (
    client_id, stage, source, travelers_adults,
    preferred_start_date, client_question
  ) VALUES (
    v_client_ar_id, 'working_on', 'whatsapp', 2,
    '2025-09-15',
    'مهتم بجولة الدراجة في كينيا - 8 أيام تشمل نيروبي ونايفاشا وناكورو وإلدوريت والعودة.'
  ) RETURNING id INTO v_request_ar_id;

  -- ── Quotes ────────────────────────────────────────────────────────────────
  INSERT INTO quotes (client_id, request_id, mode, status, created_by)
  VALUES (v_client_en_id, v_request_en_id, 'custom', 'draft', v_admin_id)
  RETURNING id INTO v_quote_en_id;

  INSERT INTO quotes (client_id, request_id, mode, status, created_by)
  VALUES (v_client_ar_id, v_request_ar_id, 'custom', 'draft', v_admin_id)
  RETURNING id INTO v_quote_ar_id;

  -- ── Quote versions ────────────────────────────────────────────────────────
  INSERT INTO quote_versions (
    quote_id, version_number, status, language, title,
    travel_start_date, travel_end_date, valid_until,
    default_markup_percent,
    client_snapshot, company_snapshot, policy_snapshot, created_by
  ) VALUES (
    v_quote_en_id, 1, 'draft', 'en',
    'Kenya 8 Days / 7 Nights — Nairobi to Nairobi Bike Tour',
    '2025-09-15', '2025-09-22', current_date + 14,
    v_markup,
    jsonb_build_object('first_name','James','last_name','Thornton',
      'email','james.thornton.sample@example.com','phone','+447700900123',
      'country','United Kingdom','language','en'),
    v_co_snap, v_pol_snap, v_admin_id
  ) RETURNING id INTO v_ver_en_id;

  INSERT INTO quote_versions (
    quote_id, version_number, status, language, title,
    travel_start_date, travel_end_date, valid_until,
    default_markup_percent,
    client_snapshot, company_snapshot, policy_snapshot, created_by
  ) VALUES (
    v_quote_ar_id, 1, 'draft', 'ar',
    'كينيا 8 أيام / 7 ليالٍ — جولة دراجة نيروبي إلى نيروبي',
    '2025-09-15', '2025-09-22', current_date + 14,
    v_markup,
    jsonb_build_object('first_name','محمد','last_name','الرشيدي',
      'email','mohammed.alrashidi.sample@example.com','phone','+966501234567',
      'country','Saudi Arabia','language','ar'),
    v_co_snap, v_pol_snap, v_admin_id
  ) RETURNING id INTO v_ver_ar_id;

  -- ══════════════════════════════════════════════════════════════════════════
  -- ITINERARY — 8 days × 2 versions
  -- ══════════════════════════════════════════════════════════════════════════

  -- ── Day 1 ─────────────────────────────────────────────────────────────────
  INSERT INTO quote_days (quote_version_id, day_number, day_date, sort_order,
    title, client_notes, title_ar, client_notes_ar, meals, destination_snapshot)
  VALUES
  (v_ver_en_id, 1, '2025-09-15', 0,
   'Arrival in Nairobi — Welcome to Kenya',
   'Meet your tour captain who will guide the entire trip and brief the full route plan. Suggested activity: visit a local café or restaurant for dinner.',
   'الوصول إلى نيروبي — مرحباً بكم في كينيا',
   'قابل قائد الجولة الذي سيقود الرحلة بأكملها ويشرح الخطة اليومية. النشاط المقترح: زيارة مقهى محلي أو مطعم لتناول العشاء.',
   '{}', '{}'),
  (v_ver_ar_id, 1, '2025-09-15', 0,
   'Arrival in Nairobi — Welcome to Kenya',
   'Meet your tour captain who will guide the entire trip and brief the full route plan. Suggested activity: visit a local café or restaurant for dinner.',
   'الوصول إلى نيروبي — مرحباً بكم في كينيا',
   'قابل قائد الجولة الذي سيقود الرحلة بأكملها ويشرح الخطة اليومية. النشاط المقترح: زيارة مقهى محلي أو مطعم لتناول العشاء.',
   '{}', '{}');

  -- ── Day 2 ─────────────────────────────────────────────────────────────────
  INSERT INTO quote_days (quote_version_id, day_number, day_date, sort_order,
    title, client_notes, title_ar, client_notes_ar, meals, destination_snapshot)
  VALUES
  (v_ver_en_id, 2, '2025-09-16', 1,
   'Nairobi → Lake Naivasha | 140 KM',
   'Forest Adventure Centre (65 KM): rope climbing & suspension bridges. Sanctuary Farm: giraffes, zebras, birdlife and optional boat tours. Overnight at Lake Oloiden Camp. Evening: sunset boat cruise on Lake Naivasha.',
   'نيروبي → بحيرة نايفاشا | 140 كم',
   'مركز مغامرات الغابة (65 كم): التسلق على الحبال والمشي على الجسور المعلقة. مزرعة سانكشوري: زرافات وحمر وحشية وطيور وجولات قارب اختيارية. إقامة في مخيم بحيرة أولويدن. المساء: جولة غروب الشمس بالقارب.',
   ARRAY['breakfast','lunch','dinner'], '{}'),
  (v_ver_ar_id, 2, '2025-09-16', 1,
   'Nairobi → Lake Naivasha | 140 KM',
   'Forest Adventure Centre (65 KM): rope climbing & suspension bridges. Sanctuary Farm: giraffes, zebras, birdlife and optional boat tours. Overnight at Lake Oloiden Camp. Evening: sunset boat cruise on Lake Naivasha.',
   'نيروبي → بحيرة نايفاشا | 140 كم',
   'مركز مغامرات الغابة (65 كم): التسلق على الحبال والمشي على الجسور المعلقة. مزرعة سانكشوري: زرافات وحمر وحشية وطيور وجولات قارب اختيارية. إقامة في مخيم بحيرة أولويدن. المساء: جولة غروب الشمس بالقارب.',
   ARRAY['breakfast','lunch','dinner'], '{}');

  -- ── Day 3 ─────────────────────────────────────────────────────────────────
  INSERT INTO quote_days (quote_version_id, day_number, day_date, sort_order,
    title, client_notes, title_ar, client_notes_ar, meals, destination_snapshot)
  VALUES
  (v_ver_en_id, 3, '2025-09-17', 2,
   'Lake Naivasha → Nakuru | 190 KM',
   'Morning in Hells Gate National Park (65 KM): spot giraffes, zebras and birdlife; optional nature walks through the gorge. Continue to Nakuru for scenic hill views. Overnight at Ivory Park Hotel.',
   'بحيرة نايفاشا → ناكورو | 190 كم',
   'صباح في محمية هيلز غيت (65 كم): مشاهدة الزرافات والحمر الوحشية والطيور؛ مشي اختياري في الطبيعة عبر الممر الصخري. الاستمرار إلى ناكورو مع إطلالات خلابة على التلال. إقامة في فندق آيفوري بارك.',
   ARRAY['breakfast','lunch','dinner'], '{}'),
  (v_ver_ar_id, 3, '2025-09-17', 2,
   'Lake Naivasha → Nakuru | 190 KM',
   'Morning in Hells Gate National Park (65 KM): spot giraffes, zebras and birdlife; optional nature walks through the gorge. Continue to Nakuru for scenic hill views. Overnight at Ivory Park Hotel.',
   'بحيرة نايفاشا → ناكورو | 190 كم',
   'صباح في محمية هيلز غيت (65 كم): مشاهدة الزرافات والحمر الوحشية والطيور؛ مشي اختياري في الطبيعة عبر الممر الصخري. الاستمرار إلى ناكورو مع إطلالات خلابة على التلال. إقامة في فندق آيفوري بارك.',
   ARRAY['breakfast','lunch','dinner'], '{}');

  -- ── Day 4 ─────────────────────────────────────────────────────────────────
  INSERT INTO quote_days (quote_version_id, day_number, day_date, sort_order,
    title, client_notes, title_ar, client_notes_ar, meals, destination_snapshot)
  VALUES
  (v_ver_en_id, 4, '2025-09-18', 3,
   'Nakuru → Eldoret via Kericho Tea Farms | 260 KM',
   'Visit Kericho tea farms (110 KM): guided walk through rolling green fields, learn tea production and enjoy a tasting. Continue to Eldoret (150 KM). Evening: explore the city and local cuisine. Overnight at Boma Inn Hotel.',
   'ناكورو → إلدوريت عبر مزارع شاي كيريتشو | 260 كم',
   'زيارة مزارع الشاي في كيريتشو (110 كم): جولة إرشادية عبر الحقول الخضراء والتعرف على إنتاج الشاي وتذوقه. الاستمرار إلى إلدوريت (150 كم). المساء: استكشاف المدينة والمطبخ المحلي. إقامة في فندق بوما إن.',
   ARRAY['breakfast','lunch','dinner'], '{}'),
  (v_ver_ar_id, 4, '2025-09-18', 3,
   'Nakuru → Eldoret via Kericho Tea Farms | 260 KM',
   'Visit Kericho tea farms (110 KM): guided walk through rolling green fields, learn tea production and enjoy a tasting. Continue to Eldoret (150 KM). Evening: explore the city and local cuisine. Overnight at Boma Inn Hotel.',
   'ناكورو → إلدوريت عبر مزارع شاي كيريتشو | 260 كم',
   'زيارة مزارع الشاي في كيريتشو (110 كم): جولة إرشادية عبر الحقول الخضراء والتعرف على إنتاج الشاي وتذوقه. الاستمرار إلى إلدوريت (150 كم). المساء: استكشاف المدينة والمطبخ المحلي. إقامة في فندق بوما إن.',
   ARRAY['breakfast','lunch','dinner'], '{}');

  -- ── Day 5 ─────────────────────────────────────────────────────────────────
  INSERT INTO quote_days (quote_version_id, day_number, day_date, sort_order,
    title, client_notes, title_ar, client_notes_ar, meals, destination_snapshot)
  VALUES
  (v_ver_en_id, 5, '2025-09-19', 4,
   'Eldoret → Nyahururu via Iten & Marigat | 220 KM',
   'Iten (40 KM): Kenya''s "Home of Champions" running town — meet elite athletes and enjoy valley views. Marigat near Lake Bogoria (90 KM): hot springs and optional boat tours. Stop at Thomson''s Falls in Nyahururu. Overnight at Panari Resort.',
   'إلدوريت → نياهورورو عبر إيتن وماريغات | 220 كم',
   'إيتن (40 كم): مدينة الأبطال في كينيا — لقاء الرياضيين المحترفين والاستمتاع بإطلالات الوادي. ماريغات قرب بحيرة بوقوريا (90 كم): ينابيع ساخنة وجولات قارب اختيارية. توقف عند شلال ثومسون في نياهورورو. إقامة في منتجع باناري.',
   ARRAY['breakfast','lunch','dinner'], '{}'),
  (v_ver_ar_id, 5, '2025-09-19', 4,
   'Eldoret → Nyahururu via Iten & Marigat | 220 KM',
   'Iten (40 KM): Kenya''s "Home of Champions" running town — meet elite athletes and enjoy valley views. Marigat near Lake Bogoria (90 KM): hot springs and optional boat tours. Stop at Thomson''s Falls in Nyahururu. Overnight at Panari Resort.',
   'إلدوريت → نياهورورو عبر إيتن وماريغات | 220 كم',
   'إيتن (40 كم): مدينة الأبطال في كينيا — لقاء الرياضيين المحترفين والاستمتاع بإطلالات الوادي. ماريغات قرب بحيرة بوقوريا (90 كم): ينابيع ساخنة وجولات قارب اختيارية. توقف عند شلال ثومسون في نياهورورو. إقامة في منتجع باناري.',
   ARRAY['breakfast','lunch','dinner'], '{}');

  -- ── Day 6 ─────────────────────────────────────────────────────────────────
  INSERT INTO quote_days (quote_version_id, day_number, day_date, sort_order,
    title, client_notes, title_ar, client_notes_ar, meals, destination_snapshot)
  VALUES
  (v_ver_en_id, 6, '2025-09-20', 5,
   'Nyahururu → Lagoon Resort via Castle Forest | 200 KM',
   'Morning departure to Castle Forest Lodge on Mt Kenya slopes (170 KM) for forest exploration and mountain views. Continue to The Lagoon Resort in Koitobus (30 KM) for a relaxing evening by the lake. Overnight at The Lagoon Resort.',
   'نياهورورو → منتجع لاقون عبر غابة كاسل | 200 كم',
   'مغادرة صباحية إلى كاسل فورست لودج على منحدرات جبل كينيا (170 كم) لاستكشاف الغابة ومناظر جبلية خلابة. الاستمرار إلى منتجع لاقون في كويتوبوس (30 كم) لقضاء مساء مريح بجانب البحيرة. إقامة في منتجع لاقون.',
   ARRAY['breakfast','lunch','dinner'], '{}'),
  (v_ver_ar_id, 6, '2025-09-20', 5,
   'Nyahururu → Lagoon Resort via Castle Forest | 200 KM',
   'Morning departure to Castle Forest Lodge on Mt Kenya slopes (170 KM) for forest exploration and mountain views. Continue to The Lagoon Resort in Koitobus (30 KM) for a relaxing evening by the lake. Overnight at The Lagoon Resort.',
   'نياهورورو → منتجع لاقون عبر غابة كاسل | 200 كم',
   'مغادرة صباحية إلى كاسل فورست لودج على منحدرات جبل كينيا (170 كم) لاستكشاف الغابة ومناظر جبلية خلابة. الاستمرار إلى منتجع لاقون في كويتوبوس (30 كم) لقضاء مساء مريح بجانب البحيرة. إقامة في منتجع لاقون.',
   ARRAY['breakfast','lunch','dinner'], '{}');

  -- ── Day 7 ─────────────────────────────────────────────────────────────────
  INSERT INTO quote_days (quote_version_id, day_number, day_date, sort_order,
    title, client_notes, title_ar, client_notes_ar, meals, destination_snapshot)
  VALUES
  (v_ver_en_id, 7, '2025-09-21', 6,
   'Lagoon Resort → Nairobi via Tea & Coffee Farms | 190 KM',
   'Visit Kiambethu Tea Farm (140 KM): guided plantation tour, tea tasting and hill views. Continue to Nairobi (50 KM) and check in for the final night. Overnight at Hillsgate Experience Hotel.',
   'منتجع لاقون → نيروبي عبر مزارع الشاي والقهوة | 190 كم',
   'زيارة مزرعة كيمبيثو للشاي (140 كم): جولة إرشادية في المزارع وتذوق الشاي وإطلالات على التلال. الاستمرار إلى نيروبي (50 كم) وتسجيل الوصول لليلة الأخيرة. إقامة في فندق هيلزغيت إكسبيرينس.',
   ARRAY['breakfast','lunch'], '{}'),
  (v_ver_ar_id, 7, '2025-09-21', 6,
   'Lagoon Resort → Nairobi via Tea & Coffee Farms | 190 KM',
   'Visit Kiambethu Tea Farm (140 KM): guided plantation tour, tea tasting and hill views. Continue to Nairobi (50 KM) and check in for the final night. Overnight at Hillsgate Experience Hotel.',
   'منتجع لاقون → نيروبي عبر مزارع الشاي والقهوة | 190 كم',
   'زيارة مزرعة كيمبيثو للشاي (140 كم): جولة إرشادية في المزارع وتذوق الشاي وإطلالات على التلال. الاستمرار إلى نيروبي (50 كم) وتسجيل الوصول لليلة الأخيرة. إقامة في فندق هيلزغيت إكسبيرينس.',
   ARRAY['breakfast','lunch'], '{}');

  -- ── Day 8 ─────────────────────────────────────────────────────────────────
  INSERT INTO quote_days (quote_version_id, day_number, day_date, sort_order,
    title, client_notes, title_ar, client_notes_ar, meals, destination_snapshot)
  VALUES
  (v_ver_en_id, 8, '2025-09-22', 7,
   'Nairobi — Departure',
   'Transfer to Jomo Kenyatta International Airport as per departure plans. End of the Kenya bike adventure. Please confirm your flight details in advance so transfers can be arranged.',
   'نيروبي — المغادرة',
   'التوصيل إلى مطار جومو كينياتا الدولي وفقاً لخطط المغادرة. نهاية جولة الدراجة المغامرة في كينيا. يُرجى تأكيد تفاصيل رحلتكم مسبقاً لترتيب التنقلات.',
   '{}', '{}'),
  (v_ver_ar_id, 8, '2025-09-22', 7,
   'Nairobi — Departure',
   'Transfer to Jomo Kenyatta International Airport as per departure plans. End of the Kenya bike adventure. Please confirm your flight details in advance so transfers can be arranged.',
   'نيروبي — المغادرة',
   'التوصيل إلى مطار جومو كينياتا الدولي وفقاً لخطط المغادرة. نهاية جولة الدراجة المغامرة في كينيا. يُرجى تأكيد تفاصيل رحلتكم مسبقاً لترتيب التنقلات.',
   '{}', '{}');

  -- ══════════════════════════════════════════════════════════════════════════
  -- TRAVELLERS — 2 adults per version
  -- ══════════════════════════════════════════════════════════════════════════
  INSERT INTO quote_travellers (
    quote_version_id, display_name, traveller_category,
    room_category, is_paying, is_complimentary, sort_order,
    age_band_id, age_band_snapshot
  ) VALUES
  (v_ver_en_id, 'Traveller 1', coalesce((SELECT code FROM traveller_age_bands WHERE is_active ORDER BY sort_order LIMIT 1), 'adult'),
   'sharing', true, false, 0, v_band_id, v_band_snap),
  (v_ver_en_id, 'Traveller 2', coalesce((SELECT code FROM traveller_age_bands WHERE is_active ORDER BY sort_order LIMIT 1), 'adult'),
   'sharing', true, false, 1, v_band_id, v_band_snap),
  (v_ver_ar_id, 'Traveller 1', coalesce((SELECT code FROM traveller_age_bands WHERE is_active ORDER BY sort_order LIMIT 1), 'adult'),
   'sharing', true, false, 0, v_band_id, v_band_snap),
  (v_ver_ar_id, 'Traveller 2', coalesce((SELECT code FROM traveller_age_bands WHERE is_active ORDER BY sort_order LIMIT 1), 'adult'),
   'sharing', true, false, 1, v_band_id, v_band_snap);

  -- ══════════════════════════════════════════════════════════════════════════
  -- PRICE LINES — typical Kenya 8-day bike tour (USD)
  -- cost_category values: accommodation | activities | park_fees |
  --   transport | staff | meals | flights | other
  -- pricing_unit values: person | room | vehicle | group | day | night |
  --   trip
  -- ══════════════════════════════════════════════════════════════════════════
  INSERT INTO quote_price_lines (
    quote_version_id, description, cost_category, pricing_unit,
    quantity, unit_cost_usd, markup_percent_override,
    total_cost_usd, total_selling_usd, is_optional, sort_order
  )
  SELECT
    ver_id,
    description,
    cost_category::text,
    pricing_unit::text,
    quantity,
    unit_cost_usd,
    v_markup,
    quantity * unit_cost_usd,
    round(quantity * unit_cost_usd * (1 + v_markup / 100.0), 2),
    is_optional,
    sort_order
  FROM
    (VALUES (v_ver_en_id),(v_ver_ar_id)) AS v(ver_id),
    (VALUES
      ('Hillsgate Experience Hotel, Nairobi — 2 nights (Day 1 & 7)',   'accommodation', 'night',   2,  80.00, false,  0),
      ('Lake Oloiden Camp, Naivasha — 1 night (Day 2)',               'accommodation', 'night',   1,  65.00, false,  1),
      ('Ivory Park Hotel, Nakuru — 1 night (Day 3)',                  'accommodation', 'night',   1,  70.00, false,  2),
      ('Boma Inn Hotel, Eldoret — 1 night (Day 4)',                   'accommodation', 'night',   1,  75.00, false,  3),
      ('Panari Resort, Nyahururu — 1 night (Day 5)',                  'accommodation', 'night',   1,  90.00, false,  4),
      ('The Lagoon Resort, Koitobus — 1 night (Day 6)',               'accommodation', 'night',   1, 100.00, false,  5),
      ('Quality mountain bike hire (8 days)',                         'transport',     'day',     8,  25.00, false,  6),
      ('Support 4x4 vehicle with driver (8 days)',                    'transport',     'day',     8,  70.00, false,  7),
      ('Experienced tour captain / guide (8 days)',                   'staff',         'day',     8,  60.00, false,  8),
      ('Forest Adventure Centre — rope course & activities (×2 pax)', 'activities',    'person',  2,  20.00, false,  9),
      ('Sanctuary Farm — wildlife & boat tour entry (×2 pax)',        'activities',    'person',  2,  15.00, false, 10),
      ('Hells Gate National Park fees (×2 pax)',                      'park_fees',     'person',  2,  35.00, false, 11),
      ('Lake Nakuru National Park fees (×2 pax)',                     'park_fees',     'person',  2,  60.00, false, 12),
      ('Kericho Tea Farm guided tour (×2 pax)',                       'activities',    'person',  2,  10.00, false, 13),
      ('Thomson''s Falls entry (×2 pax)',                             'activities',    'person',  2,   5.00, false, 14),
      ('Castle Forest Lodge nature walk (×2 pax)',                    'activities',    'person',  2,  12.00, false, 15),
      ('Kiambethu Tea Farm guided tour (×2 pax)',                     'activities',    'person',  2,  15.00, false, 16),
      ('All meals — breakfast daily, lunch & dinner Days 2–7 (×2)',   'meals',         'person',  2, 180.00, false, 17),
      ('Airport transfers — arrival & departure (×2 pax)',            'transport',     'trip',    2,  25.00, false, 18),
      ('Travel insurance (per person — recommended)',                 'other',         'person',  2,  45.00, true,  19)
    ) AS p(description, cost_category, pricing_unit, quantity, unit_cost_usd, is_optional, sort_order);

  RAISE NOTICE '✓ Seed complete';
  RAISE NOTICE '  English quote  → /admin/quotes/%', v_quote_en_id;
  RAISE NOTICE '  Arabic quote   → /admin/quotes/%', v_quote_ar_id;

END;
$$;
