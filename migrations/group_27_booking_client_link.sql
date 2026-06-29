-- Group 27: Wire bookings to CRM clients, and let accepted quotes become bookings.
--
-- 1. bookings.client_id  — firm link to the clients table (was only email-matched).
-- 2. bookings.quote_id   — when a booking is created from an accepted quote.
-- 3. departure_id becomes nullable so accepted *custom* quotes (which have no
--    fixed departure) can still produce a confirmed booking.

alter table bookings
  add column if not exists client_id uuid references clients(id) on delete set null,
  add column if not exists quote_id  uuid references quotes(id)  on delete set null;

-- Accepted custom quotes have no departure — allow a booking without one.
alter table bookings alter column departure_id drop not null;

create index if not exists idx_bookings_client_id on bookings(client_id);
create index if not exists idx_bookings_quote_id  on bookings(quote_id);

-- Backfill client_id on existing bookings by matching a traveller's email
-- to a client record (case-insensitive).
update bookings b
set client_id = c.id
from booking_travellers t
join clients c on lower(c.email) = lower(t.email)
where t.booking_id = b.id
  and b.client_id is null;
