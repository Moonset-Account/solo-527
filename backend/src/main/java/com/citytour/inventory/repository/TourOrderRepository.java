package com.citytour.inventory.repository;

import com.citytour.inventory.entity.TourOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface TourOrderRepository extends JpaRepository<TourOrder, Long> {

    Optional<TourOrder> findByOrderNo(String orderNo);

    @Query("SELECT o FROM TourOrder o WHERE " +
           "(:orderNo IS NULL OR o.orderNo LIKE %:orderNo%) AND " +
           "(:routeId IS NULL OR o.routeId = :routeId) AND " +
           "(:customerName IS NULL OR o.customerName LIKE %:customerName%) AND " +
           "(:customerPhone IS NULL OR o.customerPhone LIKE %:customerPhone%) AND " +
           "(:startDate IS NULL OR o.travelDate >= :startDate) AND " +
           "(:endDate IS NULL OR o.travelDate <= :endDate) AND " +
           "(:orderStatus IS NULL OR o.orderStatus = :orderStatus) AND " +
           "(:refundStatus IS NULL OR o.refundStatus = :refundStatus)")
    Page<TourOrder> findByConditions(@Param("orderNo") String orderNo,
                                     @Param("routeId") Long routeId,
                                     @Param("customerName") String customerName,
                                     @Param("customerPhone") String customerPhone,
                                     @Param("startDate") LocalDate startDate,
                                     @Param("endDate") LocalDate endDate,
                                     @Param("orderStatus") String orderStatus,
                                     @Param("refundStatus") String refundStatus,
                                     Pageable pageable);
}
