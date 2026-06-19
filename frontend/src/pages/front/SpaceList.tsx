import { useState, useEffect } from 'react';
import { Card, Row, Col, Input, Select, Button, Tag, Space as AntSpace, Pagination, message, Empty } from 'antd';
import { SearchOutlined, EnvironmentOutlined, TeamOutlined, DollarOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { spaceApi } from '../../services/api';
import { spaceStatusLabels, spaceStatusColors, spaceTypeLabels } from '../../utils/enums';
import { SpaceType, SpaceStatus } from '../../types';
import type { Space as SpaceEntity } from '../../types';

const { Search } = Input;

function SpaceList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<SpaceEntity[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(9);
  const [keyword, setKeyword] = useState('');
  const [type, setType] = useState<SpaceType | undefined>();
  const [status, setStatus] = useState<SpaceStatus | undefined>(SpaceStatus.Available);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await spaceApi.list({
        page,
        pageSize,
        keyword,
        type,
        status,
      });
      if (res.success && res.data) {
        setList(res.data.items);
        setTotal(res.data.totalCount);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, type, status]);

  const handleSearch = () => {
    setPage(1);
    fetchData();
  };

  return (
    <div>
      <Card style={{ marginBottom: 24 }}>
        <AntSpace size="middle" wrap>
          <Search
            placeholder="搜索房源名称、地址"
            prefix={<SearchOutlined />}
            allowClear
            style={{ width: 300 }}
            onSearch={handleSearch}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <Select
            placeholder="房源类型"
            allowClear
            style={{ width: 160 }}
            value={type}
            onChange={(v) => { setType(v); setPage(1); }}
            options={Object.entries(spaceTypeLabels).map(([k, v]) => ({ value: Number(k), label: v }))}
          />
          <Select
            placeholder="房源状态"
            allowClear
            style={{ width: 140 }}
            value={status}
            onChange={(v) => { setStatus(v); setPage(1); }}
            options={Object.entries(spaceStatusLabels).map(([k, v]) => ({ value: Number(k), label: v }))}
          />
          <Button type="primary" onClick={handleSearch}>
            查询
          </Button>
        </AntSpace>
      </Card>

      {list.length === 0 && !loading ? (
        <Empty description="暂无房源" />
      ) : (
        <>
          <Row gutter={[24, 24]}>
            {list.map((space) => (
              <Col xs={24} sm={12} md={8} key={space.id}>
                <Card
                  hoverable
                  onClick={() => navigate(`/spaces/${space.id}`)}
                  cover={
                    <div style={{
                      height: 160,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: 48,
                    }}>
                      🏢
                    </div>
                  }
                >
                  <Card.Meta
                    title={
                      <AntSpace>
                        <span>{space.name}</span>
                        <Tag color={spaceStatusColors[space.status]}>
                          {spaceStatusLabels[space.status]}
                        </Tag>
                      </AntSpace>
                    }
                    description={
                      <div style={{ marginTop: 8 }}>
                        <p style={{ margin: '4px 0' }}>
                          <EnvironmentOutlined /> {space.address}
                        </p>
                        <p style={{ margin: '4px 0' }}>
                          <TeamOutlined /> 容纳 {space.capacity} 人 · {space.area}㎡
                        </p>
                        {space.prices.length > 0 && (
                          <p style={{ margin: '4px 0', color: '#f5222d', fontWeight: 'bold' }}>
                            <DollarOutlined /> ¥{space.prices[0].unitPrice}/{space.prices[0].unit}起
                          </p>
                        )}
                        <Tag>{spaceTypeLabels[space.type]}</Tag>
                      </div>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <Pagination
              current={page}
              pageSize={pageSize}
              total={total}
              onChange={setPage}
              showSizeChanger={false}
            />
          </div>
        </>
      )}
    </div>
  );
}

export default SpaceList;
