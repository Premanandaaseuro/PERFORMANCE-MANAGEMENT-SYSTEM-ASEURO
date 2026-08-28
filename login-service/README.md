# Login / Authentication Service

## Overview
This service handles all user authentication, role verification, JWT token issuance, session validation, and user profile management across Employee, Manager, and HR roles.

## Components Included
- **Frontend:** `Login.tsx`, `Profile.tsx`, `authApi.ts`
- **Backend:** `AuthController.java`, `AuthService.java`, `SecurityConfig.java`, `JwtAuthenticationFilter.java`, `CustomUserDetailsService.java`
- **Database Schema:** `01_auth_employee_schema.sql` (`employee` table with roles & credentials)
- **Docker:** `docker/Dockerfile`

## Managed APIs
- `POST /api/auth/login` - Authenticate user credentials & issue JWT
- `GET /employee/profile` - Fetch authenticated user profile details
- `PUT /employee/profile` - Update profile details & profile picture avatar
