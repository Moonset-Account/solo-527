package com.badminton.arena.entity;

import com.alibaba.excel.annotation.ExcelIgnore;
import com.alibaba.excel.annotation.ExcelProperty;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.io.Serializable;
import java.time.LocalDateTime;

@TableName("api_log")
public class ApiLog implements Serializable {

    @TableId(type = IdType.AUTO)
    @ExcelProperty("日志ID")
    private Long id;

    @ExcelProperty("链路ID")
    private String traceId;

    @ExcelProperty("接口路径")
    private String apiPath;

    @ExcelProperty("请求方法")
    private String apiMethod;

    @ExcelIgnore
    private String requestParams;

    @ExcelIgnore
    private String responseData;

    @ExcelProperty("状态")
    private Integer status;

    @ExcelProperty("错误信息")
    private String errorMsg;

    @ExcelProperty("重试次数")
    private Integer retryCount;

    @ExcelProperty("最大重试次数")
    private Integer maxRetry;

    @ExcelProperty("是否需要重试")
    private Integer needRetry;

    @ExcelProperty("耗时(ms)")
    private Integer costTime;

    @ExcelProperty("用户ID")
    private Long userId;

    @TableField(fill = com.baomidou.mybatisplus.annotation.FieldFill.INSERT)
    @ExcelProperty("创建时间")
    private LocalDateTime createTime;

    @TableField(fill = com.baomidou.mybatisplus.annotation.FieldFill.INSERT_UPDATE)
    @ExcelProperty("更新时间")
    private LocalDateTime updateTime;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTraceId() {
        return traceId;
    }

    public void setTraceId(String traceId) {
        this.traceId = traceId;
    }

    public String getApiPath() {
        return apiPath;
    }

    public void setApiPath(String apiPath) {
        this.apiPath = apiPath;
    }

    public String getApiMethod() {
        return apiMethod;
    }

    public void setApiMethod(String apiMethod) {
        this.apiMethod = apiMethod;
    }

    public String getRequestParams() {
        return requestParams;
    }

    public void setRequestParams(String requestParams) {
        this.requestParams = requestParams;
    }

    public String getResponseData() {
        return responseData;
    }

    public void setResponseData(String responseData) {
        this.responseData = responseData;
    }

    public Integer getStatus() {
        return status;
    }

    public void setStatus(Integer status) {
        this.status = status;
    }

    public String getErrorMsg() {
        return errorMsg;
    }

    public void setErrorMsg(String errorMsg) {
        this.errorMsg = errorMsg;
    }

    public Integer getRetryCount() {
        return retryCount;
    }

    public void setRetryCount(Integer retryCount) {
        this.retryCount = retryCount;
    }

    public Integer getMaxRetry() {
        return maxRetry;
    }

    public void setMaxRetry(Integer maxRetry) {
        this.maxRetry = maxRetry;
    }

    public Integer getNeedRetry() {
        return needRetry;
    }

    public void setNeedRetry(Integer needRetry) {
        this.needRetry = needRetry;
    }

    public Integer getCostTime() {
        return costTime;
    }

    public void setCostTime(Integer costTime) {
        this.costTime = costTime;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public LocalDateTime getCreateTime() {
        return createTime;
    }

    public void setCreateTime(LocalDateTime createTime) {
        this.createTime = createTime;
    }

    public LocalDateTime getUpdateTime() {
        return updateTime;
    }

    public void setUpdateTime(LocalDateTime updateTime) {
        this.updateTime = updateTime;
    }
}
