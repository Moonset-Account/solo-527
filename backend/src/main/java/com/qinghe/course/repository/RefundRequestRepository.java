package com.qinghe.course.repository;

import com.qinghe.course.entity.RefundRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface RefundRequestRepository extends JpaRepository<RefundRequest, Long> {

    @Query("SELECT rr FROM RefundRequest rr WHERE " +
           "(:keyword IS NULL OR CAST(rr.orderId AS string) LIKE %:keyword%) AND " +
           "(:status IS NULL OR rr.status = :status) AND " +
           "(:startTime IS NULL OR rr.createdAt >= :startTime) AND " +
           "(:endTime IS NULL OR rr.createdAt <= :endTime) " +
           "ORDER BY rr.createdAt DESC")
    Page<RefundRequest> search(@Param("keyword") String keyword,
                               @Param("status") String status,
                               @Param("startTime") LocalDateTime startTime,
                               @Param("endTime") LocalDateTime endTime,
                               Pageable pageable);

    List<RefundRequest> findByUserId(Long userId);

    List<RefundRequest> findByStatus(String status);

    List<RefundRequest> findByReminderSentFalseAndHoursWrittenBackFalse();
}
