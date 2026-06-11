package com.qinghe.course.repository;

import com.qinghe.course.entity.DistributionCommission;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface DistributionCommissionRepository extends JpaRepository<DistributionCommission, Long> {

    @Query("SELECT dc FROM DistributionCommission dc WHERE " +
           "(:distributorId IS NULL OR dc.distributorId = :distributorId) AND " +
           "(:status IS NULL OR dc.status = :status) AND " +
           "(:startTime IS NULL OR dc.createdAt >= :startTime) AND " +
           "(:endTime IS NULL OR dc.createdAt <= :endTime) " +
           "ORDER BY dc.createdAt DESC")
    Page<DistributionCommission> search(@Param("distributorId") Long distributorId,
                                        @Param("status") String status,
                                        @Param("startTime") LocalDateTime startTime,
                                        @Param("endTime") LocalDateTime endTime,
                                        Pageable pageable);

    List<DistributionCommission> findByDistributorId(Long distributorId);
}
