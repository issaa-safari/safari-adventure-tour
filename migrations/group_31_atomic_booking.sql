-- Group 31: Atomic departure booking.
--
-- The website booking flow used to read `departures.booked_seats`, check
-- capacity in application code, then write the booking and update the seat
-- count as three separate round trips. Two concurrent bookings for the last
-- remaining seats could both pass the capacity check before either write
-- landed, overselling the departure.
--
-- This function locks the departure row (`FOR UPDATE`), re-checks capacity,
-- and creates the booking + updates the seat count in one statement — a
-- single RPC call runs inside one implicit transaction, so the lock is held
-- for the whole operation and concurrent callers serialize on it.

create or replace function create_departure_booking_atomic(
  p_departure_id uuid,
  p_client_id uuid,
  p_group_size integer,
  p_total_price_usd numeric
)
returns table (booking_id uuid, tour_id uuid)
language plpgsql
as $$
declare
  v_max_seats integer;
  v_booked_seats integer;
  v_tour_id uuid;
  v_booking_id uuid;
begin
  if p_group_size is null or p_group_size < 1 then
    raise exception 'INVALID_GROUP_SIZE';
  end if;

  select d.max_seats, d.booked_seats, d.tour_id
    into v_max_seats, v_booked_seats, v_tour_id
    from departures d
    where d.id = p_departure_id
    for update;

  if not found then
    raise exception 'DEPARTURE_NOT_FOUND';
  end if;

  if p_group_size > (v_max_seats - v_booked_seats) then
    raise exception 'NOT_ENOUGH_SEATS';
  end if;

  insert into bookings (departure_id, client_id, number_of_travellers, total_price_usd, status)
  values (p_departure_id, p_client_id, p_group_size, p_total_price_usd, 'confirmed')
  returning id into v_booking_id;

  update departures
    set booked_seats = booked_seats + p_group_size
    where id = p_departure_id;

  return query select v_booking_id, v_tour_id;
end;
$$;
