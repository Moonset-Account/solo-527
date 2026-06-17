package com.citytour.inventory.repository;

import com.citytour.inventory.entity.RefundRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RefundRecordRepository extends JpaRepository<RefundRecord, Long> {

    Optional<RefundRecord> findByRefundNo(String refundNo);

    List<RefundRecord> findByOrderNo(String orderNo);

    @Query("SELECT r FROM RefundRecord r WHERE " +
           "(:refundNo IS NULL OR r.refundNo LIKE %:refundNo%) AND " +
           "(:orderNo IS NULL OR r.orderNo LIKE %:orderNo%) AND " +
           "(:routeId IS NULL OR r.routeId = :routeId) AND " +
           "(:refundStatus IS NULL OR r.refundStatus = :refundStatus) AND " +
           "(:refundType IS NULL OR r.refundType = :refundType)")
    Page<RefundRecord> findByConditions(@Param("refundNo") String refundNo,
                                       @Param("orderNo") String orderNo,
                                       @Param("routeId") Long routeId,
                                       @Param("refundStatus") String refundStatus,
                                       @Param("refundType") String refundType,
                                       Pageable pageable);
}
