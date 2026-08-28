package com.aseuro.pms.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {
    private String email;
    private String password;
    private String role;

    public String email() {
        return this.email;
    }

    public String password() {
        return this.password;
    }

    public String role() {
        return this.role;
    }
}
