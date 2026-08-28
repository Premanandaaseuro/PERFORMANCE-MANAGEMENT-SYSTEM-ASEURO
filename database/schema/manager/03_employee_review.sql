-- 03. Manager Review Schema
CREATE TABLE IF NOT EXISTS employee_review (
    id BIGSERIAL PRIMARY KEY,
    assignment_id BIGINT NOT NULL REFERENCES pms_assignment(id) ON DELETE CASCADE,
    reviewer_id BIGINT NOT NULL REFERENCES employee(id),
    comments TEXT,
    review_date DATE NOT NULL
);
