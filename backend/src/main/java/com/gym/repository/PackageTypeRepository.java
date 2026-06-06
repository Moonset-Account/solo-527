package com.gym.repository;

import com.gym.entity.PackageType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PackageTypeRepository extends JpaRepository<PackageType, Long> {
    List<PackageType> findByType(String type);
    List<PackageType> findByStatus(String status);
    List<PackageType> findByNameContaining(String name);
}
