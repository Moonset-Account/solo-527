package com.qinghe.course.repository;

import com.qinghe.course.entity.LearningProgress;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface LearningProgressRepository extends JpaRepository<LearningProgress, Long> {

    @Query("SELECT lp FROM LearningProgress lp WHERE " +
           "(:userId IS NULL OR lp.userId = :userId) AND " +
           "(:status IS NULL OR lp.status = :status) AND " +
           "(:startTime IS NULL OR lp.lastStudyAt >= :startTime) AND " +
           "(:endTime IS NULL OR lp.lastStudyAt <= :endTime) " +
           "ORDER BY lp.lastStudyAt DESC")
    Page<LearningProgress> search(@Param("userId") Long userId,
                                  @Param("status") String status,
                                  @Param("startTime") LocalDateTime startTime,
                                  @Param("endTime") LocalDateTime endTime,
                                  Pageable pageable);

    Optional<LearningProgress> findByUserIdAndCourseIdAndClassId(Long userId, Long courseId, Long classId);

    List<LearningProgress> findByUserId(Long userId);

    List<LearningProgress> findByClassId(Long classId);

    @Query("SELECT AVG(lp.completionRate) FROM LearningProgress lp WHERE lp.classId = :classId")
    BigDecimal calculateAverageCompletionRateByClassId(@Param("classId") Long classId);
}
