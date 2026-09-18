package com.procurement.system.service;

import com.procurement.system.entity.ApprovalHierarchy;
import com.procurement.system.repository.ApprovalHierarchyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ApprovalHierarchyService {

    private final ApprovalHierarchyRepository approvalHierarchyRepository;

    public ApprovalHierarchy createApprovalHierarchy(ApprovalHierarchy approvalHierarchy) {
        return approvalHierarchyRepository.save(approvalHierarchy);
    }

    public List<ApprovalHierarchy> getAllApprovalHierarchies() {
        return approvalHierarchyRepository.findAll();
    }

    public ApprovalHierarchy getApprovalHierarchyById(Long id) {
        return approvalHierarchyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("ApprovalHierarchy not found with id: " + id));
    }

    public void deleteApprovalHierarchy(Long id) {
        approvalHierarchyRepository.deleteById(id);
    }
}