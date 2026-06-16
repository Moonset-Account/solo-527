package com.rider.analyzer.service;

import com.rider.analyzer.dto.OrderAcceptDTO;
import com.rider.analyzer.dto.OrderVO;
import com.rider.analyzer.dto.PageResult;
import com.rider.analyzer.dto.RouteInfoVO;
import com.rider.analyzer.dto.TodoDetailDTO;
import com.rider.analyzer.entity.DeliveryOrder;
import com.rider.analyzer.entity.Rider;
import com.rider.analyzer.entity.SignRecord;
import com.rider.analyzer.entity.Station;
import com.rider.analyzer.entity.StationInventory;
import com.rider.analyzer.repository.DeliveryOrderRepository;
import com.rider.analyzer.repository.RiderRepository;
import com.rider.analyzer.repository.SignRecordRepository;
import com.rider.analyzer.repository.StationInventoryRepository;
import com.rider.analyzer.repository.StationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DeliveryOrderService {

    private final DeliveryOrderRepository deliveryOrderRepository;
    private final SignRecordRepository signRecordRepository;
    private final StationInventoryRepository stationInventoryRepository;
    private final RiderRepository riderRepository;
    private final StationRepository stationRepository;

    private static final Map<String, String> STATUS_LABEL_MAP = new HashMap<>();
    static {
        STATUS_LABEL_MAP.put("PENDING", "待接单");
        STATUS_LABEL_MAP.put("ACCEPTED", "已接单");
        STATUS_LABEL_MAP.put("PICKED_UP", "已取货");
        STATUS_LABEL_MAP.put("DELIVERING", "配送中");
        STATUS_LABEL_MAP.put("SIGNED", "已签收");
        STATUS_LABEL_MAP.put("EXCEPTION", "异常");
    }

    @Transactional
    public DeliveryOrder acceptOrder(OrderAcceptDTO dto) {
        DeliveryOrder order = deliveryOrderRepository.findById(dto.getOrderId())
                .orElseThrow(() -> new RuntimeException("订单不存在"));
        if (!"PENDING".equals(order.getStatus())) {
            throw new RuntimeException("订单状态不允许接单");
        }
        order.setRiderId(dto.getRiderId());
        order.setStatus("ACCEPTED");
        order.setAcceptTime(LocalDateTime.now());
        return deliveryOrderRepository.save(order);
    }

    public TodoDetailDTO getTodoDetail(Long id) {
        DeliveryOrder order = deliveryOrderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("订单不存在"));

        TodoDetailDTO detail = new TodoDetailDTO();
        detail.setOrderId(order.getId());
        detail.setOrderNo(order.getOrderNo());
        detail.setStationId(order.getStationId());
        detail.setReceiverName(order.getReceiverName());
        detail.setReceiverPhone(order.getReceiverPhone());
        detail.setReceiverAddress(order.getReceiverAddress());
        detail.setStatus(order.getStatus());
        detail.setStatusLabel(STATUS_LABEL_MAP.getOrDefault(order.getStatus(), order.getStatus()));
        detail.setPromiseTime(order.getPromiseTime());
        detail.setAcceptTime(order.getAcceptTime());
        detail.setPickupTime(order.getPickupTime());
        detail.setDeliverTime(order.getDeliverTime());
        detail.setSignTime(order.getSignTime());
        detail.setCreateTime(order.getCreateTime());

        if (order.getStationId() != null) {
            stationRepository.findById(order.getStationId()).ifPresent(
                    station -> detail.setStationName(station.getName()));
        }

        List<SignRecord> signRecords = signRecordRepository.findByOrderId(id);
        if (!signRecords.isEmpty()) {
            SignRecord sr = signRecords.get(0);
            TodoDetailDTO.SignRecordInfo info = new TodoDetailDTO.SignRecordInfo();
            info.setId(sr.getId());
            info.setExpectedQty(sr.getExpectedQty());
            info.setActualQty(sr.getActualQty());
            info.setDiffQty(sr.getDiffQty());
            info.setDiffReason(sr.getDiffReason());
            info.setSignType(sr.getSignType());
            detail.setSignRecord(info);
        }

        if (order.getStationId() != null) {
            List<StationInventory> inventories = stationInventoryRepository.findByStationId(order.getStationId());
            List<TodoDetailDTO.StationInventoryInfo> invList = inventories.stream().map(inv -> {
                TodoDetailDTO.StationInventoryInfo info = new TodoDetailDTO.StationInventoryInfo();
                info.setId(inv.getId());
                info.setSkuCode(inv.getSkuCode());
                info.setSkuName(inv.getSkuName());
                info.setQuantity(inv.getQuantity());
                return info;
            }).collect(Collectors.toList());
            detail.setStationInventoryList(invList);
        }

        return detail;
    }

    public RouteInfoVO getRouteInfo(Long id) {
        DeliveryOrder order = deliveryOrderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("订单不存在"));

        RouteInfoVO vo = new RouteInfoVO();

        RouteInfoVO.OrderBasicInfo orderInfo = new RouteInfoVO.OrderBasicInfo();
        orderInfo.setOrderId(order.getId());
        orderInfo.setOrderNo(order.getOrderNo());
        orderInfo.setReceiverName(order.getReceiverName());
        orderInfo.setReceiverAddress(order.getReceiverAddress());
        orderInfo.setStatus(order.getStatus());
        orderInfo.setStatusLabel(STATUS_LABEL_MAP.getOrDefault(order.getStatus(), order.getStatus()));
        orderInfo.setPromiseTime(order.getPromiseTime());
        orderInfo.setCreateTime(order.getCreateTime());

        if (order.getRiderId() != null) {
            riderRepository.findById(order.getRiderId()).ifPresent(
                    rider -> orderInfo.setRiderName(rider.getName()));
        }
        vo.setOrderInfo(orderInfo);

        vo.setTimeline(buildTimelineNodes(order));
        vo.setRouteInfo(buildRouteDetailInfo(order));
        vo.setPoints(generateRoutePoints(order));

        return vo;
    }

    private List<RouteInfoVO.TimelineNode> buildTimelineNodes(DeliveryOrder order) {
        List<RouteInfoVO.TimelineNode> nodes = new java.util.ArrayList<>();
        if (order.getSignTime() != null) {
            RouteInfoVO.TimelineNode node = new RouteInfoVO.TimelineNode();
            node.setTime(formatTime(order.getSignTime()));
            node.setLabel("已签收");
            node.setType("success");
            nodes.add(node);
        }
        if (order.getDeliverTime() != null) {
            RouteInfoVO.TimelineNode node = new RouteInfoVO.TimelineNode();
            node.setTime(formatTime(order.getDeliverTime()));
            node.setLabel("配送中");
            node.setType("primary");
            nodes.add(node);
        }
        if (order.getPickupTime() != null) {
            RouteInfoVO.TimelineNode node = new RouteInfoVO.TimelineNode();
            node.setTime(formatTime(order.getPickupTime()));
            node.setLabel("取货出发");
            node.setType("primary");
            nodes.add(node);
        }
        if (order.getAcceptTime() != null) {
            RouteInfoVO.TimelineNode node = new RouteInfoVO.TimelineNode();
            node.setTime(formatTime(order.getAcceptTime()));
            node.setLabel("骑手接单");
            node.setType("primary");
            nodes.add(node);
        }
        if (order.getCreateTime() != null) {
            RouteInfoVO.TimelineNode node = new RouteInfoVO.TimelineNode();
            node.setTime(formatTime(order.getCreateTime()));
            node.setLabel("系统派单");
            node.setType("info");
            nodes.add(node);
        }
        return nodes;
    }

    private RouteInfoVO.RouteDetailInfo buildRouteDetailInfo(DeliveryOrder order) {
        RouteInfoVO.RouteDetailInfo info = new RouteInfoVO.RouteDetailInfo();

        double distance = 8.5;
        info.setDistance(distance);

        if (order.getCreateTime() != null) {
            java.time.LocalDateTime end = order.getSignTime() != null ? order.getSignTime() : java.time.LocalDateTime.now();
            long diffMinutes = java.time.Duration.between(order.getCreateTime(), end).toMinutes();
            info.setElapsedTime(formatDuration(diffMinutes));
        } else {
            info.setElapsedTime("-");
        }

        if (order.getPromiseTime() != null) {
            if ("SIGNED".equals(order.getStatus())) {
                info.setRemainingTime("已完成");
                long actualMinutes = java.time.Duration.between(order.getCreateTime(), order.getSignTime()).toMinutes();
                info.setTotalTime(formatDuration(Math.abs(actualMinutes)));
            } else {
                long remaining = java.time.Duration.between(java.time.LocalDateTime.now(), order.getPromiseTime()).toMinutes();
                if (remaining <= 0) {
                    info.setRemainingTime("已超时");
                    info.setTotalTime(formatDuration(
                            java.time.Duration.between(order.getCreateTime(), order.getPromiseTime()).toMinutes()));
                } else {
                    info.setRemainingTime(formatDuration(remaining));
                    info.setTotalTime(formatDuration(
                            java.time.Duration.between(order.getCreateTime(), order.getPromiseTime()).toMinutes()));
                }
            }
        } else {
            info.setRemainingTime("-");
            info.setTotalTime("-");
        }

        return info;
    }

    private List<RouteInfoVO.RoutePoint> generateRoutePoints(DeliveryOrder order) {
        List<RouteInfoVO.RoutePoint> points = new java.util.ArrayList<>();
        double baseLng = 116.48;
        double baseLat = 39.92;

        points.add(createPoint(baseLng, baseLat, "站点"));
        points.add(createPoint(baseLng - 0.02, baseLat + 0.01, "商家"));
        points.add(createPoint(baseLng - 0.04, baseLat + 0.02, "中转"));

        String status = order.getStatus();
        if ("PICKED_UP".equals(status) || "DELIVERING".equals(status) || "SIGNED".equals(status)) {
            points.add(createPoint(baseLng - 0.06, baseLat + 0.03, "途中"));
        }
        if ("DELIVERING".equals(status) || "SIGNED".equals(status)) {
            points.add(createPoint(baseLng - 0.07, baseLat + 0.04, "配送中"));
        }
        if ("SIGNED".equals(status)) {
            points.add(createPoint(baseLng - 0.08, baseLat + 0.04, "目的地"));
        }

        if (points.size() < 5) {
            points.add(createPoint(baseLng - 0.08, baseLat + 0.04, "目的地"));
        }

        return points;
    }

    private RouteInfoVO.RoutePoint createPoint(double lng, double lat, String label) {
        RouteInfoVO.RoutePoint point = new RouteInfoVO.RoutePoint();
        point.setLng(lng);
        point.setLat(lat);
        point.setLabel(label);
        return point;
    }

    private String formatTime(java.time.LocalDateTime t) {
        return t != null ? t.format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")) : "-";
    }

    private String formatDuration(long minutes) {
        if (minutes < 60) {
            return minutes + "分钟";
        }
        long hours = minutes / 60;
        long mins = minutes % 60;
        return hours + "小时" + mins + "分钟";
    }

    @Transactional
    public DeliveryOrder updateStatus(Long orderId, String status) {
        DeliveryOrder order = deliveryOrderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("订单不存在"));
        order.setStatus(status);
        switch (status) {
            case "PICKED_UP" -> order.setPickupTime(LocalDateTime.now());
            case "DELIVERING" -> order.setDeliverTime(LocalDateTime.now());
            case "SIGNED" -> order.setSignTime(LocalDateTime.now());
        }
        return deliveryOrderRepository.save(order);
    }

    public PageResult<OrderVO> getOrderList(Long riderId, Long stationId, String status, int page, int pageSize) {
        Pageable pageable = PageRequest.of(page - 1, pageSize, Sort.by(Sort.Direction.DESC, "createTime"));
        Page<DeliveryOrder> orderPage;

        if (riderId != null && status != null) {
            orderPage = deliveryOrderRepository.findByRiderIdAndStatus(riderId, status, pageable);
        } else if (status != null) {
            orderPage = deliveryOrderRepository.findByStatus(status, pageable);
        } else if (riderId != null) {
            orderPage = deliveryOrderRepository.findByRiderId(riderId, pageable);
        } else if (stationId != null) {
            orderPage = deliveryOrderRepository.findByStationId(stationId, pageable);
        } else {
            orderPage = deliveryOrderRepository.findAll(pageable);
        }

        List<Long> riderIds = orderPage.getContent().stream()
                .map(DeliveryOrder::getRiderId).filter(java.util.Objects::nonNull).distinct().toList();
        List<Long> stationIds = orderPage.getContent().stream()
                .map(DeliveryOrder::getStationId).filter(java.util.Objects::nonNull).distinct().toList();

        Map<Long, String> riderNameMap = riderRepository.findAllById(riderIds).stream()
                .collect(Collectors.toMap(Rider::getId, Rider::getName));
        Map<Long, String> stationNameMap = stationRepository.findAllById(stationIds).stream()
                .collect(Collectors.toMap(Station::getId, Station::getName));

        List<OrderVO> voList = orderPage.getContent().stream()
                .map(o -> toOrderVO(o, riderNameMap, stationNameMap))
                .collect(Collectors.toList());

        return new PageResult<>(voList, orderPage.getTotalElements(), page, pageSize);
    }

    private OrderVO toOrderVO(DeliveryOrder order, Map<Long, String> riderNameMap, Map<Long, String> stationNameMap) {
        OrderVO vo = new OrderVO();
        vo.setId(order.getId());
        vo.setOrderNo(order.getOrderNo());
        vo.setRiderId(order.getRiderId());
        vo.setRiderName(riderNameMap.getOrDefault(order.getRiderId(), ""));
        vo.setStationId(order.getStationId());
        vo.setStationName(stationNameMap.getOrDefault(order.getStationId(), ""));
        vo.setReceiverName(order.getReceiverName());
        vo.setReceiverPhone(order.getReceiverPhone());
        vo.setReceiverAddress(order.getReceiverAddress());
        vo.setStatus(order.getStatus());
        vo.setStatusLabel(STATUS_LABEL_MAP.getOrDefault(order.getStatus(), order.getStatus()));
        vo.setPromiseTime(order.getPromiseTime());
        vo.setAcceptTime(order.getAcceptTime());
        vo.setPickupTime(order.getPickupTime());
        vo.setDeliverTime(order.getDeliverTime());
        vo.setSignTime(order.getSignTime());
        vo.setCreateTime(order.getCreateTime());
        return vo;
    }
}
