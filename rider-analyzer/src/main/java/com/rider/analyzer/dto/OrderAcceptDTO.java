package com.rider.analyzer.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class OrderAcceptDTO {

    @NotNull(message = "订单ID不能为空")
    private Long orderId;

    @NotNull(message = "骑手ID不能为空")
    private Long riderId;
}
