import React, { useState } from 'react';
import { Form, Input, Button, Card, Select, Steps, message, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { resumeApi } from '../api/resume';
import { useAuthStore } from '../store/authStore';

const { Step } = Steps;
const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const ResumeSubmit: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [current, setCurrent] = useState(0);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const steps = [
    { title: '基本信息', description: '填写个人基本信息' },
    { title: '教育背景', description: '填写学历和专业信息' },
    { title: '技能经历', description: '填写技能和项目经历' },
    { title: '确认提交', description: '确认信息并提交简历' },
  ];

  const next = () => {
    form.validateFields(getStepFields(current))
      .then(() => {
        setCurrent(current + 1);
      })
      .catch(() => {});
  };

  const prev = () => {
    setCurrent(current - 1);
  };

  const getStepFields = (step: number): string[] => {
    switch (step) {
      case 0:
        return ['candidateName', 'email', 'phone'];
      case 1:
        return ['school', 'major', 'degree', 'graduationYear'];
      case 2:
        return ['skills', 'experience', 'projects', 'positionApplied', 'recruiterCycle'];
      default:
        return [];
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      const res = await resumeApi.submit(values);
      if (res.success) {
        message.success('简历提交成功！');
        navigate('/resume/progress');
      } else {
        message.error(res.message);
      }
    } catch (error: any) {
      message.error(error.message || '提交失败');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (current) {
      case 0:
        return (
          <div>
            <Form.Item
              name="candidateName"
              label="姓名"
              rules={[{ required: true, message: '请输入姓名' }]}
            >
              <Input placeholder="请输入您的姓名" />
            </Form.Item>
            <Form.Item
              name="email"
              label="邮箱"
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入有效的邮箱地址' },
              ]}
            >
              <Input placeholder="请输入您的邮箱" />
            </Form.Item>
            <Form.Item
              name="phone"
              label="手机号"
              rules={[{ required: true, message: '请输入手机号' }]}
            >
              <Input placeholder="请输入您的手机号" />
            </Form.Item>
          </div>
        );
      case 1:
        return (
          <div>
            <Form.Item
              name="school"
              label="毕业院校"
              rules={[{ required: true, message: '请输入毕业院校' }]}
            >
              <Input placeholder="请输入您的毕业院校" />
            </Form.Item>
            <Form.Item
              name="major"
              label="专业"
              rules={[{ required: true, message: '请输入专业' }]}
            >
              <Input placeholder="请输入您的专业" />
            </Form.Item>
            <Form.Item
              name="degree"
              label="学历"
              rules={[{ required: true, message: '请选择学历' }]}
            >
              <Select placeholder="请选择学历">
                <Option value="本科">本科</Option>
                <Option value="硕士">硕士</Option>
                <Option value="博士">博士</Option>
                <Option value="大专">大专</Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="graduationYear"
              label="毕业年份"
              rules={[{ required: true, message: '请输入毕业年份' }]}
            >
              <Input type="number" placeholder="请输入毕业年份" />
            </Form.Item>
          </div>
        );
      case 2:
        return (
          <div>
            <Form.Item
              name="skills"
              label="专业技能"
              rules={[{ required: true, message: '请输入专业技能' }]}
            >
              <TextArea rows={3} placeholder="请描述您的专业技能" />
            </Form.Item>
            <Form.Item name="experience" label="实习/工作经历">
              <TextArea rows={3} placeholder="请描述您的实习或工作经历" />
            </Form.Item>
            <Form.Item name="projects" label="项目经历">
              <TextArea rows={3} placeholder="请描述您的项目经历" />
            </Form.Item>
            <Form.Item
              name="positionApplied"
              label="应聘岗位"
              rules={[{ required: true, message: '请选择应聘岗位' }]}
            >
              <Select placeholder="请选择应聘岗位">
                <Option value="前端开发工程师">前端开发工程师</Option>
                <Option value="后端开发工程师">后端开发工程师</Option>
                <Option value="全栈开发工程师">全栈开发工程师</Option>
                <Option value="测试工程师">测试工程师</Option>
                <Option value="产品经理">产品经理</Option>
                <Option value="UI设计师">UI设计师</Option>
              </Select>
            </Form.Item>
            <Form.Item name="recruiterCycle" label="招聘周期">
              <Select placeholder="请选择招聘周期">
                <Option value="2024秋季校园招聘">2024秋季校园招聘</Option>
                <Option value="2025春季校园招聘">2025春季校园招聘</Option>
              </Select>
            </Form.Item>
          </div>
        );
      case 3:
        return (
          <div>
            <Title level={4}>请确认您的简历信息</Title>
            <div style={{ background: '#f5f5f5', padding: 20, borderRadius: 8 }}>
              <p><Text strong>姓名：</Text>{form.getFieldValue('candidateName')}</p>
              <p><Text strong>邮箱：</Text>{form.getFieldValue('email')}</p>
              <p><Text strong>手机号：</Text>{form.getFieldValue('phone')}</p>
              <p><Text strong>毕业院校：</Text>{form.getFieldValue('school')}</p>
              <p><Text strong>专业：</Text>{form.getFieldValue('major')}</p>
              <p><Text strong>学历：</Text>{form.getFieldValue('degree')}</p>
              <p><Text strong>毕业年份：</Text>{form.getFieldValue('graduationYear')}</p>
              <p><Text strong>专业技能：</Text>{form.getFieldValue('skills')}</p>
              <p><Text strong>应聘岗位：</Text>{form.getFieldValue('positionApplied')}</p>
              <p><Text strong>招聘周期：</Text>{form.getFieldValue('recruiterCycle')}</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={3} style={{ margin: 0 }}>投递简历</Title>
      </div>

      <Card>
        <Steps current={current} items={steps} style={{ marginBottom: 40 }} />
        
        <Form
          form={form}
          layout="vertical"
          initialValues={{ candidateName: user?.name }}
          style={{ maxWidth: 600, margin: '0 auto' }}
        >
          {renderStepContent()}
          
          <div style={{ marginTop: 32, textAlign: 'center' }}>
            {current > 0 && (
              <Button style={{ margin: '0 8px' }} onClick={prev}>
                上一步
              </Button>
            )}
            {current < steps.length - 1 && (
              <Button type="primary" onClick={next}>
                下一步
              </Button>
            )}
            {current === steps.length - 1 && (
              <Button type="primary" onClick={handleSubmit} loading={loading}>
                提交简历
              </Button>
            )}
            {current > 0 && (
              <Button style={{ margin: '0 8px' }} onClick={() => navigate('/dashboard')}>
                取消
              </Button>
            )}
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default ResumeSubmit;
