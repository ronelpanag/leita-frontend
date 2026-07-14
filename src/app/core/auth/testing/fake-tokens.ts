/**
 * Test-only JWT helpers. Lives outside *.spec.ts on purpose: importing one
 * spec file from another makes Vitest register its suites twice across
 * parallel workers, which intermittently crashed the auth-service suite.
 */

/** Builds an unsigned JWT with the given payload (decode-only on the client). */
export function fakeJwt(payload: Record<string, unknown>): string {
  const encode = (obj: unknown) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${encode({ alg: 'none' })}.${encode(payload)}.sig`;
}

export const CANDIDATE_JWT = fakeJwt({
  sub: 'user-1',
  email: 'nora@example.no',
  role: 'Candidate',
  'leita:candidate_id': 'c0ffee00-0000-0000-0000-000000000001',
});

export const COMPANY_JWT = fakeJwt({
  sub: 'user-2',
  email: 'admin@fjellheim.no',
  role: 'CompanyAdmin',
  'leita:company_id': 'c0ffee00-0000-0000-0000-000000000002',
});
