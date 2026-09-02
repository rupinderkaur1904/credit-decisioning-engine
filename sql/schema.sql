CREATE DATABASE IF NOT EXISTS credit_decisioning;
USE credit_decisioning;

CREATE TABLE applicants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  income DECIMAL(12,2) NOT NULL,
  existing_debt DECIMAL(12,2) NOT NULL,
  credit_score INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  applicant_id INT NOT NULL,
  loan_amount DECIMAL(12,2) NOT NULL,
  tenure_months INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (applicant_id) REFERENCES applicants(id)
);

CREATE TABLE decisions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  application_id INT NOT NULL,
  score INT NOT NULL,
  risk_tier VARCHAR(20) NOT NULL,
  outcome VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES applications(id)
);

CREATE TABLE decision_factors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  decision_id INT NOT NULL,
  factor_name VARCHAR(50) NOT NULL,
  contribution INT NOT NULL,
  detail VARCHAR(255),
  FOREIGN KEY (decision_id) REFERENCES decisions(id)
);
