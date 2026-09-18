package com.procurement.system.dto;

import com.procurement.system.entity.RequestStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminApprovalDto {
    private RequestStatus status; // APPROVED or REJECTED
    private String adminDescription;
}