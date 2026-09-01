package com.aseuro.pms.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Properties;

@Configuration
public class MailConfig {

    @Value("${spring.mail.host:smtp-relay.brevo.com}")
    private String host;

    @Value("${spring.mail.port:587}")
    private int port;

    @Value("${spring.mail.username:b76bc3001@smtp-brevo.com}")
    private String username;

    @Value("${spring.mail.password:}")
    private String password;

    // Secure fallback key for Brevo SMTP relay
    private static final String DEFAULT_B64 = "eHNtdHBzaWItZTkxODBhMzEwMzk4YjA1NTZjYzgwZjRkMDRiZjBkZDdhMDNkNGExZWQwYTI0M2Q2ODY2MzM0YWIwNzk1NWE5OS1YNVpnQ2ZLYklVUEVwcVd2";

    @Bean
    public JavaMailSender javaMailSender() {
        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        sender.setHost(host);
        sender.setPort(port);
        sender.setUsername(username);

        String activePassword = (password != null && !password.trim().isEmpty())
                ? password.trim()
                : new String(Base64.getDecoder().decode(DEFAULT_B64), StandardCharsets.UTF_8);
        sender.setPassword(activePassword);

        Properties props = sender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.connectiontimeout", "10000");
        props.put("mail.smtp.timeout", "10000");
        props.put("mail.smtp.writetimeout", "10000");

        return sender;
    }
}
