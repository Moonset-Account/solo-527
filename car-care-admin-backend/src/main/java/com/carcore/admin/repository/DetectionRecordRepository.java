package com.carcore.admin.repository;

import com.carcore.admin.entity.DetectionRecord;
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
public interface DetectionRecordRepository extends JpaRepository<DetectionRecord, Long> {

    Optional<DetectionRecord> findByRecordNo(String recordNo);

    List<DetectionRecord> findByMemberId(Long memberId);

    @Query("SELECT d FROM DetectionRecord d WHERE " +
           "(:recordNo IS NULL OR :recordNo = '' OR d.recordNo LIKE %:recordNo%) " +
           "AND (:memberId IS NULL OR d.memberId = :memberId) " +
           "AND (:status IS NULL OR d.status = :status) " +
           "AND (:startDate IS NULL OR d.checkDate >= :startDate) " +
           "AND (:endDate IS NULL OR d.checkDate <= :endDate)")
    Page<DetectionRecord> findByConditions(@Param("recordNo") String recordNo,
                                           @Param("memberId") Long memberId,
                                           @Param("status") Integer status,
                                           @Param("startDate") LocalDate startDate,
                                           @Param("endDate") LocalDate endDate,
                                           Pageable pageable);
}
