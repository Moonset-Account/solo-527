package com.energy.service;

import com.energy.dto.AlertQueryDTO;
import com.energy.dto.AssignAlertDTO;
import com.energy.dto.HandleAlertDTO;
import com.energy.entity.Alert;
import com.energy.entity.AlertHandling;
import org.springframework.data.domain.Page;

import java.util.List;
import java.util.Map;

public interface AlertService {
    Page<Alert> queryAlerts(AlertQueryDTO dto);
    Alert getAlertById(Long id);
    Alert assignAlert(AssignAlertDTO dto);
    AlertHandling handleAlert(HandleAlertDTO dto);
    List<AlertHandling> getHandlingHistory(Long alertId);
    Map<String, Long> getAlertStats();
    List<Alert> getAbnormalMeters(AlertQueryDTO dto);
}
