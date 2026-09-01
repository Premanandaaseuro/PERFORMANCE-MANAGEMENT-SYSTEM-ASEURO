package com.aseuro.pms.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Value("${resend.api.key:${RESEND_API_KEY:}}")
    private String resendApiKey;

    @Value("${app.mail.from:${MAIL_FROM:onboarding@resend.dev}}")
    private String fromEmail;

    @Value("${app.portal.url:https://pms-frontend-kz6u.onrender.com/login}")
    private String portalUrl;

    @Value("${app.company.id:aseurotechnolog}")
    private String companyId;

    @Value("${app.company.name:Aseuro Technologies}")
    private String companyName;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    /**
     * Sends welcome email with login credentials to newly created Employee or Manager.
     */
    @Async
    public void sendWelcomeEmail(String recipientEmail, String recipientName, String rawPassword, String roleName) {
        String displayName = (recipientName != null && !recipientName.trim().isEmpty()) ? recipientName.trim() : "Team Member";
        String subject = "Welcome to " + companyName + " HR System — Your Account Credentials";

        String messageBody = String.format(
                "Dear %s,\n\n" +
                "Hi %s,\n\n" +
                "Welcome to our HR System %s\n" +
                "The login details to the system are as follows and I would like you to go to your My profile section and update all your data.\n\n" +
                "URL: %s\n" +
                "User Name: %s\n" +
                "Password: %s\n" +
                "Company Id: %s\n\n" +
                "Please let me know if I can be of further assistance in helping you navigate the system.\n\n" +
                "Regards\n" +
                "Team HR\n" +
                "HR Manager\n\n" +
                "For access or login please click here: %s\n\n" +
                "Regards,\n" +
                "Team HR\n",
                displayName,
                displayName,
                companyName,
                portalUrl,
                recipientEmail,
                rawPassword,
                companyId,
                portalUrl
        );

        logger.info("================================================================================");
        logger.info("[EMAIL DISPATCH] Sending welcome credentials email to: {}", recipientEmail);
        logger.info("Subject: {}", subject);
        logger.info("================================================================================");

        if (resendApiKey == null || resendApiKey.trim().isEmpty()) {
            logger.info("[EMAIL SERVICE] Resend API key not set. Set RESEND_API_KEY environment variable.");
            return;
        }

        try {
            String from = (fromEmail != null && !fromEmail.trim().isEmpty()) ? fromEmail : "onboarding@resend.dev";
            String jsonPayload = String.format(
                    "{\"from\":\"%s\",\"to\":[\"%s\"],\"subject\":\"%s\",\"text\":\"%s\"}",
                    escapeJson(from),
                    escapeJson(recipientEmail),
                    escapeJson(subject),
                    escapeJson(messageBody)
            );

            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.resend.com/emails"))
                    .header("Authorization", "Bearer " + resendApiKey.trim())
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .build();

            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                logger.info("[EMAIL SERVICE] Successfully sent email via Resend to {}: {}", recipientEmail, response.body());
            } else {
                logger.error("[EMAIL SERVICE] Resend API error (status {}): {}", response.statusCode(), response.body());
            }
        } catch (Exception e) {
            logger.error("[EMAIL SERVICE] Failed to send email via Resend to {}: {}", recipientEmail, e.getMessage(), e);
        }
    }

    private String escapeJson(String raw) {
        if (raw == null) return "";
        return raw.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
}
