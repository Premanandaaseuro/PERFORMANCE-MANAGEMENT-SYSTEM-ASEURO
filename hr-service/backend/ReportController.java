package com.aseuro.pms.controller;

import com.aseuro.pms.dto.PmsHistoryDto;
import com.aseuro.pms.security.UserPrincipal;
import com.aseuro.pms.service.PmsService;
import com.aseuro.pms.service.ReportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/employee/reports")
public class ReportController {

    private final PmsService pmsService;
    private final ReportService reportService;

    public ReportController(PmsService pmsService, ReportService reportService) {
        this.pmsService = pmsService;
        this.reportService = reportService;
    }

    @GetMapping
    public ResponseEntity<List<PmsHistoryDto>> getReports(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        // Retrieve finalised cycles (from history) as available reports
        List<PmsHistoryDto> reports = pmsService.getPmsHistory(userPrincipal.getId());
        return ResponseEntity.ok(reports);
    }

    @GetMapping("/{assignmentId}/download")
    public ResponseEntity<byte[]> downloadReport(
            @PathVariable Long assignmentId,
            @RequestParam(defaultValue = "pdf") String format,
            @AuthenticationPrincipal UserPrincipal userPrincipal) throws IOException {

        byte[] data;
        String filename;
        MediaType mediaType;

        if ("excel".equalsIgnoreCase(format)) {
            data = reportService.generateExcelReport(userPrincipal.getId(), assignmentId);
            filename = "PMS_Report_" + assignmentId + ".xlsx";
            mediaType = MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        } else {
            data = reportService.generatePdfReport(userPrincipal.getId(), assignmentId);
            filename = "PMS_Report_" + assignmentId + ".pdf";
            mediaType = MediaType.APPLICATION_PDF;
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(mediaType)
                .body(data);
    }
}
