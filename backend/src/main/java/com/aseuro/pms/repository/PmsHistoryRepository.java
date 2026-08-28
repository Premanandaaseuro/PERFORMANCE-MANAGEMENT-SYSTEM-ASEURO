package com.aseuro.pms.repository;

import com.aseuro.pms.model.Employee;
import com.aseuro.pms.model.PmsHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

import java.util.Optional;

@Repository
public interface PmsHistoryRepository extends JpaRepository<PmsHistory, Long> {
    List<PmsHistory> findByEmployee(Employee employee);
    List<PmsHistory> findByEmployeeOrderByCycleMonthDesc(Employee employee);
    Optional<PmsHistory> findFirstByAssignmentId(Long assignmentId);
}
