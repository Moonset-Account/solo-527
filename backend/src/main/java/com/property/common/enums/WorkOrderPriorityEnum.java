package com.property.common.enums;

import lombok.Getter;

@Getter
@Getter
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

    public static WorkOrderPriorityEnum getByCode(String code) {
        for (WorkOrderPriorityEnum priority : values()) {
            if (priority.code.equals(code)) {
                return priority;
            }
        }
        return null;
    }

    public static boolean isUrgent(String code) {
        return URGENT.code.equals(code);
    }
}
