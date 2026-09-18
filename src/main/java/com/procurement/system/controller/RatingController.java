package com.procurement.system.controller;

import com.procurement.system.dto.RatingCreateDto;
import com.procurement.system.entity.Rating;
import com.procurement.system.service.RatingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ratings")
@RequiredArgsConstructor
public class RatingController {

    private final RatingService ratingService;

    @PostMapping
    public ResponseEntity<Rating> submitRating(@RequestBody RatingCreateDto dto) {
        Rating created = ratingService.submitRating(dto);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<List<Rating>> getRatingsByProduct(@PathVariable Long productId) {
        return ResponseEntity.ok(ratingService.getRatingsByProduct(productId));
    }

    @GetMapping("/product/{productId}/average")
    public ResponseEntity<Double> getAverageProductRating(@PathVariable Long productId) {
        return ResponseEntity.ok(ratingService.getAverageProductRating(productId));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Rating>> getRatingsByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(ratingService.getRatingsByUser(userId));
    }
}