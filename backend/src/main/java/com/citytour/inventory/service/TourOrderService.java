package com.citytour.inventory.service;

import com.citytour.inventory.dto.PageResult;
import com.citytour.inventory.entity.TourOrder;
import com.citytour.inventory.repository.TourOrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TourOrderService {

    private final TourOrderRepository tourOrderRepository;
    private final RoomInventoryService roomInventoryService;

    public PageResult<TourOrder> list(int page, int size, String orderNo, Long routeId,
                                      String customerName, String customerPhone,
                                      LocalDate startDate, LocalDate endDate,
                                      String orderStatus, String refundStatus) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
        Page<TourOrder> result = tourOrderRepository.findByConditions(
                orderNo, routeId, customerName, customerPhone,
                startDate, endDate, orderStatus, refundStatus, pageRequest);
        return new PageResult<>(result.getContent(), result.getTotalElements(), page, size);
    }

    public TourOrder getById(Long id) {
        return tourOrderRepository.findById(id).orElse(null);
    }

    public TourOrder getByOrderNo(String orderNo) {
        return tourOrderRepository.findByOrderNo(orderNo).orElse(null);
    }

    @Transactional
    public TourOrder create(TourOrder order) {
        if (order.getOrderNo() == null) {
            order.setOrderNo("TO" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 4).toUpperCase());
        }
        if (order.getOrderStatus() == null) {
            order.setOrderStatus("PENDING");
        }
        if (order.getRefundStatus() == null) {
            order.setRefundStatus("NONE");
        }
        if (order.getVersion() == null) {
            order.setVersion(1);
        }
        return tourOrderRepository.save(order);
    }

    @Transactional
    public TourOrder update(TourOrder order) {
        TourOrder existing = tourOrderRepository.findById(order.getId()).orElseThrow();
        order.setVersion(existing.getVersion() + 1);
        return tourOrderRepository.save(order);
    }

    @Transactional
    public TourOrder updateStatus(Long id, String status, String operator) {
        TourOrder order = tourOrderRepository.findById(id).orElseThrow();
        order.setOrderStatus(status);
        order.setUpdatedBy(operator);
        order.setVersion(order.getVersion() + 1);
        return tourOrderRepository.save(order);
    }

    @Transactional
    public void delete(Long id) {
        tourOrderRepository.deleteById(id);
    }
}
