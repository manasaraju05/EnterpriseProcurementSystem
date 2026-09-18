package com.procurement.system.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "approval_hierarchy")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApprovalHierarchy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "approval_hierarchy_id")
    private Long approvalHierarchyId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dept_id")
    private Department department;

    private Integer level;
}
