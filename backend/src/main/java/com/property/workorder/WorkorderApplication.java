package com.property.workorder;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@MapperScan("com.property.workorder.mapper")
public class WorkorderApplication {
    public static void main(String[] args) {
        SpringApplication.run(WorkorderApplication.class, args);
    }
}
