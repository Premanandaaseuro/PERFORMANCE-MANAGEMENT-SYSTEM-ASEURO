package com.aseuro.pms.service;

import com.aseuro.pms.model.*;
import com.aseuro.pms.repository.*;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.*;

@Service
public class ReportService {

    private final PmsAssignmentRepository pmsAssignmentRepository;
    private final PmsKpiRepository pmsKpiRepository;
    private final EmployeeKpiRatingRepository employeeKpiRatingRepository;
    private final EmployeeReviewRepository employeeReviewRepository;
    private final EmployeeRepository employeeRepository;

    public ReportService(
            PmsAssignmentRepository pmsAssignmentRepository,
            PmsKpiRepository pmsKpiRepository,
            EmployeeKpiRatingRepository employeeKpiRatingRepository,
            EmployeeReviewRepository employeeReviewRepository,
            EmployeeRepository employeeRepository) {
        this.pmsAssignmentRepository = pmsAssignmentRepository;
        this.pmsKpiRepository = pmsKpiRepository;
        this.employeeKpiRatingRepository = employeeKpiRatingRepository;
        this.employeeReviewRepository = employeeReviewRepository;
        this.employeeRepository = employeeRepository;
    }

    private byte[] loadLogoBytes() {
        try (InputStream is = getClass().getResourceAsStream("/aseuro-logo.png")) {
            if (is != null) {
                return is.readAllBytes();
            }
        } catch (Exception e) {
            // Ignore if logo unavailable
        }
        return null;
    }

    @Transactional(readOnly = true)
    public byte[] generatePdfReport(Long employeeId, Long assignmentId) throws IOException {
        PmsAssignment assignment = pmsAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new IllegalArgumentException("Assignment not found"));

        List<PmsKpi> kpis = pmsKpiRepository.findByAssignment(assignment);
        List<EmployeeKpiRating> ratings = employeeKpiRatingRepository.findByAssignment(assignment);
        List<EmployeeReview> reviews = employeeReviewRepository.findByAssignment(assignment);

        try (PDDocument document = new PDDocument()) {
            PDType1Font fontBold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
            PDType1Font fontRegular = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
            PDType1Font fontOblique = new PDType1Font(Standard14Fonts.FontName.HELVETICA_OBLIQUE);

            // Official ASEURO Branding Colors
            Color brightGreen = new Color(111, 192, 74);  // #6FC04A (Bright Lime/Green)
            Color darkGray = new Color(58, 58, 58);       // #3A3A3A (Logo Text Dark Gray)
            Color darkGreen = new Color(74, 118, 55);     // #4A7637 (Green Anti-aliased / Shadow Areas)
            Color lightRowBg = new Color(244, 249, 241);   // Light Soft Green Tint
            Color borderLightColor = new Color(220, 230, 215); // Border Accent
            Color textColor = new Color(51, 65, 85);       // Body Text

            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);
            PDPageContentStream contentStream = new PDPageContentStream(document, page);

            float margin = 40;
            float pageHeight = PDRectangle.A4.getHeight();
            float pageWidth = PDRectangle.A4.getWidth();
            float usableWidth = pageWidth - (margin * 2); // 515 pt

            float y = pageHeight - margin;

            // 1. BRANDING HEADER WITH ASEURO LOGO
            float logoOffset = 15;
            byte[] logoBytes = loadLogoBytes();
            if (logoBytes != null && logoBytes.length > 0) {
                try {
                    PDImageXObject pdLogo = PDImageXObject.createFromByteArray(document, logoBytes, "aseuro-logo");
                    contentStream.drawImage(pdLogo, margin + 5, y - 52, 45, 45);
                    logoOffset = 60;
                } catch (Exception e) {
                    logoOffset = 15;
                }
            }

            // Company Title
            contentStream.beginText();
            contentStream.setFont(fontBold, 15);
            contentStream.setNonStrokingColor(darkGray);
            contentStream.newLineAtOffset(margin + logoOffset, y - 25);
            contentStream.showText("ASEURO TECHNOLOGIES PVT LIMITED");
            contentStream.endText();

            // Subtitle
            contentStream.beginText();
            contentStream.setFont(fontBold, 9);
            contentStream.setNonStrokingColor(darkGreen);
            contentStream.newLineAtOffset(margin + logoOffset, y - 40);
            contentStream.showText("Performance Management System (PMS) — Official Appraisal Certification Report");
            contentStream.endText();

            y -= 58;

            // Accent Green Stripe (#6FC04A)
            drawFilledRect(contentStream, margin, y, usableWidth, 2.5f, brightGreen);

            y -= 15;

            // 2. EMPLOYEE & CYCLE SUMMARY CARD
            float infoBoxHeight = 85;
            drawFilledRect(contentStream, margin, y - infoBoxHeight, usableWidth, infoBoxHeight, lightRowBg);
            drawStrokedRect(contentStream, margin, y - infoBoxHeight, usableWidth, infoBoxHeight, darkGreen, 1);

            // Left Side Details
            contentStream.beginText();
            contentStream.setFont(fontBold, 11);
            contentStream.setNonStrokingColor(darkGray);
            contentStream.newLineAtOffset(margin + 15, y - 20);
            contentStream.showText(sanitizeForPdf(assignment.getEmployee().getName()));
            contentStream.endText();

            contentStream.beginText();
            contentStream.setFont(fontRegular, 9);
            contentStream.setNonStrokingColor(darkGray);
            contentStream.newLineAtOffset(margin + 15, y - 35);
            contentStream.showText("Employee ID: EMP-" + assignment.getEmployee().getId() + "   |   Department: " + sanitizeForPdf(assignment.getEmployee().getDepartment()));
            contentStream.newLineAtOffset(0, -14);
            contentStream.showText("Designation: " + sanitizeForPdf(assignment.getEmployee().getDesignation()));
            contentStream.newLineAtOffset(0, -14);
            contentStream.showText("Reporting Manager: " + sanitizeForPdf(assignment.getEmployee().getManager() != null ? assignment.getEmployee().getManager().getName() : "N/A"));
            contentStream.endText();

            // Right Side Summary
            float rightBoxX = margin + 300;
            contentStream.beginText();
            contentStream.setFont(fontBold, 9);
            contentStream.setNonStrokingColor(darkGray);
            contentStream.newLineAtOffset(rightBoxX, y - 20);
            contentStream.showText("Appraisal Cycle: " + sanitizeForPdf(assignment.getCycleMonth()));
            contentStream.newLineAtOffset(0, -16);
            contentStream.setFont(fontBold, 12);
            contentStream.setNonStrokingColor(darkGreen);
            contentStream.showText("Final Score: " + (assignment.getOverallScore() != null ? String.format("%.2f / 5.00", assignment.getOverallScore()) : "Pending"));
            contentStream.newLineAtOffset(0, -16);
            contentStream.setFont(fontBold, 9);
            contentStream.setNonStrokingColor(darkGray);
            contentStream.showText("Grade: " + (assignment.getPerformanceGrade() != null ? sanitizeForPdf(assignment.getPerformanceGrade()) : "Pending"));
            contentStream.newLineAtOffset(0, -14);
            contentStream.setFont(fontRegular, 8);
            contentStream.setNonStrokingColor(darkGreen);
            contentStream.showText("Finalized Date: " + (assignment.getFinalizedDate() != null ? assignment.getFinalizedDate().toString() : "In Progress"));
            contentStream.endText();

            y -= infoBoxHeight + 20;

            // 3. TABLE SECTION TITLE
            contentStream.beginText();
            contentStream.setFont(fontBold, 11);
            contentStream.setNonStrokingColor(darkGray);
            contentStream.newLineAtOffset(margin, y);
            contentStream.showText("KPI Performance Evaluation Matrix & Breakdown");
            contentStream.endText();

            y -= 15;

            // Table Column Widths: # (20), KPI Description (145), Weight (40), Self (35), Mgr (35), HR (35), Final (40), Comments (165)
            float[] colWidths = {20, 145, 40, 35, 35, 35, 40, 165};
            String[] headers = {"#", "KPI Name & Description", "Weight", "Self", "Manager", "HR", "Final", "Comments & Feedback"};

            y = drawTableHeader(contentStream, margin, y, colWidths, headers, fontBold, darkGray, brightGreen);

            int index = 1;
            for (PmsKpi kpi : kpis) {
                EmployeeKpiRating rating = ratings.stream()
                        .filter(r -> r.getKpi().getId().equals(kpi.getId()))
                        .findFirst().orElse(null);

                Double effRating = null;
                if (rating != null) {
                    if (rating.getHrRating() != null) effRating = rating.getHrRating();
                    else if (rating.getManagerRating() != null) effRating = rating.getManagerRating();
                    else if (rating.getSelfRating() != null) effRating = rating.getSelfRating();
                }
                if (effRating == null && assignment.getOverallScore() != null) {
                    effRating = assignment.getOverallScore();
                }

                String selfStr = (rating != null && rating.getSelfRating() != null) ? String.format("%.1f", rating.getSelfRating()) : "-";
                String mgrStr = (rating != null && rating.getManagerRating() != null) ? String.format("%.1f", rating.getManagerRating()) : "-";
                String hrStr = (rating != null && rating.getHrRating() != null) ? String.format("%.1f", rating.getHrRating()) : "-";
                String finalStr = effRating != null ? String.format("%.1f", effRating) : "-";

                // Text wrapping for Col 1 (KPI Name & Desc - 137 pt width)
                List<String> nameLines = wrapText(kpi.getKpiName(), fontBold, 8.5f, 137);
                List<String> descLines = wrapText(kpi.getDescription(), fontRegular, 7.5f, 137);

                // Text wrapping for Col 7 (Comments - 157 pt width)
                List<String> commentLines = new ArrayList<>();
                if (rating != null && rating.getComments() != null && !rating.getComments().trim().isEmpty()) {
                    commentLines.addAll(wrapText("Self: " + rating.getComments(), fontOblique, 7.5f, 157));
                }
                if (rating != null && rating.getManagerComments() != null && !rating.getManagerComments().trim().isEmpty()) {
                    commentLines.addAll(wrapText("Mgr: " + rating.getManagerComments(), fontOblique, 7.5f, 157));
                }
                if (rating != null && rating.getHrComments() != null && !rating.getHrComments().trim().isEmpty()) {
                    commentLines.addAll(wrapText("HR: " + rating.getHrComments(), fontOblique, 7.5f, 157));
                }
                if (commentLines.isEmpty()) {
                    commentLines.add("-");
                }

                // Dynamic height calculation
                int leftLinesCount = nameLines.size() + descLines.size();
                int rightLinesCount = commentLines.size();
                int maxLines = Math.max(leftLinesCount, rightLinesCount);
                float rowHeight = Math.max(28, (maxLines * 11) + 12);

                // Auto Multi-page Break
                if (y - rowHeight < 50) {
                    contentStream.close();
                    page = new PDPage(PDRectangle.A4);
                    document.addPage(page);
                    contentStream = new PDPageContentStream(document, page);
                    y = pageHeight - margin;
                    y = drawTableHeader(contentStream, margin, y, colWidths, headers, fontBold, darkGray, brightGreen);
                }

                // Row Alternate Background
                if (index % 2 == 0) {
                    drawFilledRect(contentStream, margin, y - rowHeight, usableWidth, rowHeight, lightRowBg);
                }

                // Row Outer Border Box
                drawStrokedRect(contentStream, margin, y - rowHeight, usableWidth, rowHeight, borderLightColor, 0.5f);

                // Render Cells
                float currentX = margin;

                // Col 0: Index
                drawCellText(contentStream, String.valueOf(index), fontBold, 8.5f, currentX + 5, y - 16, darkGray);
                currentX += colWidths[0];

                // Col 1: Name & Description
                float textY = y - 13;
                for (String line : nameLines) {
                    drawCellText(contentStream, line, fontBold, 8.5f, currentX + 4, textY, darkGray);
                    textY -= 10.5f;
                }
                for (String line : descLines) {
                    drawCellText(contentStream, line, fontRegular, 7.5f, currentX + 4, textY, new Color(100, 116, 139));
                    textY -= 9.5f;
                }
                currentX += colWidths[1];

                // Col 2: Weight
                drawCellText(contentStream, String.format("%.0f%%", kpi.getWeightage()), fontRegular, 8.5f, currentX + 8, y - 16, textColor);
                currentX += colWidths[2];

                // Col 3: Self Rating
                drawCellText(contentStream, selfStr, fontRegular, 8.5f, currentX + 10, y - 16, textColor);
                currentX += colWidths[3];

                // Col 4: Manager Rating
                drawCellText(contentStream, mgrStr, fontRegular, 8.5f, currentX + 10, y - 16, textColor);
                currentX += colWidths[4];

                // Col 5: HR Rating
                drawCellText(contentStream, hrStr, fontRegular, 8.5f, currentX + 10, y - 16, textColor);
                currentX += colWidths[5];

                // Col 6: Final Score
                drawCellText(contentStream, finalStr, fontBold, 9.0f, currentX + 10, y - 16, darkGreen);
                currentX += colWidths[6];

                // Col 7: Comments & Feedback
                textY = y - 13;
                for (String line : commentLines) {
                    Color cColor = line.startsWith("HR:") ? darkGreen : line.startsWith("Mgr:") ? darkGray : textColor;
                    drawCellText(contentStream, line, fontOblique, 7.5f, currentX + 4, textY, cColor);
                    textY -= 9.5f;
                }

                // Vertical Gridlines Between Columns
                float divX = margin;
                for (int c = 0; c < colWidths.length - 1; c++) {
                    divX += colWidths[c];
                    contentStream.setStrokingColor(borderLightColor);
                    contentStream.setLineWidth(0.5f);
                    contentStream.moveTo(divX, y);
                    contentStream.lineTo(divX, y - rowHeight);
                    contentStream.stroke();
                }

                y -= rowHeight;
                index++;
            }

            // 5. OFFICIAL REVIEWER REMARKS BOX
            if (!reviews.isEmpty() && y - 70 > 50) {
                y -= 15;
                drawFilledRect(contentStream, margin, y - 65, usableWidth, 65, lightRowBg);
                drawStrokedRect(contentStream, margin, y - 65, usableWidth, 65, darkGreen, 1);

                contentStream.beginText();
                contentStream.setFont(fontBold, 10);
                contentStream.setNonStrokingColor(darkGray);
                contentStream.newLineAtOffset(margin + 12, y - 18);
                contentStream.showText("Official Reviewer Remarks & Comments:");
                contentStream.endText();

                float revY = y - 32;
                for (EmployeeReview rev : reviews) {
                    String rRole = rev.getReviewer().getRole().name().replace("ROLE_", "");
                    String rName = rev.getReviewer().getName();
                    String rText = rRole + " (" + rName + "): " + (rev.getComments() != null ? rev.getComments() : "Approved");
                    List<String> rLines = wrapText(rText, fontRegular, 8.0f, usableWidth - 24);

                    for (String rline : rLines) {
                        contentStream.beginText();
                        contentStream.setFont(fontRegular, 8.0f);
                        contentStream.setNonStrokingColor(textColor);
                        contentStream.newLineAtOffset(margin + 12, revY);
                        contentStream.showText(rline);
                        contentStream.endText();
                        revY -= 10;
                    }
                }
            }

            // Bottom Footer
            contentStream.beginText();
            contentStream.setFont(fontRegular, 7.5f);
            contentStream.setNonStrokingColor(darkGreen);
            contentStream.newLineAtOffset(margin, 25);
            contentStream.showText("ASEURO TECHNOLOGIES PVT LIMITED  •  Confidential Performance Appraisal Document");
            contentStream.endText();

            contentStream.close();

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            document.save(baos);
            return baos.toByteArray();
        }
    }

    private float drawTableHeader(PDPageContentStream stream, float x, float y, float[] widths, String[] headers, PDType1Font font, Color bgColor, Color accentColor) throws IOException {
        float headerHeight = 22;
        drawFilledRect(stream, x, y - headerHeight, 515, headerHeight, bgColor);
        drawFilledRect(stream, x, y - 2, 515, 2, accentColor); // Top accent stripe (#6FC04A)

        float currentX = x;
        for (int i = 0; i < headers.length; i++) {
            stream.beginText();
            stream.setFont(font, 8.5f);
            stream.setNonStrokingColor(Color.WHITE);
            stream.newLineAtOffset(currentX + (i == 0 ? 5 : 4), y - 15);
            stream.showText(headers[i]);
            stream.endText();
            currentX += widths[i];
        }
        return y - headerHeight;
    }

    private void drawCellText(PDPageContentStream stream, String text, PDType1Font font, float fontSize, float x, float y, Color color) throws IOException {
        stream.beginText();
        stream.setFont(font, fontSize);
        stream.setNonStrokingColor(color);
        stream.newLineAtOffset(x, y);
        stream.showText(sanitizeForPdf(text));
        stream.endText();
    }

    private void drawFilledRect(PDPageContentStream stream, float x, float y, float w, float h, Color color) throws IOException {
        stream.setNonStrokingColor(color);
        stream.addRect(x, y, w, h);
        stream.fill();
    }

    private void drawStrokedRect(PDPageContentStream stream, float x, float y, float w, float h, Color color, float lineWidth) throws IOException {
        stream.setStrokingColor(color);
        stream.setLineWidth(lineWidth);
        stream.addRect(x, y, w, h);
        stream.stroke();
    }

    private List<String> wrapText(String text, PDType1Font font, float fontSize, float maxWidth) throws IOException {
        if (text == null || text.trim().isEmpty()) return Collections.emptyList();
        text = sanitizeForPdf(text);
        List<String> lines = new ArrayList<>();
        String[] words = text.split(" ");
        StringBuilder currentLine = new StringBuilder();

        for (String word : words) {
            String testLine = currentLine.length() == 0 ? word : currentLine + " " + word;
            float width = font.getStringWidth(testLine) / 1000 * fontSize;
            if (width > maxWidth) {
                if (currentLine.length() > 0) {
                    lines.add(currentLine.toString());
                    currentLine = new StringBuilder(word);
                } else {
                    lines.add(word);
                }
            } else {
                currentLine = new StringBuilder(testLine);
            }
        }
        if (currentLine.length() > 0) {
            lines.add(currentLine.toString());
        }
        return lines;
    }

    private String sanitizeForPdf(String text) {
        if (text == null) return "";
        return text.replace("•", "-")
                .replace("\r", " ")
                .replace("\n", " ")
                .replace("“", "\"")
                .replace("”", "\"")
                .replace("’", "'")
                .replaceAll("[^\\x00-\\x7F]", "");
    }

    @Transactional(readOnly = true)
    public byte[] generateExcelReport(Long employeeId, Long assignmentId) throws IOException {
        PmsAssignment assignment = pmsAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new IllegalArgumentException("Assignment not found"));

        List<PmsKpi> kpis = pmsKpiRepository.findByAssignment(assignment);
        List<EmployeeKpiRating> ratings = employeeKpiRatingRepository.findByAssignment(assignment);

        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("PMS Final Combined Report");

            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setFontHeightInPoints((short) 11);
            headerFont.setColor(IndexedColors.WHITE.getIndex());

            CellStyle headerCellStyle = workbook.createCellStyle();
            headerCellStyle.setFont(headerFont);
            headerCellStyle.setFillForegroundColor(IndexedColors.DARK_TEAL.getIndex());
            headerCellStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            // Employee details
            int rowNum = 0;
            Row rInfo1 = sheet.createRow(rowNum++);
            rInfo1.createCell(0).setCellValue("Employee Name:");
            rInfo1.createCell(1).setCellValue(assignment.getEmployee().getName());
            
            Row rInfo2 = sheet.createRow(rowNum++);
            rInfo2.createCell(0).setCellValue("Employee ID:");
            rInfo2.createCell(1).setCellValue("EMP-" + assignment.getEmployee().getId());

            Row rInfo3 = sheet.createRow(rowNum++);
            rInfo3.createCell(0).setCellValue("PMS Cycle:");
            rInfo3.createCell(1).setCellValue(assignment.getCycleMonth());

            Row rInfo4 = sheet.createRow(rowNum++);
            rInfo4.createCell(0).setCellValue("Combined Final Score:");
            rInfo4.createCell(1).setCellValue(assignment.getOverallScore() != null ? assignment.getOverallScore() : 0.0);

            Row rInfo5 = sheet.createRow(rowNum++);
            rInfo5.createCell(0).setCellValue("Performance Grade:");
            rInfo5.createCell(1).setCellValue(assignment.getPerformanceGrade() != null ? assignment.getPerformanceGrade() : "N/A");

            rowNum++; // Blank row

            // KPI Header row
            Row headerRow = sheet.createRow(rowNum++);
            String[] columns = {"KPI Name", "Measurement Description", "Weightage", "Self Rating", "Manager Rating", "HR Rating", "Combined Effective Rating", "Employee Comments", "Manager Feedback", "HR Feedback"};
            for (int i = 0; i < columns.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerCellStyle);
            }

            // Write KPI details
            for (PmsKpi kpi : kpis) {
                EmployeeKpiRating rating = ratings.stream()
                        .filter(r -> r.getKpi().getId().equals(kpi.getId()))
                        .findFirst().orElse(null);

                Double effRating = null;
                if (rating != null) {
                    if (rating.getHrRating() != null) effRating = rating.getHrRating();
                    else if (rating.getManagerRating() != null) effRating = rating.getManagerRating();
                    else if (rating.getSelfRating() != null) effRating = rating.getSelfRating();
                }
                if (effRating == null && assignment.getOverallScore() != null) {
                    effRating = assignment.getOverallScore();
                }
                if (effRating == null) effRating = 0.0;

                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(kpi.getKpiName());
                row.createCell(1).setCellValue(kpi.getDescription());
                row.createCell(2).setCellValue(kpi.getWeightage() + "%");
                row.createCell(3).setCellValue(rating != null && rating.getSelfRating() != null ? rating.getSelfRating() : 0.0);
                row.createCell(4).setCellValue(rating != null && rating.getManagerRating() != null ? rating.getManagerRating() : 0.0);
                row.createCell(5).setCellValue(rating != null && rating.getHrRating() != null ? rating.getHrRating() : 0.0);
                row.createCell(6).setCellValue(effRating);
                row.createCell(7).setCellValue(rating != null && rating.getComments() != null ? rating.getComments() : "");
                row.createCell(8).setCellValue(rating != null && rating.getManagerComments() != null ? rating.getManagerComments() : "");
                row.createCell(9).setCellValue(rating != null && rating.getHrComments() != null ? rating.getHrComments() : "");
            }

            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            workbook.write(baos);
            return baos.toByteArray();
        }
    }
}
