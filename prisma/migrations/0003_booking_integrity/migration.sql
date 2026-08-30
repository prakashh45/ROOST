-- Enforce the no-overlapping-booking rule at database level.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE bookings DROP CONSTRAINT IF EXISTS no_double_booking;
ALTER TABLE bookings ADD CONSTRAINT no_double_booking
  EXCLUDE USING gist (
    bed_id WITH =,
    daterange(check_in, check_out, '[)') WITH &&
  ) WHERE (status IN ('PENDING', 'CONFIRMED', 'CHECKED_IN'));
