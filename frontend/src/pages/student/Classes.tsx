import { useEffect, useState } from 'react';
import { Table, Card, Tag } from 'antd';
import { api } from '../../api';
import { ClassDto } from '../../types';

export default function StudentClasses() {
  const [data, setData] = useState<ClassDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.classes.my().then((res: any) => {
      setData(res);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const columns = [
    { title: '班级名称', dataIndex: 'name', key: 'name' },
    { title: '课程', dataIndex: 'courseName', key: 'courseName' },
    { title: '授课老师', dataIndex: 'teacherName', key: 'teacherName' },
    {
      title: '人数',
      key: 'count',
      render: (_: any, r: ClassDto) => `${r.studentCount}/${r.maxStudents}`
    },
    {
      title: '开课时间',
      key: 'date',
      render: (_: any, r: ClassDto) =>
        `${new Date(r.startDate).toLocaleDateString()} ~ ${new Date(r.endDate).toLocaleDateString()}`
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'status',
      render: (v: boolean) => (v ? <Tag color="green">进行中</Tag> : <Tag color="gray">已结束</Tag>)
    }
  ];

  return (
    <div>
      <div className="page-title">我的班级</div>
      <Card className="card-shadow">
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={data}
          pagination={false}
        />
      </Card>
    </div>
  );
}
