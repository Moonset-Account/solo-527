package com.gym.common.enums;

public enum BookingStatusEnum {
    PENDING("PENDING", "待确认"),
    CONFIRMED("CONFIRMED", "已确认"),
    COMPLETED("COMPLETED", "已完成"),
    CANCELLED("CANCELLED", "已取消"),
    ABSENT("ABSENT", "未到课");

    private final String code;
    private final String desc;

    BookingStatusEnum(String code, String desc) {
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
