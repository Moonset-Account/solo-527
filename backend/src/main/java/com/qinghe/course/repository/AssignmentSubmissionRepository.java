package com.qinghe.course.repository;

import com.qinghe.course.entity.AssignmentSubmission;
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
public interface AssignmentSubmissionRepository extends JpaRepository<AssignmentSubmission, Long> {

    @Query("SELECT asub FROM AssignmentSubmission asub WHERE " +
           "(:assignmentId IS NULL OR asub.assignmentId = :assignmentId) AND " +
           "(:status IS NULL OR asub.status = :status) AND " +
           "(:startTime IS NULL OR asub.submittedAt >= :startTime) AND " +
           "(:endTime IS NULL OR asub.submittedAt <= :endTime) " +
           "ORDER BY asub.submittedAt DESC")
    Page<AssignmentSubmission> search(@Param("assignmentId") Long assignmentId,
                                      @Param("status") String status,
                                      @Param("startTime") LocalDateTime startTime,
                                      @Param("endTime") LocalDateTime endTime,
                                      Pageable pageable);

    Optional<AssignmentSubmission> findByAssignmentIdAndUserId(Long assignmentId, Long userId);

    List<AssignmentSubmission> findByAssignmentId(Long assignmentId);
}
