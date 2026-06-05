package com.property.common.enums;

import lombok.Getter;

@Getter
public enum UserRoleEnum {
    ADMIN("ADMIN", "物业主管"),
    PROPERTY("PROPERTY", "物业人员"),
    MAINTENANCE("MAINTENANCE", "维修人员"),
    INSPECTOR("INSPECTOR", "巡检人员"),
    OWNER("OWNER", "业主");

    private final String code;
    private final String desc;

    UserRoleEnum(String code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    public static UserRoleEnum getByCode(String code) {
        for (UserRoleEnum role : values()) {
            if (role.code.equals(code)) {
                return role;
            }
        }
        return null;
    }
}
