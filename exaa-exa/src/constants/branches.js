/** Branches a subject can belong to. Stored on the subject doc as `branches: string[]`. */
export const BRANCHES = ['CSE', 'CS-AIML', 'CS-AIDS', 'IT', 'ECE'];

/** Subjects created before branches existed have no field — they count as CSE-only. */
export const DEFAULT_BRANCHES = ['CSE'];

export const normalizeBranches = (value) =>
  Array.isArray(value) && value.length ? value.filter((b) => BRANCHES.includes(b)) : DEFAULT_BRANCHES;
