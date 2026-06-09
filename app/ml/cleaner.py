import re
import jieba
import json
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
import hashlib


STOPWORDS = set([
    "的", "了", "在", "是", "我", "有", "和", "就", "不", "人", "都", "一",
    "一个", "上", "也", "很", "到", "说", "要", "去", "你", "会", "着", "没有",
    "看", "好", "自己", "这", "那", "这个", "那个", "什么", "怎么", "为什么",
    "可以", "可能", "应该", "需要", "已经", "但是", "所以", "因为", "如果",
    "还是", "或者", "以及", "的话", "一下", "一些", "一样", "一直", "其实",
    "然后", "还有", "就是", "这样", "那样", "多少", "几个", "怎么样",
    "您好", "你好", "谢谢", "麻烦", "请问", "一下", "啊", "哦", "呢", "吧",
    "吗", "嗯", "哈", "啦", "呗", "呀", "嘛", "么", "了", "请", "帮忙",
])


URL_PATTERN = re.compile(
    r'https?://(?:[-\w.]|(?:%[\da-fA-F]{2}))+[\w\-._~:/?#[\]@!$&\'()*+,;=%]*'
)
EMAIL_PATTERN = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')
PHONE_PATTERN = re.compile(r'\b1[3-9]\d{9}\b')
ORDER_NO_PATTERN = re.compile(r'\b(?:[A-Z]{1,4}[-_]?)?\d{8,20}\b')
HTML_PATTERN = re.compile(r'<[^>]+>')
EMOJI_PATTERN = re.compile(
    "["
    "\U0001F600-\U0001F64F"
    "\U0001F300-\U0001F5FF"
    "\U0001F680-\U0001F6FF"
    "\U0001F1E0-\U0001F1FF"
    "\U00002700-\U000027BF"
    "\U0001F900-\U0001F9FF"
    "]+",
    flags=re.UNICODE,
)
WHITESPACE_PATTERN = re.compile(r'\s+')
SPECIAL_CHARS_PATTERN = re.compile(r'[^\w\s\u4e00-\u9fff]')


@dataclass
class CleanedText:
    original: str
    cleaned: str
    tokens: List[str]
    normalized: str
    metadata: Dict[str, Any]


class TextCleaner:
    def __init__(self, stopwords: Optional[set] = None, use_jieba: bool = True):
        self.stopwords = stopwords or STOPWORDS
        self.use_jieba = use_jieba

    def clean_text(self, text: str) -> CleanedText:
        original = text or ""
        metadata = {
            "original_length": len(original),
            "urls_found": [],
            "emails_found": [],
            "phones_found": [],
            "order_nos_found": [],
            "emojis_removed": False,
        }

        def _capture_and_replace(pattern: re.Pattern, placeholder: str, store_key: str) -> str:
            nonlocal working
            matches = pattern.findall(working)
            if matches:
                metadata[store_key] = matches
                working = pattern.sub(placeholder, working)
            return working

        working = original.strip()
        working = HTML_PATTERN.sub(' ', working)

        if EMOJI_PATTERN.search(working):
            metadata["emojis_removed"] = True
            working = EMOJI_PATTERN.sub(' ', working)

        working = _capture_and_replace(URL_PATTERN, "[URL]", "urls_found")
        working = _capture_and_replace(EMAIL_PATTERN, "[EMAIL]", "emails_found")
        working = _capture_and_replace(PHONE_PATTERN, "[PHONE]", "phones_found")
        working = _capture_and_replace(ORDER_NO_PATTERN, "[ORDER]", "order_nos_found")

        working = working.lower()

        working = SPECIAL_CHARS_PATTERN.sub(' ', working)
        working = WHITESPACE_PATTERN.sub(' ', working).strip()

        tokens = self._tokenize(working)
        filtered_tokens = [t for t in tokens if t not in self.stopwords and len(t.strip()) > 0]
        normalized = ' '.join(filtered_tokens)

        metadata["cleaned_length"] = len(working)
        metadata["token_count"] = len(tokens)
        metadata["filtered_token_count"] = len(filtered_tokens)

        return CleanedText(
            original=original,
            cleaned=working,
            tokens=filtered_tokens,
            normalized=normalized,
            metadata=metadata,
        )

    def _tokenize(self, text: str) -> List[str]:
        if self.use_jieba:
            return list(jieba.cut(text))
        return [t for t in text.split() if t]

    def clean_ticket(self, title: str, content: str, channel: Optional[str] = None) -> CleanedText:
        combined = f"{title}\n{content}"
        if channel:
            combined = f"[CHANNEL_{channel.upper()}]\n{combined}"
        return self.clean_text(combined)


def generate_text_hash(text: str) -> str:
    return hashlib.md5(text.encode("utf-8")).hexdigest()


def remove_near_duplicates(texts: List[Tuple[int, str]], threshold: float = 0.95) -> List[int]:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity

    if len(texts) < 2:
        return [tid for tid, _ in texts]

    ids = [tid for tid, _ in texts]
    contents = [t for _, t in texts]

    vectorizer = TfidfVectorizer(max_features=5000)
    try:
        tfidf = vectorizer.fit_transform(contents)
    except ValueError:
        return ids

    sim_matrix = cosine_similarity(tfidf)
    kept_ids = []
    removed = set()

    for i in range(len(ids)):
        if i in removed:
            continue
        kept_ids.append(ids[i])
        for j in range(i + 1, len(ids)):
            if sim_matrix[i][j] >= threshold:
                removed.add(j)

    return kept_ids


def detect_language(text: str) -> str:
    chinese_chars = sum(1 for c in text if '\u4e00' <= c <= '\u9fff')
    total_chars = sum(1 for c in text if c.isalpha())
    if total_chars == 0:
        return "unknown"
    ratio = chinese_chars / total_chars
    if ratio >= 0.5:
        return "zh"
    return "en"
