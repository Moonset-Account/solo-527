import re
import logging
from typing import List, Dict, Any
from django.core.cache import cache
from apps.risks.models import RiskRule

logger = logging.getLogger(__name__)


class RiskDetector:
    CACHE_KEY = 'risk_rules_active'
    CACHE_TIMEOUT = 300

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._rules_cache = None
            cls._instance._rules_cache_time = 0
        return cls._instance

    def load_rules(self, force_refresh: bool = False) -> List[RiskRule]:
        if not force_refresh and self._rules_cache is not None:
            import time
            if time.time() - self._rules_cache_time < self.CACHE_TIMEOUT:
                return self._rules_cache

        try:
            rules = list(RiskRule.objects.filter(is_active=True).order_by('-risk_level'))
            self._rules_cache = rules
            import time
            self._rules_cache_time = time.time()
            logger.info(f'加载风险规则成功，共 {len(rules)} 条')
            return rules
        except Exception as e:
            logger.error(f'加载风险规则失败: {e}')
            return []

    def detect(self, text: str) -> List[Dict[str, Any]]:
        if not text:
            return []

        rules = self.load_rules()
        if not rules:
            return []

        detected_risks = []

        for rule in rules:
            try:
                matched_text = self._match_rule(text, rule)
                if matched_text:
                    risk_level_map = {
                        'critical': 4,
                        'high': 3,
                        'medium': 2,
                        'low': 1,
                    }
                    detected_risks.append({
                        'rule_id': rule.id,
                        'rule_name': rule.name,
                        'rule_type': rule.rule_type,
                        'risk_level': rule.risk_level,
                        'risk_level_order': risk_level_map.get(rule.risk_level, 0),
                        'matched_text': matched_text,
                        'category': self._get_category(rule),
                    })
            except Exception as e:
                logger.error(f'风险规则匹配失败 (rule_id={rule.id}): {e}')
                continue

        detected_risks.sort(key=lambda x: x['risk_level_order'], reverse=True)

        if detected_risks:
            logger.info(f'检测到 {len(detected_risks)} 个风险: {[r["rule_name"] for r in detected_risks]}')

        return detected_risks

    def _match_rule(self, text: str, rule: RiskRule) -> str:
        if rule.rule_type == 'keyword':
            return self._match_keywords(text, rule.pattern)
        elif rule.rule_type == 'regex':
            return self._match_regex(text, rule.pattern)
        elif rule.rule_type == 'ai_detect':
            return ''
        else:
            return ''

    def _match_keywords(self, text: str, pattern: str) -> str:
        keywords = [kw.strip() for kw in pattern.split('\n') if kw.strip()]
        text_lower = text.lower()

        for keyword in keywords:
            if keyword.lower() in text_lower:
                return keyword

        return ''

    def _match_regex(self, text: str, pattern: str) -> str:
        try:
            patterns = [p.strip() for p in pattern.split('\n') if p.strip()]
            for regex_pattern in patterns:
                match = re.search(regex_pattern, text, re.IGNORECASE)
                if match:
                    return match.group(0)
        except re.error as e:
            logger.warning(f'正则表达式无效: {pattern}, 错误: {e}')

        return ''

    def _get_category(self, rule: RiskRule) -> str:
        rule_name = rule.name.lower()
        if '敏感' in rule.name or '色情' in rule.name or '低俗' in rule.name:
            return 'sensitive_word'
        elif '隐私' in rule.name or '身份证' in rule.name or '手机号' in rule.name:
            return 'privacy_leak'
        elif '虚假' in rule.name or '谣言' in rule.name or '错误' in rule.name:
            return 'misinformation'
        elif '合规' in rule.name or '法律' in rule.name or '政治' in rule.name:
            return 'compliance_risk'
        else:
            return 'other'

    def get_highest_risk_level(self, risks: List[Dict[str, Any]]) -> str:
        if not risks:
            return 'none'

        level_order = {
            'critical': 4,
            'high': 3,
            'medium': 2,
            'low': 1,
            'none': 0,
        }

        highest = max(risks, key=lambda x: level_order.get(x['risk_level'], 0))
        return highest['risk_level']

    def refresh_rules(self):
        self.load_rules(force_refresh=True)
