/**
 * Contract-accurate in-memory mock of the Leita API, used only by the
 * Playwright e2e suite so the three critical paths can run without the real
 * .NET backend + PostgreSQL. It mirrors the shapes in
 * leita-backend/src/Leita.Api (camelCase, string enums, JWT claims
 * role / leita:candidate_id / leita:company_id) and the pipeline state
 * machine. Listens on :5193, where the Angular dev server proxies /api.
 */
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';

const b64url = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
const bearer = (req) => {
  try {
    const token = (req.headers.authorization ?? '').replace('Bearer ', '');
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
  } catch {
    return null;
  }
};

const LEGAL = {
  Applied: ['Screening', 'Rejected'],
  Screening: ['Interview', 'Rejected'],
  Interview: ['Offer', 'Rejected'],
  Offer: ['Hired', 'Rejected'],
  Hired: [],
  Rejected: [],
};

const companies = new Map([
  ['aaaa1111-0000-0000-0000-000000000001', { id: 'aaaa1111-0000-0000-0000-000000000001', name: 'Fjellheim AS', description: 'Nordic outdoor software.', website: null }],
]);
const jobs = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    companyId: 'aaaa1111-0000-0000-0000-000000000001',
    title: 'Frontend Engineer',
    description: 'Build the hiring trail.\n\nAngular 22, zoneless, signals.',
    location: 'Oslo, hybrid',
    status: 'Published',
    createdAtUtc: '2026-06-20T09:00:00Z',
    publishedAtUtc: '2026-07-01T09:00:00Z',
    closedAtUtc: null,
  },
];
const users = new Map();
const refreshTokens = new Map();
const applications = [];
const follows = new Map();

function issue(email) {
  const user = users.get(email);
  const payload = { sub: email, email, role: user.role, exp: Math.floor(Date.now() / 1000) + 900 };
  if (user.candidateId) payload['leita:candidate_id'] = user.candidateId;
  if (user.companyId) payload['leita:company_id'] = user.companyId;
  const accessToken = `${b64url({ alg: 'none' })}.${b64url(payload)}.stub`;
  const refreshToken = randomUUID();
  refreshTokens.set(refreshToken, email);
  return { accessToken, accessTokenExpiresAtUtc: new Date(Date.now() + 900_000).toISOString(), refreshToken };
}

const json = (res, status, body) => {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
};
const noContent = (res) => {
  res.writeHead(204);
  res.end();
};
const summary = ({ description, status, createdAtUtc, closedAtUtc, ...rest }) => rest;

createServer((req, res) => {
  let raw = '';
  req.on('data', (chunk) => (raw += chunk));
  req.on('end', () => {
    const body = raw ? JSON.parse(raw) : {};
    const route = `${req.method} ${req.url.split('?')[0]}`;
    const claims = bearer(req);

    if (route === 'POST /api/auth/login') {
      const user = users.get(body.email);
      if (!user || user.password !== body.password) return json(res, 401, { title: 'Invalid credentials.' });
      return json(res, 200, issue(body.email));
    }
    if (route === 'POST /api/auth/refresh') {
      const email = refreshTokens.get(body.refreshToken);
      if (!email) return json(res, 401, { title: 'Invalid or expired refresh token.' });
      refreshTokens.delete(body.refreshToken);
      return json(res, 200, issue(email));
    }
    if (route === 'POST /api/candidate/register') {
      const candidateId = randomUUID();
      users.set(body.email, { password: body.password, role: 'Candidate', candidateId });
      return json(res, 201, { candidateId, tokens: issue(body.email) });
    }
    if (route === 'POST /api/company/register') {
      const companyId = randomUUID();
      companies.set(companyId, { id: companyId, name: body.companyName, description: body.description ?? null, website: body.website ?? null });
      users.set(body.email, { password: body.password, role: 'CompanyAdmin', companyId });
      return json(res, 201, { companyId, tokens: issue(body.email) });
    }

    // Public
    const jobDetail = req.url.match(/^\/api\/public\/jobs\/([0-9a-f-]+)$/);
    if (req.method === 'GET' && jobDetail) {
      const job = jobs.find((j) => j.id === jobDetail[1]);
      return job ? json(res, 200, job) : json(res, 404, { title: 'Not found' });
    }
    if (req.method === 'GET' && req.url.startsWith('/api/public/jobs')) {
      const published = jobs.filter((j) => j.status === 'Published').map(summary);
      return json(res, 200, { items: published, page: 1, pageSize: 20, totalCount: published.length, totalPages: 1 });
    }

    // Candidate
    const candidateId = claims?.['leita:candidate_id'];
    if (route === 'POST /api/candidate/applications') {
      if (!candidateId) return json(res, 401, { title: 'Unauthorized' });
      const app = { id: randomUUID(), jobPostingId: body.jobPostingId, candidateId, currentStage: 'Applied', submittedAtUtc: new Date().toISOString(), interviews: [] };
      applications.push(app);
      return json(res, 201, { id: app.id });
    }
    if (route === 'GET /api/candidate/applications') {
      if (!candidateId) return json(res, 401, { title: 'Unauthorized' });
      return json(res, 200, applications.filter((a) => a.candidateId === candidateId));
    }
    const followMatch = req.url.match(/^\/api\/candidate\/follows\/([0-9a-f-]+)$/);
    if (followMatch && (req.method === 'POST' || req.method === 'DELETE')) {
      if (!candidateId) return json(res, 401, { title: 'Unauthorized' });
      const set = follows.get(candidateId) ?? new Set();
      if (req.method === 'POST') set.add(followMatch[1]);
      else set.delete(followMatch[1]);
      follows.set(candidateId, set);
      return noContent(res);
    }
    if (route === 'GET /api/candidate/follows') {
      if (!candidateId) return json(res, 401, { title: 'Unauthorized' });
      return json(res, 200, [...(follows.get(candidateId) ?? new Set())].map((id) => companies.get(id)).filter(Boolean));
    }

    // Company
    const companyId = claims?.['leita:company_id'];
    if (route === 'POST /api/company/jobs') {
      if (!companyId) return json(res, 401, { title: 'Unauthorized' });
      const job = { id: randomUUID(), companyId, title: body.title, description: body.description, location: body.location, status: 'Draft', createdAtUtc: new Date().toISOString(), publishedAtUtc: null, closedAtUtc: null };
      jobs.push(job);
      return json(res, 201, { id: job.id });
    }
    const pub = req.url.match(/^\/api\/company\/jobs\/([0-9a-f-]+)\/(publish|close)$/);
    if (req.method === 'POST' && pub) {
      const job = jobs.find((j) => j.id === pub[1]);
      if (!job) return json(res, 404, { title: 'Not found' });
      if (pub[2] === 'publish') { job.status = 'Published'; job.publishedAtUtc = new Date().toISOString(); }
      else { job.status = 'Closed'; job.closedAtUtc = new Date().toISOString(); }
      return noContent(res);
    }
    const jobApps = req.url.match(/^\/api\/company\/jobs\/([0-9a-f-]+)\/applications$/);
    if (req.method === 'GET' && jobApps) {
      return json(res, 200, applications.filter((a) => a.jobPostingId === jobApps[1]));
    }
    const stage = req.url.match(/^\/api\/company\/applications\/([0-9a-f-]+)\/stage$/);
    if (req.method === 'POST' && stage) {
      const app = applications.find((a) => a.id === stage[1]);
      if (!app) return json(res, 404, { title: 'Not found' });
      if (!LEGAL[app.currentStage].includes(body.nextStage)) return json(res, 409, { title: 'Illegal transition' });
      app.currentStage = body.nextStage;
      return noContent(res);
    }
    const interview = req.url.match(/^\/api\/company\/applications\/([0-9a-f-]+)\/interviews$/);
    if (req.method === 'POST' && interview) {
      const app = applications.find((a) => a.id === interview[1]);
      if (!app) return json(res, 404, { title: 'Not found' });
      const created = { id: randomUUID(), scheduledAtUtc: body.scheduledAtUtc, location: body.location };
      app.interviews.push(created);
      return json(res, 201, { id: created.id });
    }

    json(res, 404, { title: 'Not found' });
  });
}).listen(5193, () => console.log('leita e2e mock api on :5193'));
