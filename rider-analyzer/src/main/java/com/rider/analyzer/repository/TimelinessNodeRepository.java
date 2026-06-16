package com.rider.analyzer.repository;

import com.rider.analyzer.entity.TimelinessNode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface TimelinessNodeRepository extends JpaRepository<TimelinessNode, Long> {

    List<TimelinessNode> findByOrderId(Long orderId);

    List<TimelinessNode> findByIsTimeoutAndCreateTimeBetween(Integer isTimeout, LocalDateTime start, LocalDateTime end);

    List<TimelinessNode> findByNodeTypeAndIsTimeout(String nodeType, Integer isTimeout);

    List<TimelinessNode> findByNodeTypeAndCreateTimeBetween(String nodeType, LocalDateTime start, LocalDateTime end);
}
