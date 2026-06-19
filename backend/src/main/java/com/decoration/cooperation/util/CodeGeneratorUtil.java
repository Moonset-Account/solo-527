package com.decoration.cooperation.util;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.atomic.AtomicInteger;

public class CodeGeneratorUtil {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
    private static final AtomicInteger LEAD_SEQUENCE = new AtomicInteger(1);
    private static final AtomicInteger CONTRACT_SEQUENCE = new AtomicInteger(1);
    private static final AtomicInteger APPROVAL_SEQUENCE = new AtomicInteger(1);
    private static final AtomicInteger TASK_SEQUENCE = new AtomicInteger(1);

    public static String generateLeadNo() {
        String timestamp = LocalDateTime.now().format(DATE_FORMATTER);
        int seq = LEAD_SEQUENCE.getAndIncrement() % 10000;
        return "XS" + timestamp + String.format("%04d", seq);
    }

    public static String generateContractNo() {
        String timestamp = LocalDateTime.now().format(DATE_FORMATTER);
        int seq = CONTRACT_SEQUENCE.getAndIncrement() % 10000;
        return "HT" + timestamp + String.format("%04d", seq);
    }

    public static String generateApprovalNo() {
        String timestamp = LocalDateTime.now().format(DATE_FORMATTER);
        int seq = APPROVAL_SEQUENCE.getAndIncrement() % 10000;
        return "SP" + timestamp + String.format("%04d", seq);
    }

    public static String generateTaskNo() {
        String timestamp = LocalDateTime.now().format(DATE_FORMATTER);
        int seq = TASK_SEQUENCE.getAndIncrement() % 10000;
        return "RW" + timestamp + String.format("%04d", seq);
    }
}
