package com.rider.analyzer.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class RouteInfoVO {

    private OrderBasicInfo orderInfo;
    private List<TimelineNode> timeline;
    private RouteDetailInfo routeInfo;
    private List<RoutePoint> points;

    @Data
    public static class RoutePoint {
        private Double lng;
        private Double lat;
        private String label;
    }

    @Data
    public static class OrderBasicInfo {
        private Long orderId;
        private String orderNo;
        private String receiverName;
        private String receiverAddress;
        private String riderName;
        private String status;
        private String statusLabel;
        private LocalDateTime promiseTime;
        private LocalDateTime createTime;
    }

    @Data
    public static class TimelineNode {
        private String time;
        private String label;
        private String type;
    }

    @Data
    public static class RouteDetailInfo {
        private String totalTime;
        private String elapsedTime;
        private String remainingTime;
        private Double distance;
    }
}
