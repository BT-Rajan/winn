import type { BuilderProfileRow } from "../builders/builders.repository";
import type { ProjectRow } from "../projects/projects.repository";

export interface MatchResult {
  score: number;
  explanation: string;
  /** Which inputs actually contributed, for transparency — the trust rule
   *  is "AI cannot hide relevant information", so this is available
   *  alongside the score rather than only a bare percentage. */
  matchedCriteria: string[];
}

/**
 * A deliberately deterministic, rule-based scorer — not a model call.
 * Every point is traceable to a specific input, which is what lets the
 * explanation be genuinely accurate rather than a plausible-sounding
 * guess. This is what "AI should make the decision clearer, not make the
 * platform mysterious" means in practice for Pass 5.
 *
 * Only signals we actually collect are used. "Availability" and
 * "Historical performance" are constitution-listed inputs with no real
 * data behind them yet (no capacity tracking, no completed-project
 * history until Pass 6/7 exist) — they're left out entirely rather than
 * faked, per "AI cannot manufacture reputation".
 */
const WEIGHTS = {
  specialty: 35,
  location: 30,
  budget: 20,
  experience: 15,
} as const;

const EXPERIENCE_CAP_YEARS = 10;

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function matchesAny(candidates: string[], target: string): boolean {
  const normalizedTarget = normalize(target);
  if (!normalizedTarget) return false;
  return candidates.some((candidate) => {
    const normalizedCandidate = normalize(candidate);
    return (
      normalizedCandidate === normalizedTarget ||
      normalizedCandidate.includes(normalizedTarget) ||
      normalizedTarget.includes(normalizedCandidate)
    );
  });
}

function budgetRangesOverlap(
  builderMin: number | null,
  builderMax: number | null,
  projectMin: number | null,
  projectMax: number | null,
): boolean {
  if (builderMin == null || builderMax == null || projectMin == null) return false;
  const effectiveProjectMax = projectMax ?? projectMin;
  return projectMin <= builderMax && effectiveProjectMax >= builderMin;
}

function joinWithAnd(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

export function scoreMatch(project: ProjectRow, profile: BuilderProfileRow): MatchResult {
  let score = 0;
  const reasons: string[] = [];
  const matchedCriteria: string[] = [];

  const specialtyHit =
    project.project_type != null && matchesAny(profile.specialties ?? [], project.project_type);
  if (specialtyHit) {
    score += WEIGHTS.specialty;
    matchedCriteria.push("Specialty");
    reasons.push(`has relevant ${project.project_type} experience`);
  }

  const locationHit = project.location != null && matchesAny(profile.service_locations ?? [], project.location);
  if (locationHit) {
    score += WEIGHTS.location;
    matchedCriteria.push("Location");
    reasons.push(`operates in ${project.location}`);
  }

  const budgetHit = budgetRangesOverlap(
    profile.budget_range_min != null ? Number(profile.budget_range_min) : null,
    profile.budget_range_max != null ? Number(profile.budget_range_max) : null,
    project.budget_min != null ? Number(project.budget_min) : null,
    project.budget_max != null ? Number(project.budget_max) : null,
  );
  if (budgetHit) {
    score += WEIGHTS.budget;
    matchedCriteria.push("Budget");
    reasons.push("regularly handles projects in this budget range");
  }

  const years = profile.years_experience ?? 0;
  if (years > 0) {
    const experienceFraction = Math.min(years / EXPERIENCE_CAP_YEARS, 1);
    score += Math.round(WEIGHTS.experience * experienceFraction);
    if (years >= 5) {
      matchedCriteria.push("Experience");
      reasons.push(`brings ${years} years of relevant experience`);
    }
  }

  score = Math.min(100, Math.round(score));

  // The label must track the actual score — a low score calling itself
  // "strong" would be exactly the kind of mysterious, untrustworthy
  // framing the constitution's matching principle rules out.
  const qualifier = score >= 70 ? "Strong match" : score >= 40 ? "Possible match" : "Limited match";
  const explanation =
    reasons.length > 0
      ? `${qualifier} because the builder ${joinWithAnd(reasons)}.`
      : "Limited match — this builder's profile has little overlap with the project so far.";

  return { score, explanation, matchedCriteria };
}
