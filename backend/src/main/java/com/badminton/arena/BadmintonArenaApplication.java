package com.badminton.arena;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@MapperScan("com.badminton.arena.mapper")
@EnableScheduling
public class BadmintonArenaApplication {

    public static void main(String[] args) {
        SpringApplication.run(BadmintonArenaApplication.class, args);
    }
}
