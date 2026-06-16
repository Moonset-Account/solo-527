package com.pm.workstation.service;

import com.pm.workstation.dto.PageResultDTO;
import com.pm.workstation.dto.ReportQueryDTO;
import com.pm.workstation.entity.CollaborationReport;
import java.math.BigDecimal;
import java.util.Map;

public interface ReportService {

    CollaborationReport generateDailyReport();

    PageResultDTO<CollaborationReport> getReports(ReportQueryDTO query);

    BigDecimal getDelayRatio(String startDate, String endDate);

    Map<String, Object> getDeptMetrics();
}
