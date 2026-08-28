package com.aseuro.pms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {
    private String token;
    private String tokenType;
    private Long id;
    private String email;
    private String name;
    private String role;
    private String profilePhoto;

    public LoginResponse(String token, String tokenType, String email, String name, String role) {
        this.token = token;
        this.tokenType = tokenType;
        this.email = email;
        this.name = name;
        this.role = role;
    }
}
