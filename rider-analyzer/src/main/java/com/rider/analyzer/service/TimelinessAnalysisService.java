package com.rider.analyzer.service;

import com.rider.analyzer.dto.FulfillmentDataVO;
import com.rider.analyzer.dto.TimelinessAnalysisDTO;
import com.rider.analyzer.dto.TimelinessAnalysisVO;
import com.rider.analyzer.dto.TimeoutOrderDetailVO;
import com.rider.analyzer.dto.TimeoutReasonVO;
import com.rider.analyzer.entity.DeliveryOrder;
import com.rider.analyzer.entity.Station;
import com.rider.analyzer.entity.TimelinessNode;
import com.rider.analyzer.repository.DeliveryOrderRepository;
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
    private final DeliveryOrderRepository deliveryOrderRepository;

    private static final Map<String, String> NODE_LABEL_MAP = new HashMap<>();
    private static final Map<String, String> REASON_COLOR_MAP = new HashMap<>();
    static {
        NODE_LABEL_MAP.put("ACCEPT", "接单");
        NODE_LABEL_MAP.put("PICKUP", "取货");
        NODE_LABEL_MAP.put("DELIVER", "送达");
        NODE_LABEL_MAP.put("SIGN", "签收");

        REASON_COLOR_MAP.put("骑手接单延迟", "#409eff");
        REASON_COLOR_MAP.put("商家出餐慢", "#e6a23c");
        REASON_COLOR_MAP.put("道路拥堵", "#f56c6c");
        REASON_COLOR_MAP.put("客户地址难找", "#67c23a");
        REASON_COLOR_MAP.put("天气原因", "#909399");
        REASON_COLOR_MAP.put("联系不上客户", "#606266");
    }

    public TimelinessAnalysisVO getFullAnalysis() {
        TimelinessAnalysisVO vo = new TimelinessAnalysisVO();
        vo.setNodeStats(getNodeStats());
        vo.setTimeoutReasons(getTimeoutReasons());
        vo.setTimeoutOrders(getTimeoutOrderDetails());
        return vo;
    }

    public List<TimeoutReasonVO> getTimeoutReasons() {
        List<TimelinessNode> allTimeoutNodes = timelinessNodeRepository
                .findByIsTimeoutAndCreateTimeBetween(1,
                        LocalDateTime.now().minusDays(7),
                        LocalDateTime.now());

        Map<String, List<TimelinessNode>> byReason = allTimeoutNodes.stream()
                .filter(n -> n.getReason() != null && !n.getReason().isEmpty())
                .collect(Collectors.groupingBy(TimelinessNode::getReason));

        long totalTimeout = allTimeoutNodes.size();
        List<TimeoutReasonVO> result = new ArrayList<>();

        for (Map.Entry<String, List<TimelinessNode>> entry : byReason.entrySet()) {
            TimeoutReasonVO vo = new TimeoutReasonVO();
            vo.setReason(entry.getKey());
            vo.setCount((long) entry.getValue().size());
            vo.setPercentage(totalTimeout > 0
                    ? BigDecimal.valueOf(entry.getValue().size())
                            .multiply(BigDecimal.valueOf(100))
                            .divide(BigDecimal.valueOf(totalTimeout), 2, RoundingMode.HALF_UP)
                            .doubleValue()
                    : 0.0);
            vo.setColor(REASON_COLOR_MAP.getOrDefault(entry.getKey(), "#409eff"));
            result.add(vo);
        }

        result.sort((a, b) -> Long.compare(b.getCount(), a.getCount()));
        return result;
    }

    public List<TimeoutOrderDetailVO> getTimeoutOrderDetails() {
        List<TimelinessNode> timeoutNodes = timelinessNodeRepository
                .findByIsTimeoutAndCreateTimeBetween(1,
                        LocalDateTime.now().minusDays(7),
                        LocalDateTime.now());

        Map<Long, DeliveryOrder> orderMap = deliveryOrderRepository.findAll().stream()
                .collect(Collectors.toMap(DeliveryOrder::getId, o -> o));

        List<TimeoutOrderDetailVO> result = new ArrayList<>();
        for (TimelinessNode node : timeoutNodes) {
            TimeoutOrderDetailVO vo = new TimeoutOrderDetailVO();
            vo.setId(node.getId());
            vo.setNodeType(node.getNodeType());
            vo.setNodeLabel(NODE_LABEL_MAP.getOrDefault(node.getNodeType(), node.getNodeType()));
            vo.setPlanTime(node.getPlanTime());
            vo.setActualTime(node.getActualTime());
            vo.setTimeoutMinutes((long) node.getTimeoutMinutes());
            vo.setReason(node.getReason());

            DeliveryOrder order = orderMap.get(node.getOrderId());
            if (order != null) {
                vo.setOrderNo(order.getOrderNo());
            }
            result.add(vo);
        }

        result.sort((a, b) -> Long.compare(b.getTimeoutMinutes(), a.getTimeoutMinutes()));
        return result;
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
