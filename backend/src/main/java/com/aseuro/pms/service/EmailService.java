package com.aseuro.pms.service;

import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${app.mail.from:${MAIL_FROM:premanandabspp@gmail.com}}")
    private String fromEmail;

    @Value("${app.portal.url:https://pms-frontend-kz6u.onrender.com/login}")
    private String portalUrl;

    @Value("${app.company.id:aseurotechnolog}")
    private String companyId;

    @Value("${app.company.name:Aseuro Technologies}")
    private String companyName;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * Sends welcome email with login credentials to newly created Employee or Manager.
     */
    @Async
    public void sendWelcomeEmail(String recipientEmail, String recipientName, String rawPassword, String roleName) {
        String displayName = (recipientName != null && !recipientName.trim().isEmpty()) ? recipientName.trim() : "Team Member";
        String subject = "Notification: Welcome email - PMS ASEURO";

        String htmlBody = String.format(
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
                "Regards,<br><strong>Team HR</strong><br>HR Manager - Aseuro Technologies<br>" +
                "Contact: <a href=\"mailto:m.premananda@aseuro.in\">m.premananda@aseuro.in</a>" +
                "</p>" +
                "</div></body></html>",
                companyName, displayName, portalUrl, portalUrl, recipientEmail, rawPassword, companyId
        );

        String textBody = String.format(
                "Dear %s,\n\n" +
                "Welcome to our HR System PMS ASEURO\n" +
                "The login details to the system are as follows and I would like you to go to your My profile section and update all your data.\n\n" +
                "URL: %s\n" +
                "User Name: %s\n" +
                "Password: %s\n" +
                "Company Id: %s\n\n" +
                "Please let me know if I can be of further assistance in helping you navigate the system.\n\n" +
                "Regards\n" +
                "Team HR\n" +
                "HR Manager\n\n" +
                "For access or login please click here: %s\n",
                displayName, portalUrl, recipientEmail, rawPassword, companyId, portalUrl
        );

        logger.info("================================================================================");
        logger.info("[EMAIL DISPATCH] Sending welcome credentials email to: {}", recipientEmail);
        logger.info("Subject: {}", subject);
        logger.info("================================================================================");

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            String sender = (fromEmail != null && !fromEmail.trim().isEmpty()) ? fromEmail.trim() : "premanandabspp@gmail.com";
            helper.setFrom(new InternetAddress(sender, "PMS ASEURO HR System"));
            helper.setReplyTo("m.premananda@aseuro.in");
            helper.setTo(recipientEmail);
            helper.setSubject(subject);
            helper.setText(textBody, htmlBody);

            mailSender.send(mimeMessage);
            logger.info("[EMAIL SERVICE] Successfully sent live HTML email to {}", recipientEmail);
        } catch (Exception e) {
            logger.warn("[EMAIL SERVICE] MimeMessage failed, trying fallback SimpleMailMessage: {}", e.getMessage());
            try {
                SimpleMailMessage mailMessage = new SimpleMailMessage();
                String sender = (fromEmail != null && !fromEmail.trim().isEmpty()) ? fromEmail.trim() : "premanandabspp@gmail.com";
                mailMessage.setFrom(sender);
                mailMessage.setReplyTo("m.premananda@aseuro.in");
                mailMessage.setTo(recipientEmail);
                mailMessage.setSubject(subject);
                mailMessage.setText(textBody);
                mailSender.send(mailMessage);
                logger.info("[EMAIL SERVICE] Successfully sent fallback email to {}", recipientEmail);
            } catch (Exception ex) {
                logger.error("[EMAIL SERVICE] Critical: Failed to send email to {}: {}", recipientEmail, ex.getMessage(), ex);
            }
        }
    }
}
