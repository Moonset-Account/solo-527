package com.energy.service;

import com.energy.dto.ResponseDurationDTO;
import com.energy.entity.PeakLoad;
import com.energy.entity.PriceRule;
import com.energy.entity.Strategy;
import org.springframework.data.domain.Page;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public interface ReferenceService {
    List<PriceRule> getPriceRules(String area, LocalDate date);
    List<Strategy> getStrategies(Boolean activeOnly);
    Strategy getStrategyByCodeAndVersion(String code, String version);
    List<Strategy> getStrategyVersions(String code);
    List<PeakLoad> getPeakLoads(String area, LocalDateTime start, LocalDateTime end);
    List<PeakLoad> getFailedPeaks();
    List<Strategy> getFailedStrategies();
    Map<String, Object> getStatistics(LocalDateTime start, LocalDateTime end);
    Double getAvgResponseDuration(LocalDateTime start, LocalDateTime end);
    Page<ResponseDurationDTO> getResponseDurationList(LocalDateTime start, LocalDateTime end, String handler, int page, int size);
}
