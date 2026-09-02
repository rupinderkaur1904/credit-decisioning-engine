# Credit Decisioning Engine

![Node](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8%20(mysql2)-4479A1?logo=mysql&logoColor=white)
![Jest](https://img.shields.io/badge/Tests-12%20passing-C21325?logo=jest&logoColor=white)
![License](https://img.shields.io/badge/License-ISC-lightgrey)

A backend-first loan underwriting engine that evaluates loan applications using a deterministic, rule-based scorecard. It produces an explainable score, risk tier, and approval decision, with rule-level factors stored for auditability.

> Note: The scorecard thresholds are project-specific educational values and are not real bank or NatWest credit policy.

![Demo](docs/Credit_Score.gif)

## Key Features

- Deterministic credit scoring using DTI, Credit Score, and LTI
- Explainable decisions with rule-level factor contributions
- Live what-if simulator for exploring different credit scenarios
- MySQL persistence with transactional decision records
- REST APIs built with Express.js
- Layered Routes -> Controllers -> Services -> Repositories architecture
- Pure rule engine separated from Express and MySQL
- 12 Jest tests covering scoring, validation, HTTP behavior, and simulator isolation

## Architecture

```text
Browser
   |
Express Routes
   |
Controllers
   |
Services
   |
Repositories
   |
MySQL

Services
   |
Pure Rule Engine
The rule engine in src/rules/scorecard.js is a pure function. It takes financial inputs and returns:

{ score, riskTier, outcome, factors }

The persisted evaluation flow and the what-if simulator both use the same rule engine. The simulator does not write to the database.

Scorecard

The score is calculated from three independent rules.

Debt-to-Income Ratio (DTI)
DTI	Contribution
<= 20%	+30
<= 35%	+15
<= 50%	0
<= 70%	-15
> 70%	-30
Credit Score
Credit Score	Contribution
>= 750	+30
650-749	0
< 650	-30
Loan-to-Income Ratio (LTI)
LTI	Contribution
<= 1x	+30
<= 2x	+15
<= 3x	0
<= 5x	-15
> 5x	-30
Risk Tier
Score	Risk Tier
>= 40	LOW
0-39	MEDIUM
< 0	HIGH
Decision
Score	Outcome
>= 20	APPROVED
< 20	REJECTED

Risk tier and outcome are independent. For example, a MEDIUM-risk application can still be APPROVED when the score is at least 20.

Project Structure
credit-decisioning-engine/
|
├── src/
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   ├── db/
│   ├── rules/
│   ├── middleware/
│   ├── errors.js
│   └── app.js
|
├── public/
│   ├── index.html
│   ├── styles.css
│   └── app.js
|
├── sql/
│   └── schema.sql
|
├── tests/
│   ├── scorecard.test.js
│   └── simulate.test.js
|
├── .env.example
├── .gitignore
├── package.json
└── server.js
Database

The application uses four related tables:

applicants
    |
    v
applications
    |
    v
decisions
    |
    v
decision_factors

A decision and its three rule-level factors are persisted together using a database transaction.

If any part of the write fails, the transaction is rolled back.

API
Health Check
GET /health

Returns:

{
  "status": "ok"
}
Simulate Decision
POST /applications/simulate

Runs the scorecard without persisting anything.

Example request:

{
  "income": 60000,
  "existingDebt": 21000,
  "creditScore": 700,
  "loanAmount": 120000,
  "tenureMonths": 36
}

Example response:

{
  "score": 30,
  "riskTier": "MEDIUM",
  "outcome": "APPROVED",
  "factors": [
    {
      "factorName": "debt_to_income_ratio",
      "contribution": 15
    },
    {
      "factorName": "credit_score",
      "contribution": 0
    },
    {
      "factorName": "loan_to_income_ratio",
      "contribution": 15
    }
  ]
}
Create Applicant
POST /applicants
Create Application
POST /applications
Evaluate Application
POST /applications/:id/evaluate

Evaluates a saved application and persists the decision.

Decision History
GET /applicants/:id/decisions

Returns the applicant's previous decisions and their rule-level factors.

Testing

Run:

npx jest

Expected result:

Test Suites: 2 passed, 2 total
Tests: 12 passed, 12 total

Tests cover:

Strong and weak applicants
Credit score boundary values
Input validation
Risk tier and outcome behavior
HTTP validation
Simulator behavior
Simulator isolation from database persistence
Running Locally
1. Install dependencies
npm install
2. Configure environment variables

Create a .env file based on .env.example:

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=credit_decisioning
PORT=3002
3. Create database tables
mysql -u root -p < sql/schema.sql
4. Start the server
npm run dev
5. Open the application
http://localhost:3002
Design Decisions
The scoring engine is implemented as a pure function to keep business rules independent from infrastructure.
The simulator reuses the same scoring logic as persisted evaluations.
Decision and factor inserts are wrapped in a transaction for consistency.
SQL queries use parameterized statements.
Invalid financial inputs are rejected before scoring.
The simulator is stateless and does not create database records.
Future Work
Scorecard versioning
Authentication and authorization
Fraud detection
Interest calculation
More sophisticated underwriting models
Production infrastructure and scaling
Pagination, search, and filtering for decision history
License

ISC
