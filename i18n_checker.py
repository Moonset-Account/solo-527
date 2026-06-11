import json
import re
import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Set, Tuple, Optional, Any


PLACEHOLDER_PATTERNS = [
    (re.compile(r'\$\{(\w+)\}'), lambda m: f'${{{m}}}'),
    (re.compile(r'\{\{(\w+)\}\}'), lambda m: f'{{{{{m}}}}}'),
    (re.compile(r'(?<![\$\{])\{(\w+)\}(?!\})'), lambda m: f'{{{m}}}'),
    (re.compile(r'(?<!\$)\$(\w+)(?!\{)'), lambda m: f'${m}'),
    (re.compile(r'%(\w+)%'), lambda m: f'%{m}%'),
    (re.compile(r'(?<!\w):(\w+)'), lambda m: f':{m}'),
]

PLACEHOLDER_NAME_PATTERNS = [
    re.compile(r'\$\{(\w+)\}'),
    re.compile(r'\{\{(\w+)\}\}'),
    re.compile(r'(?<![\$\{])\{(\w+)\}(?!\})'),
    re.compile(r'(?<!\$)\$(\w+)(?!\{)'),
    re.compile(r'%(\w+)%'),
    re.compile(r'(?<!\w):(\w+)'),
]


TRANSLATION_CALL_PATTERNS = [
    re.compile(r'''(?<![.\w])t\(\s*['"]([^'"]+)['"]\s*(?:[,)])'''),
    re.compile(r'''i18n\.t\(\s*['"]([^'"]+)['"]\s*(?:[,)])'''),
    re.compile(r'''translate\(\s*['"]([^'"]+)['"]\s*(?:[,)])'''),
    re.compile(r'''\$t\(\s*['"]([^'"]+)['"]\s*(?:[,)])'''),
    re.compile(r'''trans\(\s*['"]([^'"]+)['"]\s*(?:[,)])'''),
]


@dataclass
class PlaceholderMismatch:
    key: str
    source_placeholders: List[str]
    target_placeholders: List[str]
    source_names: List[str]
    target_names: List[str]
    locale: str
    mismatch_type: str = "name"


@dataclass
class I18nReport:
    missing_keys: Dict[str, List[str]] = field(default_factory=dict)
    unused_keys: List[str] = field(default_factory=list)
    placeholder_mismatches: List[PlaceholderMismatch] = field(default_factory=list)
    duplicate_values: Dict[str, List[str]] = field(default_factory=dict)
    code_referenced_keys: Set[str] = field(default_factory=set)
    total_source_keys: int = 0
    locale_stats: Dict[str, Dict[str, int]] = field(default_factory=dict)

    def has_errors(self, fail_on_missing: bool = False) -> bool:
        if self.placeholder_mismatches:
            return True
        if fail_on_missing and any(self.missing_keys.values()):
            return True
        return False

    def to_dict(self) -> Dict[str, Any]:
        return {
            "missing_keys": {k: v for k, v in self.missing_keys.items()},
            "unused_keys": self.unused_keys,
            "placeholder_mismatches": [
                {
                    "key": m.key,
                    "locale": m.locale,
                    "source_placeholders": m.source_placeholders,
                    "target_placeholders": m.target_placeholders,
                    "source_names": m.source_names,
                    "target_names": m.target_names,
                    "mismatch_type": m.mismatch_type,
                }
                for m in self.placeholder_mismatches
            ],
            "duplicate_values": {k: v for k, v in self.duplicate_values.items()},
            "locale_stats": self.locale_stats,
            "summary": {
                "total_source_keys": self.total_source_keys,
                "total_missing": sum(len(v) for v in self.missing_keys.values()),
                "total_unused": len(self.unused_keys),
                "total_placeholder_mismatches": len(self.placeholder_mismatches),
                "total_duplicates": len(self.duplicate_values),
            },
        }


def extract_placeholders(text: str) -> List[str]:
    placeholders: Set[str] = set()
    for pattern, formatter in PLACEHOLDER_PATTERNS:
        for match in pattern.findall(text):
            placeholders.add(formatter(match))
    return sorted(placeholders)


def extract_placeholder_names(text: str) -> List[str]:
    placeholders: Set[str] = set()
    for pattern in PLACEHOLDER_NAME_PATTERNS:
        for match in pattern.findall(text):
            placeholders.add(match)
    return sorted(placeholders)


def load_json_file(file_path: str) -> Dict[str, Any]:
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"文件不存在: {file_path}")
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def flatten_keys(data: Dict[str, Any], prefix: str = "") -> Dict[str, str]:
    result: Dict[str, str] = {}
    for key, value in data.items():
        full_key = f"{prefix}.{key}" if prefix else key
        if isinstance(value, dict):
            result.update(flatten_keys(value, full_key))
        elif isinstance(value, str):
            result[full_key] = value
        else:
            result[full_key] = str(value)
    return result


def scan_code_for_keys(code_dirs: List[str], extensions: Optional[List[str]] = None) -> Set[str]:
    if extensions is None:
        extensions = [".ts", ".tsx", ".js", ".jsx", ".vue", ".svelte"]
    referenced: Set[str] = set()

    for code_dir in code_dirs:
        dir_path = Path(code_dir)
        if not dir_path.exists():
            continue
        for root, _, files in os.walk(dir_path):
            for filename in files:
                if not any(filename.endswith(ext) for ext in extensions):
                    continue
                file_path = Path(root) / filename
                try:
                    content = file_path.read_text(encoding="utf-8", errors="ignore")
                    for pattern in TRANSLATION_CALL_PATTERNS:
                        for match in pattern.findall(content):
                            referenced.add(match)
                except Exception:
                    pass
    return referenced


def find_duplicate_values(flat_data: Dict[str, str]) -> Dict[str, List[str]]:
    value_to_keys: Dict[str, List[str]] = {}
    for key, value in flat_data.items():
        if not value.strip():
            continue
        value_to_keys.setdefault(value, []).append(key)
    return {v: k for v, k in value_to_keys.items() if len(k) > 1}


def check_i18n(
    source_file: str,
    target_files: Dict[str, str],
    code_dirs: Optional[List[str]] = None,
    specific_locales: Optional[List[str]] = None,
) -> I18nReport:
    report = I18nReport()

    source_data = load_json_file(source_file)
    source_flat = flatten_keys(source_data)
    report.total_source_keys = len(source_flat)

    source_placeholders: Dict[str, List[str]] = {}
    source_ph_names: Dict[str, List[str]] = {}
    for key, value in source_flat.items():
        source_placeholders[key] = extract_placeholders(value)
        source_ph_names[key] = extract_placeholder_names(value)

    if code_dirs:
        report.code_referenced_keys = scan_code_for_keys(code_dirs)
        all_keys = set(source_flat.keys())
        report.unused_keys = sorted(all_keys - report.code_referenced_keys)

    duplicate_map = find_duplicate_values(source_flat)
    report.duplicate_values = duplicate_map

    locales_to_check = specific_locales if specific_locales else list(target_files.keys())

    for locale in locales_to_check:
        if locale not in target_files:
            continue

        target_path = target_files[locale]
        try:
            target_data = load_json_file(target_path)
        except FileNotFoundError:
            report.missing_keys[locale] = sorted(source_flat.keys())
            report.locale_stats[locale] = {
                "missing": len(source_flat),
                "present": 0,
                "placeholder_mismatches": 0,
            }
            continue

        target_flat = flatten_keys(target_data)

        missing = sorted(set(source_flat.keys()) - set(target_flat.keys()))
        report.missing_keys[locale] = missing

        mismatch_count = 0
        for key in source_flat.keys():
            if key not in target_flat:
                continue
            src_ph = source_placeholders.get(key, [])
            src_names = source_ph_names.get(key, [])
            tgt_ph = extract_placeholders(target_flat[key])
            tgt_names = extract_placeholder_names(target_flat[key])

            mismatch_type = None
            if sorted(src_names) != sorted(tgt_names):
                mismatch_type = "name"
            elif sorted(src_ph) != sorted(tgt_ph):
                mismatch_type = "format"

            if mismatch_type:
                report.placeholder_mismatches.append(
                    PlaceholderMismatch(
                        key=key,
                        source_placeholders=src_ph,
                        target_placeholders=tgt_ph,
                        source_names=src_names,
                        target_names=tgt_names,
                        locale=locale,
                        mismatch_type=mismatch_type,
                    )
                )
                mismatch_count += 1

        report.locale_stats[locale] = {
            "missing": len(missing),
            "present": len(source_flat) - len(missing),
            "placeholder_mismatches": mismatch_count,
        }

    return report


def suggest_fix(key: str, source_value: str, locale: str) -> Dict[str, str]:
    return {
        "key": key,
        "locale": locale,
        "source_value": source_value,
        "note": "请保留占位符名称，避免翻译时破坏模板变量",
    }
