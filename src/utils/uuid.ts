/** Lightweight unique id for local rows (no native crypto dependency needed). */
export function uuid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}-${Math.random()
    .toString(36)
    .slice(2, 6)}`;
}
