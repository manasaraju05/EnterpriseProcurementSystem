package com.procurement.system.dto;

import lombok.Data;

@Data
public class RegisterRequest {
    private String name;
    private String email;
    private String password;
    private String phoneNo;
    private String designation;
    private String department;
}