from __future__ import annotations

import os
import uuid
import logging
from typing import List, Optional, Dict, Any, Union, Tuple
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum

from loguru import logger
from langchain_core.documents import Document
from langchain_core.vectorstores import VectorStore, VectorStoreRetriever
from langchain_core.embeddings import Embeddings

from app.config import settings
from app.services.ai.llm_factory import LLMFactory


class VectorStoreBackend(str, Enum):
    CHROMA = "chroma"
    FAISS = "faiss"


class RetrieverSearchType(str, Enum):
    SIMILARITY = "similarity"
    MMR = "mmr"
    SIMILARITY_SCORE_THRESHOLD = "similarity_score_threshold"


@dataclass
class FilterCriteria:
    document_ids: Optional[List[int]] = None
    clause_categories: Optional[List[str]] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    quality_min: Optional[float] = None
    custom_filters: Optional[Dict[str, Any]] = None

    def to_metadata_filter(self) -> Dict[str, Any]:
        filters: Dict[str, Any] = {}
        if self.document_ids:
            filters["document_id"] = {"$in": self.document_ids}
        if self.clause_categories:
            filters["category"] = {"$in": self.clause_categories}
        if self.date_from:
            filters["created_at"] = {"$gte": self.date_from.isoformat()}
        if self.date_to:
            if "created_at" in filters:
                filters["created_at"]["$lte"] = self.date_to.isoformat()
            else:
                filters["created_at"] = {"$lte": self.date_to.isoformat()}
        if self.quality_min is not None:
            filters["quality_score"] = {"$gte": self.quality_min}
        if self.custom_filters:
            filters.update(self.custom_filters)
        return filters


@dataclass
class IndexedClause:
    clause_id: int
    document_id: int
    clause_index: int
    category: str
    original_text: str
    cleaned_text: Optional[str]
    quality_score: float
    embedding_id: str
    page_start: int
    page_end: int
    created_at: datetime
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_document(self) -> Document:
        page_content = self.cleaned_text or self.original_text
        metadata = {
            "clause_id": self.clause_id,
            "document_id": self.document_id,
            "clause_index": self.clause_index,
            "category": self.category,
            "quality_score": self.quality_score,
            "embedding_id": self.embedding_id,
            "page_start": self.page_start,
            "page_end": self.page_end,
            "created_at": self.created_at.isoformat(),
        }
        metadata.update(self.metadata)
        return Document(page_content=page_content, metadata=metadata)

    @classmethod
    def from_document(cls, doc: Document) -> "IndexedClause":
        return cls(
            clause_id=doc.metadata.get("clause_id", 0),
            document_id=doc.metadata.get("document_id", 0),
            clause_index=doc.metadata.get("clause_index", 0),
            category=doc.metadata.get("category", "other"),
            original_text=doc.page_content,
            cleaned_text=doc.page_content,
            quality_score=doc.metadata.get("quality_score", 1.0),
            embedding_id=doc.metadata.get("embedding_id", ""),
            page_start=doc.metadata.get("page_start", 1),
            page_end=doc.metadata.get("page_end", 1),
            created_at=datetime.fromisoformat(doc.metadata.get("created_at", datetime.utcnow().isoformat())),
            metadata={k: v for k, v in doc.metadata.items() if k not in {
                "clause_id", "document_id", "clause_index", "category",
                "quality_score", "embedding_id", "page_start", "page_end", "created_at"
            }},
        )


class VectorStoreManager:
    """
    向量存储管理器

    功能：
    - 基于Chroma/FAISS的向量存储，支持合同条款的持久化
    - 索引构建、增删改查操作
    - 多条件过滤（按合同ID、条款类别、日期范围）
    - 支持LangChain Retriever接口
    """

    _instance: Optional["VectorStoreManager"] = None
    _store: Optional[VectorStore] = None
    _embeddings: Optional[Embeddings] = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(
        self,
        *,
        backend: Optional[VectorStoreBackend] = None,
        collection_name: str = "contract_clauses",
        llm_factory: Optional[LLMFactory] = None,
    ):
        if hasattr(self, "_initialized") and self._initialized:
            return
        self._initialized = True

        self._backend = backend or VectorStoreBackend.CHROMA
        self._collection_name = collection_name
        self._llm_factory = llm_factory or LLMFactory()
        self._persist_directory = os.path.join(settings.VECTOR_STORE_PATH, self._backend.value)
        os.makedirs(self._persist_directory, exist_ok=True)

    @property
    def backend(self) -> VectorStoreBackend:
        return self._backend

    @property
    def collection_name(self) -> str:
        return self._collection_name

    def _get_embeddings(self) -> Embeddings:
        if self._embeddings is None:
            self._embeddings = self._llm_factory.get_embedding_model()
        return self._embeddings

    def _get_or_create_store(self) -> VectorStore:
        if self._store is not None:
            return self._store

        embeddings = self._get_embeddings()

        if self._backend == VectorStoreBackend.CHROMA:
            try:
                import chromadb
                from langchain_chroma import Chroma

                client_settings = chromadb.config.Settings(
                    is_persistent=True,
                    persist_directory=self._persist_directory,
                    anonymized_telemetry=False,
                )
                self._store = Chroma(
                    collection_name=self._collection_name,
                    embedding_function=embeddings,
                    client_settings=client_settings,
                    persist_directory=self._persist_directory,
                )
                logger.info(f"Chroma向量存储已初始化: {self._persist_directory}")
            except Exception as e:
                logger.warning(f"Chroma初始化失败，使用FAISS替代: {e}")
                self._backend = VectorStoreBackend.FAISS

        if self._backend == VectorStoreBackend.FAISS:
            try:
                from langchain_community.vectorstores import FAISS

                index_file = os.path.join(self._persist_directory, f"{self._collection_name}.faiss")
                if os.path.exists(index_file):
                    self._store = FAISS.load_local(
                        folder_path=self._persist_directory,
                        embeddings=embeddings,
                        index_name=self._collection_name,
                        allow_dangerous_deserialization=True,
                    )
                    logger.info(f"FAISS向量存储已加载: {index_file}")
                else:
                    from langchain_core.documents import Document
                    self._store = FAISS.from_documents(
                        documents=[Document(page_content="init", metadata={})],
                        embedding=embeddings,
                    )
                    self._store.delete(ids=[self._store.index_to_docstore_id[0]])
                    logger.info(f"FAISS向量存储已创建: {index_file}")
            except Exception as e:
                logger.error(f"FAISS初始化失败: {e}")
                raise RuntimeError("无法初始化向量存储，请安装chromadb或faiss-cpu")

        return self._store

    def _persist(self) -> None:
        if self._backend == VectorStoreBackend.FAISS and self._store is not None:
            try:
                self._store.save_local(
                    folder_path=self._persist_directory,
                    index_name=self._collection_name,
                )
            except Exception as e:
                logger.warning(f"FAISS持久化失败: {e}")

    def build_index(self, clauses: List[IndexedClause]) -> List[str]:
        """
        批量构建索引

        Args:
            clauses: 待索引的条款列表

        Returns:
            embedding_id列表
        """
        if not clauses:
            return []

        store = self._get_or_create_store()
        documents = [clause.to_document() for clause in clauses]
        embedding_ids = [clause.embedding_id or str(uuid.uuid4()) for clause in clauses]

        for doc, eid in zip(documents, embedding_ids):
            doc.metadata["embedding_id"] = eid

        try:
            store.add_documents(documents=documents, ids=embedding_ids)
            self._persist()
            logger.info(f"成功索引 {len(embedding_ids)} 条条款")
        except Exception as e:
            logger.error(f"批量索引失败: {e}")
            raise

        return embedding_ids

    def add_clause(self, clause: IndexedClause) -> str:
        """
        添加单条条款到索引

        Args:
            clause: 待索引的条款

        Returns:
            embedding_id
        """
        embedding_ids = self.build_index([clause])
        return embedding_ids[0] if embedding_ids else ""

    def update_clause(self, clause: IndexedClause) -> bool:
        """
        更新条款索引

        Args:
            clause: 更新后的条款

        Returns:
            是否成功
        """
        store = self._get_or_create_store()
        try:
            self.delete_by_embedding_ids([clause.embedding_id])
            self.add_clause(clause)
            return True
        except Exception as e:
            logger.error(f"更新条款索引失败: {e}")
            return False

    def delete_by_embedding_ids(self, embedding_ids: List[str]) -> int:
        """
        按embedding_id删除

        Args:
            embedding_ids: embedding_id列表

        Returns:
            删除数量
        """
        if not embedding_ids:
            return 0

        store = self._get_or_create_store()
        try:
            store.delete(ids=embedding_ids)
            self._persist()
            logger.info(f"已删除 {len(embedding_ids)} 条索引")
            return len(embedding_ids)
        except Exception as e:
            logger.error(f"按embedding_id删除失败: {e}")
            return 0

    def delete_by_document_id(self, document_id: int) -> int:
        """
        按合同ID删除所有相关条款

        Args:
            document_id: 合同文档ID

        Returns:
            删除数量
        """
        store = self._get_or_create_store()
        try:
            docs = store.get(where={"document_id": document_id})
            if docs and docs.get("ids"):
                store.delete(ids=docs["ids"])
                self._persist()
                deleted_count = len(docs["ids"])
                logger.info(f"已删除合同 {document_id} 的 {deleted_count} 条索引")
                return deleted_count
            return 0
        except Exception as e:
            logger.error(f"按document_id删除失败: {e}")
            return 0

    def delete_by_criteria(self, criteria: FilterCriteria) -> int:
        """
        按多条件删除

        Args:
            criteria: 过滤条件

        Returns:
            删除数量
        """
        store = self._get_or_create_store()
        filter_dict = criteria.to_metadata_filter()
        try:
            docs = store.get(where=filter_dict)
            if docs and docs.get("ids"):
                store.delete(ids=docs["ids"])
                self._persist()
                return len(docs["ids"])
            return 0
        except Exception as e:
            logger.error(f"按条件删除失败: {e}")
            return 0

    def similarity_search(
        self,
        query: str,
        *,
        top_k: int = settings.TOP_K_RETRIEVE,
        criteria: Optional[FilterCriteria] = None,
        score_threshold: Optional[float] = None,
    ) -> List[Tuple[IndexedClause, float]]:
        """
        相似度搜索

        Args:
            query: 查询文本
            top_k: 返回结果数量
            criteria: 过滤条件
            score_threshold: 相似度阈值（0-1，越高越严格）

        Returns:
            (IndexedClause, 相似度得分) 列表
        """
        store = self._get_or_create_store()
        filter_dict = criteria.to_metadata_filter() if criteria else None

        try:
            results_with_scores = store.similarity_search_with_score(
                query=query,
                k=top_k,
                filter=filter_dict,
            )
        except TypeError:
            docs_and_scores = store.similarity_search_with_score(query, k=top_k)
            if filter_dict:
                docs_and_scores = [
                    (doc, score) for doc, score in docs_and_scores
                    if self._document_matches_filter(doc, filter_dict)
                ]
            results_with_scores = docs_and_scores

        normalized_results = []
        for doc, score in results_with_scores:
            if self._backend == VectorStoreBackend.FAISS:
                normalized_score = 1.0 / (1.0 + score)
            else:
                normalized_score = score if score <= 1.0 else 1.0 / (1.0 + score)

            if score_threshold is None or normalized_score >= score_threshold:
                indexed_clause = IndexedClause.from_document(doc)
                normalized_results.append((indexed_clause, normalized_score))

        return normalized_results

    def mmr_search(
        self,
        query: str,
        *,
        top_k: int = settings.TOP_K_RETRIEVE,
        criteria: Optional[FilterCriteria] = None,
        lambda_mult: float = 0.5,
    ) -> List[IndexedClause]:
        """
        MMR（最大边际相关性）搜索，平衡相关性和多样性

        Args:
            query: 查询文本
            top_k: 返回结果数量
            criteria: 过滤条件
            lambda_mult: 多样性参数（0-1，0最多样，1最相关）

        Returns:
            IndexedClause列表
        """
        store = self._get_or_create_store()
        filter_dict = criteria.to_metadata_filter() if criteria else None

        retriever = store.as_retriever(
            search_type=RetrieverSearchType.MMR,
            search_kwargs={
                "k": top_k,
                "lambda_mult": lambda_mult,
                "filter": filter_dict,
            },
        )
        docs = retriever.invoke(query)
        return [IndexedClause.from_document(doc) for doc in docs]

    def get_by_criteria(
        self,
        criteria: FilterCriteria,
        *,
        limit: int = 100,
        offset: int = 0,
    ) -> List[IndexedClause]:
        """
        按条件查询已索引条款（非向量搜索）

        Args:
            criteria: 过滤条件
            limit: 返回数量上限
            offset: 偏移量

        Returns:
            IndexedClause列表
        """
        store = self._get_or_create_store()
        filter_dict = criteria.to_metadata_filter()

        try:
            docs = store.get(where=filter_dict, limit=limit, offset=offset)
            if docs and docs.get("documents"):
                documents = []
                for i, content in enumerate(docs["documents"]):
                    metadata = docs.get("metadatas", [{}])[i] if docs.get("metadatas") else {}
                    documents.append(Document(page_content=content, metadata=metadata))
                return [IndexedClause.from_document(doc) for doc in documents]
            return []
        except Exception as e:
            logger.error(f"按条件查询失败: {e}")
            return []

    def get_by_document_id(self, document_id: int) -> List[IndexedClause]:
        """
        获取指定合同的所有条款

        Args:
            document_id: 合同文档ID

        Returns:
            IndexedClause列表，按clause_index排序
        """
        criteria = FilterCriteria(document_ids=[document_id])
        clauses = self.get_by_criteria(criteria, limit=10000)
        return sorted(clauses, key=lambda c: c.clause_index)

    def as_retriever(
        self,
        *,
        search_type: RetrieverSearchType = RetrieverSearchType.SIMILARITY,
        top_k: int = settings.TOP_K_RETRIEVE,
        criteria: Optional[FilterCriteria] = None,
        score_threshold: float = 0.5,
        lambda_mult: float = 0.5,
    ) -> VectorStoreRetriever:
        """
        获取LangChain Retriever接口

        Args:
            search_type: 搜索类型
            top_k: 返回数量
            criteria: 过滤条件
            score_threshold: 相似度阈值（similarity_score_threshold模式）
            lambda_mult: 多样性参数（mmr模式）

        Returns:
            VectorStoreRetriever
        """
        store = self._get_or_create_store()
        filter_dict = criteria.to_metadata_filter() if criteria else None

        search_kwargs: Dict[str, Any] = {"k": top_k}
        if filter_dict:
            search_kwargs["filter"] = filter_dict
        if search_type == RetrieverSearchType.SIMILARITY_SCORE_THRESHOLD:
            search_kwargs["score_threshold"] = score_threshold
        if search_type == RetrieverSearchType.MMR:
            search_kwargs["lambda_mult"] = lambda_mult

        return store.as_retriever(
            search_type=search_type.value,
            search_kwargs=search_kwargs,
        )

    def get_collection_stats(self) -> Dict[str, Any]:
        """
        获取向量存储统计信息

        Returns:
            统计信息字典
        """
        store = self._get_or_create_store()
        stats = {
            "backend": self._backend.value,
            "collection_name": self._collection_name,
            "persist_directory": self._persist_directory,
        }
        try:
            collection_data = store.get()
            stats["total_documents"] = len(collection_data.get("ids", []))
            if collection_data.get("metadatas"):
                categories: Dict[str, int] = {}
                document_ids: set = set()
                for meta in collection_data["metadatas"]:
                    cat = meta.get("category", "unknown")
                    categories[cat] = categories.get(cat, 0) + 1
                    if meta.get("document_id") is not None:
                        document_ids.add(meta["document_id"])
                stats["categories_distribution"] = categories
                stats["unique_documents"] = len(document_ids)
        except Exception as e:
            logger.warning(f"获取统计信息失败: {e}")
            stats["total_documents"] = 0
        return stats

    def clear_all(self) -> None:
        """清除所有索引数据"""
        store = self._get_or_create_store()
        try:
            all_data = store.get()
            if all_data and all_data.get("ids"):
                store.delete(ids=all_data["ids"])
                self._persist()
            logger.info("已清除所有索引数据")
        except Exception as e:
            logger.error(f"清除索引失败: {e}")

    @staticmethod
    def _document_matches_filter(doc: Document, filter_dict: Dict[str, Any]) -> bool:
        for key, condition in filter_dict.items():
            doc_value = doc.metadata.get(key)
            if isinstance(condition, dict):
                if "$in" in condition:
                    if doc_value not in condition["$in"]:
                        return False
                if "$gte" in condition:
                    if doc_value is None or doc_value < condition["$gte"]:
                        return False
                if "$lte" in condition:
                    if doc_value is None or doc_value > condition["$lte"]:
                        return False
            else:
                if doc_value != condition:
                    return False
        return True


def get_vector_store_manager() -> VectorStoreManager:
    """获取单例向量存储管理器"""
    return VectorStoreManager()
