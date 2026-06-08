init python:
    class Timeline:
        def __init__(self):
            self.events = []
            self._register_default_events()

        def _register_default_events(self):
            default_events = [
                {"id": "director_arrives", "time_str": "18:00", "description": "导演·陈明远抵达剧院", "character": "director", "location": "lobby", "verified": False, "contradicted": False},
                {"id": "actress_arrives", "time_str": "18:15", "description": "女主角·林雪薇抵达剧院", "character": "actress", "location": "lobby", "verified": False, "contradicted": False},
                {"id": "stagehand_arrives", "time_str": "18:30", "description": "舞台工人·赵大勇抵达剧院", "character": "stagehand", "location": "backstage", "verified": False, "contradicted": False},
                {"id": "props_master_arrives", "time_str": "17:30", "description": "道具主管·王芝兰抵达剧院", "character": "props_master", "location": "prop_room", "verified": False, "contradicted": False},
                {"id": "crown_last_seen", "time_str": "19:00", "description": "王冠道具最后一次被确认在展示台上", "character": None, "location": "stage", "verified": False, "contradicted": False},
                {"id": "rehearsal_start", "time_str": "19:30", "description": "排练正式开始，全体人员就位", "character": None, "location": "stage", "verified": False, "contradicted": False},
                {"id": "crown_discovered_missing", "time_str": "20:00", "description": "王冠道具被发现失踪", "character": None, "location": "stage", "verified": False, "contradicted": False},
                {"id": "director_statement_time", "time_str": "20:15", "description": "导演·陈明远提供证词", "character": "director", "location": "lobby", "verified": False, "contradicted": False},
                {"id": "actress_statement_time", "time_str": "20:30", "description": "女主角·林雪薇提供证词", "character": "actress", "location": "dressing_room", "verified": False, "contradicted": False},
                {"id": "stagehand_statement_time", "time_str": "20:45", "description": "舞台工人·赵大勇提供证词", "character": "stagehand", "location": "backstage", "verified": False, "contradicted": False},
                {"id": "props_master_statement_time", "time_str": "21:00", "description": "道具主管·王芝兰提供证词", "character": "props_master", "location": "prop_room", "verified": False, "contradicted": False}
            ]
            for e in default_events:
                self.events.append(e)

        def add_event(self, event_data):
            for e in self.events:
                if e["id"] == event_data["id"]:
                    return
            self.events.append(event_data)

        def remove_event(self, event_id):
            self.events = [e for e in self.events if e["id"] != event_id]

        def verify_event(self, event_id):
            for e in self.events:
                if e["id"] == event_id:
                    e["verified"] = True
                    return

        def contradict_event(self, event_id):
            for e in self.events:
                if e["id"] == event_id:
                    e["contradicted"] = True
                    return

        def get_events_for_character(self, char_id):
            return [e for e in self.events if e["character"] == char_id]

        def get_events_for_location(self, loc_id):
            return [e for e in self.events if e["location"] == loc_id]

        def get_events_in_range(self, start_time, end_time):
            result = []
            for e in self.events:
                if start_time <= e["time_str"] <= end_time:
                    result.append(e)
            return result

        def check_alibi(self, character, time_range):
            char_events = self.get_events_for_character(character)
            alibi_events = []
            for e in char_events:
                if time_range[0] <= e["time_str"] <= time_range[1]:
                    alibi_events.append(e)
            return alibi_events

        def find_contradictions(self):
            contradictions = []
            char_events = {}
            for e in self.events:
                if e["character"] is not None:
                    if e["character"] not in char_events:
                        char_events[e["character"]] = []
                    char_events[e["character"]].append(e)
            for char_id, events in char_events.items():
                time_loc = {}
                for e in events:
                    t = e["time_str"]
                    if t in time_loc:
                        if time_loc[t]["location"] != e["location"]:
                            contradictions.append({
                                "type": "same_character_two_places",
                                "character": char_id,
                                "event_a": time_loc[t]["id"],
                                "event_b": e["id"],
                                "description": "{0}在同一时间出现在不同地点".format(char_id)
                            })
                    else:
                        time_loc[t] = e
            loc_events = {}
            for e in self.events:
                if e["location"] not in loc_events:
                    loc_events[e["location"]] = []
                loc_events[e["location"]].append(e)
            for loc_id, events in loc_events.items():
                time_chars = {}
                for e in events:
                    t = e["time_str"]
                    if t in time_chars:
                        if e["character"] is not None and time_chars[t] is not None and e["character"] != time_chars[t]:
                            if e["contradicted"] or time_chars[t] in [ev["character"] for ev in events if ev["time_str"] == t and ev["contradicted"]]:
                                contradictions.append({
                                    "type": "location_conflict",
                                    "location": loc_id,
                                    "time": t,
                                    "description": "{0}在同一时间有冲突的事件".format(loc_id)
                                })
                    else:
                        time_chars[t] = e["character"]
            return contradictions

        def get_timeline_summary(self):
            sorted_events = sorted(self.events, key=lambda e: e["time_str"])
            summary = []
            for e in sorted_events:
                status = ""
                if e["verified"]:
                    status = "[已验证]"
                elif e["contradicted"]:
                    status = "[已反驳]"
                summary.append("{0} {1} {2}".format(e["time_str"], status, e["description"]))
            return summary

    store.timeline = Timeline()
