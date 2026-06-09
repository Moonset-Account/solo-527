from __future__ import annotations

import re
import json
from typing import List, Optional, Dict, Any, Pattern
from dataclasses import dataclass, field
from enum import Enum

from loguru import logger

from app.config import settings
from app.services.ai.llm_factory import LLMFactory
from app.models.contract import RiskType, RiskLevel, ClauseCategory


class RiskMatchMode(str, Enum):
    REGEX = "regex"
    KEYWORD = "keyword"
    LLM = "llm"
    HYBRID = "hybrid"


@dataclass
class RiskRule:
    """风险规则定义"""

    rule_id: str
    name: str
    risk_type: RiskType
    default_level: RiskLevel
    match_mode: RiskMatchMode
    threshold: float = 0.5
    patterns: List[str] = field(default_factory=list)
    keywords: List[str] = field(default_factory=list)
    suggestion: str = ""
    legal_basis: str = ""
    category: ClauseCategory = ClauseCategory.OTHER
    contract_types: List[str] = field(default_factory=list)
    enabled: bool = True

    _compiled_patterns: List[Pattern] = field(default_factory=list, repr=False)

    def __post_init__(self):
        if self.match_mode in (RiskMatchMode.REGEX, RiskMatchMode.HYBRID):
            try:
                self._compiled_patterns = [re.compile(p, re.IGNORECASE | re.MULTILINE) for p in self.patterns]
            except re.error as e:
                logger.warning(f"规则 {self.rule_id} 正则编译失败: {e}")
                self._compiled_patterns = []

    def match_regex(self, text: str) -> List[re.Match]:
        matches: List[re.Match] = []
        for pattern in self._compiled_patterns:
            for m in pattern.finditer(text):
                matches.append(m)
        return matches

    def match_keyword(self, text: str) -> List[str]:
        found = []
        lower_text = text.lower()
        for kw in self.keywords:
            if kw.lower() in lower_text:
                found.append(kw)
        return found


@dataclass
class SourceReference:
    """来源段落引用"""

    clause_id: Optional[int] = None
    clause_number: str = ""
    page_number: int = 1
    original_snippet: str = ""
    char_start: int = 0
    char_end: int = 0
    clause_title: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "clause_id": self.clause_id,
            "clause_number": self.clause_number,
            "page_number": self.page_number,
            "original_snippet": self.original_snippet,
            "char_start": self.char_start,
            "char_end": self.char_end,
            "clause_title": self.clause_title,
        }


@dataclass
class RiskDetectionResult:
    """风险检测结果"""

    risk_id: str
    risk_type: RiskType
    risk_level: RiskLevel
    risk_score: float
    title: str
    description: str
    suggestion: str
    source_references: List[SourceReference]
    detection_method: str = "rule_llm_hybrid"
    confidence: float = 1.0
    rule_id: Optional[str] = None
    legal_basis: str = ""
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "risk_id": self.risk_id,
            "risk_type": self.risk_type.value,
            "risk_level": self.risk_level.value,
            "risk_score": round(self.risk_score, 4),
            "title": self.title,
            "description": self.description,
            "suggestion": self.suggestion,
            "source_references": [s.to_dict() for s in self.source_references],
            "detection_method": self.detection_method,
            "confidence": round(self.confidence, 4),
            "rule_id": self.rule_id,
            "legal_basis": self.legal_basis,
            "metadata": self.metadata,
        }


class RiskEngine:
    """风险提示引擎"""

    def __init__(self, llm_factory: Optional[LLMFactory] = None):
        self._llm_factory = llm_factory or LLMFactory()
        self._rules: List[RiskRule] = []
        self._init_builtin_rules()

    def _init_builtin_rules(self) -> None:
        self._rules = [
            RiskRule(
                rule_id="R001",
                name="违约金过高",
                risk_type=RiskType.EXCESSIVE_PENALTY,
                default_level=RiskLevel.HIGH,
                match_mode=RiskMatchMode.HYBRID,
                threshold=0.3,
                patterns=[
                    r"违约金[^，。；\n]{0,20}(?:百分之|%)\s*(?:[3-9]\d|1\d{2,})",
                    r"(?:赔偿|违约金)[^，。；\n]{0,20}超过[^，。；\n]{0,10}合同(?:总额|金额|价款)",
                ],
                keywords=["违约金", "赔偿金额", "罚款"],
                suggestion="建议将违约金比例调整至合同总金额的30%以内，根据《民法典》第585条，约定的违约金过分高于造成的损失的，人民法院或者仲裁机构可以根据当事人的请求予以适当减少。",
                legal_basis="《民法典》第五百八十五条：约定的违约金低于造成的损失的，人民法院或者仲裁机构可以根据当事人的请求予以增加；约定的违约金过分高于造成的损失的，人民法院或者仲裁机构可以根据当事人的请求予以适当减少。",
                category=ClauseCategory.LIABILITY,
            ),
            RiskRule(
                rule_id="R002",
                name="违约责任不对等",
                risk_type=RiskType.UNCLEAR_LIABILITY,
                default_level=RiskLevel.HIGH,
                match_mode=RiskMatchMode.HYBRID,
                threshold=0.5,
                patterns=[
                    r"(?:甲方|供方|卖方)[^，。；\n]{0,30}(?:违约|承担)[^，。；\n]{0,30}(?:乙方|需方|买方)[^，。；\n]{0,30}(?:无需|不承担|免责)",
                    r"仅(?:甲方|乙方|一方)(?:承担|负责)[^，。；\n]*违约责任",
                ],
                keywords=["仅一方承担", "单方面违约", "不对等"],
                suggestion="建议审查违约责任条款，确保双方权利义务对等，一方违约责任明显重于另一方的条款可能被认定为显失公平。",
                legal_basis="《民法典》第一百五十一条：一方利用对方处于危困状态、缺乏判断能力等情形，致使民事法律行为成立时显失公平的，受损害方有权请求人民法院或者仲裁机构予以撤销。",
                category=ClauseCategory.LIABILITY,
            ),
            RiskRule(
                rule_id="R003",
                name="合同到期前未提醒",
                risk_type=RiskType.DEADLINE_RISK,
                default_level=RiskLevel.MEDIUM,
                match_mode=RiskMatchMode.KEYWORD,
                threshold=0.4,
                patterns=[],
                keywords=["自动到期", "到期终止", "合同到期"],
                suggestion="建议增加到期提醒条款，约定在合同到期前30-60日书面通知对方是否续约，避免因遗忘续约导致业务中断。",
                legal_basis="合同法律实务通用建议",
                category=ClauseCategory.TERM,
            ),
            RiskRule(
                rule_id="R004",
                name="自动续期条款不利",
                risk_type=RiskType.DEADLINE_RISK,
                default_level=RiskLevel.HIGH,
                match_mode=RiskMatchMode.REGEX,
                threshold=0.4,
                patterns=[
                    r"自动续[展]期[^，。；\n]{0,50}(?:如|若)[^，。；\n]{0,30}未(?:提出|书面|通知)",
                    r"(?:到期|期满)后[^，。；\n]{0,30}自动(?:续[展]期|延长)",
                    r"默(?:认|示)续[展]期",
                ],
                keywords=["自动续期", "默认续约", "自动延长"],
                suggestion="建议修改自动续期条款，改为'除非任何一方在到期前至少30日书面通知不续约，否则合同自动续期一年'，以确保双方都有明确的退出机制。",
                legal_basis="合同法律实务通用建议：自动续期条款应赋予双方平等的终止权。",
                category=ClauseCategory.TERM,
            ),
            RiskRule(
                rule_id="R005",
                name="付款条件模糊",
                risk_type=RiskType.PAYMENT_RISK,
                default_level=RiskLevel.HIGH,
                match_mode=RiskMatchMode.HYBRID,
                threshold=0.5,
                patterns=[
                    r"(?:付款|支付)[^，。；\n]{0,30}(?:视情况|根据实际|双方协商|另行约定)",
                    r"(?:验收|合格|满意)[^，。；\n]{0,20}后[^，。；\n]{0,20}(?:付款|支付)",
                    r"按[^，。；\n]{0,10}进度(?:付款|支付)(?!.*百分比|%|比例|节点)",
                ],
                keywords=["另行约定付款", "验收后付款", "按进度付款"],
                suggestion="建议明确约定付款的具体时间节点、金额比例、触发条件以及逾期付款的违约金计算方式，避免使用模糊表述。",
                legal_basis="《民法典》第五百一十条：合同生效后，当事人就质量、价款或者报酬、履行地点等内容没有约定或者约定不明确的，可以协议补充；不能达成补充协议的，按照合同相关条款或者交易习惯确定。",
                category=ClauseCategory.PRICE_PAYMENT,
            ),
            RiskRule(
                rule_id="R006",
                name="预付款过高",
                risk_type=RiskType.PAYMENT_RISK,
                default_level=RiskLevel.HIGH,
                match_mode=RiskMatchMode.REGEX,
                threshold=0.5,
                patterns=[
                    r"(?:预付|首付|定金|订金)[^，。；\n]{0,20}(?:百分之|%)\s*(?:[5-9]\d|1\d{2,})",
                    r"(?:合同|协议)签订[^，。；\n]{0,20}(?:预付|首付)[^，。；\n]{0,20}(?:全部|全款|100%)",
                ],
                keywords=["预付款", "首付", "定金"],
                suggestion="建议将预付款比例控制在合同总金额的30%-50%以内，超出部分建议与履约进度挂钩，降低资金风险。定金不得超过主合同标的额的20%。",
                legal_basis="《民法典》第五百八十六条：定金的数额由当事人约定；但是，不得超过主合同标的额的百分之二十，超过部分不产生定金的效力。",
                category=ClauseCategory.PRICE_PAYMENT,
            ),
            RiskRule(
                rule_id="R007",
                name="全面知识产权转让",
                risk_type=RiskType.IP_TRANSFER_RISK,
                default_level=RiskLevel.HIGH,
                match_mode=RiskMatchMode.HYBRID,
                threshold=0.5,
                patterns=[
                    r"(?:全部|所有|一切|完整)[^，。；\n]{0,20}(?:知识产权|权利|著作权|专利)[^，。；\n]{0,20}(?:归|属于|转让给)[^，。；\n]{0,20}(?:甲方|乙方)",
                    r"知识产权[^，。；\n]{0,30}无偿(?:转让|归属|归)",
                    r"(?:永久|全球|独家|排他)[^，。；\n]{0,20}(?:许可|授权|使用)[^，。；\n]{0,30}(?:全部|所有|一切)",
                ],
                keywords=["全部知识产权", "独家许可", "永久授权", "权利转让"],
                suggestion="建议审查知识产权归属条款，对于开发过程中产生的知识产权，应明确区分已有知识产权、新产生知识产权及改进成果的归属，避免全部转让。",
                legal_basis="《著作权法》第十七条、《专利法》第八条关于委托创作、合作开发的知识产权归属规定。",
                category=ClauseCategory.IP,
            ),
            RiskRule(
                rule_id="R008",
                name="保密期限过短",
                risk_type=RiskType.IP_TRANSFER_RISK,
                default_level=RiskLevel.MEDIUM,
                match_mode=RiskMatchMode.REGEX,
                threshold=0.5,
                patterns=[
                    r"保密(?:期限|义务)[^，。；\n]{0,20}(?:[1-2]|一|二)\s*年",
                    r"保密(?:期限|义务)[^，。；\n]{0,20}(?:到期|终止)后[^，。；\n]{0,10}(?:[1-2]|一|二)\s*年",
                ],
                keywords=["保密期限1年", "保密期限2年"],
                suggestion="建议将保密期限设定为合同终止后3-5年，对于核心商业秘密建议约定'直至信息公开时止'的无限期保密义务。",
                legal_basis="《反不正当竞争法》第九条关于商业秘密保护的规定。",
                category=ClauseCategory.CONFIDENTIALITY,
            ),
            RiskRule(
                rule_id="R009",
                name="管辖地约定不利",
                risk_type=RiskType.NON_COMPLIANCE,
                default_level=RiskLevel.HIGH,
                match_mode=RiskMatchMode.HYBRID,
                threshold=0.5,
                patterns=[
                    r"(?:由|向)[^，。；\n]{0,30}(?:甲方|供方|卖方|对方)[^，。；\n]{0,30}所在地[^，。；\n]{0,30}(?:法院|管辖)",
                    r"(?:管辖|起诉)[^，。；\n]{0,30}(?:仲裁委员会|人民法院)",
                ],
                keywords=["对方所在地法院", "甲方所在地管辖"],
                suggestion="建议争取约定由我方所在地有管辖权的人民法院管辖，或约定中立的第三地法院管辖，降低异地诉讼成本。",
                legal_basis="《民事诉讼法》第三十五条：合同或者其他财产权益纠纷的当事人可以书面协议选择被告住所地、合同履行地、合同签订地、原告住所地、标的物所在地等与争议有实际联系的地点的人民法院管辖。",
                category=ClauseCategory.DISPUTE,
            ),
            RiskRule(
                rule_id="R010",
                name="仲裁条款缺失",
                risk_type=RiskType.NON_COMPLIANCE,
                default_level=RiskLevel.LOW,
                match_mode=RiskMatchMode.KEYWORD,
                threshold=0.3,
                patterns=[],
                keywords=["争议解决", "人民法院", "诉讼"],
                suggestion="如希望采用仲裁方式解决争议，建议补充明确的仲裁条款，包括仲裁机构名称、仲裁事项、仲裁地点等。",
                legal_basis="《仲裁法》第十六条：仲裁协议包括合同中订立的仲裁条款和以其他书面方式在纠纷发生前或者纠纷发生后达成的请求仲裁的协议。仲裁协议应当具有请求仲裁的意思表示、仲裁事项、选定的仲裁委员会。",
                category=ClauseCategory.DISPUTE,
            ),
            RiskRule(
                rule_id="R011",
                name="不可抗力条款缺失",
                risk_type=RiskType.MISSING_KEY_CLAUSE,
                default_level=RiskLevel.HIGH,
                match_mode=RiskMatchMode.KEYWORD,
                threshold=0.0,
                patterns=[],
                keywords=["不可抗力"],
                suggestion="建议增加不可抗力条款，明确不可抗力的范围、通知义务、证明要求、后果处理（如延期履行、部分免除、解除合同）等。",
                legal_basis="《民法典》第一百八十条：因不可抗力不能履行民事义务的，不承担民事责任。法律另有规定的，依照其规定。不可抗力是不能预见、不能避免且不能克服的客观情况。",
                category=ClauseCategory.FORCE_MAJEURE,
            ),
            RiskRule(
                rule_id="R012",
                name="保密条款缺失",
                risk_type=RiskType.MISSING_KEY_CLAUSE,
                default_level=RiskLevel.MEDIUM,
                match_mode=RiskMatchMode.KEYWORD,
                threshold=0.0,
                patterns=[],
                keywords=["保密", "不披露", "机密"],
                suggestion="建议增加保密条款，明确保密信息的范围、保密义务主体、保密期限、保密措施及违约责任。",
                legal_basis="《民法典》第五百零九条：当事人应当遵循诚信原则，根据合同的性质、目的和交易习惯履行通知、协助、保密等义务。",
                category=ClauseCategory.CONFIDENTIALITY,
            ),
            RiskRule(
                rule_id="R013",
                name="违约条款缺失",
                risk_type=RiskType.MISSING_KEY_CLAUSE,
                default_level=RiskLevel.HIGH,
                match_mode=RiskMatchMode.KEYWORD,
                threshold=0.0,
                patterns=[],
                keywords=["违约", "赔偿", "违约金", "违约责任"],
                suggestion="建议增加明确的违约条款，针对主要义务约定具体的违约情形、违约金计算方式或赔偿范围。",
                legal_basis="《民法典》第五百七十七条：当事人一方不履行合同义务或者履行合同义务不符合约定的，应当承担继续履行、采取补救措施或者赔偿损失等违约责任。",
                category=ClauseCategory.LIABILITY,
            ),
            RiskRule(
                rule_id="R014",
                name="单方解除权过大",
                risk_type=RiskType.UNFAVORABLE_TERMINATION,
                default_level=RiskLevel.HIGH,
                match_mode=RiskMatchMode.REGEX,
                threshold=0.5,
                patterns=[
                    r"(?:甲方|乙方|一方)[^，。；\n]{0,30}(?:随时|有权)[^，。；\n]{0,30}(?:解除|终止)[^，。；\n]{0,30}(?:合同|协议)(?!.*(?:违约|提前|通知|30|六十|60))",
                    r"(?:无需|不承担)[^，。；\n]{0,20}(?:责任|赔偿)[^，。；\n]{0,30}(?:解除|终止)",
                ],
                keywords=["随时解除", "单方终止", "无条件解除"],
                suggestion="建议限制单方解除权的行使条件，约定解除需提前30日书面通知，并对已履行部分进行合理结算。",
                legal_basis="《民法典》第五百六十三条关于法定解除权的规定。",
                category=ClauseCategory.TERMINATION,
            ),
            RiskRule(
                rule_id="R015",
                name="歧义条款",
                risk_type=RiskType.AMBIGUOUS_LANGUAGE,
                default_level=RiskLevel.MEDIUM,
                match_mode=RiskMatchMode.REGEX,
                threshold=0.5,
                patterns=[
                    r"等[^，。；\n]{0,10}(?:费用|义务|责任|情况)",
                    r"(?:包括但|不限于)[^，。；\n]{0,5}等",
                    r"(?:适当|合理|必要)[^，。；\n]{0,10}(?:费用|补偿|时间)",
                    r"(?:视|根据)[^，。；\n]{0,10}(?:情况|需要|具体)",
                ],
                keywords=["等费用", "适当补偿", "视情况"],
                suggestion="建议明确列举费用项目、补偿标准或具体条件，避免使用模糊表述导致争议。",
                legal_basis="《民法典》第四百六十六条：当事人对合同条款的理解有争议的，应当依据本法第一百四十二条第一款的规定，确定争议条款的含义。",
                category=ClauseCategory.MISCELLANEOUS,
            ),
            RiskRule(
                rule_id="R016",
                name="质保期过短",
                risk_type=RiskType.WARRANTY_RISK,
                default_level=RiskLevel.MEDIUM,
                match_mode=RiskMatchMode.REGEX,
                threshold=0.5,
                patterns=[
                    r"(?:质保|保修|质量保证)[^，。；\n]{0,20}(?:[0-3]|一|二|三)\s*(?:个月|月)",
                ],
                keywords=["质保1个月", "质保3个月", "保修30天"],
                suggestion="建议根据行业标准适当延长质保期，一般商品建议不低于1年，建设工程根据《建设工程质量管理条例》有最低期限要求。",
                legal_basis="《建设工程质量管理条例》第四十条关于最低保修期限的规定。",
                category=ClauseCategory.WARRANTY,
            ),
            RiskRule(
                rule_id="R017",
                name="赔偿上限过低",
                risk_type=RiskType.UNCLEAR_LIABILITY,
                default_level=RiskLevel.MEDIUM,
                match_mode=RiskMatchMode.REGEX,
                threshold=0.5,
                patterns=[
                    r"赔偿(?:总额|上限|限额)[^，。；\n]{0,20}(?:百分之|%)\s*(?:[1-9]|[1-2]\d|30)(?!.*实际损失)",
                    r"(?:总|全部)责任[^，。；\n]{0,20}(?:不超过|不高于)[^，。；\n]{0,10}(?:合同|协议)(?:金额|价款|总额)[^，。；\n]{0,10}(?:百分之|%)\s*([1-9]|[1-2]\d|30)",
                ],
                keywords=["赔偿上限10%", "责任上限20%"],
                suggestion="建议提高赔偿上限，或约定'因故意或重大过失造成的损失不受此限'，保护自身合法权益。",
                legal_basis="合同法律实务通用建议",
                category=ClauseCategory.LIABILITY,
            ),
            RiskRule(
                rule_id="R018",
                name="间接损失免责",
                risk_type=RiskType.UNCLEAR_LIABILITY,
                default_level=RiskLevel.MEDIUM,
                match_mode=RiskMatchMode.REGEX,
                threshold=0.5,
                patterns=[
                    r"(?:不承担|不负责|免责)[^，。；\n]{0,20}(?:间接|附带|利润|预期|可得)(?:损失|利益)",
                    r"(?:间接|利润|可得利益)(?:损失|利益)[^，。；\n]{0,20}(?:不承担|不负责|免责)",
                ],
                keywords=["间接损失不承担", "利润损失免责"],
                suggestion="建议审慎评估间接损失免责条款，如作为非违约方可能遭受利润损失，建议删除或限制该条款适用范围。",
                legal_basis="《民法典》第五百八十四条：当事人一方不履行合同义务或者履行合同义务不符合约定，造成对方损失的，损失赔偿额应当相当于因违约所造成的损失，包括合同履行后可以获得的利益。",
                category=ClauseCategory.LIABILITY,
            ),
            RiskRule(
                rule_id="R019",
                name="付款期限过长",
                risk_type=RiskType.PAYMENT_RISK,
                default_level=RiskLevel.MEDIUM,
                match_mode=RiskMatchMode.REGEX,
                threshold=0.4,
                patterns=[
                    r"(?:付款|支付)[^，。；\n]{0,20}(?:[6-9]\d|[1-9]\d{2,})\s*天",
                    r"(?:月结|账期)[^，。；\n]{0,10}(?:90|120|180|360)",
                    r"验收后[^，。；\n]{0,10}(?:6|9|12|六|九|十二)[^，。；\n]{0,10}(?:个月|月)(?:内)?(?:付款|支付)",
                ],
                keywords=["90天账期", "验收后6个月付款"],
                suggestion="建议缩短付款期限，对于期限超过60日的付款，建议约定逾期付款违约金或要求提供担保。",
                legal_basis="合同法律实务通用建议",
                category=ClauseCategory.PRICE_PAYMENT,
            ),
            RiskRule(
                rule_id="R020",
                name="无验收标准",
                risk_type=RiskType.AMBIGUOUS_LANGUAGE,
                default_level=RiskLevel.MEDIUM,
                match_mode=RiskMatchMode.HYBRID,
                threshold=0.5,
                patterns=[
                    r"(?:验收|检验)[^，。；\n]{0,50}(?:合格|通过|确认)(?!.*(?:标准|规范|国标|GB|行业))",
                ],
                keywords=["验收合格", "双方确认验收"],
                suggestion="建议明确约定验收标准（如国家标准、行业标准、技术协议等）、验收程序、验收期限及不合格的处理方式。",
                legal_basis="《民法典》第六百二十条：买受人收到标的物时应当在约定的检验期限内检验。没有约定检验期限的，应当及时检验。",
                category=ClauseCategory.QUALITY,
            ),
            RiskRule(
                rule_id="R021",
                name="合同主体不明确",
                risk_type=RiskType.NON_COMPLIANCE,
                default_level=RiskLevel.HIGH,
                match_mode=RiskMatchMode.REGEX,
                threshold=0.5,
                patterns=[
                    r"(?:甲方|乙方)[^，。：]{0,20}：\s*(?:\n|$)",
                    r"(?:甲方|乙方)[^，。：]{0,20}：\s*(?:公司|有限|集团)(?!.*(?:统一社会信用代码|身份证|地址|法定代表人))",
                ],
                keywords=["甲方：", "乙方："],
                suggestion="建议完善合同主体信息，包括完整的单位名称、统一社会信用代码、注册地址、法定代表人、联系方式等。个人应包括姓名、身份证号、住址。",
                legal_basis="《民法典》第四百七十条关于合同内容的规定。",
                category=ClauseCategory.PARTIES,
            ),
            RiskRule(
                rule_id="R022",
                name="无发票条款",
                risk_type=RiskType.NON_COMPLIANCE,
                default_level=RiskLevel.LOW,
                match_mode=RiskMatchMode.KEYWORD,
                threshold=0.0,
                patterns=[],
                keywords=["发票", "开票", "增值税"],
                suggestion="建议增加发票条款，明确发票类型（增值税专用/普通）、税率、开票时间、开票信息等。",
                legal_basis="《发票管理办法》的相关规定。",
                category=ClauseCategory.PRICE_PAYMENT,
            ),
            RiskRule(
                rule_id="R023",
                name="个人信息处理不当",
                risk_type=RiskType.NON_COMPLIANCE,
                default_level=RiskLevel.MEDIUM,
                match_mode=RiskMatchMode.HYBRID,
                threshold=0.5,
                patterns=[
                    r"(?:收集|获取|存储|使用|处理)[^，。；\n]{0,20}(?:个人信息|用户信息|客户资料)(?!.*(?:同意|授权|目的|范围|安全))",
                ],
                keywords=["收集个人信息", "用户数据"],
                suggestion="建议增加个人信息保护条款，明确个人信息处理的目的、范围、方式、存储期限、安全措施及数据主体权利。",
                legal_basis="《个人信息保护法》第十七条：个人信息处理者在处理个人信息前，应当以显著方式、清晰易懂的语言真实、准确、完整地向个人告知相关事项。",
                category=ClauseCategory.MISCELLANEOUS,
            ),
            RiskRule(
                rule_id="R024",
                name="禁止转让条款缺失",
                risk_type=RiskType.OTHER,
                default_level=RiskLevel.LOW,
                match_mode=RiskMatchMode.KEYWORD,
                threshold=0.0,
                patterns=[],
                keywords=["转让", "转委托", "分包"],
                suggestion="建议增加合同权利义务转让的限制条款，如'未经对方书面同意，任何一方不得将本合同项下的权利义务全部或部分转让给第三方'。",
                legal_basis="《民法典》第五百四十五条：债权人可以将债权的全部或者部分转让给第三人，但是有下列情形之一的除外：（一）根据债权性质不得转让；（二）按照当事人约定不得转让；（三）依照法律规定不得转让。",
                category=ClauseCategory.MISCELLANEOUS,
            ),
            RiskRule(
                rule_id="R025",
                name="通知条款缺失",
                risk_type=RiskType.OTHER,
                default_level=RiskLevel.LOW,
                match_mode=RiskMatchMode.KEYWORD,
                threshold=0.0,
                patterns=[],
                keywords=["通知", "送达", "书面通知"],
                suggestion="建议增加通知与送达条款，明确双方的送达地址、通知方式、送达生效时间及地址变更的通知义务。",
                legal_basis="《民法典》关于意思表示生效的相关规定。",
                category=ClauseCategory.MISCELLANEOUS,
            ),
            RiskRule(
                rule_id="R026",
                name="可分割性条款缺失",
                risk_type=RiskType.OTHER,
                default_level=RiskLevel.INFO,
                match_mode=RiskMatchMode.KEYWORD,
                threshold=0.0,
                patterns=[],
                keywords=["可分割", "部分无效", "条款无效"],
                suggestion="建议增加可分割性条款：'本合同任何条款被认定为无效或不可执行，不影响其他条款的效力。'",
                legal_basis="《民法典》第一百五十六条：民事法律行为部分无效，不影响其他部分效力的，其他部分仍然有效。",
                category=ClauseCategory.MISCELLANEOUS,
            ),
            RiskRule(
                rule_id="R027",
                name="完整协议条款缺失",
                risk_type=RiskType.OTHER,
                default_level=RiskLevel.INFO,
                match_mode=RiskMatchMode.KEYWORD,
                threshold=0.0,
                patterns=[],
                keywords=["完整协议", "全部内容", "取代之前"],
                suggestion="建议增加完整协议条款，明确本合同取代此前双方就同一事项达成的所有口头或书面协议。",
                legal_basis="合同法律实务通用建议",
                category=ClauseCategory.MISCELLANEOUS,
            ),
            RiskRule(
                rule_id="R028",
                name="竞业限制条款过宽",
                risk_type=RiskType.IP_TRANSFER_RISK,
                default_level=RiskLevel.MEDIUM,
                match_mode=RiskMatchMode.REGEX,
                threshold=0.5,
                patterns=[
                    r"(?:竞业|竞争)[^，。；\n]{0,20}(?:禁止|限制)[^，。；\n]{0,30}(?:任何|所有|一切)[^，。；\n]{0,20}(?:业务|行业|领域)",
                    r"(?:竞业|竞争)[^，。；\n]{0,20}(?:禁止|限制)[^，。；\n]{0,10}(?:5|[6-9]\d|\d{3,})\s*(?:年|个月)",
                ],
                keywords=["终身竞业", "竞业5年", "禁止所有业务"],
                suggestion="根据《劳动合同法》，竞业限制期限不得超过2年，且应限于同类产品、同类业务，同时应约定竞业限制补偿金。",
                legal_basis="《劳动合同法》第二十四条：竞业限制的人员限于用人单位的高级管理人员、高级技术人员和其他负有保密义务的人员。竞业限制的范围、地域、期限由用人单位与劳动者约定，竞业限制的约定不得违反法律、法规的规定。在解除或者终止劳动合同后，前款规定的人员到与本单位生产或者经营同类产品、从事同类业务的有竞争关系的其他用人单位，或者自己开业生产或者经营同类产品、从事同类业务的竞业限制期限，不得超过二年。",
                category=ClauseCategory.IP,
            ),
            RiskRule(
                rule_id="R029",
                name="利息约定过高",
                risk_type=RiskType.EXCESSIVE_PENALTY,
                default_level=RiskLevel.HIGH,
                match_mode=RiskMatchMode.REGEX,
                threshold=0.4,
                patterns=[
                    r"(?:利息|利率)[^，。；\n]{0,20}(?:月息|月利率)[^，。；\n]{0,10}(?:3|4|5|6|7|8|9|[1-9]\d)(?:%|‰)",
                    r"(?:利息|利率)[^，。；\n]{0,20}(?:年息|年利率)[^，。；\n]{0,10}(?:3[6-9]|[4-9]\d|\d{3,})(?:%|‰)",
                    r"(?:日息|日利率)[^，。；\n]{0,10}(?:千|‰)[^，。；\n]{0,10}(?:五|5|[6-9])",
                ],
                keywords=["月息3%", "年利率36%"],
                suggestion="根据法律规定，民间借贷利率不得超过LPR的4倍（约年15.4%），超出部分不受法律保护。商业合同逾期付款违约金建议参照此标准。",
                legal_basis="《最高人民法院关于审理民间借贷案件适用法律若干问题的规定》第二十五条：出借人请求借款人按照合同约定利率支付利息的，人民法院应予支持，但是双方约定的利率超过合同成立时一年期贷款市场报价利率四倍的除外。",
                category=ClauseCategory.PRICE_PAYMENT,
            ),
            RiskRule(
                rule_id="R030",
                name="价格调整机制缺失",
                risk_type=RiskType.PAYMENT_RISK,
                default_level=RiskLevel.LOW,
                match_mode=RiskMatchMode.KEYWORD,
                threshold=0.0,
                patterns=[],
                keywords=["价格调整", "调价", "变更价格"],
                suggestion="对于长期合同，建议增加价格调整机制，约定原材料价格波动超过一定比例时的调价方式。",
                legal_basis="《民法典》第五百三十三条：合同成立后，合同的基础条件发生了当事人在订立合同时无法预见的、不属于商业风险的重大变化，继续履行合同对于当事人一方明显不公平的，受不利影响的当事人可以与对方重新协商；在合理期限内协商不成的，当事人可以请求人民法院或者仲裁机构变更或者解除合同。",
                category=ClauseCategory.PRICE_PAYMENT,
            ),
            RiskRule(
                rule_id="R031",
                name="分包未约定责任",
                risk_type=RiskType.UNCLEAR_LIABILITY,
                default_level=RiskLevel.MEDIUM,
                match_mode=RiskMatchMode.HYBRID,
                threshold=0.5,
                patterns=[
                    r"(?:分包|转包|转委托)[^，。；\n]{0,50}(?:允许|同意|可以)(?!.*(?:连带责任|承担责任|负责))",
                ],
                keywords=["允许分包", "可以转委托"],
                suggestion="如允许分包，应约定分包方的资质要求以及承包方对分包行为的连带责任。",
                legal_basis="《民法典》第七百九十一条：总承包人或者勘察、设计、施工承包人经发包人同意，可以将自己承包的部分工作交由第三人完成。第三人就其完成的工作成果与总承包人或者勘察、设计、施工承包人向发包人承担连带责任。",
                category=ClauseCategory.LIABILITY,
            ),
            RiskRule(
                rule_id="R032",
                name="无廉洁条款",
                risk_type=RiskType.NON_COMPLIANCE,
                default_level=RiskLevel.INFO,
                match_mode=RiskMatchMode.KEYWORD,
                threshold=0.0,
                patterns=[],
                keywords=["廉洁", "反贿赂", "反腐败", "商业贿赂"],
                suggestion="建议增加反商业贿赂/廉洁条款，明确禁止商业贿赂行为及违约责任。",
                legal_basis="《反不正当竞争法》第七条：经营者不得采用财物或者其他手段贿赂下列单位或者个人，以谋取交易机会或者竞争优势。",
                category=ClauseCategory.MISCELLANEOUS,
            ),
        ]

    @property
    def rules(self) -> List[RiskRule]:
        return [r for r in self._rules if r.enabled]

    def get_rules_by_category(self, category: ClauseCategory) -> List[RiskRule]:
        return [r for r in self.rules if r.category == category]

    def get_rule_by_id(self, rule_id: str) -> Optional[RiskRule]:
        for rule in self._rules:
            if rule.rule_id == rule_id:
                return rule
        return None

    def detect_risks(
        self,
        clauses: List[Any],
        contract_type: Optional[str] = None,
        template_id: Optional[int] = None,
        full_text: str = "",
    ) -> List[RiskDetectionResult]:
        """检测合同风险"""
        results: List[RiskDetectionResult] = []
        seen_risks: set = set()

        if not clauses:
            return results

        if not full_text:
            full_text = "\n".join(
                getattr(c, "cleaned_text", None) or getattr(c, "original_text", "") for c in clauses
            )

        clause_texts = []
        for clause in clauses:
            text = getattr(clause, "cleaned_text", None) or getattr(clause, "original_text", "")
            clause_texts.append((clause, text))

        self._apply_rule_matching(results, seen_risks, clause_texts)
        self._detect_missing_clauses(results, seen_risks, clauses, full_text)

        if contract_type:
            self._apply_contract_type_specific_analysis(results, seen_risks, clause_texts, contract_type)

        results.sort(key=lambda r: r.risk_score, reverse=True)
        logger.info(f"风险检测完成: 共检测到 {len(results)} 条风险")
        return results

    def _apply_rule_matching(
        self,
        results: List[RiskDetectionResult],
        seen_risks: set,
        clause_texts: List[tuple],
    ) -> None:
        for rule in self.rules:
            best_score = 0.0
            best_source_refs: List[SourceReference] = []
            best_clause = None
            matched_snippets: List[str] = []

            for clause, text in clause_texts:
                if not text:
                    continue
                score, source_refs, snippets = self._evaluate_rule_on_clause(rule, clause, text)
                if score > best_score:
                    best_score = score
                    best_source_refs = source_refs
                    best_clause = clause
                    matched_snippets = snippets

            if best_score >= rule.threshold and best_source_refs:
                risk_key = f"{rule.rule_id}_{best_clause.id if best_clause else 'text'}"
                if risk_key in seen_risks:
                    continue
                seen_risks.add(risk_key)

                final_score = min(max(best_score, 0.0), 1.0)
                level = self._score_to_level(final_score, rule.default_level)

                description = self._build_description(rule, matched_snippets)
                result = RiskDetectionResult(
                    risk_id=f"risk_{rule.rule_id}_{len(results) + 1}",
                    risk_type=rule.risk_type,
                    risk_level=level,
                    risk_score=final_score,
                    title=rule.name,
                    description=description,
                    suggestion=rule.suggestion,
                    source_references=best_source_refs,
                    detection_method=rule.match_mode.value,
                    confidence=min(final_score + 0.2, 1.0),
                    rule_id=rule.rule_id,
                    legal_basis=rule.legal_basis,
                    metadata={"matched_snippets": matched_snippets},
                )
                results.append(result)

    def _evaluate_rule_on_clause(
        self, rule: RiskRule, clause: Any, text: str
    ) -> tuple[float, List[SourceReference], List[str]]:
        score = 0.0
        source_refs: List[SourceReference] = []
        matched_snippets: List[str] = []

        if rule.match_mode in (RiskMatchMode.REGEX, RiskMatchMode.HYBRID):
            matches = rule.match_regex(text)
            if matches:
                max_match_score = 0.0
                for m in matches:
                    span_len = m.end() - m.start()
                    match_score = min(span_len / 50.0, 1.0) * 0.8 + 0.2
                    if match_score > max_match_score:
                        max_match_score = match_score
                    snippet = self._extract_snippet(text, m.start(), m.end())
                    matched_snippets.append(m.group(0))
                    if not source_refs:
                        source_refs.append(self._build_source_ref(clause, snippet, m.start(), m.end()))
                score = max(score, max_match_score)

        if rule.match_mode in (RiskMatchMode.KEYWORD, RiskMatchMode.HYBRID):
            keywords_found = rule.match_keyword(text)
            if keywords_found:
                kw_score = min(len(keywords_found) / max(len(rule.keywords), 1), 1.0) * 0.7
                score = max(score, kw_score)
                if not matched_snippets and keywords_found:
                    pos = text.lower().find(keywords_found[0].lower())
                    if pos >= 0:
                        snippet = self._extract_snippet(text, pos, pos + len(keywords_found[0]))
                        matched_snippets.append(keywords_found[0])
                        if not source_refs:
                            source_refs.append(self._build_source_ref(clause, snippet, pos, pos + len(keywords_found[0])))

        if rule.match_mode == RiskMatchMode.HYBRID and score > 0:
            score = min(score * 1.1, 1.0)

        return score, source_refs, matched_snippets

    def _build_source_ref(
        self, clause: Any, snippet: str, char_start: int, char_end: int
    ) -> SourceReference:
        return SourceReference(
            clause_id=getattr(clause, "id", None),
            clause_number=getattr(clause, "clause_number", "") or "",
            page_number=getattr(clause, "page_start", 1) or 1,
            original_snippet=snippet,
            char_start=char_start + (getattr(clause, "char_start", 0) or 0),
            char_end=char_end + (getattr(clause, "char_start", 0) or 0),
            clause_title=getattr(clause, "clause_title", "") or "",
        )

    @staticmethod
    def _extract_snippet(text: str, start: int, end: int, padding: int = 30) -> str:
        text_len = len(text)
        s = max(0, start - padding)
        e = min(text_len, end + padding)
        snippet = text[s:e].strip()
        if s > 0:
            snippet = "..." + snippet
        if e < text_len:
            snippet = snippet + "..."
        return snippet

    @staticmethod
    def _build_description(rule: RiskRule, snippets: List[str]) -> str:
        base = f"检测到【{rule.name}】风险"
        if snippets:
            base += f"。相关内容：{'；'.join(snippets[:3])}"
        return base

    def _score_to_level(self, score: float, default: RiskLevel) -> RiskLevel:
        if score >= settings.RISK_THRESHOLD_HIGH:
            return RiskLevel.HIGH
        if score >= settings.RISK_THRESHOLD_MEDIUM:
            return RiskLevel.MEDIUM
        if score >= settings.RISK_THRESHOLD_LOW:
            return RiskLevel.LOW
        if score > 0:
            return RiskLevel.INFO
        return default

    def _detect_missing_clauses(
        self,
        results: List[RiskDetectionResult],
        seen_risks: set,
        clauses: List[Any],
        full_text: str,
    ) -> None:
        categories_present = set()
        for clause in clauses:
            cat = getattr(clause, "category", None)
            if cat:
                categories_present.add(cat)

        required_categories = {
            ClauseCategory.FORCE_MAJEURE: "R011",
            ClauseCategory.CONFIDENTIALITY: "R012",
            ClauseCategory.LIABILITY: "R013",
        }

        for required_cat, rule_id in required_categories.items():
            if required_cat not in categories_present:
                rule = self.get_rule_by_id(rule_id)
                if not rule:
                    continue

                risk_key = f"{rule_id}_missing"
                if risk_key in seen_risks:
                    continue
                seen_risks.add(risk_key)

                general_ref = SourceReference(
                    clause_id=None,
                    clause_number="全文",
                    page_number=1,
                    original_snippet="全文未包含对应条款",
                    char_start=0,
                    char_end=len(full_text),
                    clause_title="缺失条款检测",
                )

                result = RiskDetectionResult(
                    risk_id=f"risk_{rule_id}_missing_{len(results) + 1}",
                    risk_type=RiskType.MISSING_KEY_CLAUSE,
                    risk_level=rule.default_level,
                    risk_score=0.75,
                    title=f"缺失{rule.name.replace('条款缺失', '')}条款",
                    description=f"经审查，合同全文未包含【{rule.category.value}】类型的条款，建议补充。",
                    suggestion=rule.suggestion,
                    source_references=[general_ref],
                    detection_method="clause_structure_analysis",
                    confidence=0.8,
                    rule_id=rule_id,
                    legal_basis=rule.legal_basis,
                    metadata={"missing_category": required_cat.value},
                )
                results.append(result)

    def _apply_contract_type_specific_analysis(
        self,
        results: List[RiskDetectionResult],
        seen_risks: set,
        clause_texts: List[tuple],
        contract_type: str,
    ) -> None:
        pass

    async def llm_risk_assessment(
        self,
        clause_text: str,
        clause_context: str = "",
        contract_type: str = "",
    ) -> Dict[str, Any]:
        """使用LLM进行风险严重度判断"""
        prompt = f"""
你是一位资深合同法务专家。请评估以下合同条款的风险严重程度。

合同类型: {contract_type or "未指定"}
条款上下文: {clause_context or "无"}

条款内容:
{clause_text}

请分析该条款可能存在的风险，并按JSON格式返回结果：
{{
  "has_risk": true/false,
  "risk_score": 0-1之间的浮点数,
  "risk_type": "风险类型",
  "risk_level": "high/medium/low/info",
  "title": "风险标题",
  "description": "风险详细描述",
  "suggestion": "修改建议",
  "confidence": 0-1之间的置信度
}}
仅返回JSON，不要其他内容。
"""
        messages = [{"role": "user", "content": prompt}]
        try:
            response, _ = await self._llm_factory.achat_with_usage(messages)
            content = response.content if hasattr(response, "content") else str(response)
            content = content.strip()
            if content.startswith("```json"):
                content = content[7:]
            if content.endswith("```"):
                content = content[:-3]
            return json.loads(content.strip())
        except Exception as e:
            logger.warning(f"LLM风险评估失败: {e}")
            return {
                "has_risk": False,
                "risk_score": 0.0,
                "risk_type": "other",
                "risk_level": "info",
                "title": "",
                "description": "",
                "suggestion": "",
                "confidence": 0.0,
            }

    def validate_source_references(
        self,
        result: RiskDetectionResult,
        full_text: str,
    ) -> Dict[str, Any]:
        """验证来源引用的准确性"""
        if not full_text:
            return {"valid": False, "error": "无全文内容", "score": 0.0}

        if not result.source_references:
            return {"valid": False, "error": "无来源引用", "score": 0.0}

        total_refs = len(result.source_references)
        valid_refs = 0
        details: List[Dict[str, Any]] = []

        for ref in result.source_references:
            ref_detail = {
                "clause_id": ref.clause_id,
                "clause_number": ref.clause_number,
                "char_start": ref.char_start,
                "char_end": ref.char_end,
                "valid": False,
                "reason": "",
                "snippet_match": False,
            }

            text_len = len(full_text)
            if ref.char_end > text_len:
                ref_detail["reason"] = "字符结束位置超出全文长度"
                details.append(ref_detail)
                continue

            if ref.char_start < 0 or ref.char_start >= text_len:
                ref_detail["reason"] = "字符起始位置无效"
                details.append(ref_detail)
                continue

            if ref.char_start >= ref.char_end:
                ref_detail["reason"] = "字符起始位置大于结束位置"
                details.append(ref_detail)
                continue

            actual_segment = full_text[ref.char_start : ref.char_end]
            clean_snippet = ref.original_snippet.replace("...", "").strip()
            clean_actual = actual_segment.strip()

            if clean_snippet and clean_actual:
                import re as _re

                snippet_chars = set(clean_snippet)
                actual_chars = set(clean_actual)
                overlap = len(snippet_chars & actual_chars)
                total = max(len(snippet_chars), 1)
                char_overlap_ratio = overlap / total

                if clean_snippet in clean_actual or clean_actual in clean_snippet:
                    ref_detail["snippet_match"] = True
                elif char_overlap_ratio >= 0.7:
                    ref_detail["snippet_match"] = True
                else:
                    ref_detail["reason"] = f"原文片段不匹配(重合度{char_overlap_ratio:.2f})"
                    details.append(ref_detail)
                    continue

            ref_detail["valid"] = True
            valid_refs += 1
            details.append(ref_detail)

        overall_score = valid_refs / total_refs if total_refs > 0 else 0.0
        return {
            "valid": overall_score >= 0.8,
            "score": round(overall_score, 4),
            "total_refs": total_refs,
            "valid_refs": valid_refs,
            "invalid_refs": total_refs - valid_refs,
            "details": details,
        }
