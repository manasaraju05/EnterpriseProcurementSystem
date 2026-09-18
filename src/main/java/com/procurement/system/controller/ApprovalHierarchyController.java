package com.procurement.system.controller;

import com.procurement.system.entity.ApprovalHierarchy;
import com.procurement.system.service.ApprovalHierarchyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/approval-hierarchies")
@RequiredArgsConstructor
public class ApprovalHierarchyController {

    private final ApprovalHierarchyService approvalHierarchyService;

    @PostMapping
    public ResponseEntity<ApprovalHierarchy> createApprovalHierarchy(@RequestBody ApprovalHierarchy approvalHierarchy) {
        return ResponseEntity.ok(approvalHierarchyService.createApprovalHierarchy(approvalHierarchy));
    }

    @GetMapping
    public ResponseEntity<List<ApprovalHierarchy>> getAllApprovalHierarchies() {
        return ResponseEntity.ok(approvalHierarchyService.getAllApprovalHierarchies());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApprovalHierarchy> getApprovalHierarchyById(@PathVariable Long id) {
        return ResponseEntity.ok(approvalHierarchyService.getApprovalHierarchyById(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteApprovalHierarchy(@PathVariable Long id) {
        approvalHierarchyService.deleteApprovalHierarchy(id);
        return ResponseEntity.ok("ApprovalHierarchy deleted successfully");
    }
}