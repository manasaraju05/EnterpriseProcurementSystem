package com.procurement.system.repository;

import com.procurement.system.entity.ApprovalHierarchy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ApprovalHierarchyRepository extends JpaRepository<ApprovalHierarchy, Long> {}