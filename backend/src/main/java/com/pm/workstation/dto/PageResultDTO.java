package com.pm.workstation.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PageResultDTO<T> {

    private List<T> records;

    private long total;

    private int page;

    private int size;

    private int totalPages;

    public static <T> PageResultDTO<T> of(List<T> records, long total, int page, int size) {
        int totalPages = (int) Math.ceil((double) total / size);
        return new PageResultDTO<>(records, total, page, size, totalPages);
    }
}
