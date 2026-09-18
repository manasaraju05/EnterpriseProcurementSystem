package com.procurement.system.repository;

import com.procurement.system.entity.ProcurementRequest;
import com.procurement.system.entity.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface ProcurementRequestRepository extends JpaRepository<ProcurementRequest, Long> {
    
    List<ProcurementRequest> findByUser_UserId(Long userId);
    
    List<ProcurementRequest> findByStatus(RequestStatus status);
    
    List<ProcurementRequest> findByProduct_ProductId(Long productId);

    // Fetch requests/orders by supplier ID along with payment details to fix the UNPAID column
    @Query("SELECT p FROM ProcurementRequest p LEFT JOIN FETCH p.payment WHERE p.supplier.id = :supplierId")
    List<ProcurementRequest> findBySupplierIdWithPayment(@Param("supplierId") Long supplierId);

    @Modifying
    @Transactional
    @Query("UPDATE ProcurementRequest p SET p.status = :status WHERE p.requestId = :requestId")
    void updateStatusOnly(@Param("requestId") Long requestId, @Param("status") RequestStatus status);

    // --- NEW METHOD ADDED FOR PAYMENT SYNCHRONIZATION ---
    @Modifying
    @Transactional
    @Query("UPDATE ProcurementRequest p SET p.paymentStatus = :paymentStatus WHERE p.requestId = :requestId")
    void updatePaymentStatusOnly(@Param("requestId") Long requestId, @Param("paymentStatus") String paymentStatus);
}