package com.aseuro.pms.controller;

import com.aseuro.pms.dto.DashboardResponse;
import com.aseuro.pms.dto.KpiRatingRequest;
import com.aseuro.pms.dto.PmsAssignmentDto;
import com.aseuro.pms.dto.PmsHistoryDto;
import com.aseuro.pms.security.UserPrincipal;
import com.aseuro.pms.service.PmsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/employee/pms")
public class PmsController {

    private final PmsService pmsService;

    public PmsController(PmsService pmsService) {
        this.pmsService = pmsService;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardResponse> getDashboard(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        DashboardResponse dashboard = pmsService.getDashboardData(userPrincipal.getId());
        return ResponseEntity.ok(dashboard);
    }

    @GetMapping("/current")
    public ResponseEntity<PmsAssignmentDto> getCurrentAssignment(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        PmsAssignmentDto assignment = pmsService.getCurrentAssignment(userPrincipal.getId());
        return ResponseEntity.ok(assignment);
    }

    @GetMapping("/{assignmentId}")
    public ResponseEntity<PmsAssignmentDto> getAssignmentDetail(
            @PathVariable Long assignmentId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        PmsAssignmentDto assignment = pmsService.getAssignmentDetail(userPrincipal.getId(), assignmentId);
        return ResponseEntity.ok(assignment);
    }

    @PutMapping("/{assignmentId}/draft")
    public ResponseEntity<PmsAssignmentDto> saveDraft(
            @PathVariable Long assignmentId,
            @RequestBody KpiRatingRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        PmsAssignmentDto assignment = pmsService.saveSelfAssessmentDraft(userPrincipal.getId(), assignmentId, request);
        return ResponseEntity.ok(assignment);
    }

    @PostMapping("/{assignmentId}/submit")
    public ResponseEntity<PmsAssignmentDto> submit(
            @PathVariable Long assignmentId,
            @RequestBody KpiRatingRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        PmsAssignmentDto assignment = pmsService.submitSelfAssessment(userPrincipal.getId(), assignmentId, request);
        return ResponseEntity.ok(assignment);
    }

    @GetMapping("/history")
    public ResponseEntity<List<PmsHistoryDto>> getHistory(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        List<PmsHistoryDto> history = pmsService.getPmsHistory(userPrincipal.getId());
        return ResponseEntity.ok(history);
    }

    @PostMapping("/reset-active")
    public ResponseEntity<Void> resetActive(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        pmsService.resetActiveCycle(userPrincipal.getId());
        return ResponseEntity.ok().build();
    }
}
