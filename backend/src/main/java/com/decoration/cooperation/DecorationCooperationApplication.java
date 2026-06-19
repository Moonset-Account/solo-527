package com.decoration.cooperation;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@MapperScan("com.decoration.cooperation.mapper")
public class DecorationCooperationApplication {

    public static void main(String[] args) {
        SpringApplication.run(DecorationCooperationApplication.class, args);
    }
}
