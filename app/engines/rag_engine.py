from __future__ import annotations

import os
import logging
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional, Callable, Tuple
from datetime import datetime

from llama_index.core import (
    Document as LIDocument,
    VectorStoreIndex,
    StorageContext,
    load_index_from_storage,
)
from llama_index.core.node_parser import SentenceSplitter
from llama_index.core import Settings
from llama_index.vector_stores.chroma import ChromaVectorStore
import chromadb

from app.core.config import get_settings

logger = logging.getLogger(__name__)


@dataclass
class IndexedDocument:
    doc_id: int
    title: str
    file_path: Optional[str]
    source_url: Optional[str]
    line_start: Optional[int]
    line_end: Optional[int]
    content: str
    metadata: Dict[str, Any] = field(default_factory=dict)
    language: Optional[str] = None
    data_version: Optional[str] = None


@dataclass
class IndexBuildResult:
    model_version: str
    total_documents: int
    indexed_count: int
    failed_count: int
    node_count: int
    started_at: datetime
    finished_at: Optional[datetime] = None
    error_messages: List[str] = field(default_factory=list)


class EmbedModelFactory:
    _cached_model = None

    @classmethod
    def get_model(cls):
        if cls._cached_model is not None:
            return cls._cached_model
        settings = get_settings()
        try:
            from llama_index.embeddings.huggingface import HuggingFaceEmbedding
            cls._cached_model = HuggingFaceEmbedding(
                model_name=settings.EMBEDDING_MODEL_NAME,
                token=settings.HUGGINGFACE_TOKEN,
                max_length=512,
            )
        except Exception as e:
            logger.warning(f"Failed to load HuggingFace embedding model: {e}, falling back to dummy")
            from llama_index.core.embeddings import MockEmbedding
            cls._cached_model = MockEmbedding(embed_dim=settings.EMBEDDING_DIMENSION)
        Settings.embed_model = cls._cached_model
        return cls._cached_model


class LLMModelFactory:
    _cached_model = None

    @classmethod
    def get_model(cls):
        if cls._cached_model is not None:
            return cls._cached_model
        settings = get_settings()
        try:
            from llama_index.llms.huggingface import HuggingFaceLLM
            from llama_index.core import PromptTemplate
            system_prompt = (
                "你是面向开发团队的内部代码知识库助手。"
                "请严格基于提供的上下文回答问题，不要编造不存在的API、函数或文档。"
                "如果上下文不足以回答问题，请明确说明。"
                "回答应简洁、准确，并附带来源引用。"
            )
            query_wrapper_prompt = PromptTemplate(
                "<|system|>\n" + system_prompt + "</s>\n<|user|>\n{query_str}</s>\n<|assistant|>\n"
            )
            cls._cached_model = HuggingFaceLLM(
                context_window=4096,
                max_new_tokens=512,
                generate_kwargs={"temperature": 0.2, "do_sample": False},
                system_prompt=system_prompt,
                query_wrapper_prompt=query_wrapper_prompt,
                tokenizer_name=settings.LLM_MODEL_NAME,
                model_name=settings.LLM_MODEL_NAME,
                device_map="auto",
                tokenizer_kwargs={"max_length": 4096},
            )
        except Exception as e:
            logger.warning(f"Failed to load HuggingFace LLM: {e}, falling back to dummy")
            from llama_index.core.llms import MockLLM
            cls._cached_model = MockLLM()
        Settings.llm = cls._cached_model
        return cls._cached_model


class IndexBuilder:
    """训练侧：索引构建器。负责将审核后的文档构建为向量索引。"""

    def __init__(self):
        self.settings = get_settings()
        self.embed_model = EmbedModelFactory.get_model()
        self._node_parser = SentenceSplitter(
            chunk_size=512,
            chunk_overlap=64,
            separator="\n",
        )
        Settings.chunk_size = 512
        Settings.chunk_overlap = 64

    def _convert_documents(self, docs: List[IndexedDocument]) -> List[LIDocument]:
        li_docs = []
        for d in docs:
            meta = dict(d.metadata)
            meta.update({
                "doc_id": d.doc_id,
                "title": d.title,
                "file_path": d.file_path or "",
                "source_url": d.source_url or "",
                "line_start": d.line_start if d.line_start is not None else -1,
                "line_end": d.line_end if d.line_end is not None else -1,
                "language": d.language or "",
                "data_version": d.data_version or "",
            })
            li_docs.append(LIDocument(text=d.content, metadata=meta, doc_id=str(d.doc_id)))
        return li_docs

    def _get_vector_store(self, model_version: str):
        os.makedirs(self.settings.CHROMA_PERSIST_DIR, exist_ok=True)
        db = chromadb.PersistentClient(path=self.settings.CHROMA_PERSIST_DIR)
        collection = db.get_or_create_collection(
            name=f"code_qa_{model_version.replace('.', '_')}",
            metadata={"hnsw:space": "cosine"},
        )
        return ChromaVectorStore(chroma_collection=collection)

    def build_index(self,
                    documents: List[IndexedDocument],
                    model_version: str,
                    progress_callback: Optional[Callable[[int, int], None]] = None,
                    ) -> Tuple[IndexBuildResult, List[Tuple[str, int, int]]]:
        """训练阶段：构建向量索引。返回构建结果和(node_id, doc_id, chunk_index)列表。"""
        started_at = datetime.utcnow()
        result = IndexBuildResult(
            model_version=model_version,
            total_documents=len(documents),
            indexed_count=0,
            failed_count=0,
            node_count=0,
            started_at=started_at,
        )
        node_records: List[Tuple[str, int, int]] = []
        if not documents:
            result.finished_at = datetime.utcnow()
            return result, node_records

        try:
            li_docs = self._convert_documents(documents)
            nodes = self._node_parser(li_docs)
            result.node_count = len(nodes)

            vector_store = self._get_vector_store(model_version)
            storage_context = StorageContext.from_defaults(vector_store=vector_store)

            for idx, node in enumerate(nodes):
                doc_id = int(node.metadata.get("doc_id", 0))
                chunk_idx = idx
                node_records.append((node.node_id, doc_id, chunk_idx))
                if progress_callback:
                    progress_callback(idx + 1, len(nodes))

            index = VectorStoreIndex(
                nodes=nodes,
                storage_context=storage_context,
                show_progress=self.settings.DEBUG,
            )
            index_dir = os.path.join(self.settings.INDEX_STORAGE_DIR, model_version)
            os.makedirs(index_dir, exist_ok=True)
            index.storage_context.persist(persist_dir=index_dir)

            result.indexed_count = len(documents)
            result.finished_at = datetime.utcnow()
        except Exception as e:
            logger.exception("Index build failed")
            result.error_messages.append(str(e))
            result.failed_count = len(documents)
            result.finished_at = datetime.utcnow()

        return result, node_records


class QueryEngine:
    """推理侧：查询引擎。加载已构建的索引执行语义搜索和问答。"""

    _cached_engines: Dict[str, Tuple[VectorStoreIndex, Any]] = {}

    def __init__(self, model_version: Optional[str] = None):
        self.settings = get_settings()
        self.model_version = model_version or self.settings.DEFAULT_MODEL_VERSION
        self.embed_model = EmbedModelFactory.get_model()
        self.llm_model = LLMModelFactory.get_model()
        Settings.embed_model = self.embed_model
        Settings.llm = self.llm_model

    def _load_index(self) -> VectorStoreIndex:
        if self.model_version in self._cached_engines:
            return self._cached_engines[self.model_version][0]
        index_dir = os.path.join(self.settings.INDEX_STORAGE_DIR, self.model_version)
        if os.path.exists(index_dir):
            storage_context = StorageContext.from_defaults(persist_dir=index_dir)
            index = load_index_from_storage(storage_context)
        else:
            vector_store = self._get_vector_store(self.model_version)
            storage_context = StorageContext.from_defaults(vector_store=vector_store)
            index = VectorStoreIndex.from_vector_store(vector_store=vector_store, storage_context=storage_context)
        self._cached_engines[self.model_version] = (index, None)
        return index

    def _get_vector_store(self, model_version: str):
        os.makedirs(self.settings.CHROMA_PERSIST_DIR, exist_ok=True)
        db = chromadb.PersistentClient(path=self.settings.CHROMA_PERSIST_DIR)
        collection_name = f"code_qa_{model_version.replace('.', '_')}"
        try:
            collection = db.get_collection(collection_name)
        except Exception:
            collection = db.create_collection(
                name=collection_name,
                metadata={"hnsw:space": "cosine"},
            )
        return ChromaVectorStore(chroma_collection=collection)

    def semantic_search(self, query: str, top_k: int = 8,
                        similarity_threshold: Optional[float] = None):
        """语义搜索：返回最相关的文本块及其引用。"""
        threshold = similarity_threshold or self.settings.SIMILARITY_THRESHOLD
        index = self._load_index()
        retriever = index.as_retriever(
            similarity_top_k=top_k,
            vector_store_kwargs={"similarity_top_k": top_k},
        )
        try:
            nodes = retriever.retrieve(query)
        except Exception as e:
            logger.error(f"Retrieval failed: {e}")
            return []
        results = []
        for node in nodes:
            score = float(getattr(node, 'score', 0.0))
            if score < threshold:
                continue
            meta = node.metadata or {}
            results.append({
                "node_id": node.node_id,
                "score": score,
                "content": node.get_text(),
                "citation": {
                    "document_id": meta.get("doc_id"),
                    "node_id": node.node_id,
                    "source_title": meta.get("title", "Unknown"),
                    "file_path": meta.get("file_path") or None,
                    "source_url": meta.get("source_url") or None,
                    "line_start": (
                        int(meta["line_start"])
                        if meta.get("line_start") not in (None, "", -1)
                        else None
                    ),
                    "line_end": (
                        int(meta["line_end"])
                        if meta.get("line_end") not in (None, "", -1)
                        else None
                    ),
                    "snippet": node.get_text()[:300],
                    "relevance_score": score,
                },
            })
        return results

    def answer_question(self, question: str, top_k_context: int = 8):
        """RAG问答：基于检索上下文生成回答。"""
        index = self._load_index()
        query_engine = index.as_query_engine(
            similarity_top_k=top_k_context,
            response_mode="compact",
        )
        try:
            response = query_engine.query(question)
        except Exception as e:
            logger.exception("Query failed")
            return {
                "answer": f"问答引擎执行出错：{str(e)}。请稍后重试或使用语义搜索。",
                "sources": [],
                "confidence": 0.0,
                "reasoning": "查询引擎执行失败，无法生成可靠回答。",
            }
        answer_text = str(response)
        sources = []
        seen_nodes = set()
        source_nodes = getattr(response, 'source_nodes', []) or []
        for node_with_score in source_nodes:
            node = node_with_score.node
            if node.node_id in seen_nodes:
                continue
            seen_nodes.add(node.node_id)
            score = float(getattr(node_with_score, 'score', 0.0))
            meta = node.metadata or {}
            sources.append({
                "document_id": meta.get("doc_id"),
                "node_id": node.node_id,
                "source_title": meta.get("title", "Unknown"),
                "file_path": meta.get("file_path") or None,
                "source_url": meta.get("source_url") or None,
                "line_start": (
                    int(meta["line_start"])
                    if meta.get("line_start") not in (None, "", -1)
                    else None
                ),
                "line_end": (
                    int(meta["line_end"])
                    if meta.get("line_end") not in (None, "", -1)
                    else None
                ),
                "snippet": node.get_text()[:300],
                "relevance_score": score,
            })
        if sources:
            avg_score = sum(s["relevance_score"] for s in sources) / len(sources)
        else:
            avg_score = 0.0
        confidence = self._estimate_confidence(answer_text, avg_score, len(sources))
        reasoning = self._build_reasoning(sources, avg_score)
        return {
            "answer": answer_text,
            "sources": sources,
            "confidence": confidence,
            "avg_similarity": avg_score,
            "reasoning": reasoning,
        }

    def _estimate_confidence(self, answer: str, avg_similarity: float, source_count: int) -> float:
        base = avg_similarity
        empty_markers = [
            "无法回答", "无法提供", "没有足够的信息", "没有找到相关",
            "not enough information", "cannot answer", "i don't know",
            "不明确", "未知",
        ]
        penalty = 0.0
        for marker in empty_markers:
            if marker.lower() in answer.lower():
                penalty = max(penalty, 0.3)
        if source_count == 0:
            penalty = max(penalty, 0.5)
        score = max(0.0, min(1.0, base * (1.0 - penalty)))
        return score

    def _build_reasoning(self, sources, avg_similarity) -> str:
        parts = []
        if sources:
            parts.append(f"检索到 {len(sources)} 个相关上下文片段。")
            titles = list({s["source_title"] for s in sources})[:5]
            parts.append(f"主要来源：{'、'.join(titles)}。")
        else:
            parts.append("未检索到相关上下文，回答可靠性较低。")
        parts.append(f"上下文平均相似度：{avg_similarity:.3f}。")
        parts.append("所有回答均严格基于提供的上下文生成，如与官方文档有出入，请以实际代码和文档为准。")
        return " ".join(parts)

    @classmethod
    def clear_cache(cls, model_version: Optional[str] = None):
        if model_version:
            cls._cached_engines.pop(model_version, None)
        else:
            cls._cached_engines.clear()
