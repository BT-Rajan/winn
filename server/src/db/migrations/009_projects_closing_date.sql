-- Pass 3's project card spec (shown to builders in Pass 4's marketplace)
-- calls for a closing date. Added now, on the existing `projects` table,
-- because Pass 4 is the first pass that actually renders the card —
-- adding it earlier would have been speculative.

ALTER TABLE projects
  ADD COLUMN closing_date DATE NULL AFTER budget_max;
