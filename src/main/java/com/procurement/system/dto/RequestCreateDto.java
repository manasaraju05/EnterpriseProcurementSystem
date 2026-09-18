package com.procurement.system.dto;

import lombok.Data;

@Data
public class RequestCreateDto {
    private Long userId;
    private Long productId;
    private Long categoryId; // Added for category-based automapping
    private Integer quantity;
    private String justification;

    // Explicit Getters
    public Long getUserId() {
        return userId;
    }

    public Long getProductId() {
        return productId;
    }

    public Long getCategoryId() {
        return categoryId;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public String getJustification() {
        return justification;
    }

    // Explicit Setters
    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public void setCategoryId(Long categoryId) {
        this.categoryId = categoryId;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public void setJustification(String justification) {
        this.justification = justification;
    }
}