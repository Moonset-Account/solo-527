package com.rider.analyzer.repository;

import com.rider.analyzer.entity.DeliveryOrder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface DeliveryOrderRepository extends JpaRepository<DeliveryOrder, Long> {

    List<DeliveryOrder> findByRiderIdAndStatus(Long riderId, String status);

    List<DeliveryOrder> findByStationId(Long stationId);

    Long countByStatusAndCreateTimeBetween(String status, LocalDateTime start, LocalDateTime end);

    List<DeliveryOrder> findByStatus(String status);

    List<DeliveryOrder> findByRiderId(Long riderId);
}
