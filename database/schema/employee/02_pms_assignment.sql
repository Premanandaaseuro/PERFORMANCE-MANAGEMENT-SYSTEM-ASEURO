-- 02. Employee PMS Assignment & Self-Rating Schema
CREATE TABLE IF NOT EXISTS pms_assignment (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT NOT NULL REFERENCES employee(id),
    cycle_month VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    start_date DATE,
    end_date DATE,
    submission_deadline DATE,
    overall_score DOUBLE PRECISION,
    performance_grade VARCHAR(100),
    finalized_date DATE
);

CREATE TABLE IF NOT EXISTS pms_kpi (
    id BIGSERIAL PRIMARY KEY,
    assignment_id BIGINT NOT NULL REFERENCES pms_assignment(id) ON DELETE CASCADE,
    kpi_name VARCHAR(255) NOT NULL,
    description TEXT,
    weightage DOUBLE PRECISION NOT NULL
);

CREATE TABLE IF NOT EXISTS employee_kpi_rating (
    id BIGSERIAL PRIMARY KEY,
    assignment_id BIGINT NOT NULL REFERENCES pms_assignment(id) ON DELETE CASCADE,
    kpi_id BIGINT NOT NULL REFERENCES pms_kpi(id) ON DELETE CASCADE,
    self_rating DOUBLE PRECISION,
    manager_rating DOUBLE PRECISION,
    hr_rating DOUBLE PRECISION,
    comments TEXT
);

CREATE TABLE IF NOT EXISTS pms_history (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT NOT NULL REFERENCES employee(id),
    cycle_month VARCHAR(50) NOT NULL,
    final_score DOUBLE PRECISION,
    grade VARCHAR(100),
    finalized_date DATE,
    assignment_id BIGINT
);
