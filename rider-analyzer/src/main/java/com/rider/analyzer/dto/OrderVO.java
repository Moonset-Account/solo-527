package com.rider.analyzer.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class OrderVO {

    private Long id;
    private String orderNo;
    private Long riderId;
    private String riderName;
    private Long stationId;
    private String stationName;
    private String receiverName;
    private String receiverPhone;
    private String receiverAddress;
    private String status;
    private String statusLabel;
    private LocalDateTime promiseTime;
    private LocalDateTime acceptTime;
    private LocalDateTime pickupTime;
    private LocalDateTime deliverTime;
    private LocalDateTime signTime;
    private LocalDateTime createTime;
}
