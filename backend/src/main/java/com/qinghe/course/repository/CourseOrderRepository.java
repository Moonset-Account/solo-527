package com.qinghe.course.repository;

import com.qinghe.course.entity.CourseOrder;
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
public interface CourseOrderRepository extends JpaRepository<CourseOrder, Long> {

    @Query("SELECT o FROM CourseOrder o WHERE " +
           "(:userId IS NULL OR o.userId = :userId) AND " +
           "(:keyword IS NULL OR o.orderNo LIKE %:keyword%) AND " +
           "(:status IS NULL OR o.status = :status) AND " +
           "(:startTime IS NULL OR o.createdAt >= :startTime) AND " +
           "(:endTime IS NULL OR o.createdAt <= :endTime) " +
           "ORDER BY o.createdAt DESC")
    Page<CourseOrder> search(@Param("userId") Long userId,
                             @Param("keyword") String keyword,
                             @Param("status") String status,
                             @Param("startTime") LocalDateTime startTime,
                             @Param("endTime") LocalDateTime endTime,
                             Pageable pageable);

    Optional<CourseOrder> findByOrderNo(String orderNo);

    List<CourseOrder> findByUserId(Long userId);
}
