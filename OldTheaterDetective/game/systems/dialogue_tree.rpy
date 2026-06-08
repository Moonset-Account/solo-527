init python:
    class DialogueTree:
        def __init__(self):
            self.nodes = {}
            self.current_node = None
            self.trees = {}
            self._register_default_trees()

        def _register_default_trees(self):
            self.trees["intro_dialogue"] = [
                {"id": "intro_1", "speaker": "旁白", "text": "夜幕降临，老剧院的灯光在雨幕中闪烁。你接到报案——镇上最珍贵的王冠道具在排练期间神秘失踪了。", "next_node": "intro_2"},
                {"id": "intro_2", "speaker": "侦探", "text": "这案子不简单。王冠道具在排练时失踪，说明是内部人作案。", "choices": [
                    {"text": "先去大厅了解情况", "next_node": "intro_3a", "condition_fn": None, "effects": [], "analytics_id": "intro_lobby"},
                    {"text": "直接去舞台查看现场", "next_node": "intro_3b", "condition_fn": None, "effects": [], "analytics_id": "intro_stage"}
                ]},
                {"id": "intro_3a", "speaker": "侦探", "text": "先从大厅开始调查，也许有人看到了什么。", "next_node": "intro_4"},
                {"id": "intro_3b", "speaker": "侦探", "text": "现场是最重要的，先去舞台看看有没有线索。", "next_node": "intro_4"},
                {"id": "intro_4", "speaker": "旁白", "text": "你推开了老剧院沉重的大门，一股陈旧的气息扑面而来。调查正式开始。", "next_node": None}
            ]
            self.trees["lobby_investigation"] = [
                {"id": "lobby_1", "speaker": "侦探", "text": "大厅里空无一人，但地上有奇怪的粉末痕迹……", "choices": [
                    {"text": "采集粉末样本", "next_node": "lobby_2a", "condition_fn": lambda: not store.evidence_board.is_evidence_discovered("powder_trail"), "effects": [lambda: store.evidence_board.discover("powder_trail")]},
                    {"text": "查看售票台", "next_node": "lobby_2b", "condition_fn": None, "effects": []}
                ]},
                {"id": "lobby_2a", "speaker": "侦探", "text": "这粉末……像是道具室里用来保养道具的特殊粉末。有人从道具室一路走到了大厅。", "next_node": "lobby_3"},
                {"id": "lobby_2b", "speaker": "侦探", "text": "售票台的抽屉没有上锁，里面有一张神秘字条，上面写着'今晚行动'。", "choices": [
                    {"text": "收起字条作为证据", "next_node": "lobby_3", "condition_fn": lambda: not store.evidence_board.is_evidence_discovered("mysterious_note"), "effects": [lambda: store.evidence_board.discover("mysterious_note")]}
                ]},
                {"id": "lobby_3", "speaker": "旁白", "text": "大厅的线索让你对案件有了新的认识。也许该去其他地方看看了。", "next_node": None}
            ]
            self.trees["stage_investigation"] = [
                {"id": "stage_1", "speaker": "侦探", "text": "舞台上还残留着排练的痕迹，王冠原本就放在中央的展示台上。", "choices": [
                    {"text": "检查展示台的锁", "next_node": "stage_2a", "condition_fn": None, "effects": []},
                    {"text": "查看舞台两侧", "next_node": "stage_2b", "condition_fn": None, "effects": []}
                ]},
                {"id": "stage_2a", "speaker": "侦探", "text": "锁被撬开了！手法很专业，不是一般人能做到的。这一定是坏掉的锁！必须记录下来。", "next_node": "stage_3", "choices": [
                    {"text": "记录证据", "next_node": "stage_3", "condition_fn": lambda: not store.evidence_board.is_evidence_discovered("broken_lock"), "effects": [lambda: store.evidence_board.discover("broken_lock")]}
                ]},
                {"id": "stage_2b", "speaker": "侦探", "text": "舞台右侧的幕布后面有拖拽的痕迹，似乎有人把重物从这里拖走了。", "next_node": "stage_3"},
                {"id": "stage_3", "speaker": "旁白", "text": "舞台上的线索指向了一个精心策划的盗窃行动。", "next_node": None}
            ]
            self.trees["backstage_investigation"] = [
                {"id": "backstage_1", "speaker": "侦探", "text": "后台通道昏暗狭窄，墙上的道具挂架有些是空的。", "choices": [
                    {"text": "仔细检查通道尽头", "next_node": "backstage_2a", "condition_fn": None, "effects": []},
                    {"text": "查看配电箱", "next_node": "backstage_2b", "condition_fn": None, "effects": []}
                ]},
                {"id": "backstage_2a", "speaker": "侦探", "text": "通道尽头有一个暗格！里面是空的，但明显最近被人打开过。这是藏东西的好地方。", "choices": [
                    {"text": "记录暗格证据", "next_node": "backstage_3", "condition_fn": lambda: not store.evidence_board.is_evidence_discovered("hidden_compartment"), "effects": [lambda: store.evidence_board.discover("hidden_compartment")]}
                ]},
                {"id": "backstage_2b", "speaker": "侦探", "text": "配电箱的灯在19:30到20:00之间被人关过，那段时间后台一片漆黑。", "next_node": "backstage_3"},
                {"id": "backstage_3", "speaker": "旁白", "text": "后台的秘密逐渐浮出水面。黑暗中的行动，隐藏的暗格……", "next_node": None}
            ]
            self.trees["dressing_room_investigation"] = [
                {"id": "dressing_1", "speaker": "侦探", "text": "化妆间弥漫着香水的味道，化妆台上整齐地摆放着各种用品。", "choices": [
                    {"text": "检查化妆台抽屉", "next_node": "dressing_2a", "condition_fn": None, "effects": []},
                    {"text": "查看衣柜", "next_node": "dressing_2b", "condition_fn": None, "effects": []}
                ]},
                {"id": "dressing_2a", "speaker": "侦探", "text": "抽屉里有一只不属于这里的工具手套，上面沾着和舞台上一样的粉末。这是女演员的手套！", "choices": [
                    {"text": "收集手套证据", "next_node": "dressing_3", "condition_fn": lambda: not store.evidence_board.is_evidence_discovered("actress_glove"), "effects": [lambda: store.evidence_board.discover("actress_glove")]}
                ]},
                {"id": "dressing_2b", "speaker": "侦探", "text": "衣柜里有一件沾了灰的演出服，似乎最近被穿过。口袋里有些碎屑。", "next_node": "dressing_3"},
                {"id": "dressing_3", "speaker": "旁白", "text": "化妆间的发现让嫌疑的网又收紧了一些。", "next_node": None}
            ]
            self.trees["prop_room_investigation"] = [
                {"id": "prop_1", "speaker": "侦探", "text": "道具室里堆满了各种演出用品，空气中弥漫着木材和颜料的气味。", "choices": [
                    {"text": "检查道具账本", "next_node": "prop_2a", "condition_fn": None, "effects": []},
                    {"text": "查看工作台", "next_node": "prop_2b", "condition_fn": None, "effects": []}
                ]},
                {"id": "prop_2a", "speaker": "侦探", "text": "账本上记录着最近制作了一个王冠的复制品！但申请记录上写的是'备用'。这笔账目很可疑。", "choices": [
                    {"text": "记录账本证据", "next_node": "prop_3", "condition_fn": lambda: not store.evidence_board.is_evidence_discovered("props_master_ledger"), "effects": [lambda: store.evidence_board.discover("props_master_ledger")]}
                ]},
                {"id": "prop_2b", "speaker": "侦探", "text": "工作台上有制作复制品的工具和材料。一个复制品王冠已经完成了！但真品在哪里？", "choices": [
                    {"text": "收集复制品证据", "next_node": "prop_3", "condition_fn": lambda: not store.evidence_board.is_evidence_discovered("duplicate_crown"), "effects": [lambda: store.evidence_board.discover("duplicate_crown")]}
                ]},
                {"id": "prop_3", "speaker": "旁白", "text": "道具室的真相令人震惊——王冠居然被复制了！这是一场精心策划的骗局。", "next_node": None}
            ]
            self.trees["suspect_interview_director"] = [
                {"id": "dir_1", "speaker": "导演·陈明远", "text": "你是来调查王冠失窃的？我当时一直在观众席指导排练，根本没靠近过舞台。", "choices": [
                    {"text": "你确定整个晚上都在观众席吗？", "next_node": "dir_2a", "condition_fn": None, "effects": [lambda: store.evidence_board.discover("director_alibi")], "suspicion_effects": [{"suspect_id": "director", "amount": 10, "reason": "十分钟的空白时间"}], "analytics_id": "interview_director_alibi"},
                    {"text": "你和道具主管的关系如何？", "next_node": "dir_2b", "condition_fn": None, "effects": [], "suspicion_effects": [{"suspect_id": "props_master", "amount": 5, "reason": "导演的不信任评价"}], "analytics_id": "interview_director_relationship"}
                ]},
                {"id": "dir_2a", "speaker": "导演·陈明远", "text": "我……中间确实去了一趟洗手间，大概十分钟左右。但我绝对没有去舞台！你可以问其他人。", "next_node": "dir_3"},
                {"id": "dir_2b", "speaker": "导演·陈明远", "text": "王芝兰？那个人我信不过。她的账目总是不清不楚，我也提醒过院方，但没人听。", "next_node": "dir_3"},
                {"id": "dir_3", "speaker": "侦探", "text": "导演的说辞有些地方值得推敲，需要更多证据来验证。", "next_node": None}
            ]
            self.trees["suspect_interview_actress"] = [
                {"id": "act_1", "speaker": "女主角·林雪薇", "text": "王冠不见了？我当时在化妆间准备第二幕的戏份，完全不知道发生了什么。", "choices": [
                    {"text": "化妆间里发现了你的手套，上面有舞台的粉末。", "next_node": "act_2a", "condition_fn": lambda: store.evidence_board.is_evidence_discovered("actress_glove"), "effects": [], "suspicion_effects": [{"suspect_id": "actress", "amount": 15, "reason": "手套证据与证词矛盾"}], "analytics_id": "interview_actress_glove"},
                    {"text": "你和导演是什么关系？", "next_node": "act_2b", "condition_fn": None, "effects": [], "suspicion_effects": [{"suspect_id": "director", "amount": 5, "reason": "女演员提到导演的压力"}], "analytics_id": "interview_actress_relationship"}
                ]},
                {"id": "act_2a", "speaker": "女主角·林雪薇", "text": "那手套……我之前去舞台取过道具，不小心弄脏了手套就放回化妆间了。但这和王冠失窃没有关系！", "next_node": "act_3"},
                {"id": "act_2b", "speaker": "女主角·林雪薇", "text": "陈导演是我的老师，他一直很照顾我。但最近他压力很大，总觉得有人在暗中做手脚。", "next_node": "act_3"},
                {"id": "act_3", "speaker": "侦探", "text": "林雪薇看起来很紧张，但她的话似乎也有几分道理。", "next_node": None}
            ]
            self.trees["suspect_interview_stagehand"] = [
                {"id": "stg_1", "speaker": "舞台工人·赵大勇", "text": "别看我，我只是在后台修灯光。我什么都不知道。", "choices": [
                    {"text": "后台的配电箱在19:30到20:00被关了，你当时在哪？", "next_node": "stg_2a", "condition_fn": lambda: store.evidence_board.is_evidence_discovered("hidden_compartment"), "effects": [], "suspicion_effects": [{"suspect_id": "stagehand", "amount": 10, "reason": "对配电箱事件的反应"}], "analytics_id": "interview_stagehand_power"},
                    {"text": "你的工具箱最近借给谁了？", "next_node": "stg_2b", "condition_fn": None, "effects": [], "suspicion_effects": [{"suspect_id": "props_master", "amount": 10, "reason": "借走工具箱"}], "analytics_id": "interview_stagehand_toolbox"}
                ]},
                {"id": "stg_2a", "speaker": "舞台工人·赵大勇", "text": "配电箱？那是断电事故，不是我干的！我当时在东边通道修灯，可以查我的工具记录。至于那个暗格……我不知道什么暗格。", "next_node": "stg_3"},
                {"id": "stg_2b", "speaker": "舞台工人·赵大勇", "text": "工具箱？上周王芝兰借走过，说要修什么道具架子。但我跟她早没关系了，别把我和她的事扯在一起。", "next_node": "stg_3"},
                {"id": "stg_3", "speaker": "侦探", "text": "赵大勇的反应很激烈，他似乎在隐藏什么，也可能只是不想被冤枉。", "next_node": None}
            ]
            self.trees["suspect_interview_props_master"] = [
                {"id": "propm_1", "speaker": "道具主管·王芝兰", "text": "王冠丢了？我17:30就到了，一直在道具室整理物品。那东西不是我负责保管的。", "choices": [
                    {"text": "账本上记录了你制作了王冠复制品。", "next_node": "propm_2a", "condition_fn": lambda: store.evidence_board.is_evidence_discovered("props_master_ledger"), "effects": [], "suspicion_effects": [{"suspect_id": "props_master", "amount": 15, "reason": "制作复制品但推给导演"}, {"suspect_id": "director", "amount": 10, "reason": "可能指使制作复制品"}], "analytics_id": "interview_props_master_ledger"},
                    {"text": "有人看到你借过赵大勇的工具箱。", "next_node": "propm_2b", "condition_fn": None, "effects": [], "suspicion_effects": [{"suspect_id": "props_master", "amount": 5, "reason": "对工具箱的辩解不够有力"}], "analytics_id": "interview_props_master_toolbox"}
                ]},
                {"id": "propm_2a", "speaker": "道具主管·王芝兰", "text": "复制品？那……那是导演让我做的！他说需要备用道具以防万一。我只是照吩咐做事。", "next_node": "propm_3"},
                {"id": "propm_2b", "speaker": "道具主管·王芝兰", "text": "我借工具箱是修架子用的，和赵大勇的事早就了结了。你们别想套我的话。", "next_node": "propm_3"},
                {"id": "propm_3", "speaker": "侦探", "text": "王芝兰在推卸责任，但她说导演让她做复制品——这又是另一条线索。", "next_node": None}
            ]

        def load_tree(self, tree_id):
            if tree_id not in self.trees:
                return False
            self.nodes = {}
            for node in self.trees[tree_id]:
                self.nodes[node["id"]] = node
            return True

        def start(self, tree_id):
            if not self.load_tree(tree_id):
                return
            tree_data = self.trees[tree_id]
            if tree_data:
                self.current_node = tree_data[0]["id"]

        def advance(self, choice_index=None):
            if self.current_node is None:
                return
            node = self.nodes.get(self.current_node)
            if node is None:
                return
            if "choices" in node and choice_index is not None:
                choices = node["choices"]
                if 0 <= choice_index < len(choices):
                    choice = choices[choice_index]
                    if choice.get("condition_fn") and callable(choice["condition_fn"]):
                        if not choice["condition_fn"]():
                            return
                    effects = choice.get("effects", [])
                    for effect in effects:
                        if callable(effect):
                            effect()
                    suspicion_effects = choice.get("suspicion_effects", [])
                    for se in suspicion_effects:
                        suspect_id = se.get("suspect_id")
                        amount = se.get("amount", 0)
                        reason = se.get("reason", "")
                        if suspect_id:
                            store.suspicion_system.adjust_suspicion(suspect_id, amount, reason)
                            if amount > 0:
                                store.suspicion_system.add_evidence_against(suspect_id, node.get("id", "unknown"))
                            elif amount < 0:
                                store.suspicion_system.add_evidence_for(suspect_id, node.get("id", "unknown"))
                    analytics_id = choice.get("analytics_id")
                    if analytics_id:
                        analytics_record_choice(analytics_id, choice.get("text", ""))
                    self.current_node = choice.get("next_node")
            elif "next_node" in node:
                self.current_node = node.get("next_node")
            else:
                self.current_node = None

        def is_finished(self):
            return self.current_node is None

        def get_current(self):
            if self.current_node is None:
                return None
            return self.nodes.get(self.current_node)

        def get_choices(self):
            node = self.get_current()
            if node is None:
                return []
            choices = node.get("choices", [])
            available = []
            for choice in choices:
                condition = choice.get("condition_fn")
                if condition is None or (callable(condition) and condition()):
                    available.append(choice)
            return available

    store.dialogue_tree = DialogueTree()
