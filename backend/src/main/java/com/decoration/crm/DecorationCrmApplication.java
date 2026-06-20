package com.decoration.crm;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@MapperScan("com.decoration.crm.mapper")
@EnableAsync
@EnableScheduling
public class DecorationCrmApplication {
    public static void main(String[] args) {
        SpringApplication.run(DecorationCrmApplication.class, args);
    }
}
