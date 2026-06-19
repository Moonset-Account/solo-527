package com.decoration.cooperation.service;

import com.decoration.cooperation.vo.DealPredictionVO;

import java.util.Map;

public interface ReportService {

    DealPredictionVO getDealPrediction();

    Map<String, Object> getDashboardStatistics();
}
