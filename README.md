# Performance Management System (PMS) — ASEURO

Enterprise-grade, containerized Performance Management System (PMS) built using Spring Boot, React + TS + Vite, Tailwind CSS, and PostgreSQL.

## Repository Directory Layout

```text
PMS-ASEURO/
├── docker-compose.yml           # Container orchestration
├── backend/                     # Spring Boot Rest API (Java 17 / Maven)
│   ├── pom.xml                  # Backend dependency tree
│   ├── Dockerfile               # Backend production build instructions
│   └── src/
│       ├── main/java/...        # Java source code
│       └── main/resources/...   # Server configuration & seeding
├── frontend/                    # Vite + React + TS App
│   ├── package.json             # Frontend package configurations
│   ├── nginx.conf               # Web server serving configs
│   ├── Dockerfile               # Frontend production build instructions
│   └── src/                     # React source files (api, pages, layouts)
└── e2e/                         # Playwright E2E Testing Suite
    ├── playwright.config.ts     # Playwright configuration
    └── tests/...                # Test specs (Login, Assessment, History)
```

---

## Technical Stack & Configuration Details

- **Frontend:** React 19, Vite, Tailwind CSS, TypeScript, Recharts, Lucide Icons, Axios.
- **Backend:** Java 17, Spring Boot 3.3.2, Spring Security + JWT Authentication, JPA/Hibernate, Apache POI, Apache PDFBox, Maven.
- **Database:** PostgreSQL 15, H2 Database (optional/test fallback).
- **Orchestration:** Docker Compose.

---

## Local Development Execution

### 1. Database & Backend API
Navigate into `backend/` and boot the server:
```bash
mvn clean spring-boot:run
```
- **Backend API:** `http://localhost:8080`
- **Swagger Docs:** `http://localhost:8080/swagger-ui.html`

### 2. Frontend Application
Navigate into `frontend/`, install packages, and start the development server:
```bash
npm install
npm run dev
```
- **Frontend App:** `http://localhost:5173`

---

## Seed Accounts Reference
The database seeder automatically initializes the system with these credentials:
- **Email:** `employee@aseuro.com`
- **Password:** `password`
- **Role:** `ROLE_EMPLOYEE`
- **Email:** `manager@aseuro.com`
- **Password:** `password`
- **Role:** `ROLE_MANAGER`
- **Email:** `hr@aseuro.com`
- **Password:** `password`
- **Role:** `ROLE_HR`
