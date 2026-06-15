package com.qinghe.topic.enums;

import lombok.Getter;

@Getter
public enum UserRole {
    CREATOR(1, "内容创作者"),
    REVIEWER(2, "审核员"),
    OPERATOR(3, "新媒体运营"),
    ADMIN(4, "内容负责人");

    private final Integer code;
    private final String desc;

    UserRole(Integer code, String desc) {
        this.code = code;
        this.desc = desc;
    }
}
