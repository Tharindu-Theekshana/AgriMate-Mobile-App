import { API_BASE_URL } from '../constant/serviceConstant';
import type { Disease } from '../types/api.types';
import {
    diseaseField,
    diseaseName,
    formatConfidence,
    formatDate,
    prettifyKey,
    resolveImageUrl,
} from './format';

describe('resolveImageUrl', () => {
  it('MOB-FMT-01: returns undefined for a missing url', () => {
    expect(resolveImageUrl(null)).toBeUndefined();
    expect(resolveImageUrl(undefined)).toBeUndefined();
  });

  it('MOB-FMT-02: prefixes a relative upload path with the API base URL', () => {
    expect(resolveImageUrl('/uploads/leaf.jpg')).toBe(`${API_BASE_URL}/uploads/leaf.jpg`);
  });

  it('MOB-FMT-03: rewrites a stale localhost URL to the current API base URL', () => {
    expect(resolveImageUrl('http://localhost:8080/uploads/leaf.jpg')).toBe(`${API_BASE_URL}/uploads/leaf.jpg`);
  });

  it('MOB-FMT-04: leaves an already-absolute third-party URL (e.g. Cloudinary) untouched', () => {
    const cloudinaryUrl = 'https://res.cloudinary.com/demo/image/upload/leaf.jpg';
    expect(resolveImageUrl(cloudinaryUrl)).toBe(cloudinaryUrl);
  });
});

const disease: Disease = {
  diseaseKey: 'rice_blast', nameEn: 'Rice Blast', nameSi: 'රයිස් බ්ලාස්ට්', nameTa: null,
  scientificName: null, cause: 'Fungal', causeSi: 'දිලීර', causeTa: null,
  symptoms: null, symptomsSi: null, symptomsTa: null,
  treatment: null, treatmentSi: null, treatmentTa: null,
  prevention: null, preventionSi: null, preventionTa: null, severity: 'HIGH',
};

describe('diseaseName', () => {
  it('MOB-FMT-05: returns an empty string for a missing disease', () => {
    expect(diseaseName(null, 'en')).toBe('');
  });

  it('MOB-FMT-06: returns the English name by default', () => {
    expect(diseaseName(disease, 'en')).toBe('Rice Blast');
  });

  it('MOB-FMT-07: returns the localized Sinhala name when present', () => {
    expect(diseaseName(disease, 'si')).toBe('රයිස් බ්ලාස්ට්');
  });

  it('MOB-FMT-08: falls back to English when the requested language has no translation', () => {
    expect(diseaseName(disease, 'ta')).toBe('Rice Blast'); // nameTa is null
  });
});

describe('diseaseField', () => {
  it('MOB-FMT-09: returns null for a missing disease', () => {
    expect(diseaseField(null, 'cause', 'en')).toBeNull();
  });

  it('MOB-FMT-10: returns the localized field when present', () => {
    expect(diseaseField(disease, 'cause', 'si')).toBe('දිලීර');
  });
});

describe('prettifyKey / formatConfidence / formatDate', () => {
  it('MOB-FMT-11: prettifyKey title-cases each underscore-separated word', () => {
    expect(prettifyKey('bacterial_leaf_blight')).toBe('Bacterial Leaf Blight');
  });

  it('MOB-FMT-12: formatConfidence renders a rounded percentage', () => {
    expect(formatConfidence(0.947)).toBe('95%');
    expect(formatConfidence(0.6)).toBe('60%');
  });

  it('MOB-FMT-13: formatDate returns an empty string for a missing date', () => {
    expect(formatDate(null)).toBe('');
    expect(formatDate(undefined)).toBe('');
  });
});
