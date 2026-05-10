/**
 * Get a Lucide icon name mapped to a component-friendly format
 */
export function getSubjectColor(color) {
  return color || '#2B6CB0';
}

/**
 * Calculate completion percentage from topics
 */
export function calcProgress(topics) {
  if (!topics || topics.length === 0) return 0;
  const completed = topics.filter((t) => t.completed).length;
  return Math.round((completed / topics.length) * 100);
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text, maxLength = 80) {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

/**
 * Generate stagger class for animation delays
 */
export function staggerClass(index) {
  const clamped = Math.min(index, 8);
  return `stagger-${clamped}`;
}
