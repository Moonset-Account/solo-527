// owner: alice@example.com
// lastModified: 2026-06-01
export const FF_NEW_CHECKOUT = 'payment.new_checkout_flow';
// owner: bob@example.com
export const FF_DARK_MODE = 'ui.dark_mode_enabled';
// owner: charlie@example.com
// deprecated: 废弃：迁移到新的推荐系统
export const FF_OLD_RECOMMENDER = 'recommender.legacy_algorithm';
// owner: alice@example.com
// 新用户引导流程开关
export const FF_ONBOARDING = 'user.onboarding_v2';
// owner: diana@example.com
export const FF_BETA_FEATURES = 'features.beta_access';
// owner: bob@example.com
// lastModified: 2026-06-10
export const FF_CACHE_STRATEGY = 'cache.strategy_version';

function example() {
  const isNewCheckout = featureFlag(FF_NEW_CHECKOUT, true);
  const darkMode = getBoolean(FF_DARK_MODE, false);
  const beta = featureFlag(FF_BETA_FEATURES, false);
  const cacheVer = getInt(FF_CACHE_STRATEGY, 2);

  flags['logging.verbose'] = true;
  const onboarding = getString(FF_ONBOARDING, 'default_variant');
}

function featureFlag(key: string, defaultValue: boolean): boolean {
  return defaultValue;
}

function getBoolean(key: string, defaultValue: boolean): boolean {
  return defaultValue;
}

function getString(key: string, defaultValue: string): string {
  return defaultValue;
}

function getInt(key: string, defaultValue: number): number {
  return defaultValue;
}

const flags: Record<string, unknown> = {};
