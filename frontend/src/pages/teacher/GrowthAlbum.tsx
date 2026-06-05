import { useState, useEffect, useCallback } from 'react';
import { Row, Col, Card, Upload, Button, Select, Empty, Image, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { Child, DailyRecord } from '@/types';
import { getChildren, getClasses } from '@/api/children';
import { getDailyRecords, uploadPhoto } from '@/api/records';

export default function GrowthAlbum() {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<number | undefined>();
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getChildren({ is_active: true })
      .then((res) => setChildren(res.results))
      .catch(() => message.error('获取儿童列表失败'));
  }, []);

  const fetchRecords = useCallback(async () => {
    if (!selectedChild) {
      setRecords([]);
      return;
    }
    setLoading(true);
    try {
      const res = await getDailyRecords({ child: selectedChild, page_size: 50 });
      setRecords(res.results);
    } catch {
      message.error('获取记录失败');
    }
    setLoading(false);
  }, [selectedChild]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const allPhotos = records.flatMap((r) =>
    r.photos.map((p) => ({
      ...p,
      child_name: r.child_name,
      date: r.date,
    })),
  );

  const handleUpload = async (file: File) => {
    if (!selectedChild) {
      message.warning('请先选择儿童');
      return false;
    }
    const today = new Date().toISOString().slice(0, 10);
    try {
      const recordsRes = await getDailyRecords({ child: selectedChild, date: today });
      let recordId: number;
      if (recordsRes.results.length > 0) {
        recordId = recordsRes.results[0].id;
      } else {
        message.warning('请先为该儿童创建今日记录');
        return false;
      }
      const formData = new FormData();
      formData.append('image', file);
      formData.append('record', String(recordId));
      await uploadPhoto(formData);
      message.success('照片上传成功');
      fetchRecords();
    } catch {
      message.error('照片上传失败');
    }
    return false;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>成长相册</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <Select
            placeholder="选择儿童"
            style={{ width: 200 }}
            value={selectedChild}
            onChange={setSelectedChild}
            showSearch
            optionFilterProp="label"
            options={children.map((c) => ({ value: c.id, label: c.name }))}
          />
          <Upload
            beforeUpload={(file) => {
              handleUpload(file as unknown as File);
              return false;
            }}
            showUploadList={false}
            accept="image/*"
          >
            <Button type="primary" icon={<PlusOutlined />} disabled={!selectedChild}>
              上传照片
            </Button>
          </Upload>
        </div>
      </div>

      {allPhotos.length === 0 ? (
        <Empty description={selectedChild ? '暂无照片，请上传幼儿成长照片' : '请先选择儿童查看照片'} />
      ) : (
        <Row gutter={[16, 16]}>
          {allPhotos.map((photo) => (
            <Col key={photo.id} xs={12} sm={8} md={6} lg={4}>
              <Card
                size="small"
                cover={
                  <Image
                    alt={photo.caption || '成长照片'}
                    src={photo.image}
                    style={{ height: 160, objectFit: 'cover' }}
                    fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjY2NjIiBmb250LXNpemU9IjE0Ij7ml6DnvKnnlaXlm748L3RleHQ+PC9zdmc+"
                  />
                }
              >
                <Card.Meta
                  description={
                    <div>
                      <div style={{ fontSize: 12, color: '#999' }}>{photo.child_name} · {photo.date}</div>
                      {photo.caption && <div style={{ fontSize: 12 }}>{photo.caption}</div>}
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}
