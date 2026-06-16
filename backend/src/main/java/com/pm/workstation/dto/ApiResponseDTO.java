package com.pm.workstation.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponseDTO<T> {

    private int code;

    private String message;

    private T data;

    public static <T> ApiResponseDTO<T> success(T data) {
        return new ApiResponseDTO<>(200, "success", data);
    }

    public static <T> ApiResponseDTO<T> success(String message, T data) {
        return new ApiResponseDTO<>(200, message, data);
    }

    public static <T> ApiResponseDTO<T> error(int code, String message) {
        return new ApiResponseDTO<>(code, message, null);
    }

    public static <T> ApiResponseDTO<T> error(String message) {
        return new ApiResponseDTO<>(500, message, null);
    }
}
