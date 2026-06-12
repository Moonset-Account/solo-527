package com.energy.repository;

import com.energy.entity.Strategy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface StrategyRepository extends JpaRepository<Strategy, Long> {
    List<Strategy> findByIsActiveTrue();
    List<Strategy> findByStrategyCodeOrderByVersionDesc(String strategyCode);
    Optional<Strategy> findByStrategyCodeAndVersion(String strategyCode, String version);

    @Query("SELECT s FROM Strategy s WHERE s.isActive = false " +
           "AND s.failureReason IS NOT NULL ORDER BY s.updateTime DESC")
    List<Strategy> findFailedStrategies();
}
