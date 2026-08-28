package com.aseuro.pms.service;

import com.aseuro.pms.dto.AuthResponse;
import com.aseuro.pms.dto.LoginRequest;
import com.aseuro.pms.dto.ResetPasswordRequest;
import com.aseuro.pms.entity.Employee;
import com.aseuro.pms.entity.RecordStatus;
import com.aseuro.pms.entity.User;
import com.aseuro.pms.exception.ApiException;
import com.aseuro.pms.repository.HrEmployeeRepository;
import com.aseuro.pms.repository.UserRepository;
import com.aseuro.pms.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final int MAX_FAILED_ATTEMPTS = 5;

    private final UserRepository userRepository;
    private final HrEmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Value("${pms.auth.lock-duration-seconds:900}")
    private long lockDurationSeconds;

    @Transactional
    public AuthResponse authenticate(LoginRequest request) {
        if (request == null || request.email() == null || request.email().trim().isEmpty()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Email is not found.");
        }

        String email = request.email().trim();

        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Email is not found."));

        if (user.getStatus() != RecordStatus.ACTIVE) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Unauthorized access. Please try again after some time.");
        }

        Instant now = Instant.now();
        if (user.getLockedUntil() != null && user.getLockedUntil().isAfter(now)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Unauthorized access. Please try again after some time.", user.getLockedUntil());
        }

        if (user.getLockedUntil() != null && !user.getLockedUntil().isAfter(now)) {
            user.setLockedUntil(null);
            user.setFailedAttempts(0);
        }

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            int attempts = user.getFailedAttempts() + 1;
            user.setFailedAttempts(attempts);

            if (attempts >= MAX_FAILED_ATTEMPTS) {
                user.setLockedUntil(now.plusSeconds(lockDurationSeconds));
                userRepository.save(user);
                throw new ApiException(HttpStatus.UNAUTHORIZED, "Unauthorized access. Please try again after some time.", user.getLockedUntil());
            }

            userRepository.save(user);
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid password.");
        }

        user.setFailedAttempts(0);
        user.setLockedUntil(null);
        user.setLastLoginAt(now);
        userRepository.save(user);

        String token = jwtService.generateToken(user);
        
        Optional<Employee> employeeOpt = employeeRepository.findByUserId(user.getId());
        String fullName = employeeOpt.map(Employee::getFullName).orElse(user.getUsername() != null ? user.getUsername() : "HR Admin");
        String empCode = employeeOpt.map(Employee::getEmployeeCode).orElse("HR-001");

        return new AuthResponse(token, user.getEmail(), user.getRole(), fullName, empCode, "Login successful.");
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findByEmailIgnoreCase(request.email().trim())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Email is not found."));

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }
}
