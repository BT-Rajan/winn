-- Pass 5's matching inputs include "Budget", per the constitution — but
-- nothing on the builder side captured what budget range a builder
-- typically handles. Added now, on the existing builder_profiles table,
-- because this is the first pass that actually needs it.

ALTER TABLE builder_profiles
  ADD COLUMN budget_range_min DECIMAL(14, 2) NULL AFTER years_experience,
  ADD COLUMN budget_range_max DECIMAL(14, 2) NULL AFTER budget_range_min;
