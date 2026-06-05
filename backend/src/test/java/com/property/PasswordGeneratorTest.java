package com.property;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class PasswordGeneratorTest {

    @Test
    public void generatePasswordHash() {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(10);
        String password = "123456";
        
        System.out.println("========================================");
        System.out.println("密码: " + password);
        System.out.println("========================================");
        
        for (int i = 1; i <= 5; i++) {
            String hash = encoder.encode(password);
            boolean matches = encoder.matches(password, hash);
            System.out.println("哈希 " + i + ": " + hash);
            System.out.println("验证匹配: " + matches);
            System.out.println();
        }
        
        // 测试已知哈希
        String knownHash = "$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG";
        System.out.println("已知哈希验证: " + encoder.matches(password, knownHash));
    }
}
