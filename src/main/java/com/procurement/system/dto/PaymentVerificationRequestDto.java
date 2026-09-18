package com.procurement.system.dto;

public class PaymentVerificationRequestDto {
    private Long requestId;
    private Long supplierId;
    private Double amount;
    private String paymentMethod;
    private String upiId;
    private String status;
    private String mpin;

    public PaymentVerificationRequestDto() {}

    // Getters and Setters
    public Long getRequestId() { return requestId; }
    public void setRequestId(Long requestId) { this.requestId = requestId; }

    public Long getSupplierId() { return supplierId; }
    public void setSupplierId(Long supplierId) { this.supplierId = supplierId; }

    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getUpiId() { return upiId; }
    public void setUpiId(String upiId) { this.upiId = upiId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getMpin() { return mpin; }
    public void setMpin(String mpin) { this.mpin = mpin; }
}