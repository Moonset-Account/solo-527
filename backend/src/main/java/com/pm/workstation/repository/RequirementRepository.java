package com.pm.workstation.repository;

import com.pm.workstation.entity.Requirement;
import com.pm.workstation.enums.RequirementPriority;
import com.pm.workstation.enums.RequirementStatus;
import com.pm.workstation.enums.RequirementConclusion;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public interface RequirementRepository extends JpaRepository<Requirement, Long> {

    List<Requirement> findByStatus(RequirementStatus status);

    List<Requirement> findBySubmitterId(Long submitterId);

    List<Requirement> findByAssigneeId(Long assigneeId);

    List<Requirement> findByDepartment(String department);

    List<Requirement> findByPriority(RequirementPriority priority);

    List<Requirement> findByConclusion(RequirementConclusion conclusion);

    List<Requirement> findByDeadlineBefore(LocalDate date);

    List<Requirement> findByDeadlineBetween(LocalDate start, LocalDate end);

    @Query("SELECT r FROM Requirement r WHERE r.status IN :statuses AND r.deadline < :date")
    List<Requirement> findByStatusInAndDeadlineBefore(@Param("statuses") List<RequirementStatus> statuses, @Param("date") LocalDate date);

    long countByStatus(RequirementStatus status);

    long countByDepartmentAndStatus(String department, RequirementStatus status);

    @Query("SELECT r FROM Requirement r WHERE (:status IS NULL OR r.status = :status) AND (:keyword IS NULL OR LOWER(r.title) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Requirement> searchRequirements(@Param("status") RequirementStatus status, @Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT r FROM Requirement r WHERE r.completedAt IS NOT NULL AND r.completedAt >= :start AND r.completedAt < :end")
    List<Requirement> findCompletedBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
