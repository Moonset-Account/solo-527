const express = require('express');
const router = express.Router();
const memberCouponController = require('../controllers/memberCouponController');
const { authMiddleware } = require('../middlewares/auth');

router.get('/', authMiddleware, memberCouponController.getCouponList);
router.get('/expiring', authMiddleware, memberCouponController.getExpiringCoupons);
router.get('/:id', authMiddleware, memberCouponController.getCouponById);
router.post('/', authMiddleware, memberCouponController.createCoupon);
router.put('/:id', authMiddleware, memberCouponController.updateCoupon);
router.put('/:id/use', authMiddleware, memberCouponController.useCoupon);
router.delete('/:id', authMiddleware, memberCouponController.deleteCoupon);

module.exports = router;
