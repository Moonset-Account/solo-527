import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, message, Select, Radio, Divider } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { authApi, industryApi } from '../api';
import { useQuery } from 'react-query';

const { Option } = Select;
const { TextArea } = Input;

const Register = () => {
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<'student' | 'mentor'>('student');
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const { data: industries } = useQuery('industries', () => industryApi.list());

  const handleRegister = async (values: any) => {
    setLoading(true);
    try {
      await authApi.register(values);
      message.success('注册成功，请等待管理员审核');
      navigate('/login');
    } catch (error: any) {
      message.error(error.response?.data?.error || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 py-8">
      <Card className="w-full max-w-2xl mx-auto shadow-lg">
        <div className="mb-6">
          <Link to="/login" className="text-gray-500 hover:text-gray-700 flex items-center gap-1">
            <ArrowLeftOutlined /> 返回登录
          </Link>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">校友导师匹配平台</h1>
          <p className="text-gray-500 mt-2">创建账号，连接校友，助力成长</p>
        </div>

        <Form
          form={form}
          onFinish={handleRegister}
          layout="vertical"
          initialValues={{ role: 'student' }}
        >
          <Form.Item name="role" label="我是" rules={[{ required: true }]}>
            <Radio.Group onChange={(e) => setRole(e.target.value)}>
              <Radio.Button value="student">在校学生</Radio.Button>
              <Radio.Button value="mentor">校友导师</Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Divider orientation="left">账户信息</Divider>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
              <Input size="large" placeholder="请输入真实姓名" />
            </Form.Item>
            <Form.Item name="email" label="邮箱" rules={[{ required: true, message: '请输入邮箱' }, { type: 'email' }]}>
              <Input size="large" placeholder="学校/工作邮箱" />
            </Form.Item>
            <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }, { min: 6 }]}>
              <Input.Password size="large" placeholder="至少6位字符" />
            </Form.Item>
            <Form.Item name="phone" label="手机号">
              <Input size="large" placeholder="便于联系（选填）" />
            </Form.Item>
          </div>

          {role === 'student' && (
            <>
              <Divider orientation="left">学生信息</Divider>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Form.Item name="school" label="学校" rules={[{ required: true, message: '请输入学校' }]}>
                  <Input size="large" placeholder="例如：清华大学" />
                </Form.Item>
                <Form.Item name="department" label="院系" rules={[{ required: true, message: '请输入院系' }]}>
                  <Input size="large" placeholder="例如：计算机科学与技术系" />
                </Form.Item>
                <Form.Item name="major" label="专业" rules={[{ required: true, message: '请输入专业' }]}>
                  <Input size="large" placeholder="例如：软件工程" />
                </Form.Item>
                <Form.Item name="grade" label="年级" rules={[{ required: true, message: '请输入年级' }]}>
                  <Input size="large" placeholder="例如：2021级" />
                </Form.Item>
                <Form.Item name="student_id" label="学号" rules={[{ required: true, message: '请输入学号' }]}>
                  <Input size="large" placeholder="请输入学号" />
                </Form.Item>
                <Form.Item name="expected_graduation" label="预计毕业时间">
                  <Input size="large" placeholder="例如：2025年6月" />
                </Form.Item>
              </div>
              <Form.Item name="target_industries" label="目标行业">
                <Select mode="tags" size="large" placeholder="选择或输入目标行业">
                  {industries?.data?.map((ind: any) => (
                    <Option key={ind.id} value={ind.name}>{ind.name}</Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="target_positions" label="目标岗位">
                <Select mode="tags" size="large" placeholder="选择或输入目标岗位" />
              </Form.Item>
            </>
          )}

          {role === 'mentor' && (
            <>
              <Divider orientation="left">导师信息</Divider>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Form.Item name="alumni_id" label="校友编号" rules={[{ required: true, message: '请输入校友编号' }]}>
                  <Input size="large" placeholder="请输入校友编号" />
                </Form.Item>
                <Form.Item name="graduation_year" label="毕业年份" rules={[{ required: true, message: '请输入毕业年份' }]}>
                  <Input type="number" size="large" placeholder="例如：2015" />
                </Form.Item>
                <Form.Item name="school" label="毕业院校" rules={[{ required: true, message: '请输入毕业院校' }]}>
                  <Input size="large" placeholder="例如：清华大学" />
                </Form.Item>
                <Form.Item name="department" label="院系" rules={[{ required: true, message: '请输入院系' }]}>
                  <Input size="large" placeholder="例如：计算机科学与技术系" />
                </Form.Item>
                <Form.Item name="major" label="专业" rules={[{ required: true, message: '请输入专业' }]}>
                  <Input size="large" placeholder="例如：软件工程" />
                </Form.Item>
                <Form.Item name="current_company" label="当前公司" rules={[{ required: true, message: '请输入当前公司' }]}>
                  <Input size="large" placeholder="例如：字节跳动" />
                </Form.Item>
                <Form.Item name="current_position" label="当前职位" rules={[{ required: true, message: '请输入当前职位' }]}>
                  <Input size="large" placeholder="例如：高级产品经理" />
                </Form.Item>
                <Form.Item name="years_of_experience" label="工作年限（年）" rules={[{ required: true, message: '请输入工作年限' }]}>
                  <Input type="number" size="large" placeholder="例如：5" />
                </Form.Item>
              </div>
              <Form.Item name="industry_tags" label="行业标签" rules={[{ required: true, message: '请选择行业标签' }]}>
                <Select mode="tags" size="large" placeholder="选择或输入行业标签">
                  {industries?.data?.map((ind: any) => (
                    <Option key={ind.id} value={ind.name}>{ind.name}</Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="expertise_areas" label="擅长领域">
                <Select mode="tags" size="large" placeholder="选择或输入擅长领域，如求职、考研、创业等" />
              </Form.Item>
            </>
          )}

          <Form.Item name="bio" label="个人简介">
            <TextArea rows={4} placeholder="简单介绍一下自己，让对方更好地了解你..." maxLength={500} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              提交注册
            </Button>
          </Form.Item>
        </Form>

        <div className="text-center mt-4 text-gray-500 text-sm">
          已有账号？<Link to="/login" className="text-blue-500">立即登录</Link>
        </div>
      </Card>
    </div>
  );
};

export default Register;
