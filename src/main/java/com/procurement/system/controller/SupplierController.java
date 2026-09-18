package com.procurement.system.controller;

import com.procurement.system.dto.SupplierCreateDto;
import com.procurement.system.entity.ProcurementRequest;
import com.procurement.system.entity.Supplier;
import com.procurement.system.enums.SupplierStatus;
import com.procurement.system.repository.SupplierRepository;
import com.procurement.system.service.ProductService;
import com.procurement.system.service.SupplierService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/suppliers")
@RequiredArgsConstructor
public class SupplierController {

    private final SupplierService supplierService;
    private final SupplierRepository supplierRepository;
    private final ProductService productService;

    @PostMapping
    public ResponseEntity<Supplier> createSupplier(@RequestBody SupplierCreateDto dto) {
        Supplier createdSupplier = supplierService.createSupplier(dto);
        return new ResponseEntity<>(createdSupplier, HttpStatus.CREATED);
    }

    @GetMapping("/{supplierId}/orders")
    public ResponseEntity<List<ProcurementRequest>> getSupplierOrders(@PathVariable Long supplierId) {
        List<ProcurementRequest> orders = supplierService.getOrdersForSupplier(supplierId);
        return ResponseEntity.ok(orders);
    }

    // 2. Dashboard Statistics Endpoint (Requested, Pending, Completed counts)
    @GetMapping("/{supplierId}/dashboard-stats")
    public ResponseEntity<Map<String, Long>> getDashboardStats(@PathVariable Long supplierId) {
        Map<String, Long> stats = supplierService.getSupplierDashboardStats(supplierId);
        return ResponseEntity.ok(stats);
    }

    // 3. Update Order / Fulfillment Status (Guarded against resetting payment status to unpaid)
    @PutMapping("/orders/{requestId}/status")
    public ResponseEntity<?> updateOrderStatus(
            @PathVariable Long requestId,
            @RequestParam SupplierStatus status) {
        try {
            ProcurementRequest updatedOrder = supplierService.updateFulfillmentStatus(requestId, status);
            return ResponseEntity.ok(updatedOrder);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // 4. Update Operational Status (Active, Inactive, Onboarding, Out of Stock)
    @PatchMapping("/{supplierId}/status")
    public ResponseEntity<Supplier> updateOperationalStatus(
            @PathVariable Long supplierId, 
            @RequestParam String status) {
        Supplier updated = supplierService.updateSupplierOperationalStatus(supplierId, status);
        return ResponseEntity.ok(updated);
    }

    // 5. Get Supplier by Category ID (For auto-mapping during request raising)
    @GetMapping("/by-category/{categoryId}")
    public ResponseEntity<Supplier> getSupplierByCategory(@PathVariable Long categoryId) {
        Supplier supplier = supplierRepository.findByCategory_CategoryId(categoryId).orElse(null);
        if (supplier == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        return ResponseEntity.ok(supplier);
    }
}