import re
import base64
from typing import Tuple, Optional
from cryptography.fernet import Fernet
from hashlib import sha256

from app.config import settings


def _get_cipher() -> Fernet:
    key_bytes = sha256(settings.SECRET_KEY.encode()).digest()
    fernet_key = base64.urlsafe_b64encode(key_bytes)
    return Fernet(fernet_key)


def encrypt_sensitive(text: str) -> str:
    if not text:
        return ""
    cipher = _get_cipher()
    return cipher.encrypt(text.encode("utf-8")).decode("utf-8")


def decrypt_sensitive(encrypted_text: str) -> str:
    if not encrypted_text:
        return ""
    try:
        cipher = _get_cipher()
        return cipher.decrypt(encrypted_text.encode("utf-8")).decode("utf-8")
    except Exception:
        return ""


PHONE_PATTERN = re.compile(r"(?<!\d)(1[3-9]\d{9})(?!\d)")
ID_CARD_PATTERN = re.compile(r"(?<!\d)(\d{17}[\dXx])(?!\d)")
EMAIL_PATTERN = re.compile(r"([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})")
ADDRESS_PATTERNS = [
    re.compile(r"(北京市|上海市|天津市|重庆市|河北省|山西省|辽宁省|吉林省|黑龙江省|江苏省|浙江省|安徽省|福建省|江西省|山东省|河南省|湖北省|湖南省|广东省|海南省|四川省|贵州省|云南省|陕西省|甘肃省|青海省|台湾省|内蒙古自治区|广西壮族自治区|西藏自治区|宁夏回族自治区|新疆维吾尔自治区|香港特别行政区|澳门特别行政区)[^，。；,.\s]{2,20}(路|街|巷|号|栋|单元|室|楼|院|小区|花园|大厦|广场)"),
    re.compile(r"(家住|住址|地址|住在|位于)[：:是]?[^，。；,.\s]{3,30}"),
]
NAME_PATTERN = re.compile(r"(我叫|我是|我的名字|姓名)[：:是]?[\u4e00-\u9fa5]{2,4}(同学|先生|女士)?")


def _mask_text(text: str, pattern: re.Pattern, group_idx: int = 0) -> str:
    def _replacer(m):
        matched = m.group(group_idx)
        if len(matched) <= 3:
            return settings.MASK_REPLACEMENT
        return matched[:1] + settings.MASK_REPLACEMENT + matched[-1:]
    return pattern.sub(_replacer, text)


def _mask_name_patterns(text: str) -> str:
    def _replacer(m):
        full = m.group(0)
        prefix_match = re.match(r"(我叫|我是|我的名字|姓名)[：:是]?", full)
        if prefix_match:
            prefix = prefix_match.group(0)
            name_part = full[len(prefix):]
            suffix_match = re.search(r"(同学|先生|女士)$", name_part)
            if suffix_match:
                name = name_part[:-len(suffix_match.group(0))]
                suffix = suffix_match.group(0)
            else:
                name = name_part
                suffix = ""
            if len(name) >= 2:
                masked_name = name[0] + settings.MASK_REPLACEMENT
            else:
                masked_name = settings.MASK_REPLACEMENT
            return prefix + masked_name + suffix
        return full
    return NAME_PATTERN.sub(_replacer, text)


def mask_sensitive_data(text: str) -> Tuple[str, list]:
    masked = text
    actions = []

    for m in PHONE_PATTERN.finditer(text):
        actions.append({"type": "phone", "position": m.span()})
    masked = _mask_text(masked, PHONE_PATTERN)

    for m in ID_CARD_PATTERN.finditer(text):
        actions.append({"type": "id_card", "position": m.span()})
    masked = _mask_text(masked, ID_CARD_PATTERN)

    for m in EMAIL_PATTERN.finditer(text):
        actions.append({"type": "email", "position": m.span()})
    masked = _mask_text(masked, EMAIL_PATTERN, group_idx=1)

    for pattern in ADDRESS_PATTERNS:
        for m in pattern.finditer(masked):
            actions.append({"type": "address", "position": m.span()})
        masked = pattern.sub(lambda m: settings.MASK_REPLACEMENT * 3, masked)

    masked = _mask_name_patterns(masked)

    return masked, actions


def mask_for_export(text: str) -> str:
    masked, _ = mask_sensitive_data(text)
    if len(masked) > 200:
        masked = masked[:200] + "..."
    return masked


def extract_evidence_summary(feedback_items: list, max_items: int = 5) -> list:
    summaries = []
    approved_items = [it for it in feedback_items if it.get("audit_status") == "approved"]
    for item in approved_items[:max_items]:
        suggestion = item.get("revised_suggestion") or item.get("suggestion_text", "")
        summaries.append({
            "category": item.get("category"),
            "suggestion_summary": mask_for_export(suggestion)[:100],
            "severity": item.get("severity", "normal")
        })
    return summaries
