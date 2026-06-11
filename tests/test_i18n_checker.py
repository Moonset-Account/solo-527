import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from i18n_checker import (
    extract_placeholders,
    extract_placeholder_names,
    flatten_keys,
    find_duplicate_values,
    scan_code_for_keys,
    check_i18n,
    PlaceholderMismatch,
    MissingKeySuggestion,
    I18nReport,
    suggest_fix,
)

TEST_DIR = Path(__file__).parent
LOCALES_DIR = TEST_DIR / "locales"
SRC_DIR = TEST_DIR / "src"


def test_extract_placeholders_curly_braces():
    result = extract_placeholders("Hello, {name}! You have {count} items.")
    assert result == ["{count}", "{name}"]


def test_extract_placeholders_double_curly():
    result = extract_placeholders("Welcome, {{user}} to {{app}}!")
    assert result == ["{{app}}", "{{user}}"]


def test_extract_placeholders_colon():
    result = extract_placeholders("Go to :page for :action")
    assert result == [":action", ":page"]


def test_extract_placeholders_dollar():
    result = extract_placeholders("Price: $amount USD")
    assert result == ["$amount"]


def test_extract_placeholders_dollar_curly():
    result = extract_placeholders("Total: ${price} USD")
    assert result == ["${price}"]


def test_extract_placeholders_dollar_not_confused_with_dollar():
    result = extract_placeholders("Price: $a, Total: ${b}, Count: {c}")
    assert result == ["$a", "${b}", "{c}"]


def test_extract_placeholders_percent():
    result = extract_placeholders("Score: %score% / %total%")
    assert result == ["%score%", "%total%"]


def test_extract_placeholders_mixed():
    result = extract_placeholders("{name} has {{count}} :items at ${price} and $tax")
    assert result == ["$tax", "${price}", ":items", "{name}", "{{count}}"]


def test_extract_placeholders_none():
    result = extract_placeholders("Just plain text with no placeholders")
    assert result == []


def test_extract_placeholder_names_curly_braces():
    result = extract_placeholder_names("Hello, {name}! You have {count} items.")
    assert result == ["count", "name"]


def test_extract_placeholder_names_double_curly():
    result = extract_placeholder_names("Welcome, {{user}} to {{app}}!")
    assert result == ["app", "user"]


def test_extract_placeholder_names_colon():
    result = extract_placeholder_names("Go to :page for :action")
    assert result == ["action", "page"]


def test_extract_placeholder_names_mixed():
    result = extract_placeholder_names("{name} has {{count}} :items at ${price} and $tax")
    assert result == ["count", "items", "name", "price", "tax"]


def test_extract_placeholder_names_dollar_curly():
    result = extract_placeholder_names("Total: ${price} USD")
    assert result == ["price"]


def test_extract_placeholder_names_all_variants():
    result = extract_placeholder_names("a ${x} b {y} c $z d {{w}}")
    assert result == ["w", "x", "y", "z"]


def test_flatten_keys_simple():
    data = {"a": "1", "b": "2", "c": "3"}
    result = flatten_keys(data)
    assert result == {"a": "1", "b": "2", "c": "3"}


def test_flatten_keys_nested():
    data = {
        "common": {
            "hello": "Hello",
            "goodbye": "Goodbye",
        },
        "auth": {
            "login": "Login",
        },
    }
    result = flatten_keys(data)
    assert result == {
        "common.hello": "Hello",
        "common.goodbye": "Goodbye",
        "auth.login": "Login",
    }


def test_flatten_keys_deep_nested():
    data = {
        "a": {
            "b": {
                "c": {
                    "d": "deep_value",
                }
            }
        }
    }
    result = flatten_keys(data)
    assert result == {"a.b.c.d": "deep_value"}


def test_find_duplicate_values():
    data = {
        "key1": "same value",
        "key2": "different",
        "key3": "same value",
        "key4": "other",
        "key5": "same value",
    }
    result = find_duplicate_values(data)
    assert "same value" in result
    assert set(result["same value"]) == {"key1", "key3", "key5"}
    assert "different" not in result
    assert "other" not in result


def test_find_duplicate_values_no_duplicates():
    data = {
        "key1": "value1",
        "key2": "value2",
        "key3": "value3",
    }
    result = find_duplicate_values(data)
    assert len(result) == 0


def test_find_duplicate_values_empty_ignored():
    data = {
        "key1": "",
        "key2": "",
        "key3": "   ",
    }
    result = find_duplicate_values(data)
    assert len(result) == 0


def test_scan_code_for_keys():
    keys = scan_code_for_keys([str(SRC_DIR)])
    assert "common.hello" in keys
    assert "common.welcome" in keys
    assert "common.submit" in keys
    assert "common.cancel" in keys
    assert "auth.login" in keys
    assert "auth.logout" in keys
    assert "auth.register" in keys
    assert "auth.forgot_password" in keys
    assert "auth.email_sent" in keys
    assert "auth.login_success" in keys
    assert "auth.error_invalid" in keys
    assert "auth.error_timeout" in keys
    assert "auth.reset_password" in keys
    assert "profile.title" in keys
    assert "profile.edit" in keys
    assert "profile.save" in keys
    assert "profile.score" in keys
    assert "profile.update_success" in keys
    assert "common.loading" in keys
    assert "common.retry" in keys
    assert "common.goodbye" in keys


def test_scan_code_for_keys_with_spaces(tmp_path):
    test_file = tmp_path / "test.ts"
    test_file.write_text(
        """
        // 字符串后直接跟逗号
        const a = t('key.a', { name: 'x' });
        // 字符串后有空格再接逗号
        const b = t('key.b' , { name: 'y' });
        // 字符串后有多个空格再接逗号
        const c = t('key.c'   , {});
        // 字符串后直接跟右括号
        const d = t('key.d');
        // 字符串后有空格再接右括号
        const e = t('key.e' );
        // 字符串后有多个空格再接右括号
        const f = t('key.f'   );

        // $t 格式带空格
        const g = $t('key.g' , {});
        const h = $t('key.h' );

        // i18n.t 格式带空格
        const i = i18n.t('key.i' , options);
        const j = i18n.t('key.j' );

        // translate 格式带空格
        const k = translate('key.k' , {});
        const l = translate('key.l' );

        // trans 格式带空格
        const m = trans('key.m' , {});
        const n = trans('key.n' );

        // 双引号带空格
        const o = t("key.o" , {});
        const p = t("key.p" );
        """,
        encoding="utf-8",
    )

    keys = scan_code_for_keys([str(tmp_path)])

    # 带空格跟逗号
    assert "key.b" in keys
    assert "key.c" in keys
    # 带空格跟右括号
    assert "key.e" in keys
    assert "key.f" in keys
    # 正常写法也应该匹配
    assert "key.a" in keys
    assert "key.d" in keys
    # $t 带空格
    assert "key.g" in keys
    assert "key.h" in keys
    # i18n.t 带空格
    assert "key.i" in keys
    assert "key.j" in keys
    # translate 带空格
    assert "key.k" in keys
    assert "key.l" in keys
    # trans 带空格
    assert "key.m" in keys
    assert "key.n" in keys
    # 双引号带空格
    assert "key.o" in keys
    assert "key.p" in keys


def test_check_i18n_basic():
    source_file = str(LOCALES_DIR / "en.json")
    target_files = {
        "zh-CN": str(LOCALES_DIR / "zh-CN.json"),
        "ja": str(LOCALES_DIR / "ja.json"),
    }
    report = check_i18n(source_file, target_files)

    assert report.total_source_keys == 28

    assert "zh-CN" in report.missing_keys
    zh_missing = set(report.missing_keys["zh-CN"])
    assert "common.greeting_duplicate" in zh_missing
    assert "auth.error_timeout" in zh_missing
    assert "auth.old_key_not_used" in zh_missing
    assert "profile.change_password" in zh_missing

    assert "ja" in report.missing_keys
    ja_missing = set(report.missing_keys["ja"])
    assert "common.greeting_duplicate" in ja_missing
    assert "auth.old_key_not_used" in ja_missing

    assert report.duplicate_values
    dup_values = list(report.duplicate_values.keys())
    assert any("Welcome to our app" in v for v in dup_values)


def test_check_i18n_placeholder_mismatches():
    source_file = str(LOCALES_DIR / "en.json")
    target_files = {
        "zh-CN": str(LOCALES_DIR / "zh-CN.json"),
    }
    report = check_i18n(source_file, target_files)

    mismatch_keys = {m.key for m in report.placeholder_mismatches}
    assert "common.welcome" in mismatch_keys
    assert "auth.email_sent" in mismatch_keys
    assert "auth.login_success" in mismatch_keys

    welcome_mismatch = next(
        m for m in report.placeholder_mismatches if m.key == "common.welcome"
    )
    assert welcome_mismatch.source_placeholders == ["{{user}}"]
    assert welcome_mismatch.target_placeholders == ["{{username}}"]
    assert welcome_mismatch.source_names == ["user"]
    assert welcome_mismatch.target_names == ["username"]
    assert welcome_mismatch.mismatch_type == "name"

    email_mismatch = next(
        m for m in report.placeholder_mismatches if m.key == "auth.email_sent"
    )
    assert email_mismatch.source_placeholders == [":email"]
    assert email_mismatch.target_placeholders == ["{email}"]
    assert email_mismatch.source_names == ["email"]
    assert email_mismatch.target_names == ["email"]
    assert email_mismatch.mismatch_type == "format"

    login_success_mismatch = next(
        m for m in report.placeholder_mismatches if m.key == "auth.login_success"
    )
    assert login_success_mismatch.source_names == ["username"]
    assert login_success_mismatch.target_names == ["user"]
    assert login_success_mismatch.mismatch_type == "name"

    price_mismatch = next(
        m for m in report.placeholder_mismatches if m.key == "common.price"
    )
    assert price_mismatch.source_placeholders == ["${amount}"]
    assert price_mismatch.target_placeholders == ["$amount"]
    assert price_mismatch.source_names == ["amount"]
    assert price_mismatch.target_names == ["amount"]
    assert price_mismatch.mismatch_type == "format"

    discount_mismatch = next(
        m for m in report.placeholder_mismatches if m.key == "common.discount"
    )
    assert discount_mismatch.source_placeholders == ["${discount}"]
    assert discount_mismatch.target_placeholders == ["{discount}"]
    assert discount_mismatch.source_names == ["discount"]
    assert discount_mismatch.target_names == ["discount"]
    assert discount_mismatch.mismatch_type == "format"


def test_check_i18n_unused_keys():
    source_file = str(LOCALES_DIR / "en.json")
    target_files = {
        "zh-CN": str(LOCALES_DIR / "zh-CN.json"),
    }
    report = check_i18n(source_file, target_files, code_dirs=[str(SRC_DIR)])

    assert "auth.old_key_not_used" in report.unused_keys
    assert "profile.settings" in report.unused_keys
    assert "profile.change_password" in report.unused_keys


def test_check_i18n_locale_filter():
    source_file = str(LOCALES_DIR / "en.json")
    target_files = {
        "zh-CN": str(LOCALES_DIR / "zh-CN.json"),
        "ja": str(LOCALES_DIR / "ja.json"),
    }
    report = check_i18n(source_file, target_files, specific_locales=["zh-CN"])

    assert "zh-CN" in report.missing_keys
    assert "ja" not in report.missing_keys
    assert "ja" not in report.locale_stats


def test_i18n_report_has_errors_placeholder_mismatch():
    report = I18nReport()
    assert report.has_errors() is False

    report.placeholder_mismatches.append(
        PlaceholderMismatch(
            key="test.key",
            source_placeholders=["{name}"],
            target_placeholders=["{user}"],
            source_names=["name"],
            target_names=["user"],
            locale="zh-CN",
            mismatch_type="name",
        )
    )
    assert report.has_errors() is True
    assert report.has_errors(fail_on_missing=True) is True


def test_i18n_report_has_errors_fail_on_missing():
    report = I18nReport()
    report.missing_keys = {"zh-CN": ["missing.key"]}

    assert report.has_errors() is False
    assert report.has_errors(fail_on_missing=True) is True


def test_i18n_report_to_dict():
    report = I18nReport()
    report.total_source_keys = 10
    report.missing_keys = {"zh-CN": ["key1", "key2"]}
    report.unused_keys = ["unused1"]
    report.placeholder_mismatches = [
        PlaceholderMismatch(
            key="test.key",
            source_placeholders=["{name}"],
            target_placeholders=["{user}"],
            source_names=["name"],
            target_names=["user"],
            locale="zh-CN",
            mismatch_type="name",
        )
    ]
    report.locale_stats = {
        "zh-CN": {"missing": 2, "present": 8, "placeholder_mismatches": 1}
    }
    report.duplicate_values = {"same": ["k1", "k2"]}

    d = report.to_dict()
    assert d["summary"]["total_source_keys"] == 10
    assert d["summary"]["total_missing"] == 2
    assert d["summary"]["total_unused"] == 1
    assert d["summary"]["total_placeholder_mismatches"] == 1
    assert d["summary"]["total_duplicates"] == 1
    assert len(d["placeholder_mismatches"]) == 1
    assert d["placeholder_mismatches"][0]["key"] == "test.key"
    assert d["placeholder_mismatches"][0]["mismatch_type"] == "name"
    assert d["placeholder_mismatches"][0]["source_names"] == ["name"]
    assert d["placeholder_mismatches"][0]["target_names"] == ["user"]
    assert d["locale_stats"]["zh-CN"]["missing"] == 2


def test_check_i18n_locale_stats():
    source_file = str(LOCALES_DIR / "en.json")
    target_files = {
        "zh-CN": str(LOCALES_DIR / "zh-CN.json"),
        "ja": str(LOCALES_DIR / "ja.json"),
    }
    report = check_i18n(source_file, target_files)

    assert "zh-CN" in report.locale_stats
    zh_stats = report.locale_stats["zh-CN"]
    assert zh_stats["missing"] + zh_stats["present"] == report.total_source_keys
    assert zh_stats["placeholder_mismatches"] >= 3

    assert "ja" in report.locale_stats
    ja_stats = report.locale_stats["ja"]
    assert ja_stats["missing"] + ja_stats["present"] == report.total_source_keys


def test_dollar_curly_placeholder_format_mismatch_detected(tmp_path):
    source = tmp_path / "en.json"
    source.write_text(
        json.dumps({
            "price": "Total: ${amount}",
            "discount": "Save ${percent}%",
        }),
        encoding="utf-8",
    )

    target_wrong_both = tmp_path / "zh.json"
    target_wrong_both.write_text(
        json.dumps({
            "price": "总计: $amount",
            "discount": "节省 {percent}%",
        }),
        encoding="utf-8",
    )

    target_correct = tmp_path / "ja.json"
    target_correct.write_text(
        json.dumps({
            "price": "合計: ${amount}",
            "discount": "割引: ${percent}%",
        }),
        encoding="utf-8",
    )

    report = check_i18n(
        str(source),
        {"zh": str(target_wrong_both), "ja": str(target_correct)},
    )

    zh_mismatches = [m for m in report.placeholder_mismatches if m.locale == "zh"]
    assert len(zh_mismatches) == 2

    price_m = next(m for m in zh_mismatches if m.key == "price")
    assert price_m.mismatch_type == "format"
    assert price_m.source_placeholders == ["${amount}"]
    assert price_m.target_placeholders == ["$amount"]

    discount_m = next(m for m in zh_mismatches if m.key == "discount")
    assert discount_m.mismatch_type == "format"
    assert discount_m.source_placeholders == ["${percent}"]
    assert discount_m.target_placeholders == ["{percent}"]

    ja_mismatches = [m for m in report.placeholder_mismatches if m.locale == "ja"]
    assert len(ja_mismatches) == 0

    assert report.has_errors() is True


def test_dollar_curly_placeholder_suggest_fix_preserves_format(tmp_path):
    source_value = "Total: ${amount}"
    suggestion = suggest_fix("price", source_value, "zh-CN")
    assert suggestion["source_value"] == source_value
    assert "${amount}" in suggestion["source_value"]
    assert "保留占位符名称" in suggestion["note"]
    assert suggestion["locale"] == "zh-CN"
    assert suggestion["key"] == "price"


def test_dollar_curly_in_json_output(tmp_path):
    source = tmp_path / "en.json"
    source.write_text(
        json.dumps({"price": "Total: ${amount}"}),
        encoding="utf-8",
    )
    target = tmp_path / "zh.json"
    target.write_text(
        json.dumps({"price": "Total: {amount}"}),
        encoding="utf-8",
    )

    report = check_i18n(str(source), {"zh": str(target)})
    d = report.to_dict()

    ph = d["placeholder_mismatches"][0]
    assert ph["key"] == "price"
    assert ph["mismatch_type"] == "format"
    assert ph["source_placeholders"] == ["${amount}"]
    assert ph["target_placeholders"] == ["{amount}"]
    assert ph["source_names"] == ["amount"]
    assert ph["target_names"] == ["amount"]
    assert d["summary"]["total_placeholder_mismatches"] == 1


def test_missing_key_suggestions_in_report():
    source_file = str(LOCALES_DIR / "en.json")
    target_files = {
        "zh-CN": str(LOCALES_DIR / "zh-CN.json"),
        "ja": str(LOCALES_DIR / "ja.json"),
    }
    report = check_i18n(source_file, target_files)

    zh_suggestions = [s for s in report.missing_key_suggestions if s.locale == "zh-CN"]
    ja_suggestions = [s for s in report.missing_key_suggestions if s.locale == "ja"]

    zh_sugg_keys = {s.key for s in zh_suggestions}
    assert "common.greeting_duplicate" in zh_sugg_keys
    assert "auth.error_timeout" in zh_sugg_keys
    assert "auth.old_key_not_used" in zh_sugg_keys
    assert "profile.change_password" in zh_sugg_keys

    ja_sugg_keys = {s.key for s in ja_suggestions}
    assert "common.greeting_duplicate" in ja_sugg_keys
    assert "auth.old_key_not_used" in ja_sugg_keys

    for s in zh_suggestions:
        assert s.locale == "zh-CN"
        assert s.key is not None
        assert s.source_value is not None
        assert "保留占位符" in s.note

    for s in ja_suggestions:
        assert s.locale == "ja"


def test_missing_key_suggestions_preserve_placeholder_format():
    source_file = str(LOCALES_DIR / "en.json")
    target_files = {
        "zh-CN": str(LOCALES_DIR / "zh-CN.json"),
    }
    report = check_i18n(source_file, target_files)

    greeting_s = next(
        s for s in report.missing_key_suggestions
        if s.key == "common.greeting_duplicate" and s.locale == "zh-CN"
    )
    assert "{{user}}" in greeting_s.source_value


def test_missing_key_suggestions_in_json_output(tmp_path):
    source = tmp_path / "en.json"
    source.write_text(
        json.dumps({
            "hello": "Hello, {name}!",
            "price": "Total: ${amount}",
            "score": "Score: %score% / %total%",
        }),
        encoding="utf-8",
    )
    target = tmp_path / "zh.json"
    target.write_text(
        json.dumps({
            "hello": "你好，{name}！",
        }),
        encoding="utf-8",
    )

    report = check_i18n(str(source), {"zh": str(target)})
    d = report.to_dict()

    assert "missing_key_suggestions" in d
    suggestions = d["missing_key_suggestions"]
    assert len(suggestions) == 2

    price_s = next(s for s in suggestions if s["key"] == "price")
    assert price_s["locale"] == "zh"
    assert price_s["source_value"] == "Total: ${amount}"
    assert "${amount}" in price_s["source_value"]
    assert "保留占位符" in price_s["note"]

    score_s = next(s for s in suggestions if s["key"] == "score")
    assert score_s["locale"] == "zh"
    assert score_s["source_value"] == "Score: %score% / %total%"
    assert "%score%" in score_s["source_value"]
    assert "%total%" in score_s["source_value"]


def test_missing_key_suggestions_file_not_found(tmp_path):
    source = tmp_path / "en.json"
    source.write_text(
        json.dumps({"hello": "Hello, {name}!"}),
        encoding="utf-8",
    )

    report = check_i18n(str(source), {"zh": str(tmp_path / "nonexistent.json")})

    assert len(report.missing_key_suggestions) == 1
    assert report.missing_key_suggestions[0].locale == "zh"
    assert report.missing_key_suggestions[0].key == "hello"
    assert report.missing_key_suggestions[0].source_value == "Hello, {name}!"
    assert "{name}" in report.missing_key_suggestions[0].source_value


def test_missing_keys_still_simple_list():
    source_file = str(LOCALES_DIR / "en.json")
    target_files = {
        "zh-CN": str(LOCALES_DIR / "zh-CN.json"),
    }
    report = check_i18n(source_file, target_files)

    assert isinstance(report.missing_keys["zh-CN"], list)
    for key in report.missing_keys["zh-CN"]:
        assert isinstance(key, str)
