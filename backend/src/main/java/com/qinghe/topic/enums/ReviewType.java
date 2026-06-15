package com.qinghe.topic.enums;

import lombok.Getter;

@Getter
public enum ReviewType {
    TOPIC(1, "选题审核"),
    SCRIPT(2, "脚本审核"),
    MATERIAL(3, "素材标签审核");

    private final Integer code;
    private final String desc;

    ReviewType(Integer code, String desc) {
        this.code = code;
        this.desc = desc;
    }
}
