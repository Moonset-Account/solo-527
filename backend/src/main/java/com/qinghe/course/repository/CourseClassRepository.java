package com.qinghe.course.repository;

import com.qinghe.course.entity.CourseClass;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CourseClassRepository extends JpaRepository<CourseClass, Long> {

    @Query("SELECT cc FROM CourseClass cc WHERE " +
           "(:keyword IS NULL OR cc.className LIKE %:keyword%) AND " +
           "(:status IS NULL OR cc.status = :status) AND " +
           "(:startTime IS NULL OR cc.createdAt >= :startTime) AND " +
           "(:endTime IS NULL OR cc.createdAt <= :endTime) " +
           "ORDER BY cc.createdAt DESC")
    Page<CourseClass> search(@Param("keyword") String keyword,
                             @Param("status") String status,
                             @Param("startTime") LocalDateTime startTime,
                             @Param("endTime") LocalDateTime endTime,
                             Pageable pageable);

    List<CourseClass> findByCourseId(Long courseId);
}
