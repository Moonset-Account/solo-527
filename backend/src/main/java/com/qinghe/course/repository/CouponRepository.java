package com.qinghe.course.repository;

import com.qinghe.course.entity.Coupon;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface CouponRepository extends JpaRepository<Coupon, Long> {

    @Query("SELECT c FROM Coupon c WHERE " +
           "(:keyword IS NULL OR c.name LIKE %:keyword% OR c.code LIKE %:keyword%) AND " +
           "(:status IS NULL OR c.status = :status) AND " +
           "(:startTime IS NULL OR c.createdAt >= :startTime) AND " +
           "(:endTime IS NULL OR c.createdAt <= :endTime) " +
           "ORDER BY c.createdAt DESC")
    Page<Coupon> search(@Param("keyword") String keyword,
                        @Param("status") String status,
                        @Param("startTime") LocalDateTime startTime,
                        @Param("endTime") LocalDateTime endTime,
                        Pageable pageable);

    Optional<Coupon> findByCode(String code);
}
