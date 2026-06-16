package com.rider.analyzer.service;

import com.rider.analyzer.dto.OrderAcceptDTO;
import com.rider.analyzer.dto.TodoDetailDTO;
import com.rider.analyzer.entity.DeliveryOrder;
import com.rider.analyzer.entity.SignRecord;
import com.rider.analyzer.entity.StationInventory;
import com.rider.analyzer.repository.DeliveryOrderRepository;
import com.rider.analyzer.repository.SignRecordRepository;
import com.rider.analyzer.repository.StationInventoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DeliveryOrderService {

    private final DeliveryOrderRepository deliveryOrderRepository;
    private final SignRecordRepository signRecordRepository;
    private final StationInventoryRepository stationInventoryRepository;

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
        detail.setReceiverName(order.getReceiverName());
        detail.setReceiverPhone(order.getReceiverPhone());
        detail.setReceiverAddress(order.getReceiverAddress());
        detail.setStatus(order.getStatus());
        detail.setPromiseTime(order.getPromiseTime());
        detail.setAcceptTime(order.getAcceptTime());
        detail.setPickupTime(order.getPickupTime());
        detail.setDeliverTime(order.getDeliverTime());
        detail.setSignTime(order.getSignTime());

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

    public List<DeliveryOrder> getOrderList(Long riderId, String status) {
        if (riderId != null && status != null) {
            return deliveryOrderRepository.findByRiderIdAndStatus(riderId, status);
        }
        if (status != null) {
            return deliveryOrderRepository.findByStatus(status);
        }
        if (riderId != null) {
            return deliveryOrderRepository.findByRiderId(riderId);
        }
        return deliveryOrderRepository.findAll();
    }
}
