package com.carcore.admin.repository;

import com.carcore.admin.entity.MemberPackageOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface MemberPackageOrderRepository extends JpaRepository<MemberPackageOrder, Long> {

    Optional<MemberPackageOrder> findByOrderNo(String orderNo);

    List<MemberPackageOrder> findByMemberId(Long memberId);

    List<MemberPackageOrder> findByMemberIdAndStatus(Long memberId, Integer status);

    @Query("SELECT o FROM MemberPackageOrder o WHERE " +
           "(:orderNo IS NULL OR :orderNo = '' OR o.orderNo LIKE %:orderNo%) " +
           "AND (:memberId IS NULL OR o.memberId = :memberId) " +
           "AND (:packageId IS NULL OR o.packageId = :packageId) " +
           "AND (:status IS NULL OR o.status = :status) " +
           "AND (:startDate IS NULL OR o.purchaseDate >= :startDate) " +
           "AND (:endDate IS NULL OR o.purchaseDate <= :endDate)")
    Page<MemberPackageOrder> findByConditions(@Param("orderNo") String orderNo,
                                              @Param("memberId") Long memberId,
                                              @Param("packageId") Long packageId,
                                              @Param("status") Integer status,
                                              @Param("startDate") LocalDate startDate,
                                              @Param("endDate") LocalDate endDate,
                                              Pageable pageable);
}
