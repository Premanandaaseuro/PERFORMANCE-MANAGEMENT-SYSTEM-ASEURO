package com.aseuro.pms;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class PmsBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(PmsBackendApplication.class, args);
    }
}
