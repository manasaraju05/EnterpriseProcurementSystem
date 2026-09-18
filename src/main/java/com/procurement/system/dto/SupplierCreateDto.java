package com.procurement.system.dto;

import com.procurement.system.enums.SupplierStatus;
import lombok.Data;

@Data
public class SupplierCreateDto {

    private Long productId;
    private String name;
    private String phone;
    private String address;
    private String email;
    private String gstNumber;
    private SupplierStatus status;
    private Double rating;
    private String feedback;

    // Account Section
    private String bankName;
    private String accountNumber;
    private String ifscOrSwiftCode;
    private String paymentTerms;

    // Account History
    private Double outstandingBalance;
    private Double totalPaidAmount;
    private Integer totalOrdersCompleted;
    private String accountHistoryNotes;
}