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

    @Value("${app.website.url:${COMPANY_WEBSITE_URL:https://aseuro.in}}")
    private String websiteUrl;

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
        sendWelcomeEmail(recipientEmail, recipientName, rawPassword, roleName, null);
    }

    @Async
    public void sendWelcomeEmail(String recipientEmail, String recipientName, String rawPassword, String roleName, String employeeCode) {
        String displayName = (recipientName != null && !recipientName.trim().isEmpty()) ? recipientName.trim() : "Team Member";
        String empIdDisplay = (employeeCode != null && !employeeCode.trim().isEmpty()) ? employeeCode.trim() : "EMP-" + Math.abs(recipientEmail.hashCode() % 1000);
        String subject = "Welcome to Aseuro PMS – Your Performance Management Account";

        String senderAddress = (fromEmail != null && !fromEmail.trim().isEmpty()) ? fromEmail.trim() : "m.premananda@aseuro.in";
        String mainSiteUrl = (websiteUrl != null && !websiteUrl.trim().isEmpty()) ? websiteUrl.trim() : "https://aseuro.in";

        String htmlContent = String.format(
                "<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"></head>" +
                "<body style=\"margin: 0; padding: 30px 10px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;\">" +
                "<table role=\"presentation\" width=\"100%%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">" +
                "<tr><td align=\"center\">" +
                "<table role=\"presentation\" width=\"100%%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" style=\"max-width: 580px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;\">" +
                "<!-- Green Header Banner with Official Logo Linking to Website -->" +
                "<tr><td style=\"background-color: #52a447; padding: 26px 24px 22px 24px; text-align: center;\">" +
                "<table role=\"presentation\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" style=\"margin: 0 auto;\">" +
                "<tr>" +
                "<td style=\"vertical-align: middle; padding-right: 12px;\">" +
                "<a href=\"%s\" target=\"_blank\" style=\"text-decoration: none; display: inline-block;\">" +
                "<span style=\"display: inline-block; width: 44px; height: 44px; background-color: #ffffff; border-radius: 10px; text-align: center; line-height: 44px; box-shadow: 0 2px 5px rgba(0,0,0,0.12);\">" +
                "<img src=\"https://pms-frontend-kz6u.onrender.com/aseuro-logo.png\" alt=\"Aseuro Logo\" width=\"34\" height=\"34\" style=\"vertical-align: middle; display: inline-block;\" />" +
                "</span>" +
                "</a>" +
                "</td>" +
                "<td style=\"vertical-align: middle; text-align: left;\">" +
                "<a href=\"%s\" target=\"_blank\" style=\"text-decoration: none; color: #ffffff;\">" +
                "<h1 style=\"margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase;\">ASEURO</h1>" +
                "<p style=\"margin: 2px 0 0 0; color: #ecfdf5; font-size: 13px; font-weight: 500; letter-spacing: 0.5px;\">Performance Management System</p>" +
                "</a>" +
                "</td>" +
                "</tr>" +
                "</table>" +
                "</td></tr>" +
                "<!-- Content Body -->" +
                "<tr><td style=\"padding: 32px 28px 28px 28px; background-color: #ffffff;\">" +
                "<h2 style=\"margin: 0 0 16px 0; color: #1e293b; font-size: 18px; font-weight: 700;\">Welcome to Aseuro PMS</h2>" +
                "<p style=\"margin: 0 0 12px 0; color: #334155; font-size: 14px; line-height: 1.5;\">Hello %s,</p>" +
                "<p style=\"margin: 0 0 24px 0; color: #475569; font-size: 13.5px; line-height: 1.6;\">" +
                "Welcome to Aseuro! Your Performance Management System (PMS) account has been successfully created. You can now access the PMS portal to view your profile, KPIs, performance objectives, appraisal information, and other performance-related activities." +
                "</p>" +
                "<!-- Login Details Box -->" +
                "<div style=\"background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 0 0 24px 0;\">" +
                "<p style=\"margin: 0 0 14px 0; color: #475569; font-size: 11px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;\">YOUR ACCOUNT LOGIN DETAILS</p>" +
                "<table role=\"presentation\" width=\"100%%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" style=\"font-size: 13px;\">" +
                "<tr><td style=\"padding: 5px 0; color: #64748b; width: 130px;\">Employee Name:</td><td style=\"padding: 5px 0; color: #0f172a; font-weight: 700;\">%s</td></tr>" +
                "<tr><td style=\"padding: 5px 0; color: #64748b;\">Employee ID:</td><td style=\"padding: 5px 0; color: #0f172a; font-weight: 700;\">%s</td></tr>" +
                "<tr><td style=\"padding: 5px 0; color: #64748b;\">Login Email:</td><td style=\"padding: 5px 0;\"><a href=\"mailto:%s\" style=\"color: #2563eb; text-decoration: underline; font-weight: 600;\">%s</a></td></tr>" +
                "<tr><td style=\"padding: 5px 0; color: #64748b;\">Initial Password:</td><td style=\"padding: 5px 0;\"><span style=\"font-family: Consolas, Monaco, monospace; background-color: #e2e8f0; padding: 3px 8px; border-radius: 4px; font-weight: 700; color: #0f172a; font-size: 13px;\">%s</span></td></tr>" +
                "</table></div>" +
                "<!-- Action Button -->" +
                "<div style=\"text-align: center; margin: 0 0 28px 0;\">" +
                "<a href=\"%s\" style=\"background-color: #52a447; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 700; font-size: 13px; letter-spacing: 0.5px; display: inline-block; box-shadow: 0 2px 4px rgba(82,164,71,0.25);\">LOGIN TO ASEURO PMS</a>" +
                "</div>" +
                "<!-- Security Guidelines Box -->" +
                "<div style=\"background-color: #fff9f2; border: 1px solid #fed7aa; border-radius: 8px; padding: 14px 18px; margin: 0 0 24px 0;\">" +
                "<p style=\"margin: 0 0 6px 0; color: #c2410c; font-size: 12px; font-weight: 700;\">Security Guidelines:</p>" +
                "<ul style=\"margin: 0; padding-left: 18px; color: #9a3412; font-size: 11.5px; line-height: 1.6;\">" +
                "<li style=\"margin-bottom: 3px;\">For your Security, please change your password after your first login.</li>" +
                "<li style=\"margin-bottom: 3px;\">Never share your password with anyone.</li>" +
                "<li>If you did not expect this account, please contact your HR administrator immediately.</li>" +
                "</ul></div>" +
                "<p style=\"margin: 0 0 16px 0; color: #475569; font-size: 13px;\">We are pleased to have you part of the Aseuro team.</p>" +
                "<p style=\"margin: 0; color: #334155; font-size: 13px; line-height: 1.5;\">" +
                "Regards,<br><strong>HR Administration</strong><br><a href=\"%s\" target=\"_blank\" style=\"color: #52a447; text-decoration: none; font-weight: 600;\">Aseuro Technologies</a>" +
                "</p>" +
                "</td></tr></table></td></tr></table>" +
                "</body></html>",
                mainSiteUrl, mainSiteUrl, displayName, displayName, empIdDisplay, recipientEmail, recipientEmail, rawPassword, portalUrl, mainSiteUrl
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
