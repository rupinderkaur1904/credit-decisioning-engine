const { evaluateApplication } = require('../src/rules/scorecard');

describe('evaluateApplication', () => {
  test('Test 1 — Strong applicant', () => {
    const result = evaluateApplication({
      income: 100000,
      existingDebt: 5000,
      creditScore: 800,
      loanAmount: 50000,
      tenureMonths: 24
    });

    // DTI = 5000/100000 = 5% → +30
    // Credit = 800 → +30
    // LTI = 50000/100000 = 0.5x → +30
    expect(result.score).toBe(90);
    expect(result.riskTier).toBe('LOW');
    expect(result.outcome).toBe('APPROVED');
    expect(result.factors).toHaveLength(3);

    expect(result.factors[0].factorName).toBe('debt_to_income_ratio');
    expect(result.factors[0].contribution).toBe(30);

    expect(result.factors[1].factorName).toBe('credit_score');
    expect(result.factors[1].contribution).toBe(30);

    expect(result.factors[2].factorName).toBe('loan_to_income_ratio');
    expect(result.factors[2].contribution).toBe(30);
  });

  test('Test 2 — Weak applicant', () => {
    const result = evaluateApplication({
      income: 20000,
      existingDebt: 18000,
      creditScore: 550,
      loanAmount: 150000,
      tenureMonths: 12
    });

    // DTI = 18000/20000 = 90% → -30
    // Credit = 550 → -30
    // LTI = 150000/20000 = 7.5x → -30
    expect(result.score).toBe(-90);
    expect(result.riskTier).toBe('HIGH');
    expect(result.outcome).toBe('REJECTED');
  });

  test('Test 3 — Credit score 649', () => {
    const result = evaluateApplication({
      income: 50000,
      existingDebt: 5000,
      creditScore: 649,
      loanAmount: 30000,
      tenureMonths: 24
    });

    expect(result.factors[1].factorName).toBe('credit_score');
    expect(result.factors[1].contribution).toBe(-30);
  });

  test('Test 4 — Credit score 650', () => {
    const result = evaluateApplication({
      income: 50000,
      existingDebt: 5000,
      creditScore: 650,
      loanAmount: 30000,
      tenureMonths: 24
    });

    expect(result.factors[1].factorName).toBe('credit_score');
    expect(result.factors[1].contribution).toBe(0);
  });

  test('Test 5 — Credit score 749', () => {
    const result = evaluateApplication({
      income: 50000,
      existingDebt: 5000,
      creditScore: 749,
      loanAmount: 30000,
      tenureMonths: 24
    });

    expect(result.factors[1].factorName).toBe('credit_score');
    expect(result.factors[1].contribution).toBe(0);
  });

  test('Test 6 — Credit score 750', () => {
    const result = evaluateApplication({
      income: 50000,
      existingDebt: 5000,
      creditScore: 750,
      loanAmount: 30000,
      tenureMonths: 24
    });

    expect(result.factors[1].factorName).toBe('credit_score');
    expect(result.factors[1].contribution).toBe(30);
  });

  test('Test 7 — Zero income throws error', () => {
    expect(() => {
      evaluateApplication({
        income: 0,
        existingDebt: 5000,
        creditScore: 700,
        loanAmount: 20000,
        tenureMonths: 12
      });
    }).toThrow('income must be a positive number greater than zero');
  });

  test('Test 8 — Negative income throws error', () => {
    expect(() => {
      evaluateApplication({
        income: -1000,
        existingDebt: 5000,
        creditScore: 700,
        loanAmount: 20000,
        tenureMonths: 12
      });
    }).toThrow('income must be a positive number greater than zero');
  });

  test('Test 9 — Medium risk but approved', () => {
    const result = evaluateApplication({
      income: 60000,
      existingDebt: 21000,
      creditScore: 700,
      loanAmount: 120000,
      tenureMonths: 36
    });

    // DTI = 21000/60000 = 35% → +15
    // Credit = 700 → 0
    // LTI = 120000/60000 = 2x → +15
    // Score = 30
    expect(result.score).toBe(30);
    expect(result.riskTier).toBe('MEDIUM');
    expect(result.outcome).toBe('APPROVED');
  });
});
