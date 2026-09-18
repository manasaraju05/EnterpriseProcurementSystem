package com.procurement.system.controller;

import com.procurement.system.dto.PaymentVerificationRequestDto;
import com.procurement.system.entity.ProcurementRequest;
import com.procurement.system.entity.RequestStatus;
import com.procurement.system.entity.Supplier;
import com.procurement.system.repository.ProcurementRequestRepository;
import com.procurement.system.repository.SupplierRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "*", allowCredentials = "false")
public class PaymentController {

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private ProcurementRequestRepository procurementRequestRepository;

    @PostMapping("/process")
    public ResponseEntity<Map<String, Object>> processPayment(@RequestBody PaymentVerificationRequestDto request) {
        Map<String, Object> response = new HashMap<>();

        // 1. Basic validation for Supplier ID
        if (request.getSupplierId() == null) {
            response.put("success", false);
            response.put("message", "Supplier ID is required.");
            return ResponseEntity.badRequest().body(response);
        }

        // 2. Fetch the supplier from the database table (optional check, but good for tracking)
        Optional<Supplier> supplierOptional = supplierRepository.findById(request.getSupplierId());
        if (supplierOptional.isEmpty()) {
            response.put("success", false);
            response.put("message", "Supplier not found.");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }

        Supplier supplier = supplierOptional.get();

        // 3. Determine payment mode (MPIN vs QR Code)
        boolean isQrPayment = "UPI_QR_CODE".equalsIgnoreCase(request.getPaymentMethod()) || 
                              "QR_VERIFIED".equalsIgnoreCase(request.getMpin());

        if (isQrPayment) {
            // QR Code Payment Flow: Bypass MPIN verification and mark payment status as PAID
            if (request.getRequestId() != null) {
                procurementRequestRepository.updatePaymentStatusOnly(request.getRequestId(), "PAID");
            }
            response.put("success", true);
            response.put("message", "QR Payment verified and database updated successfully!");
            response.put("requestId", request.getRequestId());
            return ResponseEntity.ok(response);
        }

        // 4. MPIN Direct Payment Flow
        if (request.getMpin() == null || request.getMpin().trim().isEmpty()) {
            response.put("success", false);
            response.put("message", "Security MPIN is required.");
            return ResponseEntity.badRequest().body(response);
        }

        if (supplier.getMpin() == null) {
            response.put("success", false);
            response.put("message", "MPIN is not configured for this supplier.");
            return ResponseEntity.badRequest().body(response);
        }

        // 5. Strictly verify if the entered MPIN matches the database record
        if (supplier.getMpin().equals(request.getMpin().trim())) {
            // MPIN is correct: Update procurement payment status to PAID
            if (request.getRequestId() != null) {
                procurementRequestRepository.updatePaymentStatusOnly(request.getRequestId(), "PAID");
            }
            response.put("success", true);
            response.put("message", "Payment processed successfully! Database updated.");
            response.put("requestId", request.getRequestId());
            return ResponseEntity.ok(response);
        } else {
            // MPIN is incorrect: Reject payment with 401 Unauthorized
            response.put("success", false);
            response.put("message", "The MPIN is incorrect. Please try again.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
    }

    @PostMapping("/verify-mpin")
    public ResponseEntity<Map<String, Object>> verifyMpin(@RequestBody PaymentVerificationRequestDto request) {
        // Keeping this endpoint intact as a standalone verifier if needed elsewhere
        return processPayment(request);
    }
}