init python:

    import time

    class SettlementSystem:

        GRADE_S = "S"
        GRADE_A = "A"
        GRADE_B = "B"
        GRADE_C = "C"

        def __init__(self):
            self.chapter_results = {}
            self._retry_counts = {}
            self._failure_records = []

        def calculate_chapter_score(self, chapter_id):
            chapter = store.level_config.get_chapter(chapter_id)
            if chapter is None:
                return {}

            discovered = store.evidence_board.get_discovered()
            total_evidence_in_chapter = 0
            discovered_in_chapter = 0
            for eid, ev in store.evidence_board.evidence.items():
                if ev.get("location") in chapter.get("available_locations", []):
                    total_evidence_in_chapter += 1
                    if ev["discovered"]:
                        discovered_in_chapter += 1

            interrogated = sum(1 for s in store.suspicion_system.suspects.values() if s["interrogated"])
            req_interrogated = chapter.get("required_suspects_interrogated", 0)

            contradictions = store.evidence_board.check_contradictions()
            player_connections = store.evidence_board.get_connection_count()

            hints_used = store.hint_system.get_hints_given_count()
            hint_threshold = chapter.get("hint_threshold", 3)

            retry_count = self._retry_counts.get(chapter_id, 0)

            evidence_score = (discovered_in_chapter / max(1, total_evidence_in_chapter)) * 35
            interrogation_score = min(interrogated / max(1, req_interrogated), 1.0) * 20
            contradiction_score = min(len(contradictions) / 3.0, 1.0) * 10
            connection_score = min(player_connections / 5.0, 1.0) * 20
            hint_penalty = max(0, (hints_used - hint_threshold)) * 3
            retry_penalty = retry_count * 5

            total = max(0, min(100, evidence_score + interrogation_score + contradiction_score + connection_score - hint_penalty - retry_penalty))

            grade = self.GRADE_C
            if total >= 90:
                grade = self.GRADE_S
            elif total >= 75:
                grade = self.GRADE_A
            elif total >= 55:
                grade = self.GRADE_B

            result = {
                "chapter_id": chapter_id,
                "chapter_title": chapter["title"],
                "evidence_score": evidence_score,
                "interrogation_score": interrogation_score,
                "contradiction_score": contradiction_score,
                "connection_score": connection_score,
                "hint_penalty": hint_penalty,
                "retry_penalty": retry_penalty,
                "total_score": total,
                "grade": grade,
                "evidence_found": discovered_in_chapter,
                "evidence_total": total_evidence_in_chapter,
                "interrogated": interrogated,
                "interrogated_required": req_interrogated,
                "contradictions_found": len(contradictions),
                "connections_made": player_connections,
                "hints_used": hints_used,
                "retries": retry_count,
                "timestamp": time.time(),
            }

            self.chapter_results[chapter_id] = result
            return result

        def record_retry(self, chapter_id, step_id=None):
            if chapter_id not in self._retry_counts:
                self._retry_counts[chapter_id] = 0
            self._retry_counts[chapter_id] += 1
            analytics_record_retry(step_id or chapter_id)

        def record_failure(self, chapter_id, step_id, reason):
            self._failure_records.append({
                "chapter_id": chapter_id,
                "step_id": step_id,
                "reason": reason,
                "timestamp": time.time(),
            })
            analytics_record_failure(step_id)

        def can_retry(self, chapter_id):
            max_retries = store.level_config.get_max_retries()
            current_retries = self._retry_counts.get(chapter_id, 0)
            return current_retries < max_retries

        def get_retry_count(self, chapter_id):
            return self._retry_counts.get(chapter_id, 0)

        def get_failures_for_chapter(self, chapter_id):
            return [f for f in self._failure_records if f["chapter_id"] == chapter_id]

        def calculate_final_score(self):
            total_score = 0
            chapter_count = len(self.chapter_results)
            if chapter_count == 0:
                return {"total_score": 0, "grade": self.GRADE_C, "chapters": {}}

            for cid, result in self.chapter_results.items():
                total_score += result["total_score"]

            avg_score = total_score / chapter_count
            final_grade = self.GRADE_C
            if avg_score >= 90:
                final_grade = self.GRADE_S
            elif avg_score >= 75:
                final_grade = self.GRADE_A
            elif avg_score >= 55:
                final_grade = self.GRADE_B

            ending = store.ending_system.get_current_ending()
            ending_bonus = 0
            if ending == "true_ending":
                ending_bonus = 15
            elif ending == "secret_ending":
                ending_bonus = 20
            elif ending == "good_ending":
                ending_bonus = 10

            final_score = min(100, avg_score + ending_bonus)
            if final_score >= 90:
                final_grade = self.GRADE_S
            elif final_score >= 75:
                final_grade = self.GRADE_A
            elif final_score >= 55:
                final_grade = self.GRADE_B

            return {
                "total_score": final_score,
                "grade": final_grade,
                "ending": ending,
                "ending_bonus": ending_bonus,
                "chapter_scores": {cid: r["total_score"] for cid, r in self.chapter_results.items()},
                "chapter_grades": {cid: r["grade"] for cid, r in self.chapter_results.items()},
                "total_retries": sum(self._retry_counts.values()),
                "total_failures": len(self._failure_records),
            }

        def get_chapter_result(self, chapter_id):
            return self.chapter_results.get(chapter_id, None)

        def reset(self):
            self.chapter_results = {}
            self._retry_counts = {}
            self._failure_records = []

    store.settlement_system = SettlementSystem()
