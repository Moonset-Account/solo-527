package com.approval.workflow.repository;

import com.approval.workflow.entity.Requirement;
import com.approval.workflow.enums.RequirementStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface RequirementRepository extends JpaRepository<Requirement, Long>, JpaSpecificationExecutor<Requirement> {

    Page<Requirement> findByStatus(RequirementStatus status, Pageable pageable);

    Page<Requirement> findByCreatorId(Long creatorId, Pageable pageable);

    Page<Requirement> findByAssigneeId(Long assigneeId, Pageable pageable);

    Page<Requirement> findByDeptId(Long deptId, Pageable pageable);

    List<Requirement> findByDeptIdIn(List<Long> deptIds);

    List<Requirement> findAllByDeptId(Long deptId);

    @Query("SELECT r FROM Requirement r WHERE r.status = :status AND r.deptId IN :deptIds")
    Page<Requirement> findByStatusAndDeptIdIn(@Param("status") RequirementStatus status,
                                              @Param("deptIds") List<Long> deptIds,
                                              Pageable pageable);

    @Query("SELECT r FROM Requirement r WHERE r.title LIKE %:keyword% OR r.description LIKE %:keyword%")
    Page<Requirement> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT COUNT(r) FROM Requirement r WHERE r.deptId = :deptId AND r.status = :status")
    long countByDeptIdAndStatus(@Param("deptId") Long deptId, @Param("status") RequirementStatus status);

    @Query("SELECT r FROM Requirement r WHERE r.mergedToId = :mergedToId")
    List<Requirement> findByMergedToId(@Param("mergedToId") Long mergedToId);

    @Query("SELECT r FROM Requirement r WHERE r.status = :status AND r.createdAt >= :startTime AND r.createdAt <= :endTime")
    List<Requirement> findByStatusAndCreatedAtBetween(@Param("status") RequirementStatus status,
                                                       @Param("startTime") LocalDateTime startTime,
                                                       @Param("endTime") LocalDateTime endTime);

    List<Requirement> findByIdIn(List<Long> ids);
}
