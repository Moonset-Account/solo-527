package com.gym.common.enums;

import lombok.Getter;

@Getter
public enum RoleEnum {
    ADMIN("ADMIN", "系统管理员"),
    MANAGER("MANAGER", "店长/合伙人"),
    COACH("COACH", "教练"),
    RECEPTION("RECEPTION", "前台"),
    MEMBER("MEMBER", "会员");

    private final String code;
    private final String desc;

    RoleEnum(String code, String desc) {
        this.code = code;
        this.desc = desc;
    }
}
