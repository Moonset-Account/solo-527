import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  TrendingUp,
  Clock,
  BookOpen,
  Eye,
  ThumbsUp,
  History,
  X,
} from 'lucide-react';
import { knowledgeApi } from '@/api/knowledgeApi';
import type { KnowledgeSearchResult, HotSearch, QueryHistory } from '@/types';
import { Card, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/common/Select';
import { Badge } from '@/components/common/Badge';
import { KNOWLEDGE_CATEGORIES } from '@/utils/constants';
import { formatRelativeTime } from '@/utils/formatTime';

export default function KnowledgeSearch() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('all');
  const [results, setResults] = useState<KnowledgeSearchResult[]>([]);
  const [hotSearches, setHotSearches] = useState<HotSearch[]>([]);
  const [queryHistory, setQueryHistory] = useState<QueryHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    fetchHotSearches();
    fetchQueryHistory();
  }, []);

  const fetchHotSearches = async () => {
    try {
      const response = await knowledgeApi.getHotSearches();
      if (response.success) {
        setHotSearches(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch hot searches:', error);
    }
  };

  const fetchQueryHistory = async () => {
    try {
      const response = await knowledgeApi.getQueryHistory();
      if (response.success) {
        setQueryHistory(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch query history:', error);
    }
  };

  const handleSearch = async () => {
    if (!keyword.trim()) return;

    setLoading(true);
    setHasSearched(true);
    try {
      await knowledgeApi.recordQuery(keyword);
      const response = await knowledgeApi.searchKnowledge({
        keyword,
        category: category === 'all' ? undefined : category,
        page: 1,
        pageSize: 20,
      });
      if (response.success) {
        setResults(response.data.data);
      }
      fetchQueryHistory();
    } catch (error) {
      console.error('Failed to search knowledge:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleHotSearchClick = (searchKeyword: string) => {
    setKeyword(searchKeyword);
    setTimeout(() => handleSearch(), 0);
  };

  const handleHistoryClick = (searchKeyword: string) => {
    setKeyword(searchKeyword);
    setTimeout(() => handleSearch(), 0);
  };

  const clearKeyword = () => {
    setKeyword('');
    setResults([]);
    setHasSearched(false);
  };

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">知识库</h1>
        <p className="text-zinc-500 mt-1">搜索常见问题和解决方案</p>
      </div>

      <div className="max-w-3xl mx-auto">
        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-zinc-400" />
          <input
            type="text"
            placeholder="输入问题搜索知识库..."
            className="w-full h-16 pl-16 pr-24 bg-white border-2 border-zinc-200 rounded-2xl text-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
          />
          {keyword && (
            <button
              className="absolute right-20 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600"
              onClick={clearKeyword}
            >
              <X className="h-5 w-5" />
            </button>
          )}
          <Button
            className="absolute right-3 top-1/2 -translate-y-1/2 h-12"
            onClick={handleSearch}
            isLoading={loading}
          >
            搜索
          </Button>
        </div>

        <div className="flex items-center gap-4 mt-4">
          <span className="text-sm text-zinc-500">分类：</span>
          <div className="flex flex-wrap gap-2">
            {KNOWLEDGE_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                className={
                  `px-4 py-1.5 text-sm rounded-full transition-colors ${
                    category === cat.value
                      ? 'bg-primary-600 text-white'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`
                }
                onClick={() => setCategory(cat.value)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
          {!hasSearched ? (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-warning-600" />
                  <h3 className="text-lg font-semibold text-zinc-900">热门搜索</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {hotSearches.map((item, index) => (
                    <button
                      key={item.keyword}
                      className="flex items-center gap-2 px-4 py-2 bg-zinc-50 hover:bg-primary-50 rounded-lg text-sm text-zinc-700 hover:text-primary-600 transition-colors"
                      onClick={() => handleHotSearchClick(item.keyword)}
                    >
                      <span className={
                        `w-5 h-5 flex items-center justify-center rounded text-xs font-bold ${
                          index < 3
                            ? 'bg-warning-500 text-white'
                            : 'bg-zinc-200 text-zinc-600'
                        }`
                      }>
                        {index + 1}
                      </span>
                      {item.keyword}
                      <span className="text-xs text-zinc-400">{item.count}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="card p-6">
                  <div className="h-6 w-3/4 skeleton rounded mb-3" />
                  <div className="h-4 skeleton rounded mb-2" />
                  <div className="h-4 w-2/3 skeleton rounded" />
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <BookOpen className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
                <p className="text-zinc-500">未找到相关知识库内容</p>
                <p className="text-sm text-zinc-400 mt-1">请尝试其他关键词</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {results.map((result) => (
                <Card
                  key={result.item.id}
                  hoverable
                  onClick={() => navigate(`/knowledge/${result.item.id}`)}
                  className="overflow-hidden"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3
                            className="text-lg font-semibold text-zinc-900 hover:text-primary-600 transition-colors"
                            dangerouslySetInnerHTML={{
                              __html: result.highlightTitle || result.item.title,
                            }}
                          />
                          <Badge variant="secondary">{result.item.category}</Badge>
                        </div>
                        <p
                          className="text-zinc-600 line-clamp-2 mb-3"
                          dangerouslySetInnerHTML={{
                            __html: result.highlightContent || result.item.content,
                          }}
                        />
                        <div className="flex items-center gap-4 text-sm text-zinc-400">
                          <span className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            {result.item.views}
                          </span>
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="h-4 w-4" />
                            {result.item.likes}
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-4 w-4" />
                            命中 {result.hitCount} 次
                          </span>
                          <span>匹配度 {(result.matchScore * 100).toFixed(0)}%</span>
                          <span>{formatRelativeTime(result.item.updatedAt)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5 text-primary-600" />
                  <h3 className="font-semibold text-zinc-900">历史查询</h3>
                </div>
                <button
                  className="text-xs text-zinc-400 hover:text-zinc-600"
                  onClick={fetchQueryHistory}
                >
                  刷新
                </button>
              </div>
              <div className="space-y-2">
                {queryHistory.length === 0 ? (
                  <p className="text-sm text-zinc-400 text-center py-4">暂无查询记录</p>
                ) : (
                  queryHistory.map((item) => (
                    <button
                      key={item.id}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50 rounded-lg transition-colors text-left"
                      onClick={() => handleHistoryClick(item.keyword)}
                    >
                      <Clock className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                      <span className="truncate flex-1">{item.keyword}</span>
                    </button>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
