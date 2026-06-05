package com.property.common.enums;

public enum WorkOrderPriorityEnum {
    LOW("LOW", "低"),
    NORMAL("NORMAL", "普通"),
    HIGH("HIGH", "高"),
    URGENT("URGENT", "紧急");

    private final String code;
    private final String desc;

    WorkOrderPriorityEnum(String code, String desc) {
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
