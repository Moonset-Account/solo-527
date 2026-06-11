package com.qinghe.course.controller;

import com.qinghe.course.common.PageResult;
import com.qinghe.course.common.QueryParams;
import com.qinghe.course.common.Result;
import com.qinghe.course.entity.Coupon;
import com.qinghe.course.service.CouponService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/coupons")
@RequiredArgsConstructor
public class CouponController {

    private final CouponService couponService;

    @GetMapping
    public Result<PageResult<Coupon>> list(QueryParams params) {
        return Result.success(couponService.search(params));
    }

    @GetMapping("/{id}")
    public Result<Coupon> detail(@PathVariable Long id) {
        return Result.success(couponService.getById(id));
    }

    @GetMapping("/code/{code}")
    public Result<Coupon> getByCode(@PathVariable String code) {
        return Result.success(couponService.getByCode(code));
    }

    @PostMapping
    public Result<Coupon> create(@RequestBody Coupon coupon) {
        return Result.success(couponService.create(coupon));
    }

    @PutMapping("/{id}")
    public Result<Coupon> update(@PathVariable Long id, @RequestBody Coupon coupon) {
        return Result.success(couponService.update(id, coupon));
    }

    @DeleteMapping("/{id}")
    public Result<?> delete(@PathVariable Long id) {
        couponService.delete(id);
        return Result.success();
    }
}
