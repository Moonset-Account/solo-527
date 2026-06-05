package com.property.utils;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class PasswordEncoderUtil {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String password = "123456";
        
        for (int i = 0; i < 5; i++) {
            String encodedPassword = encoder.encode(password);
            System.out.println("密码 " + password + " 的BCrypt哈希值 " + (i+1) + ":");
            System.out.println(encodedPassword);
            System.out.println("验证匹配: " + encoder.matches(password, encodedPassword));
            System.out.println();
        }
    }
}
