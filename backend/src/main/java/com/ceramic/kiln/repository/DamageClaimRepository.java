package com.ceramic.kiln.repository;

import com.ceramic.kiln.entity.DamageClaim;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DamageClaimRepository extends JpaRepository<DamageClaim, Long>, JpaSpecificationExecutor<DamageClaim> {
    Optional<DamageClaim> findByClaimCode(String claimCode);
    List<DamageClaim> findByStudentId(Long studentId);
    List<DamageClaim> findByStatus(String status);
}
