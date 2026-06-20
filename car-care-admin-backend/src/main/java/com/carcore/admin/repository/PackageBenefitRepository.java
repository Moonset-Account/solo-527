package com.carcore.admin.repository;

import com.carcore.admin.entity.PackageBenefit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PackageBenefitRepository extends JpaRepository<PackageBenefit, Long> {

    List<PackageBenefit> findByPackageIdOrderBySortOrderAsc(Long packageId);

    void deleteByPackageId(Long packageId);
}
