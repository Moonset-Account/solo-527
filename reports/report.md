[1m[34m═══ 检查摘要 ═══[39m[22m

基准语言: [1men[22m
目标语言: zh-CN, ja, ko, de
基准键总数: [1m39[22m
生成时间: 2026-06-10T05:06:18.200Z

┌───────┬────┬────┬────┬─────┬────┬────┬──────────────────────────────────────┐
│ 语言    │ 键数 │ 缺失 │ 多余 │ 占位符 │ 长度 │ 状态 │ 完成度                                  │
├────────┼────┼────┼────┼─────┼────┼────┼───────────────────────────────────────┤
│ zh-CN │ 40 │ 0  │ 1  │ 2   │ 0  │ 0  │ 100% [32m██████████[39m[90m[39m  │
│ ja    │ 38 │ 1  │ 0  │ 1   │ 0  │ 0  │ 97.4% [32m██████████[39m[90m[39m │
│ ko    │ 39 │ 0  │ 0  │ 1   │ 0  │ 0  │ 100% [32m██████████[39m[90m[39m  │
│ de    │ 41 │ 0  │ 2  │ 0   │ 0  │ 0  │ 100% [32m██████████[39m[90m[39m  │
└───────┴────┴────┴────┴─────┴────┴────┴──────────────────────────────────────┘

[1m[31m── 缺失的翻译键 (1) ──[39m[22m
[31m✖[39m [1muser.profile.settings[22m  缺少于: ja
    [90m基准:[39m Account Settings

[1m[33m── 多余的翻译键 (3) ──[39m[22m
[33m⚠[39m [1mzh-CN[22m (1 个):
  legacy.oldFeatureName = 这个键只在 zh-CN 中存在，是多余的
[33m⚠[39m [1mde[22m (2 个):
  experimental.betaFeatureLabel = Nur in de vorhanden - Beta-Funktion
  experimental.earlyAccessHint = Dieses Feld ist eine zusätzliche Schlüssel, die nicht im Basis-English existiert.

[1m[31m── 占位符不匹配 (4) ──[39m[22m
[31m✖[39m [1mcart.itemsCount[22m  (zh-CN)
    基准 [无]: You have {count, plural, one {1 item} other {# items}} in y…
    目标 [count]: 您的购物车中有 {count} 件商品。
[31m✖[39m [1msearch.noResults[22m  (zh-CN)
    基准 [query]: No results found for "{query}". Try different keywords or b…
    目标 [keyword]: 未找到与「{keyword}」相关的结果。请尝试其他关键词或浏览分类。
[31m✖[39m [1mcart.itemsCount[22m  (ja)
    基准 [无]: You have {count, plural, one {1 item} other {# items}} in y…
    目标 [count]: カートには {count} 個の商品があります。
[31m✖[39m [1mcart.itemsCount[22m  (ko)
    基准 [无]: You have {count, plural, one {1 item} other {# items}} in y…
    目标 [count]: 장바구니에 {count}개의 상품이 있습니다.
