package com.energy.service.impl;

import com.energy.entity.PeakLoad;
import com.energy.entity.PriceRule;
import com.energy.entity.Strategy;
import com.energy.repository.AlertHandlingRepository;
import com.energy.repository.PeakLoadRepository;
import com.energy.repository.PriceRuleRepository;
import com.energy.repository.StrategyRepository;
import com.energy.service.ReferenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReferenceServiceImpl implements ReferenceService {

    private final PriceRuleRepository priceRuleRepository;
    private final StrategyRepository strategyRepository;
    private final PeakLoadRepository peakLoadRepository;
    private final AlertHandlingRepository handlingRepository;

    @Override
    @Cacheable(value = "priceRules", key = "#area + '_' + #date")
    public List<PriceRule> getPriceRules(String area, LocalDate date) {
        LocalDate d = date != null ? date : LocalDate.now();
        return priceRuleRepository.findEffectiveRules(d, area);
    }

    @Override
    @Cacheable(value = "strategies", key = "#activeOnly")
    public List<Strategy> getStrategies(Boolean activeOnly) {
        if (Boolean.TRUE.equals(activeOnly)) {
            return strategyRepository.findByIsActiveTrue();
        }
        return strategyRepository.findAll();
    }

    @Override
    public Strategy getStrategyByCodeAndVersion(String code, String version) {
        return strategyRepository.findByStrategyCodeAndVersion(code, version).orElse(null);
    }

    @Override
    public List<Strategy> getStrategyVersions(String code) {
        return strategyRepository.findByStrategyCodeOrderByVersionDesc(code);
    }

    @Override
    @Cacheable(value = "peakLoads", key = "#area + '_' + #start + '_' + #end")
    public List<PeakLoad> getPeakLoads(String area, LocalDateTime start, LocalDateTime end) {
        LocalDateTime s = start != null ? start : LocalDateTime.now().minusDays(7);
        LocalDateTime e = end != null ? end : LocalDateTime.now();
        return peakLoadRepository.findByFilters(s, e, area);
    }

    @Override
    public List<PeakLoad> getFailedPeaks() {
        return peakLoadRepository.findFailedPeaks();
    }

    @Override
    public List<Strategy> getFailedStrategies() {
        return strategyRepository.findFailedStrategies();
    }

    @Override
    public Map<String, Object> getStatistics(LocalDateTime start, LocalDateTime end) {
        LocalDateTime s = start != null ? start : LocalDateTime.now().minusDays(30);
        LocalDateTime e = end != null ? end : LocalDateTime.now();
        Map<String, Object> result = new HashMap<>();
        result.put("peakLoads", getPeakLoads(null, s, e));
        result.put("failedPeaks", getFailedPeaks());
        result.put("failedStrategies", getFailedStrategies());
        result.put("avgResponseDuration", getAvgResponseDuration(s, e));
        return result;
    }

    @Override
    public Double getAvgResponseDuration(LocalDateTime start, LocalDateTime end) {
        return handlingRepository.findAvgResponseDuration(start, end);
    }
}
