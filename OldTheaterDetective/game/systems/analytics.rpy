init python:

    import time

    class AnalyticsStore:

        def __init__(self):
            self._scene_start_times = {}
            self._initialized = False

        def _ensure_init(self):
            if not self._initialized:
                if not hasattr(persistent, "analytics") or persistent.analytics is None:
                    persistent.analytics = {
                        "scene_times": {},
                        "failure_counts": {},
                        "retry_counts": {},
                        "tutorial_skipped": [],
                        "key_choices": [],
                        "completion_timestamps": {},
                    }
                self._initialized = True

        def analytics_start(self, scene_id):
            self._ensure_init()
            self._scene_start_times[scene_id] = time.time()

        def analytics_end(self, scene_id):
            self._ensure_init()
            if scene_id in self._scene_start_times:
                elapsed = time.time() - self._scene_start_times[scene_id]
                if scene_id not in persistent.analytics["scene_times"]:
                    persistent.analytics["scene_times"][scene_id] = []
                persistent.analytics["scene_times"][scene_id].append(elapsed)
                del self._scene_start_times[scene_id]
                persistent.analytics["completion_timestamps"][scene_id] = time.time()

        def analytics_record_failure(self, step_id):
            self._ensure_init()
            if step_id not in persistent.analytics["failure_counts"]:
                persistent.analytics["failure_counts"][step_id] = 0
            persistent.analytics["failure_counts"][step_id] += 1

        def analytics_record_retry(self, step_id):
            self._ensure_init()
            if step_id not in persistent.analytics["retry_counts"]:
                persistent.analytics["retry_counts"][step_id] = 0
            persistent.analytics["retry_counts"][step_id] += 1

        def analytics_record_choice(self, choice_id, choice_text):
            self._ensure_init()
            persistent.analytics["key_choices"].append({
                "id": choice_id,
                "text": choice_text,
                "timestamp": time.time(),
            })

        def analytics_record_tutorial_skip(self, tutorial_id):
            self._ensure_init()
            persistent.analytics["tutorial_skipped"].append({
                "id": tutorial_id,
                "timestamp": time.time(),
            })

        def analytics_get_summary(self):
            self._ensure_init()
            summary = {}
            for scene_id, times in persistent.analytics["scene_times"].items():
                summary[scene_id] = {
                    "total_time": sum(times),
                    "visit_count": len(times),
                    "avg_time": sum(times) / len(times) if len(times) > 0 else 0,
                }
            summary["failure_counts"] = dict(persistent.analytics["failure_counts"])
            summary["retry_counts"] = dict(persistent.analytics["retry_counts"])
            summary["tutorial_skipped"] = list(persistent.analytics["tutorial_skipped"])
            summary["key_choices"] = list(persistent.analytics["key_choices"])
            summary["completion_timestamps"] = dict(persistent.analytics["completion_timestamps"])
            return summary

        def analytics_reset(self):
            persistent.analytics = {
                "scene_times": {},
                "failure_counts": {},
                "retry_counts": {},
                "tutorial_skipped": [],
                "key_choices": [],
                "completion_timestamps": {},
            }
            self._scene_start_times = {}
            self._initialized = True

    store.analytics = AnalyticsStore()

    def analytics_start(scene_id):
        store.analytics.analytics_start(scene_id)

    def analytics_end(scene_id):
        store.analytics.analytics_end(scene_id)

    def analytics_record_failure(step_id):
        store.analytics.analytics_record_failure(step_id)

    def analytics_record_retry(step_id):
        store.analytics.analytics_record_retry(step_id)

    def analytics_record_choice(choice_id, choice_text):
        store.analytics.analytics_record_choice(choice_id, choice_text)

    def analytics_record_tutorial_skip(tutorial_id):
        store.analytics.analytics_record_tutorial_skip(tutorial_id)

    def analytics_get_summary():
        return store.analytics.analytics_get_summary()

    def analytics_reset():
        store.analytics.analytics_reset()
