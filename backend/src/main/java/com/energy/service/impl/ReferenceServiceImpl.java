package com.energy.service.impl;

import com.energy.dto.ResponseDurationDTO;
import com.energy.entity.Alert;
import com.energy.entity.AlertHandling;
import com.energy.entity.Meter;
import com.energy.entity.PeakLoad;
import com.energy.entity.PriceRule;
import com.energy.entity.Strategy;
import com.energy.repository.AlertHandlingRepository;
import com.energy.repository.AlertRepository;
import com.energy.repository.MeterRepository;
import com.energy.repository.PeakLoadRepository;
import com.energy.repository.PriceRuleRepository;
import com.energy.repository.StrategyRepository;
import com.energy.service.ReferenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReferenceServiceImpl implements ReferenceService {

    private final PriceRuleRepository priceRuleRepository;
    private final StrategyRepository strategyRepository;
    private final PeakLoadRepository peakLoadRepository;
    private final AlertHandlingRepository handlingRepository;
    private final AlertRepository alertRepository;
    private final MeterRepository meterRepository;

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

    @Override
    public Page<ResponseDurationDTO> getResponseDurationList(LocalDateTime start, LocalDateTime end,
                                                              String handler, int page, int size) {
        LocalDateTime s = start != null ? start : LocalDateTime.now().minusDays(30);
        LocalDateTime e = end != null ? end : LocalDateTime.now();
        String h = (handler != null && !handler.isEmpty()) ? handler : null;

        List<AlertHandling> all = handlingRepository.findByFilters(s, e, h);
        int total = all.size();
        int fromIndex = page * size;
        int toIndex = Math.min(fromIndex + size, total);
        List<AlertHandling> pageContent = fromIndex < total ? all.subList(fromIndex, toIndex) : new ArrayList<>();

        List<Long> alertIds = pageContent.stream().map(AlertHandling::getAlertId).distinct().collect(Collectors.toList());
        Map<Long, Alert> alertMap = new HashMap<>();
        Map<Long, Meter> meterMap = new HashMap<>();
        if (!alertIds.isEmpty()) {
            List<Alert> alerts = alertRepository.findAllById(alertIds);
            for (Alert a : alerts) {
                alertMap.put(a.getId(), a);
            }
            List<Long> meterIds = alerts.stream().map(Alert::getMeterId).distinct().collect(Collectors.toList());
            if (!meterIds.isEmpty()) {
                List<Meter> meters = meterRepository.findAllById(meterIds);
                for (Meter m : meters) {
                    meterMap.put(m.getId(), m);
                }
            }
        }

        List<ResponseDurationDTO> dtoList = new ArrayList<>();
        for (AlertHandling ah : pageContent) {
            ResponseDurationDTO dto = new ResponseDurationDTO();
            dto.setId(ah.getId());
            dto.setAlertId(ah.getAlertId());
            dto.setHandler(ah.getHandler());
            dto.setHandleTime(ah.getHandleTime());
            dto.setResponseDuration(ah.getResponseDuration());
            dto.setHandleResult(ah.getHandleResult());
            dto.setHandleRemark(ah.getHandleRemark());

            Alert alert = alertMap.get(ah.getAlertId());
            if (alert != null) {
                dto.setAlertNo(alert.getAlertNo());
                dto.setAlertType(alert.getAlertType());
                dto.setAlertLevel(alert.getAlertLevel());
                dto.setAssignee(alert.getAssignee());
                dto.setAlertTime(alert.getAlertTime());
                dto.setAssignTime(alert.getAssignTime());
                Meter meter = meterMap.get(alert.getMeterId());
                if (meter != null) {
                    dto.setMeterName(meter.getMeterName());
                    dto.setArea(meter.getArea());
                }
            }
            dtoList.add(dto);
        }

        return new PageImpl<>(dtoList, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "handleTime")), total);
    }
}
