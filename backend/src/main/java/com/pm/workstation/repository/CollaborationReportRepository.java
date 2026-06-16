package com.pm.workstation.repository;

import com.pm.workstation.entity.CollaborationReport;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface CollaborationReportRepository extends JpaRepository<CollaborationReport, Long> {

    Optional<CollaborationReport> findByReportDate(LocalDate reportDate);

    List<CollaborationReport> findByReportDateBetweenOrderByReportDateDesc(LocalDate start, LocalDate end);

    Optional<CollaborationReport> findTopByOrderByReportDateDesc();
}
