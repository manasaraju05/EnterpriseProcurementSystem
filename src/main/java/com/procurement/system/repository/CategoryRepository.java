package com.procurement.system.repository;

import com.procurement.system.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    
    // Spring Data JPA derives the query automatically!
    List<Category> findByDepartmentDeptId(Long deptId);

    // Fetch categories by department name
    List<Category> findByDepartmentDeptName(String deptName);
}