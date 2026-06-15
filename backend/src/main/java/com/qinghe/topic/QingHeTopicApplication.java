package com.qinghe.topic;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.qinghe.topic.mapper")
public class QingHeTopicApplication {
    public static void main(String[] args) {
        SpringApplication.run(QingHeTopicApplication.class, args);
    }
}
