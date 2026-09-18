package com.procurement.system.service;

import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.procurement.system.dto.AuthResponse;
import com.procurement.system.dto.LoginRequest;
import com.procurement.system.dto.RegisterRequest;
import com.procurement.system.entity.Admin;
import com.procurement.system.entity.Department;
import com.procurement.system.entity.Supplier;
import com.procurement.system.entity.User;
import com.procurement.system.repository.AdminRepository;
import com.procurement.system.repository.DepartmentRepository;
import com.procurement.system.repository.SupplierRepository;
import com.procurement.system.repository.UserRepository;
import com.procurement.system.security.JwtUtils;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final AdminRepository adminRepository;
    private final DepartmentRepository departmentRepository;
    private final SupplierRepository supplierRepository;
    private final JwtUtils jwtUtils;

    public AuthResponse login(LoginRequest request) {
        // 1. Check User table with password comparison
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (user.getPassword() != null && user.getPassword().equals(request.getPassword())) {
                String token = jwtUtils.generateToken(user.getEmail());
                return new AuthResponse(user.getUserId(), user.getName(), user.getEmail(), "USER", token);
            }
        }

        // 2. Check Admin table with password comparison
        Optional<Admin> adminOpt = adminRepository.findByEmail(request.getEmail());
        if (adminOpt.isPresent()) {
            Admin admin = adminOpt.get();
            if (admin.getPassword() != null && admin.getPassword().equals(request.getPassword())) {
                String token = jwtUtils.generateToken(admin.getEmail());
                return new AuthResponse(admin.getAdminId(), admin.getFullName(), admin.getEmail(), "ADMIN", token);
            }
        }

        // 3. Check Supplier table with exact password comparison (FIXED)
        Optional<Supplier> supplierOpt = supplierRepository.findByEmail(request.getEmail());
        if (supplierOpt.isPresent()) {
            Supplier supplier = supplierOpt.get();
            if (supplier.getPassword() != null && supplier.getPassword().equals(request.getPassword())) {
                String token = jwtUtils.generateToken(supplier.getEmail());
                return new AuthResponse(supplier.getSupplierId(), supplier.getName(), supplier.getEmail(), "SUPPLIER", token);
            }
        }

        throw new RuntimeException("Invalid email or password");
    }

    @Transactional
    public String register(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("User already exists with this email ID.");
        }

        User newUser = new User();
        newUser.setName(request.getName());
        newUser.setEmail(request.getEmail());
        newUser.setPassword(request.getPassword());
        newUser.setPhoneNo(request.getPhoneNo());
        newUser.setDesignation(request.getDesignation());

        // Safely retrieve or create department
        Department department = departmentRepository.findFirstByDeptName(request.getDepartment())
            .orElseGet(() -> {
                Department newDept = new Department();
                newDept.setDeptName(request.getDepartment());
                return departmentRepository.save(newDept);
            });

        newUser.setDepartment(department);

        userRepository.save(newUser);
        return "User registered successfully!";
    }
}