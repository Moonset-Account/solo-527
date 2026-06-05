package com.property.common.enums;

import lombok.Getter;

@Getter
@Getter
public enum MessageTypeEnum {
    ORDER_NEW("ORDER_NEW", "新工单"),
    ORDER_ASSIGN("ORDER_ASSIGN", "工单派单"),
    ORDER_COMPLETE("ORDER_COMPLETE", "工单完成"),
    URGENT_REMIND("URGENT_REMIND", "紧急提醒"),
    SYSTEM_NOTICE("SYSTEM_NOTICE", "系统通知");

    private final String code;
    private final String desc;

    MessageTypeEnum(String code, String desc) {
        this.code = code;
        this.desc = desc;
    }
}
