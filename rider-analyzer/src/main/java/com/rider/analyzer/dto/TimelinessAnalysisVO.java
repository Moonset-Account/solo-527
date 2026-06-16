package com.rider.analyzer.dto;

import lombok.Data;
import java.util.List;

@Data
public class TimelinessAnalysisVO {

    private List<TimelinessAnalysisDTO> nodeStats;
    private List<TimeoutReasonVO> timeoutReasons;
    private List<TimeoutOrderDetailVO> timeoutOrders;
}
