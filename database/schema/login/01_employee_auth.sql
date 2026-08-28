-- 01. Login & Auth Schema
CREATE TABLE IF NOT EXISTS employee (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    department VARCHAR(255),
    designation VARCHAR(255),
    team VARCHAR(255),
    role VARCHAR(50) NOT NULL,
    account_status VARCHAR(50) DEFAULT 'ACTIVE',
    joining_date DATE,
    profile_photo TEXT,
    manager_id BIGINT REFERENCES employee(id)
);
