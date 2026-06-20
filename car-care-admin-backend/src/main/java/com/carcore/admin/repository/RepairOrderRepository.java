package com.carcore.admin.repository;

import com.carcore.admin.entity.RepairOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface RepairOrderRepository extends JpaRepository<RepairOrder, Long> {

    Optional<RepairOrder> findByOrderNo(String orderNo);

    List<RepairOrder> findByMemberId(Long memberId);

    List<RepairOrder> findByTechnicianId(Long technicianId);

    List<RepairOrder> findByWorkstationId(Long workstationId);

    List<RepairOrder> findByStatus(Integer status);

    @Query("SELECT r FROM RepairOrder r WHERE " +
           "(:orderNo IS NULL OR :orderNo = '' OR r.orderNo LIKE %:orderNo%) " +
           "AND (:memberId IS NULL OR r.memberId = :memberId) " +
           "AND (:technicianId IS NULL OR r.technicianId = :technicianId) " +
           "AND (:workstationId IS NULL OR r.workstationId = :workstationId) " +
           "AND (:packageOrderId IS NULL OR r.packageOrderId = :packageOrderId) " +
           "AND (:detectionRecordId IS NULL OR r.detectionRecordId = :detectionRecordId) " +
           "AND (:orderType IS NULL OR :orderType = '' OR r.orderType = :orderType) " +
           "AND (:status IS NULL OR r.status = :status) " +
           "AND (:qualityStatus IS NULL OR :qualityStatus = '' OR r.qualityStatus = :qualityStatus) " +
           "AND (:startTime IS NULL OR r.createTime >= :startTime) " +
           "AND (:endTime IS NULL OR r.createTime <= :endTime)")
    Page<RepairOrder> findByConditions(@Param("orderNo") String orderNo,
                                       @Param("memberId") Long memberId,
                                       @Param("technicianId") Long technicianId,
                                       @Param("workstationId") Long workstationId,
                                       @Param("packageOrderId") Long packageOrderId,
                                       @Param("detectionRecordId") Long detectionRecordId,
                                       @Param("orderType") String orderType,
                                       @Param("status") Integer status,
                                       @Param("qualityStatus") String qualityStatus,
                                       @Param("startTime") LocalDateTime startTime,
                                       @Param("endTime") LocalDateTime endTime,
                                       Pageable pageable);

    @Query("SELECT COUNT(r) FROM RepairOrder r WHERE r.status = 6 AND r.closeTime BETWEEN :startTime AND :endTime")
    Long countClosedOrdersByTimeRange(@Param("startTime") LocalDateTime startTime,
                                      @Param("endTime") LocalDateTime endTime);

    @Query("SELECT r FROM RepairOrder r WHERE r.status = 6 AND r.closeTime BETWEEN :startTime AND :endTime")
    List<RepairOrder> findClosedOrdersByTimeRange(@Param("startTime") LocalDateTime startTime,
                                                  @Param("endTime") LocalDateTime endTime);

    @Query("SELECT COUNT(r) FROM RepairOrder r WHERE r.status = 6 " +
           "AND (r.delayReason IS NOT NULL OR r.actualEndTime > r.planEndTime) " +
           "AND r.closeTime BETWEEN :startTime AND :endTime")
    Long countDelayedOrdersByTimeRange(@Param("startTime") LocalDateTime startTime,
                                       @Param("endTime") LocalDateTime endTime);
}
