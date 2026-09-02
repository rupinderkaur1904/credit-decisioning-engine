\# Credit Decisioning Engine



A rule-based credit decisioning engine that evaluates loan applications using income, existing debt, credit score, and loan amount. It produces an explainable score, risk tier, and approval decision, with rule-level factors stored for auditability.



> \*\*Note:\*\* The scoring thresholds are project-specific educational values and do not represent real bank.



\## Features



\- Deterministic credit scoring using DTI, Credit Score, and LTI

\- Explainable decisions with individual factor contributions

\- What-if simulator for testing scenarios without database persistence

\- MySQL persistence with transactional decision records

\- REST APIs built with Express.js

\- Layered architecture: Routes → Controllers → Services → Repositories

\- 12 Jest tests covering scoring, validation, HTTP behavior, and simulation



\## Architecture



```text

Browser

&#x20;  ↓

Express Routes

&#x20;  ↓

Controllers

&#x20;  ↓

Services

&#x20;  ↓

Repositories

&#x20;  ↓

MySQL



Services → Pure Rule Engine



The rule engine is independent of Express and MySQL. Both the simulator and persisted evaluation use the same scoring function.



Scorecard

Factor	Rules

DTI	≤20%: +30 · ≤35%: +15 · ≤50%: 0 · ≤70%: -15 · >70%: -30

Credit Score	≥750: +30 · 650–749: 0 · <650: -30

LTI	≤1x: +30 · ≤2x: +15 · ≤3x: 0 · ≤5x: -15 · >5x: -30



Risk: ≥40 LOW · 0–39 MEDIUM · <0 HIGH



Outcome: ≥20 APPROVED · <20 REJECTED



Risk tier and outcome are independent.



Tech Stack

Node.js

Express.js

MySQL

HTML / CSS / Vanilla JavaScript

Jest

Running Locally

npm install



Create .env from .env.example and configure your MySQL credentials.



mysql -u root -p < sql/schema.sql

npm run dev



Open:



http://localhost:3002



Run tests:



npx jest

Project Structure

src/

├── routes/

├── controllers/

├── services/

├── db/

└── rules/



public/

tests/

sql/

Disclaimer



This is an educational credit decisioning project. The scoring rules are illustrative and do not represent the underwriting policies of any real financial institution.



License



ISC

