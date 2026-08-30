package com.aseuro.pms.service;

import com.aseuro.pms.model.*;
import com.aseuro.pms.repository.*;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.util.List;

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

    @Transactional(readOnly = true)
    public byte[] generatePdfReport(Long employeeId, Long assignmentId) throws IOException {
        PmsAssignment assignment = pmsAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new IllegalArgumentException("Assignment not found"));

        Employee reqUser = employeeRepository.findById(employeeId).orElse(null);
        boolean isHrOrManager = reqUser != null && (reqUser.getRole() == Role.ROLE_HR || reqUser.getRole() == Role.ROLE_MANAGER);

        if (!assignment.getEmployee().getId().equals(employeeId) && !isHrOrManager) {
            throw new AccessDeniedException("Unauthorized access to report");
        }

        List<PmsKpi> kpis = pmsKpiRepository.findByAssignment(assignment);
        List<EmployeeKpiRating> ratings = employeeKpiRatingRepository.findByAssignment(assignment);
        List<EmployeeReview> reviews = employeeReviewRepository.findByAssignment(assignment);

        try (PDDocument document = new PDDocument()) {
            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);

            try (PDPageContentStream contentStream = new PDPageContentStream(document, page)) {
                PDType1Font fontBold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
                PDType1Font fontRegular = new PDType1Font(Standard14Fonts.FontName.HELVETICA);

                // Header
                contentStream.beginText();
                contentStream.setFont(fontBold, 18);
                contentStream.newLineAtOffset(50, 750);
                contentStream.showText("Performance Management System (PMS) - Final Report");
                contentStream.endText();

                // Employee Info
                contentStream.beginText();
                contentStream.setFont(fontBold, 12);
                contentStream.newLineAtOffset(50, 710);
                contentStream.showText("Employee Name: " + assignment.getEmployee().getName());
                contentStream.newLineAtOffset(0, -20);
                contentStream.showText("Employee ID: EMP-" + assignment.getEmployee().getId());
                contentStream.newLineAtOffset(0, -20);
                contentStream.showText("Designation: " + assignment.getEmployee().getDesignation());
                contentStream.newLineAtOffset(0, -20);
                contentStream.showText("Department: " + assignment.getEmployee().getDepartment());
                contentStream.newLineAtOffset(0, -20);
                contentStream.showText("PMS Cycle: " + assignment.getCycleMonth());
                contentStream.newLineAtOffset(0, -20);
                contentStream.showText("Overall Score: " + (assignment.getOverallScore() != null ? assignment.getOverallScore() : "N/A"));
                contentStream.newLineAtOffset(0, -20);
                contentStream.showText("Performance Grade: " + (assignment.getPerformanceGrade() != null ? assignment.getPerformanceGrade() : "N/A"));
                contentStream.endText();

                // KPI List Section
                contentStream.beginText();
                contentStream.setFont(fontBold, 14);
                contentStream.newLineAtOffset(50, 530);
                contentStream.showText("KPI Combined Performance Breakdown:");
                contentStream.endText();

                int yPosition = 500;
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
                    if (effRating == null) effRating = 5.0;

                    String selfStr = (rating != null && rating.getSelfRating() != null) ? String.format("%.1f", rating.getSelfRating()) : "N/A";
                    String mgrStr = (rating != null && rating.getManagerRating() != null) ? String.format("%.1f", rating.getManagerRating()) : "N/A";
                    String hrStr = (rating != null && rating.getHrRating() != null) ? String.format("%.1f", rating.getHrRating()) : "N/A";
                    String combStr = String.format("%.1f", effRating);

                    contentStream.beginText();
                    contentStream.setFont(fontBold, 11);
                    contentStream.newLineAtOffset(50, yPosition);
                    contentStream.showText("• " + kpi.getKpiName() + " (Weightage: " + kpi.getWeightage() + "%)");
                    contentStream.setFont(fontRegular, 9);
                    contentStream.newLineAtOffset(0, -14);
                    contentStream.showText("  Self Rating: " + selfStr + " | Manager Rating: " + mgrStr + " | HR Rating: " + hrStr + " | Combined: " + combStr);

                    if (rating != null && rating.getComments() != null && !rating.getComments().trim().isEmpty()) {
                        contentStream.newLineAtOffset(0, -12);
                        String empNote = rating.getComments().length() > 70 ? rating.getComments().substring(0, 67) + "..." : rating.getComments();
                        contentStream.showText("  Employee Note: \"" + empNote + "\"");
                    }

                    if (rating != null && rating.getManagerComments() != null && !rating.getManagerComments().trim().isEmpty()) {
                        contentStream.newLineAtOffset(0, -12);
                        String mgrNote = rating.getManagerComments().length() > 70 ? rating.getManagerComments().substring(0, 67) + "..." : rating.getManagerComments();
                        contentStream.showText("  Manager Feedback: \"" + mgrNote + "\"");
                    }

                    contentStream.endText();

                    yPosition -= 45;
                    if (yPosition < 100) {
                        break; // Prevent drawing off-page
                    }
                }

                // Overall Review & Manager Feedback Summary
                if (yPosition > 120 && !reviews.isEmpty()) {
                    contentStream.beginText();
                    contentStream.setFont(fontBold, 12);
                    contentStream.newLineAtOffset(50, yPosition - 10);
                    contentStream.showText("Official Manager & HR Remarks:");
                    contentStream.setFont(fontRegular, 10);
                    for (EmployeeReview rev : reviews) {
                        contentStream.newLineAtOffset(0, -18);
                        String revText = rev.getReviewer().getRole().name().replace("ROLE_", "") + " (" + rev.getReviewer().getName() + "): " + rev.getComments();
                        if (revText.length() > 85) revText = revText.substring(0, 82) + "...";
                        contentStream.showText(revText);
                    }
                    contentStream.endText();
                }
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            document.save(baos);
            return baos.toByteArray();
        }
    }

    @Transactional(readOnly = true)
    public byte[] generateExcelReport(Long employeeId, Long assignmentId) throws IOException {
        PmsAssignment assignment = pmsAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new IllegalArgumentException("Assignment not found"));

        Employee reqUser = employeeRepository.findById(employeeId).orElse(null);
        boolean isHrOrManager = reqUser != null && (reqUser.getRole() == Role.ROLE_HR || reqUser.getRole() == Role.ROLE_MANAGER);

        if (!assignment.getEmployee().getId().equals(employeeId) && !isHrOrManager) {
            throw new AccessDeniedException("Unauthorized access to report");
        }

        List<PmsKpi> kpis = pmsKpiRepository.findByAssignment(assignment);
        List<EmployeeKpiRating> ratings = employeeKpiRatingRepository.findByAssignment(assignment);

        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("PMS Final Combined Report");

            // Header Font & Style
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
            String[] columns = {"KPI Name", "Measurement Description", "Weightage", "Self Rating", "Manager Rating", "HR Rating", "Combined Effective Rating", "Employee Comments", "Manager Feedback"};
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
            }

            // Auto-size columns
            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            workbook.write(baos);
            return baos.toByteArray();
        }
    }
}
