package com.procurement.system.service;

import com.procurement.system.dto.RatingCreateDto;
import com.procurement.system.entity.ProcurementRequest;
import com.procurement.system.entity.Rating;
import com.procurement.system.entity.RequestStatus;
import com.procurement.system.repository.ProcurementRequestRepository;
import com.procurement.system.repository.RatingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RatingService {

    private final RatingRepository ratingRepository;
    private final ProcurementRequestRepository requestRepository;

    @Transactional
    public Rating submitRating(RatingCreateDto dto) {
        if (dto.getScore() == null || dto.getScore() < 1 || dto.getScore() > 5) {
            throw new IllegalArgumentException("Rating score must be between 1 and 5.");
        }

        ProcurementRequest request = requestRepository.findById(dto.getRequestId())
                .orElseThrow(() -> new IllegalArgumentException("Procurement Request not found with ID: " + dto.getRequestId()));

        if (request.getStatus() != RequestStatus.APPROVED 
                && request.getStatus() != RequestStatus.PAID 
                && request.getStatus() != RequestStatus.DELIVERED) {
            throw new IllegalStateException("You can only rate completed, paid, or delivered purchases.");
        }

        if (ratingRepository.existsByRequest_RequestId(dto.getRequestId())) {
            throw new IllegalStateException("Feedback has already been submitted for this purchase request.");
        }

        Rating rating = Rating.builder()
                .request(request)
                .user(request.getUser())
                .product(request.getProduct())
                .score(dto.getScore())
                .feedback(dto.getFeedback())
                .build();

        return ratingRepository.save(rating);
    }

    public List<Rating> getRatingsByProduct(Long productId) {
        return ratingRepository.findByProduct_ProductId(productId);
    }

    public List<Rating> getRatingsByUser(Long userId) {
        return ratingRepository.findByUser_UserId(userId);
    }

    public Double getAverageProductRating(Long productId) {
        Double avg = ratingRepository.getAverageScoreForProduct(productId);
        return (avg != null) ? Math.round(avg * 10.0) / 10.0 : 0.0;
    }
}