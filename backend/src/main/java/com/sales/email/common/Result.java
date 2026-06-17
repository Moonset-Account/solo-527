package com.sales.email.common;

import lombok.Data;

import java.io.Serializable;

@Data
public class Result<T> implements Serializable {

    private Integer code;
    private String message;
    private T data;
    private Boolean success;
    private ErrorAction action;

    public Result() {
    }

    public Result(Integer code, String message, T data, Boolean success) {
        this.code = code;
        this.message = message;
        this.data = data;
        this.success = success;
    }

    public static <T> Result<T> success() {
        return new Result<>(200, "操作成功", null, true);
    }

    public static <T> Result<T> success(T data) {
        return new Result<>(200, "操作成功", data, true);
    }

    public static <T> Result<T> success(String message, T data) {
        return new Result<>(200, message, data, true);
    }

    public static <T> Result<T> error(String message) {
        return new Result<>(500, message, null, false);
    }

    public static <T> Result<T> error(Integer code, String message) {
        return new Result<>(code, message, null, false);
    }

    public static <T> Result<T> error(Integer code, String message, ErrorAction action) {
        Result<T> result = new Result<>(code, message, null, false);
        result.setAction(action);
        return result;
    }

    public static <T> Result<T> retryable(String message) {
        Result<T> result = new Result<>(5001, message, null, false);
        result.setAction(ErrorAction.RETRY);
        return result;
    }

    public static <T> Result<T> skippable(String message) {
        Result<T> result = new Result<>(5002, message, null, false);
        result.setAction(ErrorAction.SKIP);
        return result;
    }

    public static <T> Result<T> needAdmin(String message) {
        Result<T> result = new Result<>(5003, message, null, false);
        result.setAction(ErrorAction.CONTACT_ADMIN);
        return result;
    }

    @Data
    public static class ErrorAction implements Serializable {
        private String type;
        private String description;
        private String retryEndpoint;

        public ErrorAction(String type, String description) {
            this.type = type;
            this.description = description;
        }

        public ErrorAction(String type, String description, String retryEndpoint) {
            this.type = type;
            this.description = description;
            this.retryEndpoint = retryEndpoint;
        }

        public static final ErrorAction RETRY = new ErrorAction("RETRY", "操作失败，可点击重试按钮重新执行");
        public static final ErrorAction SKIP = new ErrorAction("SKIP", "该步骤可跳过，不影响核心流程");
        public static final ErrorAction CONTACT_ADMIN = new ErrorAction("CONTACT_ADMIN", "请联系系统管理员处理");
    }
}
