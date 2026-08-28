package com.aseuro.pms.repository;

import com.aseuro.pms.model.KpiMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KpiMasterRepository extends JpaRepository<KpiMaster, Long> {
    List<KpiMaster> findByDesignationIgnoreCaseAndStatus(String designation, String status);
    List<KpiMaster> findByDesignationIgnoreCase(String designation);
    List<KpiMaster> findByStatus(String status);
}
