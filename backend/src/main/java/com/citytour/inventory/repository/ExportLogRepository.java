package com.citytour.inventory.repository;

import com.citytour.inventory.entity.ExportLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface ExportLogRepository extends JpaRepository<ExportLog, Long> {

    Optional<ExportLog> findByExportNo(String exportNo);

    @Query("SELECT e FROM ExportLog e WHERE " +
           "(:exportNo IS NULL OR e.exportNo LIKE %:exportNo%) AND " +
           "(:exportType IS NULL OR e.exportType = :exportType) AND " +
           "(:exportBy IS NULL OR e.exportBy = :exportBy) AND " +
           "(:startTime IS NULL OR e.exportTime >= :startTime) AND " +
           "(:endTime IS NULL OR e.exportTime <= :endTime) AND " +
           "(:status IS NULL OR e.status = :status)")
    Page<ExportLog> findByConditions(@Param("exportNo") String exportNo,
                                     @Param("exportType") String exportType,
                                     @Param("exportBy") String exportBy,
                                     @Param("startTime") LocalDateTime startTime,
                                     @Param("endTime") LocalDateTime endTime,
                                     @Param("status") String status,
                                     Pageable pageable);
}
