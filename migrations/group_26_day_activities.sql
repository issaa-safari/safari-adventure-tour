-- Group 26: Structured per-day activities (with moment + optional + location).
-- Stored as JSONB so each activity carries its content-library id plus the
-- assignment attributes. Idempotent.
--   shape: [{ "activity_id": uuid, "moment": "morning|afternoon|evening|night",
--             "optional": false, "destination_id": uuid|null }]

alter table tour_days
  add column if not exists activities jsonb not null default '[]';

alter table quote_days
  add column if not exists activities jsonb not null default '[]';
