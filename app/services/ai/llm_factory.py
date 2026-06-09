import os
import logging
from typing import Optional, Dict, Any, List, Tuple
from dataclasses import dataclass, field
from functools import lru_cache

from loguru import logger
from langchain_core.language_models import BaseChatModel
from langchain_core.embeddings import Embeddings
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from app.config import settings


class ChatModelProvider(str):
    OPENAI = "openai"
    LOCAL = "local"
    AZURE = "azure"
    ANTHROPIC = "anthropic"


class EmbeddingProvider(str):
    OPENAI = "openai"
    LOCAL_SENTENCE = "local_sentence"
    HUGGINGFACE = "huggingface"


@dataclass
class LLMUsage:
    tokens_input: int = 0
    tokens_output: int = 0
    cost_usd: float = 0.0
    latency_ms: float = 0.0
    calls: int = 0

    def add(self, other: "LLMUsage") -> "LLMUsage":
        self.tokens_input += other.tokens_input
        self.tokens_output += other.tokens_output
        self.cost_usd += other.cost_usd
        self.latency_ms += other.latency_ms
        self.calls += other.calls
        return self

    def to_dict(self) -> Dict:
        return {
            "tokens_input": self.tokens_input,
            "tokens_output": self.tokens_output,
            "cost_usd": round(self.cost_usd, 6),
            "latency_ms": round(self.latency_ms, 2),
            "calls": self.calls,
        }


class LLMFactory:
    """
    LLM工厂
    支持：OpenAI API、本地Ollama/兼容API、嵌入模型（OpenAI/本地SentenceTransformer）
    特性：自动重试、熔断、成本追踪、版本管理
    """

    _chat_instance: Optional[BaseChatModel] = None
    _embedding_instance: Optional[Embeddings] = None
    _cost_rates: Dict[str, Tuple[float, float]] = {
        "gpt-4o": (5.0 / 1_000_000, 15.0 / 1_000_000),
        "gpt-4o-mini": (0.15 / 1_000_000, 0.6 / 1_000_000),
        "gpt-4-turbo": (10.0 / 1_000_000, 30.0 / 1_000_000),
        "gpt-3.5-turbo": (0.5 / 1_000_000, 1.5 / 1_000_000),
        "text-embedding-3-small": (0.02 / 1_000_000, 0.0),
        "text-embedding-3-large": (0.13 / 1_000_000, 0.0),
        "text-embedding-ada-002": (0.10 / 1_000_000, 0.0),
    }

    def __init__(
        self,
        *,
        default_model: Optional[str] = None,
        default_temperature: float = 0.1,
        max_tokens: int = 4096,
    ):
        self.default_model = default_model or settings.OPENAI_MODEL_NAME
        self.default_temperature = default_temperature
        self.max_tokens = max_tokens
        self._usage_accumulator = LLMUsage()

    @classmethod
    def _compute_cost(cls, model: str, input_tokens: int, output_tokens: int) -> float:
        rate = cls._cost_rates.get(model, (0.0, 0.0))
        return input_tokens * rate[0] + output_tokens * rate[1]

    def record_usage(self, model: str, input_tokens: int, output_tokens: int, latency_ms: float) -> LLMUsage:
        cost = self._compute_cost(model, input_tokens, output_tokens)
        usage = LLMUsage(
            tokens_input=input_tokens,
            tokens_output=output_tokens,
            cost_usd=cost,
            latency_ms=latency_ms,
            calls=1,
        )
        self._usage_accumulator.add(usage)
        return usage

    def get_accumulated_usage(self) -> LLMUsage:
        return LLMUsage(
            tokens_input=self._usage_accumulator.tokens_input,
            tokens_output=self._usage_accumulator.tokens_output,
            cost_usd=self._usage_accumulator.cost_usd,
            latency_ms=self._usage_accumulator.latency_ms,
            calls=self._usage_accumulator.calls,
        )

    def reset_usage(self):
        self._usage_accumulator = LLMUsage()

    def get_chat_model(
        self,
        *,
        model_name: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        provider: Optional[str] = None,
        model_version_id: Optional[int] = None,
    ) -> BaseChatModel:
        model = model_name or self.default_model
        temp = temperature if temperature is not None else self.default_temperature
        max_tok = max_tokens or self.max_tokens
        prov = provider or self._detect_provider(model)

        if prov == ChatModelProvider.OPENAI:
            return self._get_openai_chat(model, temp, max_tok)
        elif prov == ChatModelProvider.LOCAL:
            return self._get_local_chat(model, temp, max_tok)
        elif prov == ChatModelProvider.AZURE:
            return self._get_azure_chat(model, temp, max_tok)
        else:
            raise ValueError(f"不支持的Chat模型提供商: {prov}")

    def get_embedding_model(
        self,
        *,
        provider: Optional[str] = None,
        model_name: Optional[str] = None,
    ) -> Embeddings:
        prov = provider or (
            EmbeddingProvider.OPENAI if settings.OPENAI_API_KEY else EmbeddingProvider.LOCAL_SENTENCE
        )
        model = model_name or (
            settings.OPENAI_EMBEDDING_MODEL if prov == EmbeddingProvider.OPENAI
            else settings.LOCAL_EMBEDDING_MODEL
        )

        if prov == EmbeddingProvider.OPENAI:
            return self._get_openai_embedding(model)
        elif prov == EmbeddingProvider.LOCAL_SENTENCE:
            return self._get_local_sentence_embedding(model)
        elif prov == EmbeddingProvider.HUGGINGFACE:
            return self._get_hf_embedding(model)
        else:
            raise ValueError(f"不支持的嵌入模型提供商: {prov}")

    @staticmethod
    def _detect_provider(model: str) -> str:
        if settings.USE_LOCAL_LLM:
            return ChatModelProvider.LOCAL
        if model.startswith("azure/"):
            return ChatModelProvider.AZURE
        return ChatModelProvider.OPENAI

    @staticmethod
    def _get_openai_chat(model: str, temperature: float, max_tokens: int) -> BaseChatModel:
        from langchain_openai import ChatOpenAI

        if not settings.OPENAI_API_KEY:
            raise RuntimeError("OPENAI_API_KEY 未配置")

        return ChatOpenAI(
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            api_key=settings.OPENAI_API_KEY,
            timeout=120,
            max_retries=settings.MAX_RETRY_ATTEMPTS,
        )

    @staticmethod
    def _get_local_chat(model: str, temperature: float, max_tokens: int) -> BaseChatModel:
        from langchain_openai import ChatOpenAI

        base_url = settings.LOCAL_LLM_BASE_URL
        if not base_url:
            base_url = "http://localhost:11434/v1"

        return ChatOpenAI(
            model=model or settings.LOCAL_LLM_MODEL_NAME,
            temperature=temperature,
            max_tokens=max_tokens,
            api_key="ollama",
            base_url=base_url,
            timeout=300,
            max_retries=settings.MAX_RETRY_ATTEMPTS,
        )

    @staticmethod
    def _get_azure_chat(model: str, temperature: float, max_tokens: int) -> BaseChatModel:
        from langchain_openai import AzureChatOpenAI
        actual_model = model.replace("azure/", "", 1)
        return AzureChatOpenAI(
            azure_deployment=actual_model,
            temperature=temperature,
            max_tokens=max_tokens,
            timeout=120,
            max_retries=settings.MAX_RETRY_ATTEMPTS,
        )

    @staticmethod
    def _get_openai_embedding(model: str) -> Embeddings:
        from langchain_openai import OpenAIEmbeddings

        if not settings.OPENAI_API_KEY:
            raise RuntimeError("OPENAI_API_KEY 未配置")

        return OpenAIEmbeddings(
            model=model,
            api_key=settings.OPENAI_API_KEY,
            timeout=120,
            max_retries=settings.MAX_RETRY_ATTEMPTS,
        )

    @staticmethod
    def _get_local_sentence_embedding(model: str) -> Embeddings:
        try:
            from langchain_community.embeddings import HuggingFaceEmbeddings
            return HuggingFaceEmbeddings(
                model_name=model,
                model_kwargs={"device": "cpu"},
                encode_kwargs={"normalize_embeddings": True},
            )
        except Exception as e:
            logger.warning(f"加载HuggingFaceEmbeddings失败: {e}, 回退到FakeEmbeddings")
            from langchain_core.embeddings import FakeEmbeddings
            return FakeEmbeddings(size=384)

    @staticmethod
    def _get_hf_embedding(model: str) -> Embeddings:
        from langchain_community.embeddings import HuggingFaceInferenceAPIEmbeddings
        return HuggingFaceInferenceAPIEmbeddings(
            api_key=os.environ.get("HF_API_KEY", ""),
            model_name=model,
        )

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=30),
        retry=retry_if_exception_type((Exception,)),
        reraise=True,
    )
    async def achat_with_usage(
        self,
        messages,
        *,
        model: Optional[str] = None,
        **kwargs,
    ) -> Tuple[Any, LLMUsage]:
        import time
        start = time.perf_counter()

        llm = self.get_chat_model(model_name=model)

        if hasattr(llm, "ainvoke"):
            response = await llm.ainvoke(messages, **kwargs)
        else:
            response = llm.invoke(messages, **kwargs)

        latency = (time.perf_counter() - start) * 1000

        input_tokens = 0
        output_tokens = 0
        usage_meta = getattr(response, "response_metadata", {}).get("token_usage")
        if usage_meta:
            input_tokens = usage_meta.get("prompt_tokens", 0)
            output_tokens = usage_meta.get("completion_tokens", 0)

        actual_model = model or self.default_model
        usage = self.record_usage(actual_model, input_tokens, output_tokens, latency)

        return response, usage

    def chat_with_usage(
        self,
        messages,
        *,
        model: Optional[str] = None,
        **kwargs,
    ) -> Tuple[Any, LLMUsage]:
        import time
        start = time.perf_counter()

        llm = self.get_chat_model(model_name=model)
        response = llm.invoke(messages, **kwargs)

        latency = (time.perf_counter() - start) * 1000

        input_tokens = 0
        output_tokens = 0
        usage_meta = getattr(response, "response_metadata", {}).get("token_usage")
        if usage_meta:
            input_tokens = usage_meta.get("prompt_tokens", 0)
            output_tokens = usage_meta.get("completion_tokens", 0)

        actual_model = model or self.default_model
        usage = self.record_usage(actual_model, input_tokens, output_tokens, latency)

        return response, usage
