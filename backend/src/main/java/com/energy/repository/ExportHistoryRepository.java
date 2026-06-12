package com.energy.repository;

import com.energy.entity.ExportHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ExportHistoryRepository extends JpaRepository<ExportHistory, Long>, JpaSpecificationExecutor<ExportHistory> {
    ExportHistory findByExportNo(String exportNo);

    @Query("SELECT e FROM ExportHistory e WHERE " +
           "(:operator IS NULL OR e.operator LIKE %:operator%) " +
           "AND e.exportTime BETWEEN :start AND :end " +
           "ORDER BY e.exportTime DESC")
    List<ExportHistory> searchByFilters(
            @Param("operator") String operator,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);
}
