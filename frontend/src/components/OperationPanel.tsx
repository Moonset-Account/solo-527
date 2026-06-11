import React, { useEffect, useState } from 'react';
import {
  Drawer,
  Tabs,
  List,
  Upload,
  Button,
  Input,
  Empty,
  Tag,
  Descriptions,
  Timeline,
  Divider,
  Form,
  message,
} from 'antd';
import {
  PaperClipOutlined,
  FormOutlined,
  HistoryOutlined,
  SwapOutlined,
  UploadOutlined,
  SendOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { panelApi } from '@/api';
import { STATUS_MAP } from '@/utils/constants';

const { TextArea } = Input;

interface OperationPanelProps {
  open: boolean;
  onClose: () => void;
  bizType: string;
  bizId: number | null;
  title: string;
}

const OperationPanel: React.FC<OperationPanelProps> = ({ open, onClose, bizType, bizId, title }) => {
  const [activeTab, setActiveTab] = useState('attachments');
  const [attachments, setAttachments] = useState<any[]>([]);
  const [remarks, setRemarks] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [statusFlow, setStatusFlow] = useState<any[]>([]);
  const [remarkText, setRemarkText] = useState('');
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    if (!bizId) return;
    try {
      setLoading(true);
      const [atts, rems, hist, flow] = await Promise.all([
        panelApi.attachments(bizType, bizId),
        panelApi.remarks(bizType, bizId),
        panelApi.history(bizType, bizId),
        panelApi.statusFlow(bizType, bizId),
      ]);
      setAttachments(atts || []);
      setRemarks(rems || []);
      setHistory(hist || []);
      setStatusFlow(flow || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && bizId) {
      loadData();
    }
  }, [open, bizId, bizType]);

  const handleAddRemark = async () => {
    if (!remarkText.trim() || !bizId) return;
    try {
      await panelApi.addRemark(bizType, bizId, remarkText);
      setRemarkText('');
      message.success('备注添加成功');
      loadData();
    } catch (e) {
      // error handled globally
    }
  };

  const handleUpload = async (file: File) => {
    if (!bizId) return;
    try {
      await panelApi.addAttachment(bizType, bizId, {
        fileName: file.name,
        fileUrl: URL.createObjectURL(file),
        fileSize: file.size,
        fileType: file.type,
      });
      message.success('附件上传成功');
      loadData();
    } catch (e) {
      // error handled
    }
    return false;
  };

  const handleDeleteAttachment = async (id: number) => {
    try {
      await panelApi.deleteAttachment(id);
      message.success('附件已删除');
      loadData();
    } catch (e) {
      // error handled
    }
  };

  return (
    <Drawer
      title={`操作面板 - ${title}`}
      width={640}
      open={open}
      onClose={onClose}
      loading={loading}
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'attachments',
            label: (
              <span>
                <PaperClipOutlined /> 附件
              </span>
            ),
            children: (
              <>
                <div style={{ marginBottom: 16 }}>
                  <Upload beforeUpload={handleUpload} showUploadList={false}>
                    <Button type="primary" icon={<UploadOutlined />}>
                      上传附件
                    </Button>
                  </Upload>
                </div>
                {attachments.length === 0 ? (
                  <Empty description="暂无附件" />
                ) : (
                  <List
                    dataSource={attachments}
                    renderItem={(item: any) => (
                      <List.Item
                        key={item.id}
                        actions={[
                          <Button type="link" danger onClick={() => handleDeleteAttachment(item.id)}>
                            删除
                          </Button>,
                        ]}
                      >
                        <List.Item.Meta
                          title={<a href={item.fileUrl}>{item.fileName}</a>}
                          description={`${((item.fileSize || 0) / 1024).toFixed(2)} KB · ${dayjs(
                            item.createdAt
                          ).format('YYYY-MM-DD HH:mm')}`}
                        />
                      </List.Item>
                    )}
                  />
                )}
              </>
            ),
          },
          {
            key: 'remarks',
            label: (
              <span>
                <FormOutlined /> 备注
              </span>
            ),
            children: (
              <>
                <div style={{ marginBottom: 16 }}>
                  <TextArea
                    rows={3}
                    value={remarkText}
                    onChange={(e) => setRemarkText(e.target.value)}
                    placeholder="添加备注..."
                  />
                  <div style={{ marginTop: 8, textAlign: 'right' }}>
                    <Button type="primary" icon={<SendOutlined />} onClick={handleAddRemark}>
                      添加
                    </Button>
                  </div>
                </div>
                <Divider />
                {remarks.length === 0 ? (
                  <Empty description="暂无备注" />
                ) : (
                  <List
                    dataSource={remarks}
                    renderItem={(item: any) => (
                      <List.Item key={item.id}>
                        <List.Item.Meta
                          title={dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')}
                          description={item.content}
                        />
                      </List.Item>
                    )}
                  />
                )}
              </>
            ),
          },
          {
            key: 'history',
            label: (
              <span>
                <HistoryOutlined /> 修改历史
              </span>
            ),
            children:
              history.length === 0 ? (
                <Empty description="暂无修改记录" />
              ) : (
                <Descriptions column={1} size="small" bordered>
                  {history.map((item: any) => (
                    <Descriptions.Item
                      key={item.id}
                      label={`${item.fieldName || '字段'} · ${dayjs(item.createdAt).format(
                        'YYYY-MM-DD HH:mm'
                      )}`}
                    >
                      {item.oldValue && (
                        <>
                          <Tag color="default">旧值: {item.oldValue}</Tag>
                        </>
                      )}
                      <Tag color="blue">新值: {item.newValue}</Tag>
                      {item.changeRemark && (
                        <div style={{ marginTop: 4, color: '#999' }}>{item.changeRemark}</div>
                      )}
                    </Descriptions.Item>
                  ))}
                </Descriptions>
              ),
          },
          {
            key: 'status-flow',
            label: (
              <span>
                <SwapOutlined /> 状态流转
              </span>
            ),
            children:
              statusFlow.length === 0 ? (
                <Empty description="暂无状态变更" />
              ) : (
                <Timeline
                  items={statusFlow.map((item: any) => ({
                    color: 'blue',
                    children: (
                      <div>
                        <div>
                          {item.oldStatus && (
                            <Tag color={STATUS_MAP[item.oldStatus]?.color || 'default'}>
                              {STATUS_MAP[item.oldStatus]?.text || item.oldStatus}
                            </Tag>
                          )}
                          {item.oldStatus && ' → '}
                          <Tag color={STATUS_MAP[item.newStatus]?.color || 'blue'}>
                            {STATUS_MAP[item.newStatus]?.text || item.newStatus}
                          </Tag>
                        </div>
                        <div style={{ marginTop: 4, color: '#999', fontSize: 12 }}>
                          {item.operatorName || '未知操作人'} · {dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')}
                        </div>
                        {item.remark && (
                          <div style={{ marginTop: 4 }}>{item.remark}</div>
                        )}
                      </div>
                    ),
                  }))}
                />
              ),
          },
        ]}
      />
    </Drawer>
  );
};

export default OperationPanel;
