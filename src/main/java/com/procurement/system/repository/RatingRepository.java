package com.procurement.system.repository;

import com.procurement.system.entity.Rating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RatingRepository extends JpaRepository<Rating, Long> {

    List<Rating> findByProduct_ProductId(Long productId);

    List<Rating> findByUser_UserId(Long userId);

    boolean existsByRequest_RequestId(Long requestId);

    @Query("SELECT AVG(r.score) FROM Rating r WHERE r.product.productId = :productId")
    Double getAverageScoreForProduct(Long productId);
}