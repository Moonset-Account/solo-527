package com.gym.common.enums;

public enum MemberStatusEnum {
    ACTIVE("ACTIVE", "正常"),
    FROZEN("FROZEN", "已冻结"),
    EXPIRED("EXPIRED", "已过期"),
    CANCELLED("CANCELLED", "已注销");

    private final String code;
    private final String desc;

    MemberStatusEnum(String code, String desc) {
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
