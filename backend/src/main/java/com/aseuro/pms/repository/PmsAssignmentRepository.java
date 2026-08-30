package com.aseuro.pms.repository;

import com.aseuro.pms.model.Employee;
import com.aseuro.pms.model.PmsAssignment;
import com.aseuro.pms.model.PMSState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PmsAssignmentRepository extends JpaRepository<PmsAssignment, Long> {
    List<PmsAssignment> findByEmployee(Employee employee);
    Optional<PmsAssignment> findByEmployeeAndCycleMonth(Employee employee, String cycleMonth);
    Optional<PmsAssignment> findFirstByEmployeeOrderByStartDateDesc(Employee employee);
    Optional<PmsAssignment> findFirstByEmployeeOrderByIdDesc(Employee employee);
    List<PmsAssignment> findByEmployeeAndStatusNot(Employee employee, PMSState status);
}
