package com.aseuro.pms.service;

import com.aseuro.pms.dto.CreateKpiMasterRequest;
import com.aseuro.pms.dto.KpiMasterDto;
import com.aseuro.pms.dto.UpdateKpiMasterRequest;
import com.aseuro.pms.exception.ApiException;
import com.aseuro.pms.model.KpiMaster;
import com.aseuro.pms.repository.KpiMasterRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Collectors;

@Service
public class HrKpiService {

    private final KpiMasterRepository kpiMasterRepository;

    public HrKpiService(KpiMasterRepository kpiMasterRepository) {
        this.kpiMasterRepository = kpiMasterRepository;
    }

    @Transactional(readOnly = true)
    public List<String> getAllDesignations() {
        List<KpiMaster> all = kpiMasterRepository.findAll();
        Set<String> designations = new TreeSet<>(String.CASE_INSENSITIVE_ORDER);
        all.forEach(k -> {
            if (k.getDesignation() != null && !k.getDesignation().trim().isEmpty()) {
                designations.add(k.getDesignation().trim());
            }
        });
        // Default standard designations if empty
        if (designations.isEmpty()) {
            designations.addAll(List.of(
                    "Software Engineer",
                    "Senior Software Engineer",
                    "Tech Lead",
                    "Engineering Manager",
                    "QA Engineer"
            ));
        }
        return new ArrayList<>(designations);
    }

    @Transactional(readOnly = true)
    public List<KpiMasterDto> getKpisByDesignation(String designation) {
        List<KpiMaster> list;
        if (designation != null && !designation.trim().isEmpty()) {
            list = kpiMasterRepository.findByDesignationIgnoreCaseAndStatus(designation.trim(), "ACTIVE");
        } else {
            list = kpiMasterRepository.findByStatus("ACTIVE");
        }
        return list.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional
    public KpiMasterDto createKpi(CreateKpiMasterRequest request) {
        String desig = request.getDesignation().trim();
        List<KpiMaster> existing = kpiMasterRepository.findByDesignationIgnoreCaseAndStatus(desig, "ACTIVE");

        double currentTotal = existing.stream().mapToDouble(KpiMaster::getWeightage).sum();
        if (currentTotal + request.getWeightage() > 100.0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Total KPI weightage cannot exceed 100%. (Current: " + currentTotal + "%, Attempted: " + (currentTotal + request.getWeightage()) + "%)");
        }

        KpiMaster kpi = KpiMaster.builder()
                .designation(desig)
                .kpiName(request.getKpiName().trim())
                .description(request.getDescription() != null ? request.getDescription().trim() : "")
                .weightage(request.getWeightage())
                .status("ACTIVE")
                .build();

        KpiMaster saved = kpiMasterRepository.save(kpi);
        return mapToDto(saved);
    }

    @Transactional
    public KpiMasterDto updateKpi(Long id, UpdateKpiMasterRequest request) {
        KpiMaster kpi = kpiMasterRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "KPI not found"));

        List<KpiMaster> existing = kpiMasterRepository.findByDesignationIgnoreCaseAndStatus(kpi.getDesignation(), "ACTIVE");
        double otherTotal = existing.stream()
                .filter(k -> !k.getId().equals(id))
                .mapToDouble(KpiMaster::getWeightage)
                .sum();

        if (otherTotal + request.getWeightage() > 100.0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Total KPI weightage cannot exceed 100%. (Other KPIs: " + otherTotal + "%, Attempted: " + (otherTotal + request.getWeightage()) + "%)");
        }

        kpi.setKpiName(request.getKpiName().trim());
        if (request.getDescription() != null) {
            kpi.setDescription(request.getDescription().trim());
        }
        kpi.setWeightage(request.getWeightage());
        if (request.getStatus() != null) {
            kpi.setStatus(request.getStatus().trim());
        }

        KpiMaster updated = kpiMasterRepository.save(kpi);
        return mapToDto(updated);
    }

    @Transactional
    public void deleteKpi(Long id) {
        KpiMaster kpi = kpiMasterRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "KPI not found"));
        kpiMasterRepository.delete(kpi);
    }

    private KpiMasterDto mapToDto(KpiMaster k) {
        return KpiMasterDto.builder()
                .id(k.getId())
                .designation(k.getDesignation())
                .kpiName(k.getKpiName())
                .description(k.getDescription())
                .weightage(k.getWeightage())
                .status(k.getStatus())
                .build();
    }
}
