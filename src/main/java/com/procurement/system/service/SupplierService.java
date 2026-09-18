package com.procurement.system.service;

import com.procurement.system.dto.SupplierCreateDto;
import com.procurement.system.entity.ProcurementRequest;
import com.procurement.system.entity.RequestStatus;
import com.procurement.system.entity.Supplier;
import com.procurement.system.enums.SupplierStatus;
import com.procurement.system.repository.ProcurementRequestRepository;
import com.procurement.system.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SupplierService {

    private final SupplierRepository supplierRepository;
    private final ProcurementRequestRepository procurementRequestRepository;

    @Transactional
    public Supplier createSupplier(SupplierCreateDto dto) {
        if (dto == null) {
            throw new IllegalArgumentException("Supplier details cannot be null.");
        }

        Supplier supplier = new Supplier();
        supplier.setName(dto.getName());
        supplier.setEmail(dto.getEmail());
        supplier.setPhone(dto.getPhone());
        supplier.setAddress(dto.getAddress());
        
        // Map financial and operational properties from DTO
        supplier.setBankName(dto.getBankName());
        supplier.setAccountNumber(dto.getAccountNumber());
        supplier.setIfscOrSwiftCode(dto.getIfscOrSwiftCode());
        supplier.setPaymentTerms(dto.getPaymentTerms());
        supplier.setGstNumber(dto.getGstNumber());
        
        if (dto.getOutstandingBalance() != null) {
            supplier.setOutstandingBalance(dto.getOutstandingBalance());
        }

        supplier.setRating(dto.getRating() != null ? dto.getRating() : 0.0);
        
        if (dto.getStatus() != null) {
            supplier.setStatus(dto.getStatus());
        } else {
            supplier.setStatus(SupplierStatus.ACTIVE);
        }

        return supplierRepository.save(supplier);
    }

    /**
     * Validates if the entered 6-digit MPIN matches the supplier's database record.
     */
    public boolean validateSupplierMpin(Long supplierId, String enteredMpin) {
        Supplier supplier = supplierRepository.findById(supplierId)
                .orElseThrow(() -> new IllegalArgumentException("Supplier not found with ID: " + supplierId));

        // Check if the MPIN matches the database record strictly
        return supplier.getMpin() != null && supplier.getMpin().equals(enteredMpin);
    }

    public List<ProcurementRequest> getOrdersForSupplier(Long supplierId) {
        // Ensure supplier exists first
        supplierRepository.findById(supplierId)
                .orElseThrow(() -> new IllegalArgumentException("Supplier not found with ID: " + supplierId));

        // Use the newly added repository query to eagerly fetch requests and their payment details
        return procurementRequestRepository.findBySupplierIdWithPayment(supplierId);
    }

    public Map<String, Long> getSupplierDashboardStats(Long supplierId) {
        List<ProcurementRequest> orders = getOrdersForSupplier(supplierId);

        long totalOrders = orders.size();
        long pendingOrders = orders.stream()
                .filter(r -> {
                    String s = String.valueOf(r.getStatus());
                    return s.equals("PENDING") || s.equals("APPROVED");
                })
                .count();
        long completedOrders = orders.stream()
                .filter(r -> {
                    String s = String.valueOf(r.getStatus());
                    return s.equals("DELIVERED") || s.equals("PAID") || s.equals("COMPLETED");
                })
                .count();

        Map<String, Long> stats = new HashMap<>();
        stats.put("totalAssignedOrders", totalOrders);
        stats.put("pendingFulfillment", pendingOrders);
        stats.put("completedFulfilled", completedOrders);

        return stats;
    }

    @Transactional
    public ProcurementRequest updateFulfillmentStatus(Long requestId, SupplierStatus status) {
        ProcurementRequest request = procurementRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found with ID: " + requestId));

        try {
            // 1. Convert incoming SupplierStatus to RequestStatus
            RequestStatus reqStatus = RequestStatus.valueOf(status.name());
            
            // 2. GUARD CHECK: Prevent overwriting an already PAID order status with UNPAID
            if (request.getStatus() == RequestStatus.PAID && reqStatus == RequestStatus.UNPAID) {
                return request; // Keep existing PAID state intact
            }

            // 3. FORCE DATABASE WRITE: Bypass entity caching and execute direct SQL update
            procurementRequestRepository.updateStatusOnly(requestId, reqStatus);
            
            // 4. Update the local object so the correct data is returned to React
            request.setStatus(reqStatus);

        } catch (IllegalArgumentException e) {
            // Log the exact error to your IDE console so we can see it
            System.err.println("CRITICAL ERROR: Failed to map '" + status.name() + "'. Did you restart the server?");
            throw new IllegalArgumentException("Cannot map SupplierStatus '" + status.name() + "' to RequestStatus.");
        } catch (Exception e) {
            System.err.println("DATABASE ERROR: " + e.getMessage());
            throw new RuntimeException("Database failed to save the status. Check if column type allows it.");
        }

        return request;
    }

    @Transactional
    public Supplier updateSupplierOperationalStatus(Long supplierId, String statusStr) {
        Supplier supplier = supplierRepository.findById(supplierId)
                .orElseThrow(() -> new IllegalArgumentException("Supplier not found with ID: " + supplierId));

        try {
            supplier.setStatus(SupplierStatus.valueOf(statusStr.toUpperCase().replace(" ", "_")));
        } catch (IllegalArgumentException e) {
            // Prevent silent failures by throwing an exception instead of defaulting to ACTIVE
            throw new IllegalArgumentException("Invalid SupplierStatus provided: " + statusStr);
        }

        return supplierRepository.save(supplier);
    }
}