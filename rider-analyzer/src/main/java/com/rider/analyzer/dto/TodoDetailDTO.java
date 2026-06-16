package com.rider.analyzer.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class TodoDetailDTO {

    private Long orderId;
    private String orderNo;
    private String receiverName;
    private String receiverPhone;
    private String receiverAddress;
    private String status;
    private LocalDateTime promiseTime;
    private LocalDateTime acceptTime;
    private LocalDateTime pickupTime;
    private LocalDateTime deliverTime;
    private LocalDateTime signTime;

    private SignRecordInfo signRecord;
    private List<StationInventoryInfo> stationInventoryList;

    @Data
    public static class SignRecordInfo {
        private Long id;
        private Integer expectedQty;
        private Integer actualQty;
        private Integer diffQty;
        private String diffReason;
        private String signType;
    }

    @Data
    public static class StationInventoryInfo {
        private Long id;
        private String skuCode;
        private String skuName;
        private Integer quantity;
    }
}
