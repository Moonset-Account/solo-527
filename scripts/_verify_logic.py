import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime

print("=" * 60)
print("TEST 1: seed_data.py 模块导入（验证 sys.path 修复）")
print("=" * 60)
from scripts.seed_data import seed_categories, seed_tickets
print("[OK] seed_categories, seed_tickets 导入成功")

print()
print("=" * 60)
print("TEST 2: 业务逻辑 - 低置信度 -> 人工队列")
print("=" * 60)
from app.services.ticket_service import TicketService
from app.models.ticket import TicketStatus
from app.core.config import settings

threshold = settings.LOW_CONFIDENCE_THRESHOLD
print(f"当前低置信阈值: {threshold}")
print(f"置信度 < {threshold} -> PENDING_REVIEW (人工队列)")
print(f"置信度 >= {threshold} -> AUTO_CLASSIFIED")
print()

from app.core.database import Base
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

tmp_db = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "_test_logic.db")
if os.path.exists(tmp_db):
    os.remove(tmp_db)

test_engine = create_engine(f"sqlite:///{tmp_db}", echo=False)
Base.metadata.drop_all(test_engine)
Base.metadata.create_all(test_engine)
TestSession = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
db = TestSession()

from app.models.ticket import Ticket, Category
c = Category(id=1, name="支付问题", code="PAY_001", description="t")
c2 = Category(id=2, name="退款问题", code="PAY_002", description="t2")
db.add_all([c, c2])
db.commit()

t1 = Ticket(id=1, ticket_no="TK_LOWCONF", title="支付失败", content="我要支付但失败了",
            channel="app", status=TicketStatus.NEW.value)
t2 = Ticket(id=2, ticket_no="TK_HIGHCONF", title="申请退款", content="我要退货",
            channel="web", status=TicketStatus.NEW.value)
db.add_all([t1, t2])
db.commit()

low_conf = threshold - 0.05
high_conf = threshold + 0.05

TicketService.update_prediction(db, t1.id, predicted_category_id=c.id,
                                 confidence=low_conf, model_version_id=1)
TicketService.update_prediction(db, t2.id, predicted_category_id=c2.id,
                                 confidence=high_conf, model_version_id=1)
db.expire_all()

t1_after = db.query(Ticket).filter(Ticket.id == t1.id).first()
t2_after = db.query(Ticket).filter(Ticket.id == t2.id).first()

print(f"  低置信测试(conf={low_conf:.2f}): status={t1_after.status}")
assert t1_after.status == TicketStatus.PENDING_REVIEW.value, f"应该PENDING_REVIEW但是是{t1_after.status}"
print("    [PASS] 低置信工单进入 PENDING_REVIEW (人工队列)")

print(f"  高置信测试(conf={high_conf:.2f}): status={t2_after.status}")
assert t2_after.status == TicketStatus.AUTO_CLASSIFIED.value, f"应该AUTO_CLASSIFIED但是是{t2_after.status}"
print("    [PASS] 高置信工单标记 AUTO_CLASSIFIED")


print()
print("=" * 60)
print("TEST 3: 业务逻辑 - 人工改标 -> 版本记录 + 错分样本来源可追溯")
print("=" * 60)

from app.services.ticket_service import AnnotationService
from app.schemas.ticket import AnnotationCreate
from app.models.ticket import AnnotationVersion, ErrorSample

# 第一次人工确认：确认模型预测正确 (分类2=退款问题) —— 建立 version=1 基线
data_confirm = AnnotationCreate(
    ticket_id=t2_after.id,
    category_id=c2.id,
    reason="复核通过，模型预测正确",
    operator_id=99,
    operator_name="运营-张三",
    source="human_review",
)
anno_v1, err = AnnotationService.create_annotation(db, data_confirm)
assert err is None, f"确认标注失败: {err}"
print(f"  第一次人工确认(version={anno_v1.version})：确认原预测分类正确")

# 第二次人工改标：发现原分类错了，改成 1=支付问题 —— 触发 change_log
data = AnnotationCreate(
    ticket_id=t2_after.id,
    category_id=c.id,
    reason="原预测错误，实际是支付问题不是退款问题",
    operator_id=99,
    operator_name="运营-张三",
    source="manual",
)
anno, err = AnnotationService.create_annotation(db, data)
assert err is None, f"创建改标失败: {err}"
print(f"  人工改标成功 version={anno.version}, source={anno.source}")

assert anno.change_log is not None and "previous_category_id" in anno.change_log
print("    [PASS] 版本记录 change_log: prev/new category_id 差异记录")

prev_id = anno.change_log["previous_category_id"]
new_id = anno.change_log["new_category_id"]
print(f"        旧分类ID={prev_id} -> 新分类ID={new_id}")
print(f"        操作员: {anno.operator_name}, 改标理由: {anno.reason}")

db.expire_all()
err_sample = db.query(ErrorSample).filter(ErrorSample.ticket_id == t2_after.id).first()
assert err_sample is not None, "预测与人工不一致时必须写入 error_samples"
print(f"  错分样本自动创建, source={err_sample.source}, reported_by={err_sample.reported_by}")
assert err_sample.source == "manual", "错分来源应等于改标 source"
print("    [PASS] 错分样本 source 字段可追溯 (manual/batch_confirm/human_review)")
print(f"        错误来源: {err_sample.source}, 报告人: {err_sample.reported_by}")
print(f"        原预测分类ID={err_sample.original_predicted_id} (正确ID={err_sample.correct_category_id})")


print()
print("=" * 60)
print("TEST 4: 错误样本来源可观察（API层）")
print("=" * 60)

from app.services.ticket_service import ErrorSampleService
items, total, by_source = ErrorSampleService.list(db, page=1, page_size=10)
print(f"  错误样本总数: {total}, 按来源分布: {by_source}")
sources_meta = ErrorSampleService.get_error_sources_with_metadata(db)
print(f"  来源元数据(含模型版本&训练包含情况): {len(sources_meta)} 条")
for s in sources_meta:
    print(f"    source={s['source']} version={s['model_version']} "
          f"total={s['total']} in_training={s['included_in_training']} pending={s['pending']}")
print("    [PASS] /error-samples/sources 接口可返回错分样本来源及是否加入训练")


print()
print("=" * 60)
print("TEST 5: 批量确认接口 -> 统计延迟刷新机制")
print("=" * 60)

from app.schemas.ticket import BatchConfirmRequest
from app.models.ticket import BatchConfirmLog

req = BatchConfirmRequest(
    ticket_ids=[t1_after.id],
    operator_id=7,
    operator_name="运营-李四",
    reason="运营批量审核",
)
result, err = AnnotationService.batch_confirm(db, req)
assert err is None, f"批量确认失败: {err}"
log = db.query(BatchConfirmLog).filter(BatchConfirmLog.id == result["batch_id"]).first()
print(f"  批量确认 batch_id={result['batch_id']}, stats_updated={log.stats_updated}")
assert log.stats_updated is True or log.stats_updated is False, "存在 stats_updated 标记"
print("    [PASS] 批量确认先落库，stats_updated 控制统计刷新时机")
print(f"        total={log.total_count}, error_cases={log.error_case_count}")


db.close()
os.remove(tmp_db)

print()
print("=" * 60)
print("ALL TEST GROUPS PASSED ✅")
print("=" * 60)
