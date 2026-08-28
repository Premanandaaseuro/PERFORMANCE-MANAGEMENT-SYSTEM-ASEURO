-- HR Service Database Schema
-- Tables: kpi_master, final_pms_result

CREATE TABLE IF NOT EXISTS kpi_master (
    id BIGSERIAL PRIMARY KEY,
    designation VARCHAR(255) NOT NULL,
    kpi_name VARCHAR(255) NOT NULL,
    description TEXT,
    weightage DOUBLE PRECISION NOT NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE'
);

CREATE TABLE IF NOT EXISTS final_pms_result (
    id BIGSERIAL PRIMARY KEY,
    assignment_id BIGINT UNIQUE NOT NULL REFERENCES pms_assignment(id) ON DELETE CASCADE,
    final_score DOUBLE PRECISION NOT NULL,
    grade VARCHAR(100) NOT NULL,
    finalized_by BIGINT REFERENCES employee(id),
    finalized_date DATE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_kpi_master_designation ON kpi_master(designation);
