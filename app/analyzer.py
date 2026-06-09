import re
import jieba
import numpy as np
from typing import List, Dict, Any, Tuple, Optional
from dataclasses import dataclass

from app.config import settings
from app.models import FeedbackCategory

try:
    import torch
    from transformers import AutoTokenizer, AutoModelForSequenceClassification
    HAS_TRANSFORMERS = True
except ImportError:
    HAS_TRANSFORMERS = False


@dataclass
class FeedbackItemData:
    category: FeedbackCategory
    original_text: Optional[str]
    suggestion_text: str
    location_start: Optional[int]
    location_end: Optional[int]
    confidence: float
    severity: str
    evidence: Dict[str, Any]


@dataclass
class AnalysisResult:
    category: FeedbackCategory
    items: List[FeedbackItemData]
    overall_confidence: float
    evidence_refs: List[Dict[str, Any]]
    model_name: str


class EssayAnalyzer:
    def __init__(self):
        self.device = settings.MODEL_DEVICE
        self.low_threshold = settings.LOW_CONFIDENCE_THRESHOLD
        self.model_name = settings.ANALYSIS_MODEL_NAME
        self.tokenizer = None
        self.model = None
        self._model_loaded = False
        self._init_model()

    def _init_model(self):
        if not HAS_TRANSFORMERS:
            return
        try:
            self.tokenizer = AutoTokenizer.from_pretrained(
                self.model_name,
                cache_dir="./model_cache"
            )
            self.model = AutoModelForSequenceClassification.from_pretrained(
                self.model_name,
                cache_dir="./model_cache"
            ).to(self.device)
            self.model.eval()
            self._model_loaded = True
        except Exception:
            self._model_loaded = False

    def _score_text(self, text: str) -> Tuple[float, Dict[str, Any]]:
        if not self._model_loaded or not HAS_TRANSFORMERS:
            return self._heuristic_score(text)
        try:
            inputs = self.tokenizer(
                text,
                max_length=512,
                truncation=True,
                return_tensors="pt"
            ).to(self.device)
            with torch.no_grad():
                outputs = self.model(**inputs)
                probs = torch.softmax(outputs.logits, dim=-1)
                score = float(probs[0][-1].cpu().numpy())
                return score, {"model_probs": probs.cpu().numpy().tolist()}
        except Exception:
            return self._heuristic_score(text)

    def _heuristic_score(self, text: str) -> Tuple[float, Dict[str, Any]]:
        char_count = len(text)
        seg_list = list(jieba.cut(text))
        word_count = len([w for w in seg_list if w.strip()])
        sentences = re.split(r'[。！？.!?]', text)
        sentences = [s.strip() for s in sentences if s.strip()]
        avg_sent_len = word_count / max(len(sentences), 1)

        punct_density = len(re.findall(r'[，。！？、；：,.!?;:]', text)) / max(char_count, 1)
        para_count = len([p for p in text.split('\n') if p.strip()])

        score = 0.5
        reasons = []
        if 500 <= char_count <= 2000:
            score += 0.1
            reasons.append("字数合理")
        if len(sentences) >= 8:
            score += 0.05
            reasons.append("句子数量充足")
        if 10 <= avg_sent_len <= 25:
            score += 0.05
            reasons.append("句子长度适中")
        if 0.03 <= punct_density <= 0.1:
            score += 0.05
            reasons.append("标点密度合理")
        if para_count >= 3:
            score += 0.1
            reasons.append("段落结构清晰")

        score = max(0.05, min(0.95, score))
        return score, {
            "heuristic_reasons": reasons,
            "char_count": char_count,
            "word_count": word_count,
            "sentence_count": len(sentences),
            "avg_sent_len": round(avg_sent_len, 2),
            "paragraph_count": para_count
        }

    def _split_paragraphs_sentences(self, text: str) -> Tuple[List[str], List[Tuple[str, int, int]]]:
        paragraphs = [p.strip() for p in text.split('\n') if p.strip()]
        sentences = []
        cursor = 0
        for para in paragraphs:
            for m in re.finditer(r'[^。！？.!?]*[。！？.!?]?', para):
                s = m.group().strip()
                if s:
                    start = text.find(s, cursor)
                    if start == -1:
                        start = cursor
                    end = start + len(s)
                    sentences.append((s, start, end))
                    cursor = end
        return paragraphs, sentences

    def analyze_structure(self, text: str) -> AnalysisResult:
        paragraphs, sentences = self._split_paragraphs_sentences(text)
        items: List[FeedbackItemData] = []
        evidences: List[Dict[str, Any]] = []

        overall_score, meta = self._score_text(text)
        evidences.append({
            "evidence_type": "structure_overall",
            "evidence_data": meta,
            "description": "整体结构量化指标"
        })

        para_count = len(paragraphs)
        if para_count < 3:
            conf = 0.85 if para_count < 2 else 0.7
            items.append(FeedbackItemData(
                category=FeedbackCategory.STRUCTURE,
                original_text=text[:200] + "..." if len(text) > 200 else text,
                suggestion_text=f"全文仅{para_count}个段落，建议分为开头、主体（2-3段）、结尾共4-6段，使结构更清晰。",
                location_start=0,
                location_end=min(len(text), 200),
                confidence=conf,
                severity="high",
                evidence={"paragraph_count": para_count, "recommended": "4-6段"}
            ))
        elif para_count > 8:
            items.append(FeedbackItemData(
                category=FeedbackCategory.STRUCTURE,
                original_text=None,
                suggestion_text=f"段落数达{para_count}段，过多段落可能导致结构松散，建议合并语义相近的段落。",
                location_start=None,
                location_end=None,
                confidence=0.7,
                severity="normal",
                evidence={"paragraph_count": para_count}
            ))

        if paragraphs:
            first_para = paragraphs[0]
            first_len = len(first_para)
            if first_len < 30:
                items.append(FeedbackItemData(
                    category=FeedbackCategory.STRUCTURE,
                    original_text=first_para,
                    suggestion_text="开头段过短，建议点明主题、交代背景或引用名言引入，一般80-150字为宜。",
                    location_start=text.find(first_para),
                    location_end=text.find(first_para) + first_len,
                    confidence=0.8,
                    severity="normal",
                    evidence={"first_para_len": first_len, "recommended": "80-150字"}
                ))
            elif first_len > 400:
                items.append(FeedbackItemData(
                    category=FeedbackCategory.STRUCTURE,
                    original_text=first_para[:100] + "...",
                    suggestion_text="开头段过长，入题较慢。建议开篇点题，简洁有力，避免铺垫过多。",
                    location_start=text.find(first_para),
                    location_end=text.find(first_para) + min(first_len, 100),
                    confidence=0.75,
                    severity="normal",
                    evidence={"first_para_len": first_len}
                ))

        if len(paragraphs) >= 2:
            last_para = paragraphs[-1]
            last_len = len(last_para)
            has_summary = any(w in last_para for w in ["总之", "综上", "总结", "总而言之", "综上所述", "所以说"])
            if not has_summary and last_len < 50:
                items.append(FeedbackItemData(
                    category=FeedbackCategory.STRUCTURE,
                    original_text=last_para,
                    suggestion_text="结尾段略显仓促，缺少总结升华。可用'总之''综上'等词总结全文观点，深化主旨。",
                    location_start=text.rfind(last_para),
                    location_end=text.rfind(last_para) + last_len,
                    confidence=0.78,
                    severity="normal",
                    evidence={"has_summary_marker": False, "last_para_len": last_len}
                ))

        confidences = [it.confidence for it in items] if items else [overall_score]
        avg_conf = float(np.mean(confidences))

        return AnalysisResult(
            category=FeedbackCategory.STRUCTURE,
            items=items,
            overall_confidence=avg_conf,
            evidence_refs=evidences,
            model_name=self.model_name if self._model_loaded else "heuristic_v1"
        )

    def _detect_argument_patterns(self, sentence: str) -> Dict[str, Any]:
        evidence_markers = [
            "例如", "比如", "正如", "据", "调查", "研究", "数据", "统计",
            "显示", "表明", "证明", "可见", "据报道", "史料", "记载"
        ]
        quote_markers = ["说过", "曾说", "名言", "曰", "：“", ":'", ':"', "说道"]
        logic_markers = ["因为", "所以", "因此", "由此可见", "因而", "从而", "既然", "那么"]
        example_count = sum(1 for m in evidence_markers if m in sentence)
        has_quote = any(m in sentence for m in quote_markers)
        logic_count = sum(1 for m in logic_markers if m in sentence)
        return {
            "evidence_markers_found": [m for m in evidence_markers if m in sentence],
            "example_count": example_count,
            "has_quote": has_quote,
            "logic_markers_found": [m for m in logic_markers if m in sentence],
            "logic_count": logic_count
        }

    def analyze_evidence(self, text: str) -> AnalysisResult:
        paragraphs, sentences = self._split_paragraphs_sentences(text)
        items: List[FeedbackItemData] = []
        evidences: List[Dict[str, Any]] = []

        body_paragraphs = paragraphs[1:-1] if len(paragraphs) >= 3 else paragraphs
        total_evidence = 0
        para_evidence_counts = []
        for idx, para in enumerate(body_paragraphs, start=1):
            _, para_sents = self._split_paragraphs_sentences(para)
            para_evidence = 0
            for sent_text, s_start, s_end in para_sents:
                analysis = self._detect_argument_patterns(sent_text)
                para_evidence += analysis["example_count"]
                para_evidence += 1 if analysis["has_quote"] else 0
            total_evidence += para_evidence
            para_evidence_counts.append({"para_index": idx, "evidence_count": para_evidence})

            if para_evidence == 0 and len(para) > 80:
                items.append(FeedbackItemData(
                    category=FeedbackCategory.EVIDENCE,
                    original_text=para[:150] + ("..." if len(para) > 150 else ""),
                    suggestion_text=f"第{idx}个主体段缺少具体论据支撑，建议添加典型事例、数据、名人名言或亲身经历来增强说服力。",
                    location_start=text.find(para),
                    location_end=text.find(para) + min(len(para), 150),
                    confidence=0.82,
                    severity="high",
                    evidence={"para_analysis": analysis}
                ))

        evidences.append({
            "evidence_type": "evidence_distribution",
            "evidence_data": {
                "total_evidence_markers": total_evidence,
                "paragraph_breakdown": para_evidence_counts
            },
            "description": "论据标记分布统计"
        })

        if total_evidence == 0 and len(text) > 200:
            items.append(FeedbackItemData(
                category=FeedbackCategory.EVIDENCE,
                original_text=None,
                suggestion_text="全文缺少论据，建议每个论点至少配备1个典型事例或名言，并在举例后结合观点展开分析。",
                location_start=None,
                location_end=None,
                confidence=0.9,
                severity="high",
                evidence={"total_evidence": 0}
            ))
        elif 0 < total_evidence < 2 and len(text) > 500:
            items.append(FeedbackItemData(
                category=FeedbackCategory.EVIDENCE,
                original_text=None,
                suggestion_text=f"全文仅{total_evidence}处论据标记，论据偏少。建议多角度选择论据（古今中外、正反对比）以增强论证力度。",
                location_start=None,
                location_end=None,
                confidence=0.7,
                severity="normal",
                evidence={"total_evidence": total_evidence}
            ))

        for sent_text, s_start, s_end in sentences:
            analysis = self._detect_argument_patterns(sent_text)
            if analysis["example_count"] > 0 and analysis["logic_count"] == 0 and len(sent_text) > 30:
                items.append(FeedbackItemData(
                    category=FeedbackCategory.EVIDENCE,
                    original_text=sent_text,
                    suggestion_text="论据后缺少分析。建议在举例后，用'因此''可见'等过渡词结合中心论点展开分析，做到叙议结合。",
                    location_start=s_start,
                    location_end=s_end,
                    confidence=0.65,
                    severity="normal",
                    evidence=analysis
                ))

        confidences = [it.confidence for it in items] if items else [0.6 + 0.03 * total_evidence]
        avg_conf = float(np.mean(confidences))
        avg_conf = min(0.95, max(0.4, avg_conf))

        return AnalysisResult(
            category=FeedbackCategory.EVIDENCE,
            items=items,
            overall_confidence=avg_conf,
            evidence_refs=evidences,
            model_name=self.model_name if self._model_loaded else "heuristic_v1"
        )

    def _load_common_typos(self) -> List[Tuple[str, str]]:
        return [
            ("的的", "的"), ("了了", "了"), ("是是", "是"),
            ("在在", "在"), ("和和", "和"), ("有有", "有"),
            ("既使", "即使"), ("既然...就", "既然...就"),
            ("再接再励", "再接再厉"), ("不径而走", "不胫而走"),
            ("谈笑风声", "谈笑风生"), ("金壁辉煌", "金碧辉煌"),
            ("迫不急待", "迫不及待"), ("兴高彩烈", "兴高采烈"),
            ("走头无路", "走投无路"), ("一如继往", "一如既往"),
            ("仗义直言", "仗义执言"), ("世外桃园", "世外桃源"),
            ("委屈求全", "委曲求全"), ("金榜提名", "金榜题名"),
            ("的到", "得到"), ("做为", "作为"), ("那怕", "哪怕"),
            ("必需", "必须"), ("即然", "既然"), ("以经", "已经"),
            ("所已", "所以"), ("在次", "再次"), ("作题", "做题"),
            ("决对", "绝对"), ("一愁莫展", "一筹莫展"),
            ("功亏一匮", "功亏一篑"), ("融汇贯通", "融会贯通"),
        ]

    def analyze_typos(self, text: str) -> AnalysisResult:
        items: List[FeedbackItemData] = []
        evidences: List[Dict[str, Any]] = []
        checked_positions = set()

        common_typos = self._load_common_typos()
        typo_matches = []
        for wrong, right in common_typos:
            start = 0
            while True:
                idx = text.find(wrong, start)
                if idx == -1:
                    break
                if any(p in checked_positions for p in range(idx, idx + len(wrong))):
                    start = idx + 1
                    continue
                typo_matches.append((idx, idx + len(wrong), wrong, right, 0.9))
                for p in range(idx, idx + len(wrong)):
                    checked_positions.add(p)
                start = idx + len(wrong)

        text_bytes = text.encode("utf-8", errors="replace")
        decoded = text_bytes.decode("utf-8", errors="replace")
        if decoded != text:
            items.append(FeedbackItemData(
                category=FeedbackCategory.TYPO,
                original_text=None,
                suggestion_text="检测到文本中存在乱码或不可见字符，请检查原始输入。",
                location_start=None,
                location_end=None,
                confidence=0.95,
                severity="high",
                evidence={"has_encoding_issue": True}
            ))

        repeated_chars = re.finditer(r'([\u4e00-\u9fa5a-zA-Z])\1{2,}', text)
        for m in repeated_chars:
            char = m.group(1)
            items.append(FeedbackItemData(
                category=FeedbackCategory.TYPO,
                original_text=m.group(),
                suggestion_text=f"疑似重复字符'{char}'，请检查是否为笔误（特殊语气除外）。",
                location_start=m.start(),
                location_end=m.end(),
                confidence=0.7,
                severity="low",
                evidence={"pattern": f"重复字符: {m.group()}"}
            ))

        for start, end, wrong, right, conf in sorted(typo_matches, key=lambda x: x[0]):
            context_start = max(0, start - 10)
            context_end = min(len(text), end + 10)
            items.append(FeedbackItemData(
                category=FeedbackCategory.TYPO,
                original_text=text[start:end],
                suggestion_text=f"疑似错别字：'{wrong}' 建议改为 '{right}'。上下文：{text[context_start:context_end]}",
                location_start=start,
                location_end=end,
                confidence=conf,
                severity="normal",
                evidence={"wrong": wrong, "right": right}
            ))

        punct_issues = re.finditer(r'[，,。.!！?？；;：:]{2,}', text)
        for m in punct_issues:
            items.append(FeedbackItemData(
                category=FeedbackCategory.TYPO,
                original_text=m.group(),
                suggestion_text="连续出现多个标点符号，通常为笔误，请确认删除重复标点。",
                location_start=m.start(),
                location_end=m.end(),
                confidence=0.85,
                severity="low",
                evidence={"punct": m.group()}
            ))

        evidences.append({
            "evidence_type": "typo_statistics",
            "evidence_data": {
                "common_typo_count": len(typo_matches),
                "checked_typos": [w for _, _, w, _, _ in typo_matches]
            },
            "description": "错别字检测统计"
        })

        confidences = [it.confidence for it in items] if items else [0.9]
        avg_conf = float(np.mean(confidences))

        return AnalysisResult(
            category=FeedbackCategory.TYPO,
            items=items,
            overall_confidence=avg_conf,
            evidence_refs=evidences,
            model_name="rule_based_typo_v1"
        )

    def analyze_expression(self, text: str) -> AnalysisResult:
        paragraphs, sentences = self._split_paragraphs_sentences(text)
        items: List[FeedbackItemData] = []
        evidences: List[Dict[str, Any]] = []
        sent_lengths = []

        weak_words = ["非常", "很", "十分", "特别", "真的", "好", "不错", "厉害", "东西", "事情", "很", "挺", "蛮"]
        vague_expressions = ["等等", "之类的", "什么的", "一些", "许多", "很多"]
        passive_voice = re.compile(r'被[\u4e00-\u9fa5]{1,6}(所|给)?[\u4e00-\u9fa5]{1,6}')
        clauses_pattern = re.compile(r'(然后|然后|接着|于是|就|就)')

        sent_meta = []
        for sent_text, s_start, s_end in sentences:
            char_len = len(sent_text)
            sent_lengths.append(char_len)
            weak_count = sum(sent_text.count(w) for w in weak_words)
            vague_count = sum(sent_text.count(w) for w in vague_expressions)
            clause_count = len(clauses_pattern.findall(sent_text))
            has_passive = bool(passive_voice.search(sent_text))

            sent_meta.append({
                "length": char_len,
                "weak_words": weak_count,
                "vague_count": vague_count,
                "clause_connectors": clause_count,
                "has_passive": has_passive
            })

            if char_len > 80:
                items.append(FeedbackItemData(
                    category=FeedbackCategory.EXPRESSION,
                    original_text=sent_text[:60] + "...",
                    suggestion_text=f"该句长达{char_len}字，建议拆分为2-3个短句，避免长句带来的理解负担，增强节奏感。",
                    location_start=s_start,
                    location_end=min(s_end, s_start + 60),
                    confidence=0.78,
                    severity="normal",
                    evidence={"sentence_length": char_len}
                ))
            elif char_len > 0 and char_len < 4 and len(sentences) > 5:
                items.append(FeedbackItemData(
                    category=FeedbackCategory.EXPRESSION,
                    original_text=sent_text,
                    suggestion_text="句子过短，可考虑与相邻句子合并，或补充修饰成分使表达更完整。",
                    location_start=s_start,
                    location_end=s_end,
                    confidence=0.55,
                    severity="low",
                    evidence={"sentence_length": char_len}
                ))

            if weak_count >= 2:
                items.append(FeedbackItemData(
                    category=FeedbackCategory.EXPRESSION,
                    original_text=sent_text,
                    suggestion_text=f"使用了{weak_count}个程度副词/模糊形容词（很、非常、好等），建议用具体描写替代。例如将'非常开心'改为'心花怒放'。",
                    location_start=s_start,
                    location_end=s_end,
                    confidence=0.65,
                    severity="normal",
                    evidence={"weak_words_count": weak_count}
                ))

            if vague_count >= 1 and char_len > 15:
                items.append(FeedbackItemData(
                    category=FeedbackCategory.EXPRESSION,
                    original_text=sent_text,
                    suggestion_text=f"使用了模糊表达，建议具体化：用具体事物或场景替代'等等''什么的'，使表达更充实准确。",
                    location_start=s_start,
                    location_end=s_end,
                    confidence=0.6,
                    severity="low",
                    evidence={"vague_words": vague_count}
                ))

            if clause_count >= 3:
                items.append(FeedbackItemData(
                    category=FeedbackCategory.EXPRESSION,
                    original_text=sent_text,
                    suggestion_text=f"句中使用了{clause_count}个承接关联词（然后/于是/就），句式略显单调，可尝试用'与此同时''不仅如此''无独有偶'等多样化过渡。",
                    location_start=s_start,
                    location_end=s_end,
                    confidence=0.62,
                    severity="low",
                    evidence={"connector_count": clause_count}
                ))

        if sent_lengths:
            avg_len = float(np.mean(sent_lengths))
            std_len = float(np.std(sent_lengths))
            evidences.append({
                "evidence_type": "sentence_rhythm",
                "evidence_data": {
                    "avg_sentence_length": round(avg_len, 1),
                    "std_sentence_length": round(std_len, 1),
                    "min_length": min(sent_lengths),
                    "max_length": max(sent_lengths)
                },
                "description": "句式节奏分析"
            })

            if std_len < 5 and len(sent_lengths) > 5:
                items.append(FeedbackItemData(
                    category=FeedbackCategory.EXPRESSION,
                    original_text=None,
                    suggestion_text="全文句式结构过于整齐，长短句搭配不足。建议穿插使用长短句，使行文更富有节奏感和韵律美。",
                    location_start=None,
                    location_end=None,
                    confidence=0.68,
                    severity="low",
                    evidence={"sentence_std": round(std_len, 1)}
                ))

        stopwords = set("的 了 和 是 就 都 而 及 与 这 那 有 在 我 你 他 她 它 们 也 被 把 让".split())
        words = list(jieba.cut(text))
        content_words = [w for w in words if w.strip() and w not in stopwords]
        unique_ratio = len(set(content_words)) / max(len(content_words), 1)
        evidences.append({
            "evidence_type": "vocabulary_richness",
            "evidence_data": {
                "total_content_words": len(content_words),
                "unique_content_words": len(set(content_words)),
                "unique_ratio": round(unique_ratio, 3)
            },
            "description": "词汇丰富度分析"
        })

        if unique_ratio < 0.4 and len(content_words) > 100:
            items.append(FeedbackItemData(
                category=FeedbackCategory.EXPRESSION,
                original_text=None,
                suggestion_text="全文词汇重复率偏高，建议使用同义词替换或比喻、拟人等修辞，丰富语言表达。",
                location_start=None,
                location_end=None,
                confidence=0.63,
                severity="low",
                evidence={"unique_ratio": round(unique_ratio, 3)}
            ))

        confidences = [it.confidence for it in items] if items else [0.65]
        avg_conf = float(np.mean(confidences))

        return AnalysisResult(
            category=FeedbackCategory.EXPRESSION,
            items=items,
            overall_confidence=avg_conf,
            evidence_refs=evidences,
            model_name=self.model_name if self._model_loaded else "heuristic_v1"
        )

    def analyze_full(self, text: str) -> Dict[FeedbackCategory, AnalysisResult]:
        if len(text.strip()) < 20:
            raise ValueError("作文内容过短，无法进行有效分析")

        results = {
            FeedbackCategory.STRUCTURE: self.analyze_structure(text),
            FeedbackCategory.EVIDENCE: self.analyze_evidence(text),
            FeedbackCategory.TYPO: self.analyze_typos(text),
            FeedbackCategory.EXPRESSION: self.analyze_expression(text),
        }
        return results


analyzer = EssayAnalyzer()
