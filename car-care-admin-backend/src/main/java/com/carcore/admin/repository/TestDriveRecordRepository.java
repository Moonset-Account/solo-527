package com.carcore.admin.repository;

import com.carcore.admin.entity.TestDriveRecord;
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
public interface TestDriveRecordRepository extends JpaRepository<TestDriveRecord, Long> {

    Optional<TestDriveRecord> findByDriveNo(String driveNo);

    List<TestDriveRecord> findByRepairOrderId(Long repairOrderId);

    List<TestDriveRecord> findByWorkstationId(Long workstationId);

    @Query("SELECT t FROM TestDriveRecord t WHERE " +
           "(:driveNo IS NULL OR :driveNo = '' OR t.driveNo LIKE %:driveNo%) " +
           "AND (:memberId IS NULL OR t.memberId = :memberId) " +
           "AND (:technicianId IS NULL OR t.technicianId = :technicianId) " +
           "AND (:workstationId IS NULL OR t.workstationId = :workstationId) " +
           "AND (:repairOrderId IS NULL OR t.repairOrderId = :repairOrderId) " +
           "AND (:status IS NULL OR t.status = :status) " +
           "AND (:startTime IS NULL OR t.driveStartTime >= :startTime) " +
           "AND (:endTime IS NULL OR t.driveStartTime <= :endTime)")
    Page<TestDriveRecord> findByConditions(@Param("driveNo") String driveNo,
                                           @Param("memberId") Long memberId,
                                           @Param("technicianId") Long technicianId,
                                           @Param("workstationId") Long workstationId,
                                           @Param("repairOrderId") Long repairOrderId,
                                           @Param("status") Integer status,
                                           @Param("startTime") LocalDateTime startTime,
                                           @Param("endTime") LocalDateTime endTime,
                                           Pageable pageable);
}
