package com.aseuro.pms.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String senderEmail;

    @Value("${app.mail.from:m.premananda@aseuro.in}")
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
     * If SMTP is not configured or in local development, outputs formatted email to console.
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
                "HR Manager\n",
                displayName,
                displayName,
                companyName,
                portalUrl,
                recipientEmail,
                rawPassword,
                companyId
        );

        logger.info("================================================================================");
        logger.info("[EMAIL DISPATCH] Sending welcome credentials email to: {}", recipientEmail);
        logger.info("Subject: {}", subject);
        logger.info("\n{}", messageBody);
        logger.info("================================================================================");

        // Check if SMTP credentials are provided
        if (senderEmail == null || senderEmail.trim().isEmpty() || senderEmail.contains("your-email")) {
            logger.info("[EMAIL SERVICE] Real SMTP username not configured. Email logged to console above for local verification.");
            return;
        }

        try {
            SimpleMailMessage mailMessage = new SimpleMailMessage();
            String fromAddress = (fromEmail != null && !fromEmail.trim().isEmpty()) ? fromEmail.trim() : senderEmail;
            mailMessage.setFrom(fromAddress);
            mailMessage.setTo(recipientEmail);
            mailMessage.setSubject(subject);
            mailMessage.setText(messageBody);

            mailSender.send(mailMessage);
            logger.info("[EMAIL SERVICE] Successfully sent live email from {} to {}", fromAddress, recipientEmail);
        } catch (Exception e) {
            logger.error("[EMAIL SERVICE] Failed to send email to {}: {}. Account was created successfully.", recipientEmail, e.getMessage());
        }
    }
}
