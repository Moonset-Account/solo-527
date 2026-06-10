package com.courselearning.common;

import lombok.Data;

import java.io.Serializable;
import java.util.List;

@Data
public class PageResult<T> implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long total;

    private List<T> records;

    private Long pageNum;

    private Long pageSize;

    private Long pages;

    public PageResult() {
    }

    public PageResult(Long total, List<T> records, Long pageNum, Long pageSize) {
        this.total = total;
        this.records = records;
        this.pageNum = pageNum;
        this.pageSize = pageSize;
        if (pageSize > 0) {
            this.pages = (total + pageSize - 1) / pageSize;
        } else {
            this.pages = 0L;
        }
    }

    public static <T> PageResult<T> of(Long total, List<T> records, Long pageNum, Long pageSize) {
        return new PageResult<>(total, records, pageNum, pageSize);
    }
}
