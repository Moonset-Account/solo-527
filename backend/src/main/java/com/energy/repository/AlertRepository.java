package com.energy.repository;

import com.energy.entity.Alert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AlertRepository extends JpaRepository<Alert, Long>, JpaSpecificationExecutor<Alert> {
    Alert findByAlertNo(String alertNo);
    List<Alert> findByStatus(String status);
    List<Alert> findByAssignee(String assignee);
    List<Alert> findByMeterId(Long meterId);

    @Query("SELECT a FROM Alert a WHERE a.alertTime BETWEEN :start AND :end " +
           "AND (:status IS NULL OR a.status = :status) " +
           "AND (:assignee IS NULL OR a.assignee = :assignee) " +
           "ORDER BY a.alertTime DESC")
    List<Alert> findByFilters(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            @Param("status") String status,
            @Param("assignee") String assignee);

    @Query("SELECT COUNT(a) FROM Alert a WHERE a.status = :status")
    Long countByStatus(@Param("status") String status);

    @Query("SELECT a.alertLevel, COUNT(a) FROM Alert a " +
           "WHERE a.alertTime BETWEEN :start AND :end GROUP BY a.alertLevel")
    List<Object[]> countByLevelAndTimeBetween(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);
}
