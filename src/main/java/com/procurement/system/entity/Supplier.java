package com.procurement.system.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.procurement.system.enums.SupplierStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "supplier")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Supplier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "supplier_id")
    private Long supplierId;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    private String name;
    private String phone;
    private String address;
    private String email;
    
    @JsonIgnore
    @Column(name = "password")
    private String password;

    @Column(name = "gst_number")
    private String gstNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private SupplierStatus status;

    private Double rating;
    private String feedback;

    @JsonIgnore
    @Column(name = "mpin", length = 6)
    private String mpin;

    // --- ACCOUNT SECTION ---
    @Column(name = "bank_name")
    private String bankName;

    @Column(name = "account_number")
    private String accountNumber;

    @Column(name = "ifsc_or_swift_code")
    private String ifscOrSwiftCode;

    @Column(name = "payment_terms")
    private String paymentTerms;

    // --- ACCOUNT HISTORY ---
    @Column(name = "outstanding_balance")
    private Double outstandingBalance;

    @Column(name = "total_paid_amount")
    private Double totalPaidAmount;

    @Column(name = "total_orders_completed")
    private Integer totalOrdersCompleted;

    @Column(name = "account_history_notes", columnDefinition = "TEXT")
    private String accountHistoryNotes;

    @Column(name = "created_date", updatable = false)
    private LocalDateTime createdDate;

    @Column(name = "update_date")
    private LocalDateTime updateDate;

    @PrePersist
    protected void onCreate() {
        this.createdDate = LocalDateTime.now();
        this.updateDate = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updateDate = LocalDateTime.now();
    }
}