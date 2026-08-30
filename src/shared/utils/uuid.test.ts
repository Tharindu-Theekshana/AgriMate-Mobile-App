import { uuid } from './uuid';

describe('uuid', () => {
  it('MOB-UUID-01: generates a non-empty string id', () => {
    expect(typeof uuid()).toBe('string');
    expect(uuid().length).toBeGreaterThan(0);
  });

  it('MOB-UUID-02: generates a different id on each call', () => {
    const ids = new Set(Array.from({ length: 50 }, () => uuid()));
    expect(ids.size).toBe(50);
  });
});
