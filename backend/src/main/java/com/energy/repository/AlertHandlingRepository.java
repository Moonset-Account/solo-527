package com.energy.repository;

import com.energy.entity.AlertHandling;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AlertHandlingRepository extends JpaRepository<AlertHandling, Long> {
    List<AlertHandling> findByAlertIdOrderByHandleTimeDesc(Long alertId);

    @Query("SELECT AVG(ah.responseDuration) FROM AlertHandling ah " +
           "WHERE ah.handleTime BETWEEN :start AND :end AND ah.responseDuration IS NOT NULL")
    Double findAvgResponseDuration(
            @Param("start") java.time.LocalDateTime start,
            @Param("end") java.time.LocalDateTime end);
}
