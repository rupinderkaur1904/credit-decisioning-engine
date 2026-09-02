const http = require('http');
const app = require('../src/app');

function post(server, path, body) {
  return new Promise((resolve, reject) => {
    const { port } = server.address();
    const data = JSON.stringify(body);
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        }
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => { raw += chunk; });
        res.on('end', () => {
          resolve({ status: res.statusCode, body: JSON.parse(raw) });
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

describe('POST /applications/simulate', () => {
  let server;

  beforeAll((done) => {
    server = app.listen(0, done);
  });

  afterAll((done) => {
    server.close(done);
  });

  test('does not require a saved applicant or application — pure calculation only', async () => {
    const { status, body } = await post(server, '/applications/simulate', {
      income: 100000,
      existingDebt: 5000,
      creditScore: 800,
      loanAmount: 50000,
      tenureMonths: 24
    });

    expect(status).toBe(200);
    expect(body.score).toBe(90);
    expect(body.riskTier).toBe('LOW');
    expect(body.outcome).toBe('APPROVED');
    expect(body.factors).toHaveLength(3);
    // /simulate never returns a decisionId — nothing was persisted
    expect(body.decisionId).toBeUndefined();
  });

  test('rejects invalid input with 400 and does not throw', async () => {
    const { status, body } = await post(server, '/applications/simulate', {
      income: -1,
      existingDebt: 5000,
      creditScore: 700,
      loanAmount: 20000,
      tenureMonths: 12
    });

    expect(status).toBe(400);
    expect(body.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('income must be')])
    );
  });

  test('rejects an out-of-range credit score', async () => {
    const { status, body } = await post(server, '/applications/simulate', {
      income: 50000,
      existingDebt: 5000,
      creditScore: 950,
      loanAmount: 20000,
      tenureMonths: 12
    });

    expect(status).toBe(400);
    expect(body.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('creditScore must be')])
    );
  });
});
