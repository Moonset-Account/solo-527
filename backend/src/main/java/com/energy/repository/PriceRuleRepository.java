package com.energy.repository;

import com.energy.entity.PriceRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface PriceRuleRepository extends JpaRepository<PriceRule, Long> {
    List<PriceRule> findByArea(String area);
    List<PriceRule> findByPeakType(String peakType);

    @Query("SELECT p FROM PriceRule p WHERE p.effectiveDate <= :date " +
           "AND (p.expireDate IS NULL OR p.expireDate >= :date) " +
           "AND (:area IS NULL OR p.area = :area) ORDER BY p.startTime")
    List<PriceRule> findEffectiveRules(
            @Param("date") LocalDate date,
            @Param("area") String area);
}
