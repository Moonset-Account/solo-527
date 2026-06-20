package com.datagrowth.portal;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class DataPortalApplication {
    public static void main(String[] args) {
        SpringApplication.run(DataPortalApplication.class, args);
    }
}
