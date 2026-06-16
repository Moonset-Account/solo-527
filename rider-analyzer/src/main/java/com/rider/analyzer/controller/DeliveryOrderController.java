package com.rider.analyzer.controller;

import com.rider.analyzer.common.Result;
import com.rider.analyzer.dto.OrderAcceptDTO;
import com.rider.analyzer.dto.OrderVO;
import com.rider.analyzer.dto.PageResult;
import com.rider.analyzer.dto.TodoDetailDTO;
import com.rider.analyzer.entity.DeliveryOrder;
import com.rider.analyzer.service.DeliveryOrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class DeliveryOrderController {

    private final DeliveryOrderService deliveryOrderService;

    @PostMapping("/accept")
    public Result<DeliveryOrder> acceptOrder(@Valid @RequestBody OrderAcceptDTO dto) {
        return Result.success(deliveryOrderService.acceptOrder(dto));
    }

    @GetMapping("/todo/{id}")
    public Result<TodoDetailDTO> getTodoDetail(@PathVariable Long id) {
        return Result.success(deliveryOrderService.getTodoDetail(id));
    }

    @GetMapping("/route/{id}")
    public Result<DeliveryOrder> getRouteInfo(@PathVariable Long id) {
        return Result.success(deliveryOrderService.getRouteInfo(id));
    }

    @GetMapping("/list")
    public Result<PageResult<OrderVO>> getOrderList(
            @RequestParam(required = false) Long riderId,
            @RequestParam(required = false) Long stationId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int pageSize) {
        return Result.success(deliveryOrderService.getOrderList(riderId, stationId, status, page, pageSize));
    }
}
