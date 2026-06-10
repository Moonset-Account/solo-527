package com.courselearning;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableAsync
@EnableScheduling
@MapperScan("com.courselearning.mapper")
public class CourseLearningApplication {
    public static void main(String[] args) {
        SpringApplication.run(CourseLearningApplication.class, args);
    }
}
