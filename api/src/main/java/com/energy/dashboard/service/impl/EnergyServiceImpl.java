package com.energy.dashboard.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.energy.dashboard.entity.EnergyData;
import com.energy.dashboard.entity.Meter;
import com.energy.dashboard.mapper.EnergyDataMapper;
import com.energy.dashboard.mapper.MeterMapper;
import com.energy.dashboard.service.EnergyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class EnergyServiceImpl implements EnergyService {

    @Autowired
    private EnergyDataMapper energyDataMapper;

    @Autowired
    private MeterMapper meterMapper;

    @Override
    public Map<String, Object> getOverview() {
        Map<String, Object> overview = new HashMap<>();

        QueryWrapper<EnergyData> wrapper = new QueryWrapper<>();
        wrapper.select("SUM(value) as value", "data_type")
                .groupBy("data_type");
        List<EnergyData> summary = energyDataMapper.selectList(wrapper);

        BigDecimal totalElectricity = BigDecimal.ZERO;
        BigDecimal totalWater = BigDecimal.ZERO;
        BigDecimal totalGas = BigDecimal.ZERO;

        QueryWrapper<EnergyData> elecWrapper = new QueryWrapper<>();
        elecWrapper.eq("data_type", "electricity");
        List<EnergyData> elecData = energyDataMapper.selectList(elecWrapper);
        for (EnergyData d : elecData) {
            totalElectricity = totalElectricity.add(d.getValue());
        }

        QueryWrapper<EnergyData> waterWrapper = new QueryWrapper<>();
        waterWrapper.eq("data_type", "water");
        List<EnergyData> waterData = energyDataMapper.selectList(waterWrapper);
        for (EnergyData d : waterData) {
            totalWater = totalWater.add(d.getValue());
        }

        QueryWrapper<EnergyData> gasWrapper = new QueryWrapper<>();
        gasWrapper.eq("data_type", "gas");
        List<EnergyData> gasData = energyDataMapper.selectList(gasWrapper);
        for (EnergyData d : gasData) {
            totalGas = totalGas.add(d.getValue());
        }

        Long meterCount = Long.valueOf(meterMapper.selectCount(null));

        overview.put("totalElectricity", totalElectricity);
        overview.put("totalWater", totalWater);
        overview.put("totalGas", totalGas);
        overview.put("meterCount", meterCount);

        return overview;
    }

    @Override
    public List<EnergyData> getCurve(String period, Long zoneId) {
        QueryWrapper<EnergyData> wrapper = new QueryWrapper<>();

        if (zoneId != null) {
            QueryWrapper<Meter> meterWrapper = new QueryWrapper<>();
            meterWrapper.eq("zone_id", zoneId);
            List<Meter> meters = meterMapper.selectList(meterWrapper);
            List<Long> meterIds = meters.stream().map(Meter::getId).collect(Collectors.toList());
            if (meterIds.isEmpty()) {
                return List.of();
            }
            wrapper.in("meter_id", meterIds);
        }

        LocalDateTime now = LocalDateTime.now();
        if ("day".equals(period)) {
            wrapper.ge("recorded_at", now.minusDays(1));
        } else if ("week".equals(period)) {
            wrapper.ge("recorded_at", now.minusWeeks(1));
        } else if ("month".equals(period)) {
            wrapper.ge("recorded_at", now.minusMonths(1));
        }

        wrapper.orderByAsc("recorded_at");
        return energyDataMapper.selectList(wrapper);
    }

    @Override
    public List<Map<String, Object>> getZoneComparison() {
        List<Meter> meters = meterMapper.selectList(null);
        Map<Long, String> zoneNames = new HashMap<>();

        List<Map<String, Object>> result = meters.stream()
                .collect(Collectors.groupingBy(Meter::getZoneId))
                .entrySet().stream()
                .map(entry -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("zoneId", entry.getKey());
                    item.put("meterCount", entry.getValue().size());

                    QueryWrapper<EnergyData> wrapper = new QueryWrapper<>();
                    wrapper.in("meter_id", entry.getValue().stream()
                            .map(Meter::getId).collect(Collectors.toList()));
                    List<EnergyData> dataList = energyDataMapper.selectList(wrapper);

                    BigDecimal total = dataList.stream()
                            .map(EnergyData::getValue)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    item.put("totalConsumption", total);
                    return item;
                })
                .collect(Collectors.toList());

        return result;
    }
}
