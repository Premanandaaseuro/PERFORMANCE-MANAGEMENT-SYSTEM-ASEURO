package com.aseuro.pms.repository;

import com.aseuro.pms.entity.Employee;
import com.aseuro.pms.entity.RecordStatus;
import com.aseuro.pms.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HrEmployeeRepository extends JpaRepository<Employee, Long> {
    Optional<Employee> findByEmailIgnoreCase(String email);
    Optional<Employee> findByEmployeeCodeIgnoreCase(String employeeCode);
    Optional<Employee> findByUserId(Long userId);
    boolean existsByEmployeeCodeIgnoreCase(String employeeCode);
    boolean existsByEmailIgnoreCase(String email);

    @Query("SELECT e FROM HrLegacyEmployee e JOIN e.user u WHERE u.role = :role AND e.status = :status")
    List<Employee> findByUserRoleAndStatus(UserRole role, RecordStatus status);

    List<Employee> findByManagerId(Long managerId);
}
