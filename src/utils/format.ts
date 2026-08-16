import { API_BASE_URL } from '@/api/config';
import type { Disease } from '@/api/types';

/**
 * Resolve an image URL for display on-device. Backend-stored local images are
 * relative (`/uploads/..`); prepend the configured API base. Also rewrite any
 * stale absolute `localhost`/`127.0.0.1` URLs (unreachable from a device).
 */
export function resolveImageUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('/')) return `${API_BASE_URL}${url}`;
  return url.replace(/https?:\/\/(localhost|127\.0\.0\.1):8080/, API_BASE_URL);
}

/** Localized disease display name based on the active language. */
export function diseaseName(disease: Disease | null | undefined, lang: string): string {
  if (!disease) return '';
  if (lang === 'si' && disease.nameSi) return disease.nameSi;
  if (lang === 'ta' && disease.nameTa) return disease.nameTa;
  return disease.nameEn;
}

/** Fallback prettifier for a raw disease key (e.g. "rice_blast" → "Rice Blast"). */
export function prettifyKey(key: string): string {
  return key
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function formatConfidence(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function formatDate(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
