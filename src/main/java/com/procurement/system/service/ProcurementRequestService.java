package com.procurement.system.service;

import com.procurement.system.dto.AdminApprovalDto;
import com.procurement.system.dto.RequestCreateDto;
import com.procurement.system.entity.ProcurementRequest;
import com.procurement.system.entity.Product;
import com.procurement.system.entity.RequestStatus;
import com.procurement.system.entity.Supplier;
import com.procurement.system.entity.User;
import com.procurement.system.repository.ProcurementRequestRepository;
import com.procurement.system.repository.ProductRepository;
import com.procurement.system.repository.SupplierRepository;
import com.procurement.system.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ProcurementRequestService {

    private final ProcurementRequestRepository requestRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final SupplierRepository supplierRepository;
    private final EmailService emailService;

    @Value("${app.admin.email:admin-email@gmail.com}")
    private String adminEmail;

    /**
     * Finds a supplier associated with a given category ID strictly without blind fallbacks.
     */
    public Supplier findSupplierByCategory(Long categoryId) {
        if (categoryId == null) {
            return null;
        }
        
        // Strict lookup by category without falling back to the first supplier in the database
        return supplierRepository.findByCategory_CategoryId(categoryId).orElse(null);
    }

    @Transactional
    public ProcurementRequest createRequest(RequestCreateDto dto) {
        if (dto == null) {
            throw new IllegalArgumentException("Request payload cannot be null.");
        }
        if (dto.getUserId() == null) {
            throw new IllegalArgumentException("User ID is required.");
        }

        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + dto.getUserId()));

        Product product = null;
        if (dto.getProductId() != null) {
            product = productRepository.findById(dto.getProductId()).orElse(null);
        }

        // AUTO-MAP SUPPLIER & PRODUCT BASED ON CATEGORY IF PRODUCT ID IS MISSING
        Supplier supplier = null;
        if (dto.getCategoryId() != null) {
            supplier = findSupplierByCategory(dto.getCategoryId());
        }

        if (product == null && dto.getCategoryId() != null && supplier != null && supplier.getProduct() != null) {
            product = supplier.getProduct();
            dto.setProductId(product.getProductId());
        }

        if (product == null) {
            throw new IllegalArgumentException("Product or valid category mapping is required.");
        }

        // If supplier wasn't resolved via category ID dto, resolve it via the product's category or product mapping
        if (supplier == null && product.getCategory() != null) {
            supplier = findSupplierByCategory(product.getCategory().getCategoryId());
        }
        if (supplier == null) {
            List<Supplier> productSuppliers = supplierRepository.findByProduct_ProductId(product.getProductId());
            if (productSuppliers != null && !productSuppliers.isEmpty()) {
                supplier = productSuppliers.get(0);
            }
        }

        // ULTIMATE SAFETY FALLBACK: Ensures supplier_id is never saved as NULL
        if (supplier == null) {
            List<Supplier> allSuppliers = supplierRepository.findAll();
            if (!allSuppliers.isEmpty()) {
                supplier = allSuppliers.get(0);
            }
        }

        double unitPrice = (product.getPricePerProduct() != null) ? product.getPricePerProduct() : 0.0;
        int quantity = (dto.getQuantity() != null && dto.getQuantity() > 0) ? dto.getQuantity() : 1;
        double totalAmount = unitPrice * quantity;

        ProcurementRequest request = ProcurementRequest.builder()
                .user(user)
                .product(product)
                .supplier(supplier) // Mapped supplier or safe default fallback
                .quantity(quantity)
                .totalAmount(totalAmount)
                .justification(dto.getJustification())
                .status(RequestStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();

        ProcurementRequest savedRequest = requestRepository.save(request);

        // Send submission emails
        if (user.getEmail() != null && !user.getEmail().isBlank()) {
            try {
                String userSubject = "Procurement Request Submitted - #" + savedRequest.getRequestId();
                String userBody = "<h3>Hello " + user.getName() + ",</h3>" +
                        "<p>Your procurement request for <b>" + product.getName() + "</b> (Qty: " + quantity + ") has been submitted successfully.</p>" +
                        "<p><b>Status:</b> PENDING</p>" +
                        "<p><b>Total Cost:</b> $" + totalAmount + "</p>";

                emailService.sendEmailNotification(user.getEmail(), userSubject, userBody);
            } catch (Exception e) {
                System.err.println("Failed to send submission email to user: " + e.getMessage());
            }
        }

        if (adminEmail != null && !adminEmail.isBlank()) {
            try {
                String adminSubject = "[ACTION REQUIRED] New Procurement Request #" + savedRequest.getRequestId();
                String adminBody = "<h3>New Procurement Request Submitted</h3>" +
                        "<p><b>Submitted By:</b> " + user.getName() + " (" + user.getEmail() + ")</p>" +
                        "<p><b>Product:</b> " + product.getName() + "</p>" +
                        "<p><b>Quantity:</b> " + quantity + "</p>" +
                        "<p><b>Total Amount:</b> $" + totalAmount + "</p>" +
                        "<p><b>Justification:</b> " + (dto.getJustification() != null ? dto.getJustification() : "N/A") + "</p>";

                emailService.sendEmailNotification(adminEmail, adminSubject, adminBody);
            } catch (Exception e) {
                System.err.println("Failed to send submission email to admin: " + e.getMessage());
            }
        }

        return savedRequest;
    }

    @Transactional
    public ProcurementRequest processAdminDecision(Long id, AdminApprovalDto dto) {
        if (dto == null || dto.getStatus() == null) {
            throw new IllegalArgumentException("Status is required.");
        }

        ProcurementRequest request = getRequestById(id);
        Product product = request.getProduct();

        if (dto.getStatus() == RequestStatus.APPROVED && product != null) {
            int currentStock = (product.getQuantity() != null) ? product.getQuantity() : 0;
            int requestedQuantity = (request.getQuantity() != null) ? request.getQuantity() : 1;

            if (currentStock < requestedQuantity) {
                throw new IllegalStateException("Insufficient stock available for " + product.getName() + 
                        ". Available stock: " + currentStock + ", Requested: " + requestedQuantity);
            }

            product.setQuantity(currentStock - requestedQuantity);
            productRepository.save(product);
        }

        request.setStatus(dto.getStatus());
        request.setAdminDescription(dto.getAdminDescription());

        ProcurementRequest updatedRequest = requestRepository.save(request);
        User user = updatedRequest.getUser();

        if (user != null && user.getEmail() != null && !user.getEmail().isBlank()) {
            try {
                String statusColor = (dto.getStatus() == RequestStatus.APPROVED) ? "green" : "red";
                String userSubject = "Procurement Request " + dto.getStatus() + " - #" + updatedRequest.getRequestId();
                String userBody = "<h3>Hello " + user.getName() + ",</h3>" +
                        "<p>Your procurement request ID #" + updatedRequest.getRequestId() +
                        " has been <b style='color:" + statusColor + ";'>" + dto.getStatus() + "</b> by the Admin.</p>" +
                        "<p><b>Admin Remarks:</b> " + (dto.getAdminDescription() != null ? dto.getAdminDescription() : "N/A") + "</p>";

                emailService.sendEmailNotification(user.getEmail(), userSubject, userBody);
            } catch (Exception e) {
                System.err.println("Failed to send approval/rejection email to user: " + e.getMessage());
            }
        }

        // Notify matching suppliers upon approval
        if (dto.getStatus() == RequestStatus.APPROVED && product != null) {
            Set<Supplier> targetSuppliers = new HashSet<>();

            if (request.getSupplier() != null) {
                targetSuppliers.add(request.getSupplier());
            }

            if (product.getCategory() != null && product.getCategory().getCategoryId() != null) {
                supplierRepository.findByCategory_CategoryId(product.getCategory().getCategoryId())
                        .ifPresent(targetSuppliers::add);
            }

            List<Supplier> productSuppliers = supplierRepository.findByProduct_ProductId(product.getProductId());
            if (productSuppliers != null) {
                targetSuppliers.addAll(productSuppliers);
            }

            if (targetSuppliers.isEmpty()) {
                targetSuppliers.addAll(supplierRepository.findAll());
            }

            for (Supplier supplier : targetSuppliers) {
                if (supplier.getEmail() != null && !supplier.getEmail().isBlank()) {
                    try {
                        String supplierSubject = "[NEW PURCHASE ORDER] Approved Request #" + updatedRequest.getRequestId();
                        String supplierBody = "<h3>Hello " + supplier.getName() + ",</h3>" +
                                "<p>A new purchase order has been approved for your category/product.</p>" +
                                "<p><b>Product Name:</b> " + product.getName() + "</p>" +
                                "<p><b>Quantity Required:</b> " + updatedRequest.getQuantity() + "</p>" +
                                "<p><b>Total Approved Amount:</b> $" + updatedRequest.getTotalAmount() + "</p>" +
                                "<p><b>Delivery Contact:</b> " + (user != null ? user.getName() : "N/A") + "</p>" +
                                "<p>Please initiate order processing and dispatch.</p>";

                        emailService.sendEmailNotification(supplier.getEmail(), supplierSubject, supplierBody);
                    } catch (Exception e) {
                        System.err.println("Failed to send order email to supplier: " + e.getMessage());
                    }
                }
            }
        }

        return updatedRequest;
    }

    @Transactional
    public ProcurementRequest updateFulfillmentStatus(Long requestId, RequestStatus status) {
        ProcurementRequest request = getRequestById(requestId);
        
        if (status == RequestStatus.DELIVERED && request.getStatus() == RequestStatus.PAID) {
            request.setStatus(RequestStatus.DELIVERED); 
        } else {
            request.setStatus(status);
        }

        ProcurementRequest updatedRequest = requestRepository.save(request);
        User user = updatedRequest.getUser();

        if (user != null && user.getEmail() != null && !user.getEmail().isBlank()) {
            try {
                String subject = "Order Status Update - Request #" + updatedRequest.getRequestId();
                String body = "<h3>Hello " + user.getName() + ",</h3>" +
                        "<p>Your order status for <b>" + updatedRequest.getProduct().getName() + "</b> has been updated to: <b>" + status + "</b>.</p>";

                        emailService.sendEmailNotification(user.getEmail(), subject, body);
            } catch (Exception e) {
                System.err.println("Failed to send status update email to user: " + e.getMessage());
            }
        }

        return updatedRequest;
    }

    @Transactional
    public ProcurementRequest updateDeliveryStatusOnly(Long requestId, String deliveryStatusStr) {
        ProcurementRequest request = getRequestById(requestId);
        
        try {
            RequestStatus newStatus = RequestStatus.valueOf(deliveryStatusStr.toUpperCase());
            
            if (request.getStatus() == RequestStatus.PAID && newStatus == RequestStatus.DELIVERED) {
                request.setStatus(RequestStatus.DELIVERED); 
            } else {
                request.setStatus(newStatus);
            }
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid delivery status: " + deliveryStatusStr);
        }

        return requestRepository.save(request);
    }

    public List<ProcurementRequest> getOrdersForSupplier(Long supplierId) {
        supplierRepository.findById(supplierId)
                .orElseThrow(() -> new IllegalArgumentException("Supplier not found with ID: " + supplierId));

        return requestRepository.findBySupplierIdWithPayment(supplierId);
    }

    public List<ProcurementRequest> getAllRequests() {
        return requestRepository.findAll();
    }

    public ProcurementRequest getRequestById(Long id) {
        return requestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Procurement Request not found with ID: " + id));
    }

    public List<ProcurementRequest> getRequestsByUserId(Long userId) {
        if (userId == null) {
            return List.of();
        }
        return requestRepository.findByUser_UserId(userId);
    }

    public List<ProcurementRequest> getRequestsByStatus(RequestStatus status) {
        return requestRepository.findByStatus(status);
    }

    public void deleteRequest(Long id) {
        if (!requestRepository.existsById(id)) {
            throw new IllegalArgumentException("Cannot delete. Request not found with ID: " + id);
        }
        requestRepository.deleteById(id);
    }

    @Transactional
    public void deleteAllRequests() {
        requestRepository.deleteAll();
    }
}