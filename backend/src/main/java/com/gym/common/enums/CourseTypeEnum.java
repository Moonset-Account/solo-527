package com.gym.common.enums;

import lombok.Getter;

@Getter
public enum CourseTypeEnum {
    PERSONAL("PERSONAL", "私教课"),
    GROUP("GROUP", "团课");

    private final String code;
    private final String desc;

    CourseTypeEnum(String code, String desc) {
        this.code = code;
        this.desc = desc;
    }
}
