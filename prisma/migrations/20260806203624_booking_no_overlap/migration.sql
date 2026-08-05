-- Guarantees no two bookings in the same room can ever overlap, even under
-- concurrent inserts. The application already checks this before writing,
-- but only the database can make it atomic.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Booking"
  ADD CONSTRAINT booking_no_overlap
  EXCLUDE USING gist (
    "roomId" WITH =,
    tstzrange("startAt", "endAt", '[)') WITH &&
  );
