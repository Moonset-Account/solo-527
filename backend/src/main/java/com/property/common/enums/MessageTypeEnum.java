package com.property.common.enums;

public enum MessageTypeEnum {
    SYSTEM_NOTICE("SYSTEM_NOTICE", "系统通知"),
    WORK_ORDER("WORK_ORDER", "工单通知"),
    EXPENSE("EXPENSE", "费用通知"),
    INSPECTION("INSPECTION", "巡检通知"),
    URGENT_REMIND("URGENT_REMIND", "紧急提醒"),
    ORDER_NEW("ORDER_NEW", "新工单提醒"),
    ORDER_ASSIGN("ORDER_ASSIGN", "工单派单提醒"),
    ORDER_COMPLETE("ORDER_COMPLETE", "工单完成提醒");

    private final String code;
    private final String desc;

    MessageTypeEnum(String code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    public String getCode() {
        return code;
    }

    public String getDesc() {
        return desc;
    }
}
