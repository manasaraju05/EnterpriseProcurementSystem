package com.procurement.system.repository;

import com.procurement.system.entity.Department;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {
	//Optional<Department> findByDeptName(String deptName);
	Optional<Department> findFirstByDeptName(String deptName);
}