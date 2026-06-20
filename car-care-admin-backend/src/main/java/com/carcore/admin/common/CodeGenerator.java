package com.carcore.admin.common;

import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class CodeGenerator {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
    private static final AtomicInteger SEQUENCE = new AtomicInteger(1);

    public String generate(String prefix) {
        String timestamp = LocalDateTime.now().format(DATE_FORMATTER);
        int seq = SEQUENCE.getAndIncrement();
        if (seq > 9999) {
            SEQUENCE.set(1);
            seq = 1;
        }
        return prefix + timestamp + String.format("%04d", seq);
    }

    public String generateDetectionRecordNo() {
        return generate("DET");
    }

    public String generatePackageCode() {
        return generate("PKG");
    }

    public String generatePackageOrderNo() {
        return generate("ORD");
    }

    public String generateRepairOrderNo() {
        return generate("WO");
    }

    public String generateTestDriveNo() {
        return generate("TD");
    }

    public String generateBatchNo() {
        return generate("BATCH");
    }

    public String generateExceptionNo() {
        return generate("EX");
    }

    public String generateReportNo() {
        return generate("RPT");
    }
}
