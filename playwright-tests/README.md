# Playwright Automated Testing Suite - Performance Management System (PMS)

Welcome to the enterprise-level Playwright automated testing suite for the **Aseuro Performance Management System (PMS)**.

---

## 📁 Directory Structure

```
playwright-tests/
├── .env.example               # Environment variables template
├── .env                       # Local environment variables
├── package.json               # NPM scripts and test dependencies
├── playwright.config.ts       # Playwright enterprise configuration
├── tsconfig.json              # TypeScript compiler configuration
├── TEST-COVERAGE.md           # Comprehensive test coverage matrix
├── TEST-CASES.md              # Detailed test case specifications
├── BUGS-FOUND.md              # Discovered defects log
├── README.md                  # Setup and execution guide
├── api/                       # API request clients (Auth, HR, Manager, Employee)
├── fixtures/                  # Playwright fixtures & dependency injection
├── pages/                     # Page Object Models (POM) for UI pages
├── utils/                     # Database (PostgreSQL) and helper utilities
└── tests/
    ├── auth/                  # Authentication & authorization tests
    ├── hr/                    # HR module workflow tests
    ├── manager/               # Manager module workflow tests
    ├── employee/              # Employee module workflow tests
    ├── api/                   # Direct backend REST API tests
    ├── database/              # PostgreSQL database integrity tests
    ├── security/              # RBAC and security tests
    ├── responsive/            # Multi-viewport responsive tests
    ├── accessibility/         # Automated WCAG accessibility audit
    └── smoke/                 # Fast sanity smoke tests
```

---

## 🚀 Quick Start

### 1. Prerequisites
* Node.js v18+
* Active frontend server (running on `http://localhost:5173`)
* Active backend server (running on `http://localhost:8081`)
* PostgreSQL database instance running

### 2. Installation
Navigate into the `playwright-tests` directory and install dependencies:
```bash
cd playwright-tests
npm.cmd install
npx.cmd playwright install
```

### 3. Environment Variables
Copy `.env.example` to `.env` and verify your credentials:
```bash
cp .env.example .env
```

---

## 🧪 Running Tests

### Run All Tests
```bash
npm.cmd test
```

### Run by Category (Tags)
```bash
npm.cmd run test:smoke           # Run fast smoke test suite
npm.cmd run test:auth            # Run authentication tests
npm.cmd run test:hr              # Run HR module tests
npm.cmd run test:manager         # Run Manager module tests
npm.cmd run test:employee        # Run Employee module tests
npm.cmd run test:api             # Run API endpoint tests
npm.cmd run test:database        # Run PostgreSQL database tests
npm.cmd run test:security        # Run RBAC security tests
npm.cmd run test:responsive      # Run responsive multi-viewport tests
npm.cmd run test:accessibility   # Run WCAG accessibility tests
```

### Run by Browser Project
```bash
npm.cmd run test:chromium        # Run on Chromium / Chrome
npm.cmd run test:firefox         # Run on Firefox
npm.cmd run test:webkit          # Run on WebKit / Safari
```

### Headed & Debug Mode
```bash
npm.cmd run test:headed          # Run tests with visible browser UI
npm.cmd run test:debug           # Run tests in Playwright Inspector debug mode
```

### View HTML Test Report
```bash
npm.cmd run test:report
```

---

## 📊 Reports & Artifacts
* HTML reports are generated automatically in `playwright-report/`.
* Failed tests capture **screenshots**, **console logs**, and **full execution traces** in `test-results/`.
