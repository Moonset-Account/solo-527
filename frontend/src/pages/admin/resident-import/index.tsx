import { useState } from 'react'
import { Card, Upload, Button, Space, Alert, message, Progress } from 'antd'
import {
  UploadOutlined,
  DownloadOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { importResidents } from '@/api'
import type { UploadFile, UploadProps } from 'antd'
import { getUserInfo } from '@/utils/auth'

const ResidentImport = () => {
  const navigate = useNavigate()
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<{ success: number; fail: number; errors?: string[] } | null>(null)

  const userInfo = getUserInfo()
  const gridId = userInfo?.gridId

  const handleDownloadTemplate = () => {
    const headers = '姓名,身份证号,手机号,地址,户别,标签,备注'
    const blob = new Blob(['\ufeff' + headers], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = '居民导入模板.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    message.success('模板下载成功')
  }

  const props: UploadProps = {
    fileList,
    accept: '.csv',
    beforeUpload: (file) => {
      const isCsv = /\.csv$/i.test(file.name)
      if (!isCsv) {
        message.error('只支持上传 CSV 文件！')
        return false
      }
      const isLt10M = file.size / 1024 / 1024 < 10
      if (!isLt10M) {
        message.error('文件大小不能超过 10MB！')
        return false
      }
      setFileList([file])
      setResult(null)
      return false
    },
    onRemove: () => {
      setFileList([])
      setResult(null)
    }
  }

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.warning('请先选择要上传的文件')
      return
    }
    setUploading(true)
    setProgress(0)
    setResult(null)

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(timer)
          return 90
        }
        return prev + 10
      })
    }, 200)

    try {
      const res = await importResidents(fileList[0].originFileObj as File, gridId)
      clearInterval(timer)
      setProgress(100)
      setResult({
        success: res.successCount || 0,
        fail: res.failCount || 0,
        errors: res.errors
      })
      message.success('导入完成')
    } catch {
      clearInterval(timer)
      setResult({ success: 0, fail: 1, errors: ['文件格式错误'] })
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card
      title={
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            返回
          </Button>
          <span>居民信息批量导入</span>
        </Space>
      }
    >
      <Alert
        message="导入说明"
        description={
          <div>
            <p>1. 请先下载导入模板，按模板格式填写居民信息</p>
            <p>2. 支持 .xlsx、.xls、.csv 格式，文件大小不超过 10MB</p>
            <p>3. 必填字段：姓名、身份证号、手机号、地址、户别、标签、备注</p>
          </div>
        }
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Space style={{ marginBottom: 24 }}>
        <Button icon={<DownloadOutlined />} onClick={handleDownloadTemplate}>
          下载导入模板
        </Button>
      </Space>

      <Upload.Dragger {...props} style={{ marginBottom: 24 }}>
        <p className="ant-upload-drag-icon">
          <UploadOutlined />
        </p>
        <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
        <p className="ant-upload-hint">仅支持 CSV 文件格式（UTF-8 编码）</p>
      </Upload.Dragger>

      {uploading && (
        <Progress percent={progress} status="active" style={{ marginBottom: 16 }} />
      )}

      {result && (
        <Alert
          type={result.fail > 0 ? 'warning' : 'success'}
          showIcon
          message="导入结果"
          description={
            <div>
              <p>成功导入：<strong style={{ color: '#52c41a' }}>{result.success}</strong> 条</p>
              <p>导入失败：<strong style={{ color: '#ff4d4f' }}>{result.fail}</strong> 条</p>
              {result.errors && result.errors.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <p>错误详情：</p>
                  <ul>
                    {result.errors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          }
          style={{ marginBottom: 24 }}
        />
      )}

      <Space>
        <Button
          type="primary"
          icon={<UploadOutlined />}
          loading={uploading}
          onClick={handleUpload}
          disabled={fileList.length === 0}
        >
          开始导入
        </Button>
        <Button
          onClick={() => {
            setFileList([])
            setResult(null)
          }}
        >
          重置
        </Button>
      </Space>
    </Card>
  )
}

export default ResidentImport
