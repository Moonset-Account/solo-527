package com.emailgenerator.repository;

import com.emailgenerator.entity.EmailTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EmailTemplateRepository extends JpaRepository<EmailTemplate, Long>, JpaSpecificationExecutor<EmailTemplate> {

    Page<EmailTemplate> findByStatus(String status, Pageable pageable);

    Page<EmailTemplate> findByNameContaining(String name, Pageable pageable);

    List<EmailTemplate> findByOwner(String owner);

    List<EmailTemplate> findBySource(String source);

    @Query("SELECT t.legalOwner, COUNT(t), SUM(CASE WHEN t.isRisk = true THEN 1 ELSE 0 END) " +
           "FROM EmailTemplate t GROUP BY t.legalOwner")
    List<Object[]> countByLegalOwner();

    @Query("SELECT DATE(t.createTime), COUNT(t) FROM EmailTemplate t " +
           "WHERE t.createTime BETWEEN :startTime AND :endTime GROUP BY DATE(t.createTime)")
    List<Object[]> countByDateRange(LocalDateTime startTime, LocalDateTime endTime);

    Long countByStatus(String status);
}
