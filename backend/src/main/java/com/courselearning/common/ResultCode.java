package com.courselearning.common;

import lombok.Getter;

@Getter
public enum ResultCode {

    SUCCESS(200, "操作成功"),
    ERROR(500, "操作失败"),

    BAD_REQUEST(400, "请求参数错误"),
    UNAUTHORIZED(401, "未登录或登录已过期"),
    FORBIDDEN(403, "没有权限访问"),
    NOT_FOUND(404, "资源不存在"),
    METHOD_NOT_ALLOWED(405, "请求方法不允许"),

    USERNAME_EXIST(1001, "用户名已存在"),
    USERNAME_NOT_EXIST(1002, "用户名不存在"),
    PASSWORD_ERROR(1003, "密码错误"),
    USER_DISABLED(1004, "账号已被禁用"),
    INVITE_CODE_INVALID(1005, "邀请码无效"),

    COURSE_NOT_EXIST(2001, "课程不存在"),
    COURSE_OFF_SHELF(2002, "课程已下架"),
    CHAPTER_NOT_EXIST(2003, "章节不存在"),

    ORDER_NOT_EXIST(3001, "订单不存在"),
    ORDER_PAID(3002, "订单已支付"),
    ORDER_STATUS_ERROR(3003, "订单状态错误"),

    MEMBER_EXPIRED(4001, "会员已过期"),
    NOT_MEMBER(4002, "不是会员"),

    COMMISSION_STATUS_ERROR(5001, "佣金状态错误"),

    TOKEN_INVALID(6001, "Token无效"),
    TOKEN_EXPIRED(6002, "Token已过期");

    private final Integer code;

    private final String message;

    ResultCode(Integer code, String message) {
        this.code = code;
        this.message = message;
    }
}
