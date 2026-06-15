package com.qinghe.topic.enums;

import lombok.Getter;

@Getter
public enum TaskStatus {
    PENDING(1, "待办"),
    PROCESSING(2, "处理中"),
    COMPLETED(3, "已完成"),
    ABNORMAL(4, "异常");

    private final Integer code;
    private final String desc;

    TaskStatus(Integer code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    public static TaskStatus getByCode(Integer code) {
        for (TaskStatus status : values()) {
            if (status.code.equals(code)) {
                return status;
            }
        }
        return null;
    }
}
