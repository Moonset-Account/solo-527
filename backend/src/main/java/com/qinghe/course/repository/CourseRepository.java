package com.qinghe.course.repository;

import com.qinghe.course.entity.Course;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {

    @Query("SELECT c FROM Course c WHERE " +
           "(:keyword IS NULL OR c.title LIKE %:keyword% OR c.description LIKE %:keyword%) AND " +
           "(:status IS NULL OR c.status = :status) AND " +
           "(:startTime IS NULL OR c.createdAt >= :startTime) AND " +
           "(:endTime IS NULL OR c.createdAt <= :endTime) " +
           "ORDER BY c.createdAt DESC")
    Page<Course> search(@Param("keyword") String keyword,
                        @Param("status") String status,
                        @Param("startTime") LocalDateTime startTime,
                        @Param("endTime") LocalDateTime endTime,
                        Pageable pageable);

    List<Course> findByStatus(String status);
}
