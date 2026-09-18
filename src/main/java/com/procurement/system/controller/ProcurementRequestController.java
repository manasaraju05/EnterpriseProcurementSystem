package com.procurement.system.controller;

import com.procurement.system.dto.AdminApprovalDto;
import com.procurement.system.dto.PaymentVerificationRequestDto;
import com.procurement.system.dto.RequestCreateDto;
import com.procurement.system.entity.Product;
import com.procurement.system.entity.ProcurementRequest;
import com.procurement.system.entity.RequestStatus;
import com.procurement.system.repository.ProcurementRequestRepository;
import com.procurement.system.repository.ProductRepository;
import com.procurement.system.service.ProcurementRequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/procurement-requests")
public class ProcurementRequestController {

    @Autowired
    private ProcurementRequestService procurementRequestService;

    @Autowired
    private ProductRepository productRepository;

    // INJECTED REPOSITORY TO HANDLE PAYMENT STATUS UPDATES
    @Autowired
    private ProcurementRequestRepository procurementRequestRepository;

    // 1. GET ALL REQUESTS
    @GetMapping
    public ResponseEntity<List<ProcurementRequest>> getAllProcurementRequests() {
        List<ProcurementRequest> requests = procurementRequestService.getAllRequests();
        return ResponseEntity.ok(requests);
    }

    // 2. CREATE REQUEST WITH CATEGORY-BASED AUTOMAPPING
    @PostMapping
    public ResponseEntity<?> createProcurementRequest(@RequestBody RequestCreateDto requestDto) {
        try {
            // Automap productId based on categoryId if productId is not explicitly provided
            if (requestDto.getProductId() == null && requestDto.getCategoryId() != null) {
                List<Product> allProducts = productRepository.findAll();
                Product matchedProduct = null;

                for (Product p : allProducts) {
                    if (p.getCategory() != null && p.getCategory().getCategoryId() != null) {
                        // Safely compare the category ID directly instead of using toString()
                        if (p.getCategory().getCategoryId().equals(requestDto.getCategoryId())) {
                            matchedProduct = p;
                            break;
                        }
                    }
                }

                // Fallback: If exact match isn't found, pick the first available product
                if (matchedProduct == null && !allProducts.isEmpty()) {
                    matchedProduct = allProducts.get(0);
                }

                if (matchedProduct != null) {
                    requestDto.setProductId(matchedProduct.getProductId());
                } else {
                    return ResponseEntity.badRequest().body(Map.of("message", "No products or suppliers found for the selected category."));
                }
            }

            ProcurementRequest createdRequest = procurementRequestService.createRequest(requestDto);
            return ResponseEntity.ok(createdRequest);

        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // 3. ADMIN APPROVAL / REJECTION ENDPOINT
    @PostMapping("/{id}/approval")
    public ResponseEntity<?> updateApprovalStatus(
            @PathVariable Long id,
            @RequestBody AdminApprovalDto approvalDto) {
        try {
            ProcurementRequest updatedRequest = procurementRequestService.processAdminDecision(id, approvalDto);
            return ResponseEntity.ok(updatedRequest);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // 4. PAYMENT ENDPOINT (Path Variable style)
    @PostMapping("/{id}/pay")
    public ResponseEntity<?> processPaymentById(
            @PathVariable Long id, 
            @RequestBody(required = false) PaymentVerificationRequestDto paymentDto) {
        try {
            // STRICTLY UPDATE THE PAYMENT STATUS ONLY
            procurementRequestRepository.updatePaymentStatusOnly(id, "PAID");
            
            // FETCH THE UPDATED REQUEST TO RETURN TO THE FRONTEND
            ProcurementRequest updatedRequest = procurementRequestService.getRequestById(id);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Payment processed successfully");
            response.put("requestId", id);
            response.put("status", "PAID");
            response.put("request", updatedRequest);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
}