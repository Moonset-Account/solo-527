import { Alert, Button, Space, Typography, Collapse, Tag, Tooltip } from 'antd'
import {
  InfoCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  ReloadOutlined,
  QuestionCircleOutlined,
  CustomerServiceOutlined
} from '@ant-design/icons'
import type { ErrorDetails } from '@/types'

const { Text, Paragraph } = Typography
const { Panel } = Collapse

interface ErrorAlertProps {
  error?: ErrorDetails
  type?: 'error' | 'warning' | 'info' | 'success'
  showIcon?: boolean
  showNextStep?: boolean
  showDetails?: boolean
  closable?: boolean
  onClose?: () => void
  onRetry?: () => void
  style?: React.CSSProperties
}

export default function ErrorAlert({
  error,
  type = 'error',
  showIcon = true,
  showNextStep = true,
  showDetails = true,
  closable = false,
  onClose,
  onRetry,
  style
}: ErrorAlertProps) {
  if (!error) return null

  const iconMap = {
    error: <CloseCircleOutlined />,
    warning: <WarningOutlined />,
    info: <InfoCircleOutlined />,
    success: <CheckCircleOutlined />
  }

  return (
    <Alert
      message={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 500 }}>{error.errorMessage}</span>
          <Tag color="default" style={{ fontSize: 12 }}>
            错误码: {error.errorCode}
          </Tag>
        </div>
      }
      description={
        <div style={{ marginTop: 8 }}>
          {showNextStep && error.nextStep && (
            <div
              className="error-next-step"
              style={{
                marginTop: 8,
                padding: '8px 12px',
                background: '#fff7e6',
                borderRadius: 4,
                borderLeft: '3px solid #faad14',
                fontSize: 13,
                color: '#d46b08'
              }}
            >
              <div style={{ fontWeight: 500, marginBottom: 4 }}>
                <QuestionCircleOutlined style={{ marginRight: 4 }} />
                下一步操作
              </div>
              <div>{error.nextStep}</div>
            </div>
          )}

          {showDetails && (error.detailedDescription || error.supportUrl || error.additionalInfo) && (
            <Collapse
              ghost
              size="small"
              style={{ marginTop: 8 }}
              items={[{
                key: '1',
                label: <span style={{ fontSize: 12 }}>查看详细信息</span>,
                children: (
                  <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.65)' }}>
                    {error.detailedDescription && (
                      <Paragraph style={{ marginBottom: 8, fontSize: 12 }}>
                        {error.detailedDescription}
                      </Paragraph>
                    )}
                    {error.supportUrl && (
                      <div style={{ marginBottom: 8 }}>
                        <Text type="secondary">帮助文档：</Text>
                        <a href={error.supportUrl} target="_blank" rel="noreferrer">
                          {error.supportUrl}
                        </a>
                      </div>
                    )}
                    {error.additionalInfo && Object.keys(error.additionalInfo).length > 0 && (
                      <div>
                        <Text type="secondary">附加信息：</Text>
                        <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                          {Object.entries(error.additionalInfo).map(([key, value]) => (
                            <li key={key}>
                              {key}: {String(value)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )
              }]}
            />
          )}

          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            {onRetry && (
              <Button
                size="small"
                icon={<ReloadOutlined />}
                onClick={onRetry}
              >
                重试
              </Button>
            )}
            {error.supportUrl && (
              <Button
                size="small"
                icon={<InfoCircleOutlined />}
                onClick={() => window.open(error.supportUrl, '_blank')}
              >
                查看帮助
              </Button>
            )}
            <Button
              size="small"
              icon={<CustomerServiceOutlined />}
              type="link"
            >
              联系客服
            </Button>
          </div>
        </div>
      }
      type={type}
      showIcon={showIcon}
      icon={iconMap[type]}
      closable={closable}
      onClose={onClose}
      style={style}
    />
  )
}

export function showErrorNotification(error: ErrorDetails) {
  // 可以配合notification使用
}

export function getErrorMessage(errorCode: string): ErrorDetails {
  const errorMap: Record<string, ErrorDetails> = {
    'SESSION_NOT_FOUND': {
      errorCode: 'SESSION_NOT_FOUND',
      errorMessage: '会话不存在或已被删除',
      nextStep: '请检查会话ID是否正确，或返回列表页重新选择会话。如果确认会话ID正确，可能是数据已被删除，请联系管理员恢复。',
      detailedDescription: '请求的会话ID在系统中不存在，可能是会话已被删除或ID输入错误。',
      supportUrl: '/help/sessions'
    },
    'INSPECTION_NOT_FOUND': {
      errorCode: 'INSPECTION_NOT_FOUND',
      errorMessage: '质检记录不存在',
      nextStep: '请检查质检记录ID是否正确，或返回质检列表重新选择。如需新建质检，请在会话详情页点击"开始质检"。',
      detailedDescription: '请求的质检记录ID在系统中不存在。',
      supportUrl: '/help/inspections'
    },
    'TICKET_NOT_FOUND': {
      errorCode: 'TICKET_NOT_FOUND',
      errorMessage: '工单不存在或已被删除',
      nextStep: '请检查工单ID是否正确，或返回工单列表重新选择。',
      detailedDescription: '请求的工单ID在系统中不存在。',
      supportUrl: '/help/tickets'
    },
    'KNOWLEDGE_NOT_FOUND': {
      errorCode: 'KNOWLEDGE_NOT_FOUND',
      errorMessage: '知识库条目不存在',
      nextStep: '请检查知识库ID是否正确，或返回知识库列表重新选择。',
      detailedDescription: '请求的知识库条目ID在系统中不存在。',
      supportUrl: '/help/knowledge'
    },
    'UNAUTHORIZED': {
      errorCode: 'UNAUTHORIZED',
      errorMessage: '登录已过期，请重新登录',
      nextStep: '请点击登录按钮重新登录系统。如果频繁出现此问题，请检查是否在多个设备同时登录。',
      detailedDescription: '当前用户的登录状态已失效，需要重新认证。',
      supportUrl: '/help/login'
    },
    'FORBIDDEN': {
      errorCode: 'FORBIDDEN',
      errorMessage: '您没有权限访问该资源',
      nextStep: '请联系您的主管或系统管理员申请相应的访问权限。权限申请通常在1-2个工作日内处理。',
      detailedDescription: '当前用户没有足够的权限执行该操作或访问该资源。',
      supportUrl: '/help/permissions'
    },
    'NETWORK_ERROR': {
      errorCode: 'NETWORK_ERROR',
      errorMessage: '网络连接失败',
      nextStep: '请检查您的网络连接是否正常，然后点击重试。如果使用的是公司内网，请确认VPN连接正常。',
      detailedDescription: '无法连接到服务器，可能是网络问题或服务器维护中。',
      supportUrl: '/help/network'
    },
    'SERVER_ERROR': {
      errorCode: 'SERVER_ERROR',
      errorMessage: '服务器内部错误',
      nextStep: '请稍后重试操作。如果问题持续存在，请联系技术支持并提供错误时间和操作描述，我们会尽快处理。',
      detailedDescription: '服务器在处理请求时发生了未预期的错误。',
      supportUrl: '/support/ticket'
    },
    'INVALID_PARAMS': {
      errorCode: 'INVALID_PARAMS',
      errorMessage: '请求参数无效',
      nextStep: '请检查输入参数是否符合要求，参考API文档修正参数后重试。必填项请确保填写完整。',
      detailedDescription: '请求参数验证失败，缺少必要参数或参数格式不正确。',
      supportUrl: '/help/api-docs'
    },
    'RELATED_RESOURCE_NOT_FOUND': {
      errorCode: 'RELATED_RESOURCE_NOT_FOUND',
      errorMessage: '关联资源不存在',
      nextStep: '请检查相关资源是否存在，选择有效的关联对象后重试。',
      detailedDescription: '创建或更新时关联的资源在系统中不存在。'
    },
    'TEMPLATE_NOT_FOUND': {
      errorCode: 'TEMPLATE_NOT_FOUND',
      errorMessage: '质检模板不存在或已被禁用',
      nextStep: '请选择一个有效的质检模板，或联系管理员创建新模板。',
      detailedDescription: '请求的质检模板ID在系统中不存在或已被禁用。'
    },
    'NOT_FOUND': {
      errorCode: 'NOT_FOUND',
      errorMessage: '请求的资源不存在',
      nextStep: '请检查您访问的链接是否正确，或返回首页重新操作。',
      detailedDescription: '请求访问的资源在系统中不存在。'
    },
    'INVALID_OPERATION': {
      errorCode: 'INVALID_OPERATION',
      errorMessage: '当前状态下无法执行该操作',
      nextStep: '请确认当前状态是否允许执行该操作，按正确的业务流程操作。如有疑问，请查看操作手册。',
      detailedDescription: '在当前状态下执行该操作不符合业务流程规范。'
    }
  }

  return errorMap[errorCode] || {
    errorCode: 'UNKNOWN_ERROR',
    errorMessage: '发生未知错误',
    nextStep: '请稍后重试，如果问题持续存在，请联系技术支持。',
    detailedDescription: '系统遇到了未预期的错误。'
  }
}
