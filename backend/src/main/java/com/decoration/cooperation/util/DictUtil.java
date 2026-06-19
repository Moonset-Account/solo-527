package com.decoration.cooperation.util;

import java.util.HashMap;
import java.util.Map;

public class DictUtil {

    private static final Map<String, String> LEAD_STATUS_MAP = new HashMap<>();
    private static final Map<String, String> FOLLOW_STAGE_MAP = new HashMap<>();
    private static final Map<String, String> LEAD_SOURCE_MAP = new HashMap<>();
    private static final Map<String, String> CONTRACT_STATUS_MAP = new HashMap<>();
    private static final Map<String, String> APPROVAL_STATUS_MAP = new HashMap<>();
    private static final Map<String, String> PAYMENT_PLAN_STATUS_MAP = new HashMap<>();
    private static final Map<Integer, String> IMPORTANCE_MAP = new HashMap<>();
    private static final Map<String, String> DECORATION_TYPE_MAP = new HashMap<>();
    private static final Map<Integer, String> TASK_PRIORITY_MAP = new HashMap<>();
    private static final Map<String, String> TASK_STATUS_MAP = new HashMap<>();
    private static final Map<String, String> CONFLICT_FLAG_MAP = new HashMap<>();

    static {
        LEAD_STATUS_MAP.put("NEW", "新建");
        LEAD_STATUS_MAP.put("FOLLOWING", "跟进中");
        LEAD_STATUS_MAP.put("MEASURED", "已量房");
        LEAD_STATUS_MAP.put("DESIGNED", "已出方案");
        LEAD_STATUS_MAP.put("QUOTED", "已报价");
        LEAD_STATUS_MAP.put("NEGOTIATING", "洽谈中");
        LEAD_STATUS_MAP.put("DEALED", "已成交");
        LEAD_STATUS_MAP.put("LOST", "已流失");
        LEAD_STATUS_MAP.put("INVALID", "无效");

        FOLLOW_STAGE_MAP.put("INITIAL_CONTACT", "初次接触");
        FOLLOW_STAGE_MAP.put("DEMAND_COMMUNICATION", "需求沟通");
        FOLLOW_STAGE_MAP.put("HOUSE_MEASURE", "量房阶段");
        FOLLOW_STAGE_MAP.put("DESIGN_DRAFT", "方案设计");
        FOLLOW_STAGE_MAP.put("QUOTE_REVIEW", "报价审核");
        FOLLOW_STAGE_MAP.put("BARGAINING", "议价阶段");
        FOLLOW_STAGE_MAP.put("CONTRACT_READY", "准备签约");
        FOLLOW_STAGE_MAP.put("SIGNED", "已签约");

        LEAD_SOURCE_MAP.put("ONLINE_AD", "网络广告");
        LEAD_SOURCE_MAP.put("REFERRAL", "老客户转介绍");
        LEAD_SOURCE_MAP.put("EXHIBITION", "展会活动");
        LEAD_SOURCE_MAP.put("COMMUNITY", "小区推广");
        LEAD_SOURCE_MAP.put("TELEMARKETING", "电话营销");
        LEAD_SOURCE_MAP.put("WECHAT", "微信公众号");
        LEAD_SOURCE_MAP.put("DOUYIN", "抖音");
        LEAD_SOURCE_MAP.put("XIAOHONGSHU", "小红书");
        LEAD_SOURCE_MAP.put("WALK_IN", "门店来访");
        LEAD_SOURCE_MAP.put("OTHER", "其他");

        CONTRACT_STATUS_MAP.put("DRAFT", "草稿");
        CONTRACT_STATUS_MAP.put("PENDING_APPROVAL", "待审批");
        CONTRACT_STATUS_MAP.put("APPROVED", "已通过");
        CONTRACT_STATUS_MAP.put("REJECTED", "已驳回");
        CONTRACT_STATUS_MAP.put("SIGNED", "已签约");
        CONTRACT_STATUS_MAP.put("EXECUTING", "执行中");
        CONTRACT_STATUS_MAP.put("COMPLETED", "已完成");
        CONTRACT_STATUS_MAP.put("CANCELLED", "已取消");

        APPROVAL_STATUS_MAP.put("PENDING", "待审批");
        APPROVAL_STATUS_MAP.put("APPROVING", "审批中");
        APPROVAL_STATUS_MAP.put("APPROVED", "已通过");
        APPROVAL_STATUS_MAP.put("REJECTED", "已驳回");
        APPROVAL_STATUS_MAP.put("WITHDRAWN", "已撤回");

        PAYMENT_PLAN_STATUS_MAP.put("UNPAID", "未支付");
        PAYMENT_PLAN_STATUS_MAP.put("PARTIAL", "部分支付");
        PAYMENT_PLAN_STATUS_MAP.put("PAID", "已支付");
        PAYMENT_PLAN_STATUS_MAP.put("OVERDUE", "已逾期");

        IMPORTANCE_MAP.put(1, "一般");
        IMPORTANCE_MAP.put(2, "重要");
        IMPORTANCE_MAP.put(3, "紧急");

        DECORATION_TYPE_MAP.put("NEW_HOUSE", "新房装修");
        DECORATION_TYPE_MAP.put("OLD_RENOVATION", "旧房翻新");
        DECORATION_TYPE_MAP.put("PARTIAL", "局部改造");
        DECORATION_TYPE_MAP.put("SOFT_OUTFIT", "软装搭配");
        DECORATION_TYPE_MAP.put("COMMERCIAL", "商业空间");
        DECORATION_TYPE_MAP.put("OFFICE", "办公空间");

        TASK_PRIORITY_MAP.put(1, "低");
        TASK_PRIORITY_MAP.put(2, "中");
        TASK_PRIORITY_MAP.put(3, "高");
        TASK_PRIORITY_MAP.put(4, "紧急");

        TASK_STATUS_MAP.put("PENDING", "待处理");
        TASK_STATUS_MAP.put("PROCESSING", "处理中");
        TASK_STATUS_MAP.put("COMPLETED", "已完成");
        TASK_STATUS_MAP.put("OVERDUE", "已逾期");
        TASK_STATUS_MAP.put("CANCELLED", "已取消");

        CONFLICT_FLAG_MAP.put("0", "无冲突");
        CONFLICT_FLAG_MAP.put("1", "存在冲突");
    }

    public static String getLeadStatusName(String code) {
        return LEAD_STATUS_MAP.getOrDefault(code, code);
    }

    public static String getFollowStageName(String code) {
        return FOLLOW_STAGE_MAP.getOrDefault(code, code);
    }

    public static String getLeadSourceName(String code) {
        return LEAD_SOURCE_MAP.getOrDefault(code, code);
    }

    public static String getContractStatusName(String code) {
        return CONTRACT_STATUS_MAP.getOrDefault(code, code);
    }

    public static String getApprovalStatusName(String code) {
        return APPROVAL_STATUS_MAP.getOrDefault(code, code);
    }

    public static String getPaymentPlanStatusName(String code) {
        return PAYMENT_PLAN_STATUS_MAP.getOrDefault(code, code);
    }

    public static String getImportanceName(Integer code) {
        return code == null ? "" : IMPORTANCE_MAP.getOrDefault(code, String.valueOf(code));
    }

    public static String getDecorationTypeName(String code) {
        return DECORATION_TYPE_MAP.getOrDefault(code, code);
    }

    public static String getTaskPriorityName(Integer code) {
        return code == null ? "" : TASK_PRIORITY_MAP.getOrDefault(code, String.valueOf(code));
    }

    public static String getTaskStatusName(String code) {
        return TASK_STATUS_MAP.getOrDefault(code, code);
    }

    public static String getConflictFlagName(String code) {
        return CONFLICT_FLAG_MAP.getOrDefault(code, code);
    }

    public static Map<String, String> getLeadStatusMap() {
        return new HashMap<>(LEAD_STATUS_MAP);
    }

    public static Map<String, String> getFollowStageMap() {
        return new HashMap<>(FOLLOW_STAGE_MAP);
    }

    public static Map<String, String> getLeadSourceMap() {
        return new HashMap<>(LEAD_SOURCE_MAP);
    }

    public static Map<String, String> getContractStatusMap() {
        return new HashMap<>(CONTRACT_STATUS_MAP);
    }

    public static Map<String, String> getApprovalStatusMap() {
        return new HashMap<>(APPROVAL_STATUS_MAP);
    }

    public static Map<String, String> getPaymentPlanStatusMap() {
        return new HashMap<>(PAYMENT_PLAN_STATUS_MAP);
    }

    public static Map<Integer, String> getImportanceMap() {
        return new HashMap<>(IMPORTANCE_MAP);
    }

    public static Map<String, String> getDecorationTypeMap() {
        return new HashMap<>(DECORATION_TYPE_MAP);
    }

    public static Map<Integer, String> getTaskPriorityMap() {
        return new HashMap<>(TASK_PRIORITY_MAP);
    }

    public static Map<String, String> getTaskStatusMap() {
        return new HashMap<>(TASK_STATUS_MAP);
    }
}
