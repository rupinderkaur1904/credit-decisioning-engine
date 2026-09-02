# Credit Decisioning Engine



![Node](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)

![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)

![MySQL](https://img.shields.io/badge/MySQL-8%20(mysql2)-4479A1?logo=mysql&logoColor=white)

![Jest](https://img.shields.io/badge/Tests-12%20passing-C21325?logo=jest&logoColor=white)

![License](https://img.shields.io/badge/License-ISC-lightgrey)



A backend-first loan underwriting engine: a deterministic, rule-based scorecard that turns an applicant's income, debt, and credit score into an explainable **score -> risk tier -> decision**, with every rule's contribution persisted for audit - plus a live **what-if simulator** to explore the scorecard interactively.



> **Note:** The scorecard thresholds are project-specific educational values, not real bank or NatWest credit policy.



![Demo](docs/Credit_Score.gif)



## Why this project



Most student CRUD projects stop at "form -> database -> table." This one models something a real underwriting system does: it takes a small set of financial signals, runs them through **independent, auditable rules**, and produces a decision that can be explained rule-by-rule - never a black box.



The scoring logic is a pure function with zero framework dependencies, so it's trivially unit-testable and could be swapped into a batch job, a queue worker, or a different API without any rewrite.



## Key features



- **Live what-if simulator** - drag sliders for income, debt, credit score, loan amount, and tenure; the score, risk tier, outcome, and rule-by-rule breakdown update instantly via a read-only `/applications/simulate` endpoint. Nothing is written to the database - it's the same pure rule engine the persisted flow uses, just called directly.



- **Explainable scoring** - every decision stores *why* it happened: three independent factors (DTI, credit score, LTI), each with its own point contribution and a human-readable detail string, not just a final number.



- **Transactional integrity** - a decision and its full factor breakdown are written atomically; if any insert fails, the whole write rolls back, so a decision can never exist without its audit trail.



- **Layered architecture** - Routes -> Controllers -> Services -> Repositories, with the scoring logic kept completely separate from Express and MySQL.



- **12 Jest tests** covering scoring boundaries, invalid input, HTTP status codes, and the simulate endpoint's isolation from persistence.



## Architecture



```text

Browser (HTML/CSS/Vanilla JS)

&#x20;       v

Express Routes

&#x20;       v

Controllers (validation + error mapping)

&#x20;       v

Services (business logic orchestration)

&#x20;       v

Repositories (database queries)

&#x20;       v

MySQL

The rule engine (src/rules/scorecard.js) is a pure function - inputs in, a result out, with no side effects and no dependency on Express, MySQL, HTTP, the filesystem, or environment variables.



Service

&#x20;  v

evaluateApplication()

&#x20;  v

Pure calculation -> { score, riskTier, outcome, factors }



Both the persisted flow (POST /applications/:id/evaluate) and the simulator (POST /applications/simulate) call this same function - the only difference is whether the result gets written to MySQL afterward.



Project structure

credit-decisioning-engine/

â”‚

â”œâ”€â”€ src/

â”‚   â”œâ”€â”€ routes/

â”‚   â”‚   â”œâ”€â”€ applicants.js          # POST /applicants, GET /applicants/:id/decisions

â”‚   â”‚   â””â”€â”€ applications.js       # POST /applications, /:id/evaluate, /simulate

â”‚   â”‚

â”‚   â”œâ”€â”€ controllers/

â”‚   â”‚   â”œâ”€â”€ applicantController.js

â”‚   â”‚   â”œâ”€â”€ applicationController.js

â”‚   â”‚   â””â”€â”€ decisionHistoryController.js

â”‚   â”‚

â”‚   â”œâ”€â”€ services/

â”‚   â”‚   â”œâ”€â”€ applicantService.js

â”‚   â”‚   â”œâ”€â”€ applicationService.js  # persisted evaluate() + no-persist simulate()

â”‚   â”‚   â””â”€â”€ decisionHistoryService.js

â”‚   â”‚

â”‚   â”œâ”€â”€ db/

â”‚   â”‚   â”œâ”€â”€ pool.js                # MySQL connection pool

â”‚   â”‚   â”œâ”€â”€ withTransaction.js     # Transaction helper

â”‚   â”‚   â”œâ”€â”€ applicantRepository.js

â”‚   â”‚   â”œâ”€â”€ applicationRepository.js

â”‚   â”‚   â””â”€â”€ decisionRepository.js

â”‚   â”‚

â”‚   â”œâ”€â”€ rules/

â”‚   â”‚   â””â”€â”€ scorecard.js            # Pure credit scoring engine

â”‚   â”‚

â”‚   â”œâ”€â”€ middleware/

â”‚   â”œâ”€â”€ errors.js                   # NotFoundError, ValidationError

â”‚   â””â”€â”€ app.js                      # Express app setup

â”‚

â”œâ”€â”€ public/

â”‚   â”œâ”€â”€ index.html                  # Simulator + full workflow demo UI

â”‚   â”œâ”€â”€ styles.css

â”‚   â””â”€â”€ app.js                      # Gauge rendering, simulator, workflow forms

â”‚

â”œâ”€â”€ sql/

â”‚   â””â”€â”€ schema.sql                  # Database schema

â”‚

â”œâ”€â”€ tests/

â”‚   â”œâ”€â”€ scorecard.test.js           # 9 tests - pure rule engine

â”‚   â””â”€â”€ simulate.test.js            # 3 tests - /simulate endpoint over HTTP

â”‚

â”œâ”€â”€ .env.example                    # Template for environment variables

â”œâ”€â”€ .gitignore

â”œâ”€â”€ package.json

â””â”€â”€ server.js                       # Application entry point

Database



Four tables with foreign key relationships:



applicants

(id, name, income, existing_debt, credit_score)

&#x20;       v 1:N

applications

(id, applicant_id, loan_amount, tenure_months)

&#x20;       v 1:N

decisions

(id, application_id, score, risk_tier, outcome)

&#x20;       v 1:N

decision_factors

(id, decision_id, factor_name, contribution, detail)



Key relationships:



An applicant can have multiple applications.

An application is expected to have one decision under normal use - this isn't yet enforced with a UNIQUE constraint, so calling /evaluate twice on the same application will insert a second decision row (see Future work).

A decision has exactly 3 decision factors (one per scoring rule).

Scorecard



Three rules, each contributing between -30 and +30 points.



Score range: -90 to 90



Rule 1: Debt-to-Income Ratio (DTI)

DTI	Contribution

â‰¤ 20%	+30

â‰¤ 35%	+15

â‰¤ 50%	0

â‰¤ 70%	-15

> 70%	-30

Rule 2: Credit Score

Score	Contribution

â‰¥ 750	+30

650â€“749	0

< 650	-30

Rule 3: Loan-to-Income Ratio (LTI)

LTI	Contribution

â‰¤ 1x	+30

â‰¤ 2x	+15

â‰¤ 3x	0

â‰¤ 5x	-15

> 5x	-30

Risk tiers

Score	Risk Tier

â‰¥ 40	LOW

0â€“39	MEDIUM

< 0	HIGH

Outcome

Score	Outcome

â‰¥ 20	APPROVED

< 20	REJECTED



Important: Risk tier and outcome are independent. A MEDIUM-risk application can still be APPROVED (score â‰¥ 20).



API

GET /health

curl http://localhost:3002/health



Response:



{

&#x20; "status": "ok"

}

POST /applications/simulate



Run the scorecard against any inputs with no persistence - nothing needs to exist in the database first. This is what powers the frontend's live simulator.



curl -X POST http://localhost:3002/applications/simulate \

&#x20; -H "Content-Type: application/json" \

&#x20; -d '{"income":60000,"existingDebt":21000,"creditScore":700,"loanAmount":120000,"tenureMonths":36}'



Response (200) - identical shape to /evaluate, minus the persistence-only fields:



{

&#x20; "score": 30,

&#x20; "riskTier": "MEDIUM",

&#x20; "outcome": "APPROVED",

&#x20; "factors": [

&#x20;   {

&#x20;     "factorName": "debt_to_income_ratio",

&#x20;     "contribution": 15,

&#x20;     "detail": "DTI is 35.0% (debt 21000 / income 60000)"

&#x20;   },

&#x20;   {

&#x20;     "factorName": "credit_score",

&#x20;     "contribution": 0,

&#x20;     "detail": "Credit score is 700 (fair band)"

&#x20;   },

&#x20;   {

&#x20;     "factorName": "loan_to_income_ratio",

&#x20;     "contribution": 15,

&#x20;     "detail": "LTI is 2.00x (loan 120000 / income 60000)"

&#x20;   }

&#x20; ]

}



Error cases: 400 for any invalid field (same validation rules as /applicants + /applications).



POST /applicants

curl -X POST http://localhost:3002/applicants \

&#x20; -H "Content-Type: application/json" \

&#x20; -d '{"name":"Jane Doe","income":60000,"existingDebt":21000,"creditScore":700}'



Response (201):



{

&#x20; "id": 1,

&#x20; "name": "Jane Doe",

&#x20; "income": 60000,

&#x20; "existingDebt": 21000,

&#x20; "creditScore": 700

}



Validation errors (400):



name must be a non-empty string

income must be a positive number

existingDebt must be a non-negative number

creditScore must be an integer between 300 and 900

POST /applications

curl -X POST http://localhost:3002/applications \

&#x20; -H "Content-Type: application/json" \

&#x20; -d '{"applicantId":1,"loanAmount":120000,"tenureMonths":36}'



Response (201):



{

&#x20; "id": 1,

&#x20; "applicantId": 1,

&#x20; "loanAmount": 120000,

&#x20; "tenureMonths": 36

}



Error cases: 400 (invalid input), 404 (applicant does not exist).



POST /applications/:id/evaluate



Evaluate a saved application against the scorecard and persist the decision.



curl -X POST http://localhost:3002/applications/1/evaluate



Response (200):



{

&#x20; "applicationId": 1,

&#x20; "decisionId": 1,

&#x20; "score": 30,

&#x20; "riskTier": "MEDIUM",

&#x20; "outcome": "APPROVED",

&#x20; "factors": [

&#x20;   ...

&#x20; ]

}



Error cases: 400 (invalid application ID), 404 (application does not exist), 422 (rule engine validation error, e.g. invalid applicant data in the DB).



GET /applicants/:id/decisions

curl http://localhost:3002/applicants/1/decisions



Response (200):



{

&#x20; "applicantId": 1,

&#x20; "decisions": [

&#x20;   {

&#x20;     "applicationId": 1,

&#x20;     "loanAmount": 120000,

&#x20;     "tenureMonths": 36,

&#x20;     "decisionId": 1,

&#x20;     "score": 30,

&#x20;     "riskTier": "MEDIUM",

&#x20;     "outcome": "APPROVED",

&#x20;     "decidedAt": "2026-09-01T...",

&#x20;     "factors": [

&#x20;       ...

&#x20;     ]

&#x20;   }

&#x20; ]

}



Note: If the applicant exists but has no decisions, returns 200 with decisions: [] - not a 404.



Transactions



The evaluation endpoint (POST /applications/:id/evaluate) uses a database transaction to ensure atomicity:



BEGIN

&#x20; v

INSERT decision

&#x20; v

INSERT factor 1

&#x20; v

INSERT factor 2

&#x20; v

INSERT factor 3

&#x20; v

COMMIT



If any step fails: ROLLBACK.



This guarantees a decision never exists without its complete rule-level audit trail. /applications/simulate never touches this path at all - it can't corrupt persisted data because it never writes anything.



Testing

npx jest



Expected output:



Test Suites: 2 passed, 2 total

Tests: 12 passed, 12 total



Tests cover:



Strong applicant (all rules maximize score)

Weak applicant (all rules minimize score)

Credit score boundary values (649, 650, 749, 750)

Input validation (zero income, negative income)

Risk tier and outcome independence (MEDIUM risk + APPROVED)

/applications/simulate over real HTTP: valid input, invalid input, and confirming no decisionId is ever returned (proof nothing was persisted)

Running locally

1\. Install dependencies

npm install

2\. Configure environment variables

cp .env.example .env



Edit .env and set DB_PASSWORD to your MySQL root password.



3\. Create the database and tables

mysql -u root -p < sql/schema.sql

4\. Start the server

npm run dev



Server running on port 3002.



5\. Open the app



Visit:



http://localhost:3002



The What-if Simulator tab works immediately with no setup - it never touches MySQL. The Full Workflow Demo tab needs the database from step 3.



Frontend



Plain HTML, CSS, and vanilla JavaScript - no build step, no framework. Built with Claude's help on the UI.



Two tabs:



What-if Simulator - five sliders drive a live SVG gauge, risk/outcome badges, and a per-rule factor breakdown with proportional bars, all recalculated on every drag via POST /applications/simulate.

Full Workflow Demo - the persisted, four-step path: create an applicant, submit a loan application, evaluate it (writes a decision), then look up that applicant's decision history.

Edge cases & design decisions

income must be > 0: a zero-value income makes DTI/LTI calculations undefined (division by zero)

loanAmount must be > 0: a zero-value loan is not a meaningful credit application

creditScore limited to 300â€“900: common credit score range for validation

Risk tier and outcome are independent: an application can be MEDIUM risk but still APPROVED

No decisions = 200 with empty array: a valid applicant with no history is not an error

Transaction rollback: protects decision/factor consistency on partial failures

Parameterized SQL: all queries use ? placeholders to prevent SQL injection

Simulate is deliberately stateless: it reuses the exact same rule engine as the persisted path so the "what-if" numbers a user sees are guaranteed to match what a real evaluation would produce - there's no second, drifting copy of the scoring logic

Future work



Not implemented, and intentionally scoped out for now:



UNIQUE constraint on decisions.application_id to enforce one decision per application at the database level (currently only expected by convention, not enforced)

Scorecard versioning and comparison

Authentication / authorization

Fraud detection

Interest calculation

More sophisticated underwriting models

Production-grade infrastructure and scaling

Pagination, search, and filtering on decision history

License



ISC


