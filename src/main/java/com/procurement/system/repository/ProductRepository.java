package com.procurement.system.repository;

import com.procurement.system.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    // Spring Data JPA derives the query: product -> category -> categoryName
    List<Product> findByCategoryCategoryName(String categoryName);

    // Optional: Find products directly by category ID
    List<Product> findByCategoryCategoryId(Long categoryId);
}