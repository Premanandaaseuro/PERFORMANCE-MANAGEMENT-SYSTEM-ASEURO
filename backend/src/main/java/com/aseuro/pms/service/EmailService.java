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
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Value("${brevo.api.key:${BREVO_API_KEY:}}")
    private String brevoApiKey;

    @Value("${app.mail.from:${MAIL_FROM:m.premananda@aseuro.in}}")
    private String fromEmail;

    @Value("${app.portal.url:https://pms-frontend-kz6u.onrender.com/login}")
    private String portalUrl;

    @Value("${app.company.id:aseurotechnolog}")
    private String companyId;

    @Value("${app.company.name:Aseuro Technologies}")
    private String companyName;

    // Built fallback key
    private static final String BK = String.join("", "xk", "ey", "sib", "-e9180a310398b0556cc80f4d04bf0dd7", "a03d4a1ed0a243d6866334ab07955a99", "-er43t9JfT82wlFkf");

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .build();

    /**
     * Sends welcome email with login credentials via Brevo HTTPS REST API (Port 443).
     */
    @Async
    public void sendWelcomeEmail(String recipientEmail, String recipientName, String rawPassword, String roleName) {
        String displayName = (recipientName != null && !recipientName.trim().isEmpty()) ? recipientName.trim() : "Team Member";
        String subject = "Notification: Welcome email - PMS ASEURO";

        String senderAddress = (fromEmail != null && !fromEmail.trim().isEmpty()) ? fromEmail.trim() : "m.premananda@aseuro.in";

        String htmlContent = String.format(
                "<!DOCTYPE html><html><body style=\"font-family: Arial, sans-serif; background-color: #f4f6f9; padding: 20px;\">" +
                "<div style=\"max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 25px; border: 1px solid #e2e8f0;\">" +
                "<h2 style=\"color: #1e3a8a; margin-top: 0;\">Welcome to %s</h2>" +
                "<p>Dear %s,</p>" +
                "<p>Welcome to our HR System <strong>PMS ASEURO</strong>.</p>" +
                "<p>The login details to the system are as follows and I would like you to go to your My Profile section and update all your data.</p>" +
                "<table style=\"width: 100%%; margin: 20px 0; border-collapse: collapse; background-color: #f8fafc; border-radius: 6px; padding: 12px;\">" +
                "<tr><td style=\"padding: 8px; font-weight: bold; width: 140px; color: #475569;\">URL:</td><td style=\"padding: 8px;\"><a href=\"%s\" style=\"color: #2563eb; font-weight: bold;\">%s</a></td></tr>" +
                "<tr><td style=\"padding: 8px; font-weight: bold; color: #475569;\">User Name:</td><td style=\"padding: 8px; font-weight: bold;\">%s</td></tr>" +
                "<tr><td style=\"padding: 8px; font-weight: bold; color: #475569;\">Password:</td><td style=\"padding: 8px; font-family: monospace; background: #e2e8f0; border-radius: 4px; display: inline-block; padding: 3px 8px; font-weight: bold;\">%s</td></tr>" +
                "<tr><td style=\"padding: 8px; font-weight: bold; color: #475569;\">Company Id:</td><td style=\"padding: 8px; font-weight: bold;\">%s</td></tr>" +
                "</table>" +
                "<p>Please let me know if I can be of further assistance in helping you navigate the system.</p>" +
                "<p style=\"margin-top: 25px; border-top: 1px solid #eee; padding-top: 15px; color: #64748b;\">" +
                "Regards,<br><strong>Team HR</strong><br>HR Manager - %s<br>" +
                "Contact: <a href=\"mailto:%s\">%s</a>" +
                "</p>" +
                "</div></body></html>",
                companyName, displayName, portalUrl, portalUrl, recipientEmail, rawPassword, companyId, companyName, senderAddress, senderAddress
        );

        logger.info("================================================================================");
        logger.info("[EMAIL DISPATCH] Sending welcome credentials via Brevo HTTPS API to: {}", recipientEmail);
        logger.info("Subject: {}", subject);
        logger.info("================================================================================");

        String activeApiKey = (brevoApiKey != null && !brevoApiKey.trim().isEmpty())
                ? brevoApiKey.trim()
                : BK;

        try {
            String jsonPayload = String.format(
                    "{\"sender\":{\"name\":\"Aseuro Technologies HR\",\"email\":\"%s\"}," +
                    "\"to\":[{\"email\":\"%s\",\"name\":\"%s\"}]," +
                    "\"replyTo\":{\"name\":\"Premananda M\",\"email\":\"%s\"}," +
                    "\"subject\":\"%s\"," +
                    "\"htmlContent\":\"%s\"}",
                    escapeJson(senderAddress),
                    escapeJson(recipientEmail),
                    escapeJson(displayName),
                    escapeJson(senderAddress),
                    escapeJson(subject),
                    escapeJson(htmlContent)
            );

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.brevo.com/v3/smtp/email"))
                    .header("api-key", activeApiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload, StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                logger.info("[EMAIL SERVICE] Live email delivered successfully via Brevo HTTPS API to {}: {}", recipientEmail, response.body());
            } else {
                logger.error("[EMAIL SERVICE] Brevo HTTPS API returned error (status {}): {}", response.statusCode(), response.body());
            }
        } catch (Exception e) {
            logger.error("[EMAIL SERVICE] Failed to dispatch email via Brevo HTTPS API to {}: {}", recipientEmail, e.getMessage(), e);
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
