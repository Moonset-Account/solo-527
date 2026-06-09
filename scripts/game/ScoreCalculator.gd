extends Node
class_name ScoreCalculator
## 评分系统 - 计算关卡得分和星级

signal score_updated(new_score: int)
signal stars_calculated(stars: int)

const WEIGHT_BONUS_MAX := 0.2
const SPACE_BONUS_MAX := 0.2
const FRAGILE_SAFE_BONUS := 0.3
const NO_BREAK_PENALTY := 0.0
const STREAK_BONUS_PER_ITEM := 0.02

func calculate_score(level_def: Dictionary, box: PackingBox, all_items: Array[PackingItem]) -> Dictionary:
    var result: Dictionary = {
        "base_score": 0,
        "weight_bonus": 0,
        "space_bonus": 0,
        "fragile_bonus": 0,
        "streak_bonus": 0,
        "penalties": 0,
        "total_score": 0,
        "stars": 0,
        "items_in_box": 0,
        "broken_items": 0,
        "fragile_safe": true,
        "weight_ratio": 0.0,
        "space_usage": 0.0
    }

    var base: int = 0
    var items_in_box: int = 0
    var broken_items: int = 0
    var fragile_in_box: Array[PackingItem] = []

    for item in all_items:
        if item.is_in_box:
            items_in_box += 1
            base += item.get_effective_points()
            if item.is_fragile:
                fragile_in_box.append(item)
                if item.is_broken:
                    broken_items += 1
                    result["fragile_safe"] = false

    result["base_score"] = base
    result["items_in_box"] = items_in_box
    result["broken_items"] = broken_items

    var weight_ratio: float = box.get_weight_ratio()
    result["weight_ratio"] = weight_ratio
    if weight_ratio <= 1.0:
        var ideal_ratio: float = 0.8
        var weight_eff: float = 1.0 - abs(weight_ratio - ideal_ratio) / ideal_ratio
        result["weight_bonus"] = int(base * WEIGHT_BONUS_MAX * clampf(weight_eff, 0.0, 1.0))

    var space_usage: float = box.get_space_usage()
    result["space_usage"] = space_usage
    result["space_bonus"] = int(base * SPACE_BONUS_MAX * clampf(space_usage / 0.8, 0.0, 1.0))

    if result["fragile_safe"] and fragile_in_box.size() > 0:
        result["fragile_bonus"] = int(base * FRAGILE_SAFE_BONUS)

    var placed_consecutive: int = 0
    for item in all_items:
        if item.is_in_box and not item.is_broken:
            placed_consecutive += 1
    result["streak_bonus"] = int(base * STREAK_BONUS_PER_ITEM * placed_consecutive)

    var overweight_penalty: int = 0
    if weight_ratio > 1.0:
        overweight_penalty = int(base * 0.3 * (weight_ratio - 1.0))
    result["penalties"] = overweight_penalty + (broken_items * 50)

    var total: int = max(0, base + result["weight_bonus"] + result["space_bonus"] + result["fragile_bonus"] + result["streak_bonus"] - result["penalties"])
    result["total_score"] = total

    var three_star: int = int(level_def.get("three_star_score", 200))
    var two_star: int = int(level_def.get("two_star_score", 150))
    var target: int = int(level_def.get("target_score", 100))

    if broken_items > 0 or weight_ratio > 1.0:
        result["stars"] = 0
    elif total >= three_star:
        result["stars"] = 3
    elif total >= two_star:
        result["stars"] = 2
    elif total >= target:
        result["stars"] = 1
    else:
        result["stars"] = 0

    return result

func get_score_summary(result: Dictionary) -> String:
    var summary: String = ""
    summary += "[b]基础分:[/b] +%d\n" % int(result["base_score"])
    if int(result["weight_bonus"]) > 0:
        summary += "[color=green]重量优化:[/color] +%d\n" % int(result["weight_bonus"])
    if int(result["space_bonus"]) > 0:
        summary += "[color=green]空间利用:[/color] +%d\n" % int(result["space_bonus"])
    if int(result["fragile_bonus"]) > 0:
        summary += "[color=green]易碎品完好:[/color] +%d\n" % int(result["fragile_bonus"])
    if int(result["streak_bonus"]) > 0:
        summary += "[color=green]连放奖励:[/color] +%d\n" % int(result["streak_bonus"])
    if int(result["penalties"]) > 0:
        summary += "[color=red]扣分:[/color] -%d\n" % int(result["penalties"])
    summary += "\n[b][size=24]总分: %d[/size][/b]" % int(result["total_score"])
    return summary
