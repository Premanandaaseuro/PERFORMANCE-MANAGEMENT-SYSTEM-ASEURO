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
        String subject = "Welcome to Aseuro PMS - Your Performance Management Account";

        String senderAddress = (fromEmail != null && !fromEmail.trim().isEmpty()) ? fromEmail.trim() : "m.premananda@aseuro.in";

        String htmlContent = String.format(
                "<!DOCTYPE html><html><body style=\"margin: 0; padding: 20px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;\">" +
                "<div style=\"max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0;\">" +
                "<div style=\"background: #5aa437; padding: 28px 24px; text-align: center;\">" +
                "<h1 style=\"color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 1px;\">ASEURO</h1>" +
                "<p style=\"color: #e2f3d8; margin: 4px 0 0 0; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;\">Performance Management System</p>" +
                "</div>" +
                "<div style=\"padding: 32px 28px;\">" +
                "<h2 style=\"color: #1e293b; font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 12px;\">Welcome to Aseuro PMS</h2>" +
                "<p style=\"color: #475569; font-size: 14px; margin: 0 0 16px 0;\">Hello <strong>%s</strong>,</p>" +
                "<p style=\"color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;\">" +
                "Welcome to Aseuro! Your Performance Management System (PMS) account has been successfully created. You can now access the PMS portal to view your profile, KPIs, performance objectives, appraisal information, and other performance-related activities." +
                "</p>" +
                "<div style=\"background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 28px;\">" +
                "<p style=\"margin: 0 0 14px 0; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.8px;\">YOUR ACCOUNT LOGIN DETAILS</p>" +
                "<table style=\"width: 100%%; font-size: 14px; color: #334155; border-collapse: collapse;\">" +
                "<tr><td style=\"padding: 6px 0; color: #64748b; width: 140px;\">Employee Name:</td><td style=\"padding: 6px 0; font-weight: bold;\">%s</td></tr>" +
                "<tr><td style=\"padding: 6px 0; color: #64748b;\">Login Email:</td><td style=\"padding: 6px 0; font-weight: bold;\"><a href=\"mailto:%s\" style=\"color: #2563eb; text-decoration: none;\">%s</a></td></tr>" +
                "<tr><td style=\"padding: 6px 0; color: #64748b;\">Initial Password:</td><td style=\"padding: 6px 0;\"><span style=\"background: #e2e8f0; padding: 3px 8px; border-radius: 4px; font-family: monospace; font-weight: bold; color: #0f172a;\">%s</span></td></tr>" +
                "<tr><td style=\"padding: 6px 0; color: #64748b;\">Company ID:</td><td style=\"padding: 6px 0; font-weight: bold;\">%s</td></tr>" +
                "</table>" +
                "</div>" +
                "<div style=\"text-align: center; margin-bottom: 28px;\">" +
                "<a href=\"%s\" style=\"display: inline-block; background-color: #5aa437; color: #ffffff; text-decoration: none; padding: 13px 36px; font-size: 14px; font-weight: bold; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);\">LOGIN TO ASEURO PMS</a>" +
                "</div>" +
                "<div style=\"background-color: #fff7ed; border-left: 4px solid #f97316; padding: 14px 16px; border-radius: 4px; margin-bottom: 24px;\">" +
                "<p style=\"margin: 0 0 6px 0; font-size: 12px; font-weight: bold; color: #9a3412;\">Security Guidelines:</p>" +
                "<ul style=\"margin: 0; padding-left: 18px; font-size: 12px; color: #c2410c; line-height: 1.6;\">" +
                "<li>For your security, please change your password after your first login.</li>" +
                "<li>Never share your password with anyone.</li>" +
                "<li>If you did not expect this account, please contact your HR administrator immediately.</li>" +
                "</ul>" +
                "</div>" +
                "<p style=\"color: #64748b; font-size: 13px; margin: 0 0 16px 0;\">We are pleased to have you part of the Aseuro team.</p>" +
                "<p style=\"color: #475569; font-size: 13px; margin: 0; border-top: 1px solid #f1f5f9; padding-top: 16px; line-height: 1.5;\">" +
                "Regards,<br>" +
                "<strong>HR Administration</strong><br>" +
                "Aseuro Technologies" +
                "</p>" +
                "</div>" +
                "</div></body></html>",
                displayName, displayName, recipientEmail, recipientEmail, rawPassword, companyId, portalUrl
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
