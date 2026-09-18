package com.procurement.system.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "procurement_requests")
@Getter // Replaced @Data with @Getter and @Setter to prevent infinite recursion bugs
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ProcurementRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "request_id")
    private Long requestId;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "total_amount")
    private Double totalAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private RequestStatus status;

    // --- NEW FIELD ADDED HERE ---
    @Column(name = "payment_status")
    private String paymentStatus = "UNPAID";

    @Column(name = "justification")
    private String justification;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;
    
    @Column(name = "admin_description")
    private String adminDescription;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "supplier_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Supplier supplier;

    @OneToOne(mappedBy = "procurementRequest", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnoreProperties({"procurementRequest", "hibernateLazyInitializer", "handler"})
    private Payment payment;

    // --- ADDED THIS NEW RATING MAPPING ---
    @OneToOne(mappedBy = "request", fetch = FetchType.LAZY)
    @JsonIgnoreProperties({"request", "user", "product", "hibernateLazyInitializer", "handler"})
    private Rating rating;

    @PrePersist
    public void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = RequestStatus.PENDING;
        }
        // --- NEW DEFAULT CHECK ADDED HERE ---
        if (this.paymentStatus == null) {
            this.paymentStatus = "UNPAID";
        }
    }
}