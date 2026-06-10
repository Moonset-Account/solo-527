export enum UserRole {
  ADMIN = 'admin',
  BRAND_OPERATOR = 'brand_operator',
  STORE_GUIDE = 'store_guide',
}

export enum MemberLevel {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
  DIAMOND = 'diamond',
}

export enum CouponStatus {
  UNUSED = 'unused',
  USED = 'used',
  EXPIRED = 'expired',
}

export enum CouponType {
  REPURCHASE = 'repurchase',
  DISCOUNT = 'discount',
  CASH = 'cash',
}

export enum PointsType {
  EARN = 'earn',
  CONSUME = 'consume',
  EXPIRE = 'expire',
}

export enum RedeemStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
}

export enum ReachType {
  SMS = 'sms',
  WECHAT = 'wechat',
  APP_PUSH = 'app_push',
}

export enum ReachStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  PENDING = 'pending',
}

export enum ActivityType {
  LOGIN = 'login',
  PURCHASE = 'purchase',
  SIGNIN = 'signin',
  BROWSE = 'browse',
  SHARE = 'share',
}
