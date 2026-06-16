package com.rider.analyzer.repository;

import com.rider.analyzer.entity.DeliveryOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface DeliveryOrderRepository extends JpaRepository<DeliveryOrder, Long> {

    List<DeliveryOrder> findByRiderIdAndStatus(Long riderId, String status);

    Page<DeliveryOrder> findByRiderIdAndStatus(Long riderId, String status, Pageable pageable);

    List<DeliveryOrder> findByStationId(Long stationId);

    Page<DeliveryOrder> findByStationId(Long stationId, Pageable pageable);

    Long countByStatusAndCreateTimeBetween(String status, LocalDateTime start, LocalDateTime end);

    List<DeliveryOrder> findByStatus(String status);

    Page<DeliveryOrder> findByStatus(String status, Pageable pageable);

    List<DeliveryOrder> findByRiderId(Long riderId);

    Page<DeliveryOrder> findByRiderId(Long riderId, Pageable pageable);
}
