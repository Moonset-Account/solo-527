package com.energy.service.impl;

import com.energy.dto.EnergyDataPoint;
import com.energy.dto.EnergyQueryDTO;
import com.energy.entity.Meter;
import com.energy.entity.MeterReading;
import com.energy.repository.MeterReadingRepository;
import com.energy.repository.MeterRepository;
import com.energy.service.EnergyService;
import lombok.RequiredArgsConstructor;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.OutputStreamWriter;
import java.io.StringWriter;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EnergyServiceImpl implements EnergyService {

    private final MeterReadingRepository readingRepository;
    private final MeterRepository meterRepository;

    @Override
    @Cacheable(value = "energyCurve", key = "#dto.hashCode()")
    public List<EnergyDataPoint> getEnergyCurve(EnergyQueryDTO dto) {
        LocalDateTime start = dto.getStartTime() != null ? dto.getStartTime() : LocalDateTime.now().minusHours(24);
        LocalDateTime end = dto.getEndTime() != null ? dto.getEndTime() : LocalDateTime.now();
        List<MeterReading> readings;
        if (dto.getArea() != null && !dto.getArea().isEmpty()) {
            readings = readingRepository.findByAreaAndTimeBetween(dto.getArea(), start, end);
        } else {
            List<Meter> meters = meterRepository.findAll();
            readings = new ArrayList<>();
            for (Meter m : meters) {
                readings.addAll(readingRepository.findByMeterIdAndReadingTimeBetweenOrderByReadingTime(m.getId(), start, end));
            }
        }
        return aggregateReadings(readings, dto.getGranularity());
    }

    private List<EnergyDataPoint> aggregateReadings(List<MeterReading> readings, String granularity) {
        if (readings == null || readings.isEmpty()) return Collections.emptyList();
        ChronoUnit unit = "hour".equals(granularity) ? ChronoUnit.HOURS :
                          "day".equals(granularity) ? ChronoUnit.DAYS : ChronoUnit.MINUTES;
        Map<LocalDateTime, BigDecimal> aggregated = new TreeMap<>();
        for (MeterReading r : readings) {
            if (r.getActivePower() == null) continue;
            LocalDateTime key = r.getReadingTime().truncatedTo(unit);
            aggregated.merge(key, r.getActivePower(), BigDecimal::add);
        }
        return aggregated.entrySet().stream()
                .map(e -> new EnergyDataPoint(e.getKey(), e.getValue()))
                .collect(Collectors.toList());
    }

    @Override
    @Cacheable(value = "peakAnalysis", key = "#dto.hashCode()")
    public List<EnergyDataPoint> getPeakAnalysis(EnergyQueryDTO dto) {
        LocalDateTime start = dto.getStartTime() != null ? dto.getStartTime() : LocalDateTime.now().minusDays(7);
        LocalDateTime end = dto.getEndTime() != null ? dto.getEndTime() : LocalDateTime.now();
        List<Object[]> peaks = readingRepository.findPeakPowerByAreaAndTimeBetween(start, end);
        return peaks.stream()
                .map(p -> new EnergyDataPoint(end, (BigDecimal) p[1], (String) p[0]))
                .sorted(Comparator.comparing(EnergyDataPoint::getValue).reversed())
                .collect(Collectors.toList());
    }

    @Override
    public List<MeterReading> validateReadings(EnergyQueryDTO dto) {
        LocalDateTime start = dto.getStartTime() != null ? dto.getStartTime() : LocalDateTime.now().minusHours(24);
        LocalDateTime end = dto.getEndTime() != null ? dto.getEndTime() : LocalDateTime.now();
        List<MeterReading> readings = new ArrayList<>(readingRepository.findInvalidReadings(start, end));
        List<MeterReading> allReadings;
        Map<Long, BigDecimal> meterRatedCurrentMap = new HashMap<>();
        for (Meter m : meterRepository.findAll()) {
            if (m.getRatedCurrent() != null) {
                meterRatedCurrentMap.put(m.getId(), m.getRatedCurrent());
            }
        }
        if (dto.getArea() != null && !dto.getArea().isEmpty()) {
            allReadings = readingRepository.findByAreaAndTimeBetween(dto.getArea(), start, end);
        } else {
            allReadings = new ArrayList<>();
            for (Meter m : meterRepository.findAll()) {
                allReadings.addAll(readingRepository.findByMeterIdAndReadingTimeBetweenOrderByReadingTime(m.getId(), start, end));
            }
        }
        for (MeterReading r : allReadings) {
            if (r.getVoltage() != null && (r.getVoltage().compareTo(new BigDecimal("280")) > 0 || r.getVoltage().compareTo(new BigDecimal("160")) < 0)) {
                r.setIsValid(false);
                r.setValidateRemark("电压异常: " + r.getVoltage());
                readings.add(r);
            } else if (r.getCurrentValue() != null) {
                BigDecimal rated = meterRatedCurrentMap.get(r.getMeterId());
                if (rated != null && r.getCurrentValue().compareTo(rated.multiply(new BigDecimal("1.5"))) > 0) {
                    r.setIsValid(false);
                    r.setValidateRemark("电流过载: " + r.getCurrentValue());
                    readings.add(r);
                }
            }
        }
        return readings;
    }

    @Override
    public String generatePeakCsv(EnergyQueryDTO dto) {
        LocalDateTime start = dto.getStartTime() != null ? dto.getStartTime() : LocalDateTime.now().minusDays(7);
        LocalDateTime end = dto.getEndTime() != null ? dto.getEndTime() : LocalDateTime.now();
        List<EnergyDataPoint> peaks = getPeakAnalysis(dto);
        try (StringWriter sw = new StringWriter();
             CSVPrinter csvPrinter = new CSVPrinter(sw, CSVFormat.DEFAULT.builder()
                     .setHeader("区域", "峰值功率(kW)", "统计开始时间", "统计结束时间").build())) {
            for (EnergyDataPoint p : peaks) {
                csvPrinter.printRecord(p.getArea(), p.getValue().setScale(2, RoundingMode.HALF_UP), start, end);
            }
            csvPrinter.flush();
            return sw.toString();
        } catch (Exception e) {
            throw new RuntimeException("生成CSV失败", e);
        }
    }

    @Override
    public byte[] exportPeakByArea(EnergyQueryDTO dto) {
        return generatePeakCsv(dto).getBytes(StandardCharsets.UTF_8);
    }

    @Override
    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("meterCount", meterRepository.count());
        stats.put("areas", meterRepository.findAllAreas());
        return stats;
    }

    @Override
    public List<String> getAllAreas() {
        return meterRepository.findAllAreas();
    }
}
