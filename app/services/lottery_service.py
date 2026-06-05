import random
from typing import List, Dict, Tuple
from sqlalchemy.orm import Session
from datetime import datetime
from app.models import VendorApplication, Booth, BoothAssignment, Category, ApplicationStatus, BoothStatus, AssignmentStatus
from app.schemas.booth import LotteryResult, BoothAssignmentResponse


class LotteryService:
    def __init__(self, db: Session):
        self.db = db

    def _get_adjacent_booths(self, booth: Booth, all_booths: List[Booth]) -> List[Booth]:
        adjacent = []
        for b in all_booths:
            if b.zone == booth.zone and abs(b.position_order - booth.position_order) == 1:
                adjacent.append(b)
        return adjacent

    def _get_category_at_booth(self, booth_id: int, assignments: Dict[int, BoothAssignment]) -> int:
        if booth_id in assignments:
            assignment = assignments[booth_id]
            application = self.db.query(VendorApplication).filter(
                VendorApplication.id == assignment.application_id
            ).first()
            if application:
                return application.category_id
        return None

    def _check_category_conflict(
        self,
        booth: Booth,
        category_id: int,
        assignments: Dict[int, BoothAssignment],
        all_booths: List[Booth]
    ) -> bool:
        adjacent_booths = self._get_adjacent_booths(booth, all_booths)
        for adj_booth in adjacent_booths:
            adj_category = self._get_category_at_booth(adj_booth.id, assignments)
            if adj_category == category_id:
                return True
        return False

    def run_lottery(self, event_date: datetime, zone: str = None) -> LotteryResult:
        applications = self.db.query(VendorApplication).filter(
            VendorApplication.event_date == event_date,
            VendorApplication.status == ApplicationStatus.APPROVED
        ).all()

        if zone:
            booths_query = self.db.query(Booth).filter(
                Booth.zone == zone,
                Booth.status == BoothStatus.AVAILABLE
            )
        else:
            booths_query = self.db.query(Booth).filter(
                Booth.status == BoothStatus.AVAILABLE
            )
        booths = booths_query.order_by(Booth.zone, Booth.position_order).all()

        existing_assignments = self.db.query(BoothAssignment).filter(
            BoothAssignment.event_date == event_date,
            BoothAssignment.status != AssignmentStatus.CANCELLED
        ).all()
        assigned_booth_ids = {a.booth_id for a in existing_assignments}
        available_booths = [b for b in booths if b.id not in assigned_booth_ids]

        shuffled_applications = applications.copy()
        random.shuffle(shuffled_applications)

        current_assignments: Dict[int, BoothAssignment] = {}
        for a in existing_assignments:
            current_assignments[a.booth_id] = a

        new_assignments: List[BoothAssignment] = []
        unassigned: List[VendorApplication] = []

        for app in shuffled_applications:
            placed = False
            shuffled_booths = available_booths.copy()
            random.shuffle(shuffled_booths)
            shuffled_booths.sort(key=lambda b: b.position_order)

            for booth in shuffled_booths:
                if booth.id in current_assignments:
                    continue
                if not self._check_category_conflict(booth, app.category_id, current_assignments, booths):
                    assignment = BoothAssignment(
                        booth_id=booth.id,
                        vendor_id=app.vendor_id,
                        application_id=app.id,
                        event_date=event_date,
                        status=AssignmentStatus.DRAWN,
                        lottery_round=1
                    )
                    self.db.add(assignment)
                    current_assignments[booth.id] = assignment
                    new_assignments.append(assignment)
                    placed = True
                    break

            if not placed:
                unassigned.append(app)

        for booth in available_booths:
            if booth.id not in current_assignments:
                for app in unassigned:
                    assignment = BoothAssignment(
                        booth_id=booth.id,
                        vendor_id=app.vendor_id,
                        application_id=app.id,
                        event_date=event_date,
                        status=AssignmentStatus.DRAWN,
                        lottery_round=2,
                        notes="二轮分配：同品类就近原则放宽"
                    )
                    self.db.add(assignment)
                    current_assignments[booth.id] = assignment
                    new_assignments.append(assignment)
                    unassigned.remove(app)
                    break

        self.db.commit()

        for a in new_assignments:
            self.db.refresh(a)

        message = f"抽签完成：共分配 {len(new_assignments)} 个摊位"
        if unassigned:
            message += f"，剩余 {len(unassigned)} 个申请未分配"

        assignment_responses = []
        for a in new_assignments:
            a.booth = self.db.query(Booth).filter(Booth.id == a.booth_id).first()
            assignment_responses.append(BoothAssignmentResponse.model_validate(a))

        return LotteryResult(
            success=True,
            message=message,
            assignments=assignment_responses,
            total_applications=len(applications),
            total_booths=len(booths),
            assigned_count=len(new_assignments)
        )
