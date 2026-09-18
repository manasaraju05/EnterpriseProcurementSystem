package com.procurement.system.dto;

import com.procurement.system.entity.RequestStatus;
import lombok.Data;

@Data
public class StatusUpdateDto {
    private RequestStatus status;
}