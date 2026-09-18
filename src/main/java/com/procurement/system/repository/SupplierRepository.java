package com.procurement.system.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.procurement.system.entity.Supplier;

import java.util.List;
import java.util.Optional;

@Repository
public interface SupplierRepository extends JpaRepository<Supplier, Long> {

    // Find supplier by email address
    Optional<Supplier> findByEmail(String email);

    // Find supplier by exact name
    Optional<Supplier> findByName(String name);

    // Find suppliers assigned to a specific product
    List<Supplier> findByProduct_ProductId(Long productId);

    // Find supplier by MPIN
    // Security Note: It is highly recommended to hash MPINs in the future instead of querying plaintext.
    Optional<Supplier> findByMpin(String mpin);

    // Find supplier directly through the newly mapped Category relationship.
    // Spring Data JPA automatically derives the correct database query from this method name.
    Optional<Supplier> findByCategory_CategoryId(Long categoryId);
}