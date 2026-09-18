package com.procurement.system.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"}) // <-- ADD THIS
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "name")
    private String name;
    
    @Column(name = "email", nullable = false, unique = true)
    private String email;

    @Column(name = "password")
    @JsonIgnore
    private String password;

    @Column(name = "phone_no")
    private String phoneNo;

    @Column(name = "designation")
    private String designation;

//    @ManyToOne(fetch = FetchType.LAZY)
//    @JoinColumn(name = "dept_id")
//    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"}) // <-- ADD THIS
//    private Department department;
    
    @ManyToOne(cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinColumn(name = "department_id")
    private Department department;
}