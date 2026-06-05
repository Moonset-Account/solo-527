from sqlalchemy.orm import Session

from app.models.elder import DietaryRestriction
from app.models.meal import Meal


def check_dietary_conflict(
    db: Session, elder_id: str, meal_id: str
) -> tuple[bool, str | None]:
    restrictions = (
        db.query(DietaryRestriction)
        .filter(DietaryRestriction.elder_id == elder_id)
        .all()
    )
    if not restrictions:
        return False, None

    meal = db.query(Meal).filter(Meal.id == meal_id).first()
    if not meal:
        return False, None

    conflict_details = []
    for restriction in restrictions:
        if restriction.ingredient in (meal.ingredients or []):
            conflict_details.append(
                f"{restriction.restriction_type}: 含{restriction.ingredient}({restriction.severity})"
            )
        if restriction.ingredient in (meal.allergens or []):
            conflict_details.append(
                f"{restriction.restriction_type}: 过敏原{restriction.ingredient}({restriction.severity})"
            )

    if conflict_details:
        return True, "; ".join(conflict_details)
    return False, None


def batch_check_conflicts(
    db: Session, elder_ids: list[str], meal_ids: list[str]
) -> dict[str, list[dict]]:
    results = {}
    for elder_id in elder_ids:
        conflicts = []
        for meal_id in meal_ids:
            has_conflict, detail = check_dietary_conflict(db, elder_id, meal_id)
            if has_conflict:
                conflicts.append({"meal_id": meal_id, "detail": detail})
        if conflicts:
            results[str(elder_id)] = conflicts
    return results
