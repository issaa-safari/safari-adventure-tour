-- Group 25: Finance record for website bookings.
-- Every booking creates a payment record (status 'pending') so bookings show up in
-- Finance. When a payment gateway is added later, it flips the row to 'paid'.

create table if not exists booking_payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  amount_usd numeric(12,2) not null check (amount_usd >= 0),
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'refunded', 'cancelled')),
  method text,
  reference text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_booking_payments_booking_id on booking_payments(booking_id);
create index if not exists idx_booking_payments_status on booking_payments(status);
