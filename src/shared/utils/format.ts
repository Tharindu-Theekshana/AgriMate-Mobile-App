import type { Disease } from '@/shared/types/api.types';
import { API_BASE_URL } from '../constant/serviceConstant';


export function resolveImageUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('/')) return `${API_BASE_URL}${url}`;
  return url.replace(/https?:\/\/(localhost|127\.0\.0\.1):(8080|8081|8082)/, API_BASE_URL);
}

export function diseaseName(disease: Disease | null | undefined, lang: string): string {
  if (!disease) return '';
  if (lang === 'si' && disease.nameSi) return disease.nameSi;
  if (lang === 'ta' && disease.nameTa) return disease.nameTa;
  return disease.nameEn;
}

export function diseaseField(
  disease: Disease | null | undefined,
  field: 'cause' | 'symptoms' | 'treatment' | 'prevention',
  lang: string,
): string | null | undefined {
  if (!disease) return null;
  if (lang === 'si' && disease[`${field}Si`]) return disease[`${field}Si`];
  if (lang === 'ta' && disease[`${field}Ta`]) return disease[`${field}Ta`];
  return disease[field];
}

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
