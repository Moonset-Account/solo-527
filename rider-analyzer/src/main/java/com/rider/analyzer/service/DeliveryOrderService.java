package com.rider.analyzer.service;

import com.rider.analyzer.dto.OrderAcceptDTO;
import com.rider.analyzer.dto.OrderVO;
import com.rider.analyzer.dto.PageResult;
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

    public DeliveryOrder getRouteInfo(Long id) {
        return deliveryOrderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("订单不存在"));
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
