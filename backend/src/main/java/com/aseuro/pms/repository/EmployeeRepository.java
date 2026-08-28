package com.aseuro.pms.repository;

import com.aseuro.pms.model.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    Optional<Employee> findByEmail(String email);
    List<Employee> findByManager(Employee manager);
    List<Employee> findByManagerId(Long managerId);
}
