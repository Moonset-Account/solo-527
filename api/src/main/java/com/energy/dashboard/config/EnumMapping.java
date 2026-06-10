package com.energy.dashboard.config;

import java.util.Arrays;
import java.util.List;

public class EnumMapping {

    public static String mapMeterStatus(String dbStatus) {
        if (dbStatus == null) return "fault";
        switch (dbStatus) {
            case "online": return "online";
            case "offline": return "offline";
            case "warning": return "fault";
            default: return "fault";
        }
    }

    public static String reverseMeterStatus(String frontStatus) {
        if (frontStatus == null) return null;
        switch (frontStatus) {
            case "online": return "online";
            case "offline": return "offline";
            case "fault": return "warning";
            default: return null;
        }
    }

    public static String mapAlarmLevel(String dbLevel) {
        if (dbLevel == null) return "info";
        switch (dbLevel) {
            case "high": return "critical";
            case "medium": return "warning";
            case "low": return "info";
            default: return "info";
        }
    }

    public static String reverseAlarmLevel(String frontLevel) {
        if (frontLevel == null) return null;
        switch (frontLevel) {
            case "critical": return "high";
            case "warning": return "medium";
            case "info": return "low";
            default: return null;
        }
    }

    public static String mapAlarmType(String dbType) {
        if (dbType == null) return "data_anomaly";
        switch (dbType) {
            case "over_limit": return "peak_anomaly";
            case "communication_failure": return "communication_loss";
            case "abnormal_reading": return "data_anomaly";
            case "equipment_fault": return "device_fault";
            default: return "data_anomaly";
        }
    }

    public static String reverseAlarmType(String frontType) {
        if (frontType == null) return null;
        switch (frontType) {
            case "peak_anomaly": return "over_limit";
            case "communication_loss": return "communication_failure";
            case "data_anomaly": return "abnormal_reading";
            case "device_fault": return "equipment_fault";
            default: return null;
        }
    }

    public static String mapSyncStatus(String dbStatus) {
        if (dbStatus == null) return "pending";
        switch (dbStatus) {
            case "completed": return "success";
            case "failed": return "failed";
            case "pending": return "pending";
            case "running": return "running";
            default: return "pending";
        }
    }

    public static String reverseSyncStatus(String frontStatus) {
        if (frontStatus == null) return null;
        switch (frontStatus) {
            case "success": return "completed";
            case "failed": return "failed";
            case "pending": return "pending";
            case "running": return "running";
            default: return null;
        }
    }

    public static String mapSyncType(String dbType) {
        if (dbType == null) return "meter_reading";
        switch (dbType) {
            case "manual":
            case "scheduled":
                return "meter_reading";
            default: return "meter_reading";
        }
    }

    public static List<String> reverseSyncType(String frontType) {
        if ("meter_reading".equals(frontType)) {
            return Arrays.asList("manual", "scheduled");
        }
        if ("meter_config".equals(frontType)) {
            return Arrays.asList("manual", "scheduled");
        }
        if ("alarm_sync".equals(frontType)) {
            return Arrays.asList("manual", "scheduled");
        }
        return null;
    }

    public static String mapSyncFailCategory(String dbCategory) {
        if (dbCategory == null) return "unknown";
        switch (dbCategory) {
            case "communication":
            case "timeout":
                return "network";
            case "equipment":
                return "config";
            case "data":
                return "data";
            default: return "unknown";
        }
    }

    public static List<String> reverseSyncFailCategory(String frontCategory) {
        if (frontCategory == null) return null;
        switch (frontCategory) {
            case "network": return Arrays.asList("communication", "timeout");
            case "config": return Arrays.asList("equipment");
            case "data": return Arrays.asList("data");
            default: return null;
        }
    }
}
