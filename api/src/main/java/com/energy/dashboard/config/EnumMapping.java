package com.energy.dashboard.config;

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

    public static String mapAlarmLevel(String dbLevel) {
        if (dbLevel == null) return "info";
        switch (dbLevel) {
            case "high": return "critical";
            case "medium": return "warning";
            case "low": return "info";
            default: return "info";
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

    public static String mapSyncType(String dbType) {
        if (dbType == null) return "meter_reading";
        switch (dbType) {
            case "manual":
            case "scheduled":
                return "meter_reading";
            default: return "meter_reading";
        }
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
}
