package com.aseuro.pms.controller;

import com.aseuro.pms.dto.ForgotPasswordRequest;
import com.aseuro.pms.dto.LoginRequest;
import com.aseuro.pms.dto.LoginResponse;
import com.aseuro.pms.model.Employee;
import com.aseuro.pms.model.Role;
import com.aseuro.pms.repository.EmployeeRepository;
import com.aseuro.pms.security.JwtTokenProvider;
import com.aseuro.pms.security.UserPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final EmployeeRepository employeeRepository;

    public AuthController(AuthenticationManager authenticationManager, JwtTokenProvider tokenProvider, EmployeeRepository employeeRepository) {
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
        this.employeeRepository = employeeRepository;
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

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            email,
                            loginRequest.getPassword()
                    )
            );

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
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid email or password."));
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@RequestBody ForgotPasswordRequest forgotPasswordRequest) {
        Map<String, String> response = new HashMap<>();
        response.put("message", "If an account with " + forgotPasswordRequest.getEmail() + " exists, a password reset link has been sent.");
        return ResponseEntity.ok(response);
    }
}
