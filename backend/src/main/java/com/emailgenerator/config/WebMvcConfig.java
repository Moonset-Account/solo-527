package com.emailgenerator.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.format.FormatterRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    private static final DateTimeFormatter[] FORMATTERS = {
        DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"),
        DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss"),
        DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"),
        DateTimeFormatter.ofPattern("yyyy-MM-dd")
    };

    @Override
    public void addFormatters(FormatterRegistry registry) {
        registry.addConverter(new StringToLocalDateTimeConverter());
    }

    @Bean
    public Converter<String, LocalDateTime> stringToLocalDateTimeConverter() {
        return new StringToLocalDateTimeConverter();
    }

    public static class StringToLocalDateTimeConverter implements Converter<String, LocalDateTime> {
        @Override
        public LocalDateTime convert(String source) {
            if (source == null || source.trim().isEmpty()) {
                return null;
            }
            String trimmed = source.trim();
            for (DateTimeFormatter formatter : FORMATTERS) {
                try {
                    if (formatter.toString().contains("yyyy-MM-dd")
                        && !formatter.toString().contains("HH")
                        && trimmed.length() == 10) {
                        return LocalDateTime.parse(trimmed + "T00:00:00",
                            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss"));
                    }
                    return LocalDateTime.parse(trimmed, formatter);
                } catch (DateTimeParseException ignored) {
                }
            }
            throw new IllegalArgumentException("无法解析日期: " + source
                + "，支持的格式: yyyy-MM-dd HH:mm:ss, yyyy-MM-dd");
        }
    }
}
