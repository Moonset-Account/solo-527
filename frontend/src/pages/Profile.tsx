import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Card, Form, Input, Select, Button, Space, Tabs, Avatar,
  message, Upload, Tag, Divider
} from 'antd';
import {
  UserOutlined, SaveOutlined, UploadOutlined,
  EditOutlined, ClockCircleOutlined, CheckCircleOutlined
} from '@ant-design/icons';
import { authApi, uploadApi, industryApi } from '../api';
import { useAuthStore } from '../store/authStore';

const { TextArea } = Input;
const { Option } = Select;

const reviewStatusConfig: Record<string, { color: string; text: string }> = {
  pending: { color: 'orange', text: '审核中' },
  approved: { color: 'green', text: '已通过' },
  rejected: { color: 'red', text: '已拒绝' },
};

const Profile = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [editing, setEditing] = useState(false);

  const { data: profile, isLoading } = useQuery(
    'profile',
    () => authApi.getProfile(),
    { enabled: !!user }
  );

  const { data: industries } = useQuery(
    'industries',
    () => industryApi.list(),
    { enabled: !!user }
  );

  const updateMutation = useMutation(
    (values: any) => authApi.updateProfile(values),
    {
      onSuccess: () => {
        message.success('资料更新成功');
        setEditing(false);
        queryClient.invalidateQueries('profile');
      },
      onError: (err: any) => {
        message.error(err.response?.data?.error || '更新失败');
      }
    }
  );

  const handleSubmit = (values: any) => {
    updateMutation.mutate(values);
  };

  const handleUpload = async (options: any) => {
    const { file, onSuccess, onError } = options;
    try {
      const res = await uploadApi.uploadFile(file, 'resume');
      onSuccess(res.data);
    } catch (err) {
      onError(err);
      message.error('上传失败');
    }
  };

  if (isLoading) return <div className="flex justify-center py-20">加载中...</div>;

  const profileData = profile?.data;
  const isStudent = user?.role === 'student';
  const isMentor = user?.role === 'mentor';
  const reviewStatus = profileData?.student?.review_status || profileData?.mentor?.review_status;
  const statusConfig = reviewStatus ? reviewStatusConfig[reviewStatus] : null;

  const basicInfoTab: any = {
    key: 'basic',
    label: '基本信息',
    children: (
      <Card size="small">
        <div className="flex items-start gap-6 mb-6">
          <Avatar size={80} icon={<UserOutlined />} src={profileData?.avatar_url} />
          <div className="flex-1">
            <h2 className="text-xl font-medium mb-1">{profileData?.name}</h2>
            <p className="text-gray-500 mb-2">{profileData?.email}</p>
            {profileData?.phone && <p className="text-gray-500">{profileData?.phone}</p>}
            {statusConfig && (
              <Tag color={statusConfig.color} icon={<ClockCircleOutlined />}>
                {statusConfig.text}
              </Tag>
            )}
          </div>
          <Button
            type={editing ? 'default' : 'primary'}
            icon={editing ? <CheckCircleOutlined /> : <EditOutlined />}
            onClick={() => {
              if (editing) {
                form.submit();
              } else {
                setEditing(true);
                form.setFieldsValue({
                  name: profileData?.name,
                  phone: profileData?.phone,
                  ...(isStudent && profileData?.student ? {
                    school: profileData.student.school,
                    department: profileData.student.department,
                    major: profileData.student.major,
                    grade: profileData.student.grade,
                    target_industries: profileData.student.target_industries,
                    target_positions: profileData.student.target_positions,
                    bio: profileData.student.bio,
                  } : {}),
                  ...(isMentor && profileData?.mentor ? {
                    current_company: profileData.mentor.current_company,
                    current_position: profileData.mentor.current_position,
                    years_of_experience: profileData.mentor.years_of_experience,
                    industry_tags: profileData.mentor.industry_tags,
                    expertise_areas: profileData.mentor.expertise_areas,
                    bio: profileData.mentor.bio,
                  } : {}),
                });
              }
            }}
          >
            {editing ? '保存' : '编辑资料'}
          </Button>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          disabled={!editing}
        >
          <Divider orientation="left">账户信息</Divider>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item name="name" label="姓名" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="phone" label="手机号">
              <Input />
            </Form.Item>
          </div>

          {isStudent && (
            <>
              <Divider orientation="left">学生信息</Divider>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Form.Item name="school" label="学校">
                  <Input />
                </Form.Item>
                <Form.Item name="department" label="院系">
                  <Input />
                </Form.Item>
                <Form.Item name="major" label="专业">
                  <Input />
                </Form.Item>
                <Form.Item name="grade" label="年级">
                  <Input />
                </Form.Item>
                <Form.Item name="target_industries" label="目标行业" className="md:col-span-2">
                  <Select mode="tags" placeholder="选择或输入目标行业">
                    {industries?.data?.map((ind: any) => (
                      <Option key={ind.id} value={ind.name}>{ind.name}</Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item name="target_positions" label="目标岗位" className="md:col-span-2">
                  <Select mode="tags" placeholder="选择或输入目标岗位" />
                </Form.Item>
              </div>
            </>
          )}

          {isMentor && (
            <>
              <Divider orientation="left">导师信息</Divider>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Form.Item name="current_company" label="当前公司">
                  <Input />
                </Form.Item>
                <Form.Item name="current_position" label="当前职位">
                  <Input />
                </Form.Item>
                <Form.Item name="years_of_experience" label="工作年限">
                  <Input type="number" />
                </Form.Item>
                <Form.Item name="industry_tags" label="行业标签" className="md:col-span-2">
                  <Select mode="tags" placeholder="选择或输入行业标签">
                    {industries?.data?.map((ind: any) => (
                      <Option key={ind.id} value={ind.name}>{ind.name}</Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item name="expertise_areas" label="擅长领域" className="md:col-span-2">
                  <Select mode="tags" placeholder="选择或输入擅长领域" />
                </Form.Item>
              </div>
            </>
          )}

          <Form.Item name="bio" label="个人简介">
            <TextArea rows={4} placeholder="介绍一下自己..." />
          </Form.Item>

          {editing && (
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={updateMutation.isLoading} icon={<SaveOutlined />}>
                  保存修改
                </Button>
                <Button onClick={() => setEditing(false)}>取消</Button>
              </Space>
            </Form.Item>
          )}
        </Form>
      </Card>
    ),
  };

  const resumeTab = isStudent ? {
    key: 'resume',
    label: '简历附件',
    children: (
      <Card size="small" title="我的简历">
        <Space direction="vertical" className="w-full" size="middle">
          <Upload
            customRequest={handleUpload}
            showUploadList={true}
            accept=".pdf,.doc,.docx"
            maxCount={3}
          >
            <Button icon={<UploadOutlined />}>上传简历</Button>
          </Upload>
          <p className="text-gray-400 text-sm">支持 PDF、Word 格式，最多上传 3 份简历</p>
        </Space>
      </Card>
    ),
  } : null;

  const tabItems = [basicInfoTab, resumeTab].filter(Boolean) as any;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">个人中心</h1>
      <Tabs items={tabItems} />
    </div>
  );
};

export default Profile;
