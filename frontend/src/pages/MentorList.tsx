import { useState } from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Card, List, Avatar, Tag, Input, Select, Button, 
  Space, Spin, Empty, Pagination 
} from 'antd';
import { SearchOutlined, FilterOutlined } from '@ant-design/icons';
import { mentorsApi, industryApi } from '../api';

const { Search } = Input;
const { Option } = Select;

const MentorList = () => {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<string | undefined>();
  const navigate = useNavigate();

  const { data: industries } = useQuery('industries', () => industryApi.list());

  const { data, isLoading, refetch } = useQuery(
    ['mentors', page, keyword, selectedIndustry],
    () => mentorsApi.list({
      page,
      per_page: pageSize,
      keyword: keyword || undefined,
      industry_tags: selectedIndustry ? [selectedIndustry] : undefined,
    })
  );

  const handleSearch = (value: string) => {
    setKeyword(value);
    setPage(1);
  };

  const handleIndustryChange = (value: string | undefined) => {
    setSelectedIndustry(value);
    setPage(1);
  };

  const renderTags = (tags: string[]) => (
    <>
      {tags.slice(0, 3).map((tag, idx) => (
        <Tag key={idx} color="blue">{tag}</Tag>
      ))}
    </>
  );

  return (
    <div className="space-y-4">
      <Card size="small">
        <Space direction="vertical" className="w-full" size="middle">
          <div className="flex flex-col md:flex-row gap-3">
            <Search
              placeholder="搜索导师姓名、公司、职位"
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              onSearch={handleSearch}
              className="flex-1"
            />
            <Select
              placeholder="选择行业"
              allowClear
              size="large"
              style={{ width: '100%', maxWidth: 200 }}
              onChange={handleIndustryChange}
              value={selectedIndustry}
            >
              {industries?.data?.map((ind: any) => (
                <Option key={ind.id} value={ind.name}>{ind.name}</Option>
              ))}
            </Select>
            <Button 
              type="default" 
              icon={<FilterOutlined />}
              size="large"
              onClick={() => { setKeyword(''); setSelectedIndustry(undefined); setPage(1); }}
            >
              重置
            </Button>
          </div>
        </Space>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spin size="large" /></div>
      ) : data?.data?.items?.length === 0 ? (
        <Card><Empty description="暂无符合条件的导师" /></Card>
      ) : (
        <>
          <List
            grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4 }}
            dataSource={data?.data?.items || []}
            renderItem={(mentor: any) => (
              <List.Item>
                <Card 
                  hoverable 
                  className="h-full"
                  onClick={() => navigate(`/mentors/${mentor.id}`)}
                  styles={{ body: { padding: 16 } }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar size={48} src={mentor.user.avatar_url}>
                      {mentor.user.name?.[0]}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{mentor.user.name}</div>
                      <div className="text-gray-500 text-sm truncate">{mentor.current_position}</div>
                    </div>
                  </div>
                  <div className="text-gray-600 text-sm mb-2">{mentor.current_company}</div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-yellow-500">★</span>
                    <span className="text-sm">{mentor.average_rating?.toFixed(1) || '暂无评分'}</span>
                    <span className="text-gray-400 text-sm">· {mentor.total_meetings}次咨询</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {renderTags(mentor.industry_tags || [])}
                  </div>
                </Card>
              </List.Item>
            )}
          />
          
          <div className="flex justify-center mt-6">
            <Pagination
              current={page}
              pageSize={pageSize}
              total={data?.data?.total || 0}
              onChange={setPage}
              showSizeChanger={false}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default MentorList;
