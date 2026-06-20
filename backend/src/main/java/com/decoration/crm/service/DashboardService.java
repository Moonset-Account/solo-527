package com.decoration.crm.service;

import com.decoration.crm.entity.FunnelStage;
import java.util.List;
import java.util.Map;

public interface DashboardService {
    List<FunnelStage> getFunnelStages();
    List<Map<String, Object>> getFunnelData();
    Map<String, Object> getStatistics();
}
