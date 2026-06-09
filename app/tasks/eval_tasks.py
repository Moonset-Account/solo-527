from __future__ import annotations

import json
import math
import statistics
import time
import traceback
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

from loguru import logger
from sqlalchemy import select, and_

from app.core.celery_app import celery_app
from app.models.task import Task, TaskResult, TaskStatus
from app.models.dataset import Dataset, DatasetSample, SampleStatus, SampleType
from app.models.ml import (
    ModelVersion,
    ABRun,
    ABStatus,
    EvaluationResult,
    TaskType as MLTaskType,
)
from app.tasks.base import ContractAIBaseTask
from app.services.ai.summarizer import ContractSummarizer, SummaryResult
from app.services.risk.engine import RiskEngine
from app.services.data.error_sample_manager import ErrorSampleManager
from app.services.ai.llm_factory import LLMFactory, LLMUsage
from app.services.data.dataset_manager import DatasetManager
from app.config import settings


def _compute_rouge(hypothesis: str, reference: str) -> Dict[str, float]:
    try:
        from rouge_score import rouge_scorer

        scorer = rouge_scorer.RougeScorer(
            ["rouge1", "rouge2", "rougeL"], use_stemmer=False
        )
        scores = scorer.score(reference, hypothesis)
        return {
            "rouge1": scores["rouge1"].fmeasure,
            "rouge2": scores["rouge2"].fmeasure,
            "rougeL": scores["rougeL"].fmeasure,
        }
    except Exception as e:
        logger.warning(f"ROUGE计算失败: {e}")
        return {"rouge1": 0.0, "rouge2": 0.0, "rougeL": 0.0}


def _compute_bertscore(
    hypotheses: List[str], references: List[str]
) -> Dict[str, float]:
    try:
        from evaluate import load

        bertscore = load("bertscore")
        results = bertscore.compute(
            predictions=hypotheses,
            references=references,
            lang="zh",
            model_type="bert-base-chinese",
        )
        return {
            "bertscore_precision": (
                sum(results["precision"]) / len(results["precision"])
                if results.get("precision")
                else 0.0
            ),
            "bertscore_recall": (
                sum(results["recall"]) / len(results["recall"])
                if results.get("recall")
                else 0.0
            ),
            "bertscore_f1": (
                sum(results["f1"]) / len(results["f1"]) if results.get("f1") else 0.0
            ),
        }
    except Exception as e:
        logger.warning(f"BERTScore计算失败: {e}")
        return {"bertscore_precision": 0.0, "bertscore_recall": 0.0, "bertscore_f1": 0.0}


def _percentile(values: List[float], p: float) -> float:
    if not values:
        return 0.0
    sorted_vals = sorted(values)
    k = (len(sorted_vals) - 1) * p
    f = math.floor(k)
    c = math.ceil(k)
    if f == c:
        return sorted_vals[int(k)]
    d0 = sorted_vals[int(f)] * (c - k)
    d1 = sorted_vals[int(c)] * (k - f)
    return d0 + d1


def _paired_t_test(a_scores: List[float], b_scores: List[float]) -> float:
    if len(a_scores) != len(b_scores) or len(a_scores) < 2:
        return 1.0

    try:
        from scipy import stats

        diffs = [a - b for a, b in zip(a_scores, b_scores)]
        _, p_value = stats.ttest_rel(a_scores, b_scores)
        return float(p_value)
    except Exception as e:
        logger.warning(f"配对t检验失败: {e}")
        return 1.0


@celery.task(
    bind=True,
    base=ContractAIBaseTask,
    name="eval.evaluate_model",
    queue="eval_queue",
    autoretry_for=(Exception,),
    retry_backoff=5,
    retry_kwargs={"max_retries": 2},
    time_limit=7200,
    soft_time_limit=7140,
    rate_limit="5/day",
)
def evaluate_model_task(
    self,
    task_id_str: str,
    model_id: int,
    dataset_id: int,
    task_type: str = "summary",
    sample_limit: int = 0,
) -> Dict[str, Any]:
    try:
        self.update_progress(5, "加载模型、数据集配置")
        db = self.db

        model = db.get(ModelVersion, model_id)
        if not model:
            raise ValueError(f"模型版本不存在: {model_id}")

        dataset = db.get(Dataset, dataset_id)
        if not dataset:
            raise ValueError(f"数据集不存在: {dataset_id}")

        try:
            ml_task_type = MLTaskType(task_type)
        except ValueError:
            ml_task_type = MLTaskType.SUMMARY

        stmt = (
            select(DatasetSample)
            .where(
                and_(
                    DatasetSample.dataset_id == dataset_id,
                    DatasetSample.status == SampleStatus.APPROVED,
                )
            )
            .order_by(DatasetSample.id)
        )
        samples = db.execute(stmt).scalars().all()

        if sample_limit and sample_limit > 0:
            samples = samples[:sample_limit]

        total_count = len(samples)
        if total_count == 0:
            return {
                "evaluated_count": 0,
                "metrics_summary": {},
                "error_count": 0,
            }

        self.update_progress(
            10, f"待评估样本: {total_count} 条，初始化评估服务"
        )

        llm_factory = LLMFactory()
        if model.base_model:
            llm_factory.default_model = model.base_model

        summarizer = ContractSummarizer(llm_factory=llm_factory)
        risk_engine = RiskEngine(llm_factory=llm_factory)
        error_mgr = ErrorSampleManager(db=db)

        evaluated_count = 0
        error_count = 0
        all_scores: Dict[str, List[float]] = {
            "rouge1": [],
            "rouge2": [],
            "rougeL": [],
            "overall": [],
        }
        total_latency = 0.0
        total_tokens = 0
        total_cost = 0.0
        all_hypotheses: List[str] = []
        all_references: List[str] = []

        batch_size = settings.BATCH_SIZE_PROCESS

        for batch_start in range(0, total_count, batch_size):
            batch_end = min(batch_start + batch_size, total_count)
            batch = samples[batch_start:batch_end]

            for sample in batch:
                sample_start = time.time()
                model_output = ""
                usage = LLMUsage()

                try:
                    if ml_task_type in (MLTaskType.SUMMARY, MLTaskType.DOCUMENT_SUMMARY):
                        clause_dicts = [
                            {
                                "clause_id": sample.id,
                                "id": sample.id,
                                "clause_title": "评估样本",
                                "title": "评估样本",
                                "text": sample.input_text,
                                "original_text": sample.input_text,
                                "category": "other",
                            }
                        ]
                        summary_res: SummaryResult = (
                            summarizer.generate_full_summary(
                                document_id=0,
                                clauses=clause_dicts,
                                full_contract_text=sample.input_text,
                                include_structured=False,
                                include_clause_summaries=False,
                            )
                        )
                        model_output = summary_res.full_summary
                        usage = LLMUsage(
                            tokens_input=summary_res.total_tokens,
                            tokens_output=0,
                            latency_ms=summary_res.total_latency_ms,
                            cost_usd=summary_res.total_cost_usd,
                        )

                    elif ml_task_type == MLTaskType.RISK_DETECTION:
                        fake_clause = type(
                            "FakeClause",
                            (),
                            {
                                "id": sample.id,
                                "clause_number": "",
                                "page_start": 1,
                                "cleaned_text": sample.input_text,
                                "original_text": sample.input_text,
                                "category": None,
                            },
                        )()
                        risks = risk_engine.detect_risks(
                            clauses=[fake_clause], full_text=sample.input_text
                        )
                        model_output = json.dumps(
                            [r.to_dict() for r in risks],
                            ensure_ascii=False,
                        )

                    else:
                        prompt = (
                            f"请处理以下输入文本（任务类型: {task_type}）：\n\n"
                            f"{sample.input_text}"
                        )
                        messages = [{"role": "user", "content": prompt}]
                        response, resp_usage = llm_factory.chat_with_usage(
                            messages
                        )
                        model_output = (
                            response.content
                            if hasattr(response, "content")
                            else str(response)
                        )
                        usage = resp_usage

                    reference = sample.reference_output or ""
                    scores: Dict[str, float] = {}

                    if reference and model_output:
                        rouge_scores = _compute_rouge(model_output, reference)
                        scores.update(rouge_scores)

                        overall = (
                            rouge_scores["rouge1"] * 0.25
                            + rouge_scores["rouge2"] * 0.35
                            + rouge_scores["rougeL"] * 0.40
                        )
                        scores["overall"] = overall

                        for k, v in scores.items():
                            if k in all_scores:
                                all_scores[k].append(v)

                        all_hypotheses.append(model_output)
                        all_references.append(reference)
                    else:
                        scores = {
                            "rouge1": 0.0,
                            "rouge2": 0.0,
                            "rougeL": 0.0,
                            "overall": 0.5,
                        }
                        all_scores["overall"].append(0.5)

                    latency_ms = (time.time() - sample_start) * 1000
                    total_latency += latency_ms
                    total_tokens += usage.tokens_input + usage.tokens_output
                    total_cost += usage.cost_usd

                    is_error_case = scores.get("overall", 1.0) < 0.3

                    eval_result = EvaluationResult(
                        model_id=model_id,
                        sample_id=sample.id,
                        task_type=ml_task_type,
                        variant_label=None,
                        input_text=sample.input_text[:5000],
                        model_output=model_output,
                        reference_output=reference[:5000] if reference else None,
                        scores=scores,
                        metrics={
                            "latency_ms": latency_ms,
                            "tokens_input": usage.tokens_input,
                            "tokens_output": usage.tokens_output,
                            "cost_usd": usage.cost_usd,
                        },
                        passed=scores.get("overall", 0) >= 0.5,
                        is_error_case=is_error_case,
                        latency_ms=latency_ms,
                        tokens_input=usage.tokens_input,
                        tokens_output=usage.tokens_output,
                        cost_usd=usage.cost_usd,
                    )
                    db.add(eval_result)
                    db.flush()

                    if is_error_case and reference and model_output:
                        try:
                            error_mgr.auto_detect_from_evaluation(eval_result)
                            error_count += 1
                        except Exception as e:
                            logger.warning(f"错误样本自动检测失败: {e}")

                    evaluated_count += 1

                except Exception as e:
                    logger.error(
                        f"评估样本失败 sample_id={sample.id}: {e}"
                    )
                    error_count += 1
                    all_scores["overall"].append(0.0)
                    continue

            db.commit()

            progress = 10 + int(batch_end / total_count * 80)
            self.update_progress(
                progress,
                f"评估进度: {batch_end}/{total_count}, 错误: {error_count}",
                {
                    "evaluated": evaluated_count,
                    "errors": error_count,
                    "total": total_count,
                },
            )

        self.update_progress(92, "计算汇总指标...")

        metrics_summary: Dict[str, Any] = {}

        for metric, values in all_scores.items():
            if values:
                metrics_summary[f"{metric}_mean"] = round(
                    sum(values) / len(values), 4
                )
                metrics_summary[f"{metric}_median"] = round(
                    statistics.median(values), 4
                )
                metrics_summary[f"{metric}_p25"] = round(
                    _percentile(values, 0.25), 4
                )
                metrics_summary[f"{metric}_p75"] = round(
                    _percentile(values, 0.75), 4
                )
                metrics_summary[f"{metric}_p90"] = round(
                    _percentile(values, 0.90), 4
                )

        if all_hypotheses and all_references and len(all_hypotheses) <= 200:
            bert_scores = _compute_bertscore(all_hypotheses, all_references)
            metrics_summary.update(bert_scores)

        metrics_summary["total_samples"] = total_count
        metrics_summary["evaluated_count"] = evaluated_count
        metrics_summary["error_count"] = error_count
        metrics_summary["error_rate"] = (
            round(error_count / max(1, evaluated_count), 4)
        )
        metrics_summary["avg_latency_ms"] = round(
            total_latency / max(1, evaluated_count), 2
        )
        metrics_summary["total_tokens"] = total_tokens
        metrics_summary["total_cost_usd"] = round(total_cost, 6)

        self.update_progress(100, "模型评估任务完成")

        result = {
            "evaluated_count": evaluated_count,
            "metrics_summary": metrics_summary,
            "error_count": error_count,
        }

        self.save_task_result(
            result_data=result,
            metrics=metrics_summary,
            tokens_used=total_tokens,
            latency_ms=total_latency,
            cost_usd=total_cost,
            model_version=f"{model.model_name}-{model.version}",
        )

        return result

    except Exception as e:
        logger.error(f"evaluate_model_task失败: {e}\n{traceback.format_exc()}")
        raise


@celery.task(
    bind=True,
    base=ContractAIBaseTask,
    name="eval.run_ab_test",
    queue="eval_queue",
    autoretry_for=(Exception,),
    retry_backoff=5,
    retry_kwargs={"max_retries": 2},
    time_limit=14400,
    soft_time_limit=14340,
    rate_limit="2/day",
)
def run_ab_test_task(
    self,
    task_id_str: str,
    ab_run_id: int,
    sample_limit: int = 500,
) -> Dict[str, Any]:
    try:
        self.update_progress(5, "加载AB测试配置")
        db = self.db

        ab_run = db.get(ABRun, ab_run_id)
        if not ab_run:
            raise ValueError(f"AB测试不存在: {ab_run_id}")

        model_a = db.get(ModelVersion, ab_run.model_a_id)
        model_b = db.get(ModelVersion, ab_run.model_b_id)
        if not model_a or not model_b:
            raise ValueError("AB测试模型配置缺失")

        dataset = db.get(Dataset, ab_run.dataset_id) if ab_run.dataset_id else None
        if not dataset:
            raise ValueError(f"数据集不存在: {ab_run.dataset_id}")

        ab_run.status = ABStatus.RUNNING
        ab_run.start_date = datetime.utcnow()
        db.commit()

        stmt = (
            select(DatasetSample)
            .where(
                and_(
                    DatasetSample.dataset_id == ab_run.dataset_id,
                    DatasetSample.status == SampleStatus.APPROVED,
                )
            )
            .order_by(DatasetSample.id)
        )
        samples = db.execute(stmt).scalars().all()

        if sample_limit and sample_limit > 0:
            samples = samples[:sample_limit]

        sample_count = len(samples)
        if sample_count == 0:
            ab_run.status = ABStatus.STOPPED
            ab_run.end_date = datetime.utcnow()
            db.commit()
            return {
                "sample_count": 0,
                "a_wins": 0,
                "b_wins": 0,
                "ties": 0,
                "p_value": 1.0,
                "winner": None,
            }

        self.update_progress(
            10, f"AB测试样本: {sample_count} 条，初始化服务"
        )

        llm_factory_a = LLMFactory()
        if model_a.base_model:
            llm_factory_a.default_model = model_a.base_model

        llm_factory_b = LLMFactory()
        if model_b.base_model:
            llm_factory_b.default_model = model_b.base_model

        judge_llm = LLMFactory()

        a_wins = 0
        b_wins = 0
        ties = 0
        a_scores: List[float] = []
        b_scores: List[float] = []
        batch_size = 10

        for batch_start in range(0, sample_count, batch_size):
            batch_end = min(batch_start + batch_size, sample_count)
            batch = samples[batch_start:batch_end]

            for sample in batch:
                output_a = ""
                output_b = ""
                ref = sample.reference_output or ""

                try:
                    prompt_input = sample.input_text
                    prompt_template = f"请处理以下输入文本：\n\n{prompt_input}"

                    messages_a = [{"role": "user", "content": prompt_template}]
                    resp_a, _ = llm_factory_a.chat_with_usage(messages_a)
                    output_a = (
                        resp_a.content
                        if hasattr(resp_a, "content")
                        else str(resp_a)
                    )

                    messages_b = [{"role": "user", "content": prompt_template}]
                    resp_b, _ = llm_factory_b.chat_with_usage(messages_b)
                    output_b = (
                        resp_b.content
                        if hasattr(resp_b, "content")
                        else str(resp_b)
                    )

                    if ref:
                        rouge_a = _compute_rouge(output_a, ref)
                        rouge_b = _compute_rouge(output_b, ref)
                        score_a = (
                            rouge_a["rouge1"] * 0.25
                            + rouge_a["rouge2"] * 0.35
                            + rouge_a["rougeL"] * 0.40
                        )
                        score_b = (
                            rouge_b["rouge1"] * 0.25
                            + rouge_b["rouge2"] * 0.35
                            + rouge_b["rougeL"] * 0.40
                        )
                    else:
                        score_a = 0.0
                        score_b = 0.0

                    a_scores.append(score_a)
                    b_scores.append(score_b)

                    human_pref = None
                    try:
                        judge_prompt = f"""你是一位公正的合同审查专家。请比较以下两个模型对同一输入的输出质量。

参考标准答案（如果有）：
{ref or "无参考标准答案"}

输入文本：
{sample.input_text[:2000]}

【模型A输出】：
{output_a[:3000]}

【模型B输出】：
{output_b[:3000]}

请仔细比较两者的质量（准确性、完整性、逻辑性、专业性、可操作性）。
仅返回以下三个选项之一：A、B或TIE（表示两者质量相当）。不要输出其他任何内容。"""

                        judge_messages = [{"role": "user", "content": judge_prompt}]
                        judge_resp, _ = judge_llm.chat_with_usage(judge_messages)
                        judge_text = (
                            judge_resp.content.strip().upper()
                            if hasattr(judge_resp, "content")
                            else str(judge_resp).strip().upper()
                        )

                        if "TIE" in judge_text:
                            human_pref = "TIE"
                            ties += 1
                        elif judge_text.endswith("A") or judge_text.startswith("A"):
                            human_pref = "A"
                            a_wins += 1
                        elif judge_text.endswith("B") or judge_text.startswith("B"):
                            human_pref = "B"
                            b_wins += 1
                        else:
                            if score_a > score_b + 0.05:
                                human_pref = "A"
                                a_wins += 1
                            elif score_b > score_a + 0.05:
                                human_pref = "B"
                                b_wins += 1
                            else:
                                human_pref = "TIE"
                                ties += 1
                    except Exception as e:
                        logger.warning(f"LLM Judge失败，退化为ROUGE对比: {e}")
                        if score_a > score_b + 0.05:
                            human_pref = "A"
                            a_wins += 1
                        elif score_b > score_a + 0.05:
                            human_pref = "B"
                            b_wins += 1
                        else:
                            human_pref = "TIE"
                            ties += 1

                    eval_a = EvaluationResult(
                        model_id=model_a.id,
                        ab_run_id=ab_run_id,
                        sample_id=sample.id,
                        task_type=ab_run.task_type,
                        variant_label="A",
                        input_text=sample.input_text[:5000],
                        model_output=output_a,
                        reference_output=ref[:5000] if ref else None,
                        scores={
                            "rougeL": _compute_rouge(output_a, ref).get("rougeL", 0)
                            if ref
                            else 0,
                            "auto_score": score_a,
                        },
                        passed=True,
                        is_error_case=score_a < 0.3,
                        human_preference=human_pref if human_pref == "A" else None,
                    )
                    db.add(eval_a)

                    eval_b = EvaluationResult(
                        model_id=model_b.id,
                        ab_run_id=ab_run_id,
                        sample_id=sample.id,
                        task_type=ab_run.task_type,
                        variant_label="B",
                        input_text=sample.input_text[:5000],
                        model_output=output_b,
                        reference_output=ref[:5000] if ref else None,
                        scores={
                            "rougeL": _compute_rouge(output_b, ref).get("rougeL", 0)
                            if ref
                            else 0,
                            "auto_score": score_b,
                        },
                        passed=True,
                        is_error_case=score_b < 0.3,
                        human_preference=human_pref if human_pref == "B" else None,
                    )
                    db.add(eval_b)
                    db.flush()

                except Exception as e:
                    logger.error(
                        f"AB样本处理失败 sample_id={sample.id}: {e}"
                    )
                    a_scores.append(0.0)
                    b_scores.append(0.0)
                    ties += 1
                    continue

            db.commit()

            progress = 10 + int(batch_end / sample_count * 85)
            self.update_progress(
                progress,
                f"AB测试进度: {batch_end}/{sample_count}, A={a_wins} B={b_wins} TIE={ties}",
                {
                    "a_wins": a_wins,
                    "b_wins": b_wins,
                    "ties": ties,
                    "processed": batch_end,
                    "total": sample_count,
                },
            )

        self.update_progress(96, "进行统计显著性检验...")

        p_value = _paired_t_test(a_scores, b_scores)
        is_significant = p_value < 0.05

        winner = None
        if is_significant:
            if a_wins > b_wins:
                winner = "A"
            elif b_wins > a_wins:
                winner = "B"

        results_summary = {
            "sample_count": sample_count,
            "a_wins": a_wins,
            "b_wins": b_wins,
            "ties": ties,
            "a_win_rate": round(a_wins / max(1, sample_count), 4),
            "b_win_rate": round(b_wins / max(1, sample_count), 4),
            "tie_rate": round(ties / max(1, sample_count), 4),
            "p_value": round(p_value, 6),
            "is_statistically_significant": is_significant,
            "alpha": 0.05,
            "winner": winner,
            "metrics": {
                "a_mean_score": round(
                    sum(a_scores) / max(1, len(a_scores)), 4
                ),
                "b_mean_score": round(
                    sum(b_scores) / max(1, len(b_scores)), 4
                ),
            },
        }

        ab_run.status = ABStatus.COMPLETED
        ab_run.end_date = datetime.utcnow()
        ab_run.actual_sample_size_a = sample_count
        ab_run.actual_sample_size_b = sample_count
        ab_run.winner = winner
        ab_run.p_value = round(p_value, 6)
        ab_run.is_statistically_significant = is_significant
        ab_run.results_summary = results_summary
        db.commit()

        self.update_progress(100, "AB测试任务完成")

        result = {
            "sample_count": sample_count,
            "a_wins": a_wins,
            "b_wins": b_wins,
            "ties": ties,
            "p_value": round(p_value, 6),
            "winner": winner,
        }

        self.save_task_result(
            result_data=result,
            metrics=results_summary,
            model_version=f"A:{model_a.model_name}-{model_a.version} vs B:{model_b.model_name}-{model_b.version}",
        )

        return result

    except Exception as e:
        logger.error(f"run_ab_test_task失败: {e}\n{traceback.format_exc()}")
        try:
            db = get_sync_session()
            ab_run = db.get(ABRun, ab_run_id)
            if ab_run:
                ab_run.status = ABStatus.STOPPED
                ab_run.end_date = datetime.utcnow()
                ab_run.results_summary = {"error": str(e)}
                db.commit()
            db.close()
        except Exception:
            pass
        raise
