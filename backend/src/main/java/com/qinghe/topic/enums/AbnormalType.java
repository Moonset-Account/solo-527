package com.qinghe.topic.enums;

import lombok.Getter;

@Getter
public enum AbnormalType {
    COPYRIGHT_RISK(1, "版权授权风险"),
    PORTRAIT_RISK(2, "肖像权风险"),
    TRADEMARK_RISK(3, "商标侵权风险"),
    MUSIC_RISK(4, "背景音乐授权"),
    OTHER_RISK(99, "其他风险");

    private final Integer code;
    private final String desc;

    AbnormalType(Integer code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    public static AbnormalType getByCode(Integer code) {
        for (AbnormalType type : values()) {
            if (type.code.equals(code)) {
                return type;
            }
        }
        return null;
    }
}
