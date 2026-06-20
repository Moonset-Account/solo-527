package com.datagrowth.portal.repository;

import com.datagrowth.portal.entity.DataDelayMonitor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DataDelayMonitorRepository extends JpaRepository<DataDelayMonitor, Long> {
    Page<DataDelayMonitor> findByStatus(String status, Pageable pageable);
    List<DataDelayMonitor> findByStatusIn(List<String> statuses);
    
    @Query("SELECT COUNT(d) FROM DataDelayMonitor d WHERE d.status = 'DELAYED' AND d.notified = false")
    List<DataDelayMonitor> findDelayedAndNotNotified();
    
    @Query("SELECT COUNT(d) FROM DataDelayMonitor d WHERE d.status = 'DELAYED'")
    long countDelayed();
}
