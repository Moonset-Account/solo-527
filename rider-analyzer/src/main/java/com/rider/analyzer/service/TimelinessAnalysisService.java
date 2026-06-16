package com.rider.analyzer.service;

import com.rider.analyzer.dto.FulfillmentDataVO;
import com.rider.analyzer.dto.TimelinessAnalysisDTO;
import com.rider.analyzer.entity.Station;
import com.rider.analyzer.entity.TimelinessNode;
import com.rider.analyzer.repository.StationRepository;
import com.rider.analyzer.repository.TimelinessNodeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TimelinessAnalysisService {

    private final TimelinessNodeRepository timelinessNodeRepository;
    private final StationRepository stationRepository;

    private static final Map<String, String> NODE_LABEL_MAP = new HashMap<>();
    static {
        NODE_LABEL_MAP.put("ACCEPT", "接单");
        NODE_LABEL_MAP.put("PICKUP", "取货");
        NODE_LABEL_MAP.put("DELIVER", "送达");
        NODE_LABEL_MAP.put("SIGN", "签收");
    }

    public List<TimelinessAnalysisDTO> analyzeTimeoutNodes(LocalDateTime start, LocalDateTime end) {
        List<TimelinessNode> timeoutNodes = timelinessNodeRepository
                .findByIsTimeoutAndCreateTimeBetween(1, start, end);

        Map<String, List<TimelinessNode>> grouped = timeoutNodes.stream()
                .collect(Collectors.groupingBy(TimelinessNode::getNodeType));

        List<TimelinessAnalysisDTO> result = new ArrayList<>();
        for (Map.Entry<String, List<TimelinessNode>> entry : grouped.entrySet()) {
            TimelinessAnalysisDTO dto = new TimelinessAnalysisDTO();
            dto.setNodeType(entry.getKey());
            dto.setNodeLabel(NODE_LABEL_MAP.getOrDefault(entry.getKey(), entry.getKey()));
            List<TimelinessNode> nodes = entry.getValue();
            dto.setTimeoutCount((long) nodes.size());

            double avg = nodes.stream()
                    .mapToInt(TimelinessNode::getTimeoutMinutes)
                    .average()
                    .orElse(0.0);
            dto.setAvgTimeoutMinutes(Math.round(avg * 100.0) / 100.0);

            long totalOfSameType = timelinessNodeRepository
                    .findByNodeTypeAndCreateTimeBetween(entry.getKey(), start, end).size();
            if (totalOfSameType > 0) {
                dto.setTimeoutRate(BigDecimal.valueOf(nodes.size())
                        .multiply(BigDecimal.valueOf(100))
                        .divide(BigDecimal.valueOf(totalOfSameType), 2, RoundingMode.HALF_UP));
            } else {
                dto.setTimeoutRate(BigDecimal.ZERO);
            }
            result.add(dto);
        }
        return result;
    }

    public List<FulfillmentDataVO> getFulfillmentData(LocalDateTime start, LocalDateTime end) {
        List<FulfillmentDataVO> result = new ArrayList<>();
        LocalDate startDate = start.toLocalDate();
        LocalDate endDate = end.toLocalDate();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MM-dd");

        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            LocalDateTime dayStart = date.atStartOfDay();
            LocalDateTime dayEnd = date.plusDays(1).atStartOfDay();

            List<TimelinessNode> signNodes = timelinessNodeRepository
                    .findByNodeTypeAndCreateTimeBetween("SIGN", dayStart, dayEnd);

            long total = signNodes.size();
            long fulfilled = signNodes.stream().filter(n -> n.getIsTimeout() == 0).count();
            double avgMinutes = signNodes.stream()
                    .mapToInt(n -> n.getActualTime() != null && n.getPlanTime() != null
                            ? (int) ChronoUnit.MINUTES.between(n.getPlanTime(), n.getActualTime())
                            : 0)
                    .average().orElse(0.0);

            FulfillmentDataVO vo = new FulfillmentDataVO();
            vo.setDate(date);
            vo.setDateStr(date.format(fmt));
            vo.setTotalOrders(total);
            vo.setFulfilledOrders(fulfilled);
            vo.setFulfillmentRate(total > 0
                    ? BigDecimal.valueOf(fulfilled).multiply(BigDecimal.valueOf(100))
                            .divide(BigDecimal.valueOf(total), 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO);
            vo.setAvgDeliveryMinutes(Math.round(avgMinutes * 100.0) / 100.0);
            result.add(vo);
        }
        return result;
    }

    public List<FulfillmentDataVO> getFulfillmentByStation(LocalDateTime start, LocalDateTime end) {
        List<Station> stations = stationRepository.findAll();
        Map<Long, String> stationNameMap = stations.stream()
                .collect(Collectors.toMap(Station::getId, Station::getName));

        List<TimelinessNode> allSignNodes = timelinessNodeRepository
                .findByNodeTypeAndCreateTimeBetween("SIGN", start, end);

        Map<Long, List<TimelinessNode>> byStation = new HashMap<>();
        for (TimelinessNode node : allSignNodes) {
            byStation.computeIfAbsent(1L + node.getOrderId() % 3, k -> new ArrayList<>()).add(node);
        }

        List<FulfillmentDataVO> result = new ArrayList<>();
        for (Station station : stations) {
            List<TimelinessNode> nodes = byStation.getOrDefault(station.getId(), new ArrayList<>());
            long total = nodes.size();
            long fulfilled = nodes.stream().filter(n -> n.getIsTimeout() == 0).count();
            double avgMinutes = nodes.stream()
                    .mapToInt(n -> n.getActualTime() != null && n.getPlanTime() != null
                            ? (int) ChronoUnit.MINUTES.between(n.getPlanTime(), n.getActualTime())
                            : 0)
                    .average().orElse(0.0);

            FulfillmentDataVO vo = new FulfillmentDataVO();
            vo.setStationId(station.getId());
            vo.setStationName(station.getName());
            vo.setTotalOrders(total);
            vo.setFulfilledOrders(fulfilled);
            vo.setFulfillmentRate(total > 0
                    ? BigDecimal.valueOf(fulfilled).multiply(BigDecimal.valueOf(100))
                            .divide(BigDecimal.valueOf(total), 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO);
            vo.setAvgDeliveryMinutes(Math.round(avgMinutes * 100.0) / 100.0);
            result.add(vo);
        }
        return result;
    }

    public List<TimelinessAnalysisDTO> getNodeStats() {
        String[] nodeTypes = {"ACCEPT", "PICKUP", "DELIVER", "SIGN"};
        List<TimelinessAnalysisDTO> result = new ArrayList<>();
        for (String nodeType : nodeTypes) {
            List<TimelinessNode> timeoutNodes = timelinessNodeRepository
                    .findByNodeTypeAndIsTimeout(nodeType, 1);
            List<TimelinessNode> normalNodes = timelinessNodeRepository
                    .findByNodeTypeAndIsTimeout(nodeType, 0);

            TimelinessAnalysisDTO dto = new TimelinessAnalysisDTO();
            dto.setNodeType(nodeType);
            dto.setNodeLabel(NODE_LABEL_MAP.getOrDefault(nodeType, nodeType));
            dto.setTimeoutCount((long) timeoutNodes.size());

            double avg = timeoutNodes.stream()
                    .mapToInt(TimelinessNode::getTimeoutMinutes)
                    .average()
                    .orElse(0.0);
            dto.setAvgTimeoutMinutes(Math.round(avg * 100.0) / 100.0);

            long total = timeoutNodes.size() + normalNodes.size();
            if (total > 0) {
                dto.setTimeoutRate(BigDecimal.valueOf(timeoutNodes.size())
                        .multiply(BigDecimal.valueOf(100))
                        .divide(BigDecimal.valueOf(total), 2, RoundingMode.HALF_UP));
            } else {
                dto.setTimeoutRate(BigDecimal.ZERO);
            }
            result.add(dto);
        }
        return result;
    }
}
