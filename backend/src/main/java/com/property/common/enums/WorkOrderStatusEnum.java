package com.property.common.enums;

import lombok.Getter;

@Getter
public enum WorkOrderStatusEnum {
    PENDING("PENDING", "待审核"),
    APPROVED("APPROVED", "已审核派单"),
    PROCESSING("PROCESSING", "处理中"),
    COMPLETED("COMPLETED", "待验收"),
    CLOSED("CLOSED", "已关闭"),
    REJECTED("REJECTED", "已驳回");

    private final String code;
    private final String desc;

    WorkOrderStatusEnum(String code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    public static WorkOrderStatusEnum getByCode(String code) {
        for (WorkOrderStatusEnum status : values()) {
            if (status.code.equals(code)) {
                return status;
            }
        }
        return null;
    }
}
