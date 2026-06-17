package com.sales.email.common;

import lombok.Getter;

@Getter
public class BusinessException extends RuntimeException {

    private final Integer code;
    private final Result.ErrorAction action;

    public BusinessException(String message) {
        super(message);
        this.code = 500;
        this.action = null;
    }

    public BusinessException(Integer code, String message) {
        super(message);
        this.code = code;
        this.action = null;
    }

    public BusinessException(Integer code, String message, Result.ErrorAction action) {
        super(message);
        this.code = code;
        this.action = action;
    }

    public static BusinessException retryable(String message) {
        return new BusinessException(5001, message, Result.ErrorAction.RETRY);
    }

    public static BusinessException skippable(String message) {
        return new BusinessException(5002, message, Result.ErrorAction.SKIP);
    }

    public static BusinessException needAdmin(String message) {
        return new BusinessException(5003, message, Result.ErrorAction.CONTACT_ADMIN);
    }
}
