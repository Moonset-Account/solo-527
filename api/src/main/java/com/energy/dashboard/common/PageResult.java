package com.energy.dashboard.common;

import lombok.Data;

import java.util.List;

@Data
public class PageResult<T> {

    private long total;
    private List<T> items;

    public PageResult(long total, List<T> items) {
        this.total = total;
        this.items = items;
    }
}
