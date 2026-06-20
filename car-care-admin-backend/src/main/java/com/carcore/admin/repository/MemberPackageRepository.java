package com.carcore.admin.repository;

import com.carcore.admin.entity.MemberPackage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MemberPackageRepository extends JpaRepository<MemberPackage, Long> {

    Optional<MemberPackage> findByPackageCode(String packageCode);

    List<MemberPackage> findByStatus(Integer status);

    List<MemberPackage> findByPackageType(String packageType);

    @Query("SELECT p FROM MemberPackage p WHERE " +
           "(:keyword IS NULL OR :keyword = '' OR " +
           "p.packageName LIKE %:keyword% OR p.packageCode LIKE %:keyword%) " +
           "AND (:packageType IS NULL OR :packageType = '' OR p.packageType = :packageType) " +
           "AND (:status IS NULL OR p.status = :status)")
    Page<MemberPackage> findByConditions(@Param("keyword") String keyword,
                                         @Param("packageType") String packageType,
                                         @Param("status") Integer status,
                                         Pageable pageable);
}
