package com.procurement.system.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RatingCreateDto {
    private Long requestId;
    private Long userId;
    private Integer score;    // Must be between 1 and 5
    private String feedback;  // Optional comment
}