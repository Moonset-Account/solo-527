package com.sales.email;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.sales.email.mapper")
public class EmailAiWorkbenchApplication {

    public static void main(String[] args) {
        SpringApplication.run(EmailAiWorkbenchApplication.class, args);
    }
}
