package com.aseuro.pms.controller;

import com.aseuro.pms.dto.ForgotPasswordRequest;
import com.aseuro.pms.dto.LoginRequest;
import com.aseuro.pms.dto.LoginResponse;
import com.aseuro.pms.dto.ResetPasswordRequest;
import com.aseuro.pms.model.Employee;
import com.aseuro.pms.model.Role;
import com.aseuro.pms.repository.EmployeeRepository;
import com.aseuro.pms.security.JwtTokenProvider;
import com.aseuro.pms.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping({"/api/auth", "/auth"})
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthController(AuthenticationManager authenticationManager, JwtTokenProvider tokenProvider, EmployeeRepository employeeRepository, PasswordEncoder passwordEncoder) {
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
        this.employeeRepository = employeeRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        if (loginRequest.getEmail() == null || loginRequest.getEmail().trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Email address is required."));
        }

        String email = loginRequest.getEmail().trim();
        Optional<Employee> empOpt = employeeRepository.findByEmail(email);

        String requestedRole = loginRequest.getRole();
        if (requestedRole != null && !requestedRole.trim().isEmpty()) {
            String roleUpper = requestedRole.trim().toUpperCase();
            if (roleUpper.equals("HR") || roleUpper.equals("ROLE_HR")) {
                if (empOpt.isEmpty() || empOpt.get().getRole() != Role.ROLE_HR) {
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                            .body(Map.of("message", "Invalid HR email ID."));
                }
            } else if (roleUpper.equals("MANAGER") || roleUpper.equals("ROLE_MANAGER")) {
                if (empOpt.isEmpty() || empOpt.get().getRole() != Role.ROLE_MANAGER) {
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                            .body(Map.of("message", "Invalid email ID."));
                }
            } else if (roleUpper.equals("EMPLOYEE") || roleUpper.equals("ROLE_EMPLOYEE")) {
                if (empOpt.isEmpty() || empOpt.get().getRole() != Role.ROLE_EMPLOYEE) {
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                            .body(Map.of("message", "Invalid Employee email ID."));
                }
            }
        } else {
            if (empOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Invalid email ID."));
            }
        }

        Employee emp = empOpt.get();
        if (emp.getAccountStatus() != null && !"ACTIVE".equalsIgnoreCase(emp.getAccountStatus())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Account is inactive. Please contact HR."));
        }

        // Check if account is currently locked
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        if (emp.getLockedUntil() != null) {
            if (emp.getLockedUntil().isAfter(now)) {
                long secondsRemaining = java.time.Duration.between(now, emp.getLockedUntil()).getSeconds();
                long minutesRemaining = (secondsRemaining + 59) / 60;
                Map<String, Object> lockResponse = new HashMap<>();
                lockResponse.put("message", "Account is locked due to 5 failed login attempts. Please try again after " + minutesRemaining + " minute(s).");
                lockResponse.put("lockedUntilSeconds", secondsRemaining);
                lockResponse.put("isLocked", true);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(lockResponse);
            } else {
                // Lock duration has expired, reset lock
                emp.setLockedUntil(null);
                emp.setFailedAttempts(0);
                employeeRepository.save(emp);
            }
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            email,
                            loginRequest.getPassword()
                    )
            );

            // On success: reset failed attempts and clear lock
            emp.setFailedAttempts(0);
            emp.setLockedUntil(null);
            employeeRepository.save(emp);

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = tokenProvider.generateToken(authentication);
            UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

            return ResponseEntity.ok(LoginResponse.builder()
                    .token(jwt)
                    .tokenType("Bearer")
                    .id(userPrincipal.getId())
                    .email(userPrincipal.getUsername())
                    .name(userPrincipal.getEmployee().getName())
                    .role(userPrincipal.getEmployee().getRole().name())
                    .profilePhoto(userPrincipal.getEmployee().getProfilePhoto())
                    .build());
        } catch (Exception e) {
            int currentFailedAttempts = (emp.getFailedAttempts() == null ? 0 : emp.getFailedAttempts()) + 1;
            emp.setFailedAttempts(currentFailedAttempts);

            if (currentFailedAttempts >= 5) {
                emp.setLockedUntil(now.plusMinutes(5));
                employeeRepository.save(emp);
                Map<String, Object> lockResponse = new HashMap<>();
                lockResponse.put("message", "Account is locked for 5 minutes due to 5 failed login attempts.");
                lockResponse.put("lockedUntilSeconds", 300);
                lockResponse.put("isLocked", true);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(lockResponse);
            } else {
                employeeRepository.save(emp);
                int remainingAttempts = 5 - currentFailedAttempts;
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of(
                                "message", "Invalid email or password. (" + remainingAttempts + " attempt(s) remaining before 5-min lock)",
                                "failedAttempts", currentFailedAttempts,
                                "remainingAttempts", remainingAttempts
                        ));
            }
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@RequestBody ForgotPasswordRequest forgotPasswordRequest) {
        Map<String, String> response = new HashMap<>();
        response.put("message", "If an account with " + forgotPasswordRequest.getEmail() + " exists, a password reset link has been sent.");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        if (request.email() == null || request.email().trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Email address is required."));
        }
        String newPwd = request.newPassword();
        if (newPwd == null || newPwd.length() < 8 || !newPwd.matches(".*[a-zA-Z].*") || !newPwd.matches(".*\\d.*") || !newPwd.matches(".*[^a-zA-Z0-9].*")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Password should contain minimum 8 characters with alphabets, numbers, and special characters."));
        }

        Optional<Employee> empOpt = employeeRepository.findByEmail(request.email().trim());
        if (empOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Account with this email does not exist."));
        }

        Employee emp = empOpt.get();
        emp.setPassword(passwordEncoder.encode(request.newPassword()));
        employeeRepository.save(emp);

        return ResponseEntity.ok(Map.of("message", "Password changed successfully."));
    }

    @PostMapping("/reset-lockout")
    public ResponseEntity<?> resetLockout(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        if (email != null && !email.trim().isEmpty()) {
            Optional<Employee> empOpt = employeeRepository.findByEmail(email.trim());
            if (empOpt.isPresent()) {
                Employee emp = empOpt.get();
                emp.setFailedAttempts(0);
                emp.setLockedUntil(null);
                employeeRepository.save(emp);
            }
        }
        return ResponseEntity.ok(Map.of("message", "Lockout timer reset successfully."));
    }
}
