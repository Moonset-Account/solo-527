'use client';

import { useEffect, useState, useRef } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface Task {
  id: string;
  visitorName: string;
  taskType: string;
  status: string;
  notes?: string;
  createdAt: string;
  meeting: {
    id: string;
    title: string;
    startTime: string;
    room?: {
      name: string;
    };
    host: {
      name: string;
    };
    visitors: Array<{
      id: string;
      name: string;
      status: string;
      phone: string;
    }>;
  };
}

interface TokenValidateResult {
  valid: boolean;
  visitor?: {
    id: string;
    name: string;
    phone: string;
    idCardNumber?: string;
    company?: string;
    status: string;
    meeting: {
      title: string;
      startTime: string;
      room?: {
        name: string;
      };
    };
  };
}

const taskTypeMap: Record<string, string> = {
  VERIFY_ID: '核验证件',
  NOTIFY_ROOM_CHANGE: '通知会议室变更',
  NOTIFY_TIME_CHANGE: '通知时间变更',
  HANDLE_CHECKED_IN_VISITOR: '处理已入场访客',
};

export default function FrontDeskPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [tokenInput, setTokenInput] = useState('');
  const [validatedVisitor, setValidatedVisitor] = useState<TokenValidateResult | null>(null);
  const [idPhoto, setIdPhoto] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {
    try {
      const res = await fetch('/api/front-desk?pending=true');
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleValidateToken() {
    if (!tokenInput.trim()) return;

    try {
      const res = await fetch('/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: tokenInput.trim() }),
      });

      const data = await res.json();
      setValidatedVisitor(data);

      if (data.valid && data.visitor) {
        setCameraActive(true);
        setTimeout(() => startCamera(), 100);
      }
    } catch (error) {
      console.error('Failed to validate token:', error);
      alert('验证失败，请检查二维码');
    }
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Failed to start camera:', error);
      alert('无法启动摄像头，请检查权限设置');
    }
  }

  function capturePhoto() {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setIdPhoto(dataUrl);

        const stream = video.srcObject as MediaStream;
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }
        setCameraActive(false);
      }
    }
  }

  async function handleVerifyAndCheckIn() {
    if (!validatedVisitor?.visitor) return;
    if (!idPhoto) {
      alert('请先拍摄证件照片');
      return;
    }

    try {
      await fetch(`/api/visitors/${validatedVisitor.visitor.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'upload-photo',
          photoBase64: idPhoto,
        }),
      });

      const checkInRes = await fetch(`/api/visitors/${validatedVisitor.visitor.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'checkin' }),
      });

      if (checkInRes.ok) {
        alert('证件核验完成，访客已签到');
        resetForm();
        loadTasks();
      }
    } catch (error) {
      console.error('Failed to verify visitor:', error);
      alert('核验失败');
    }
  }

  function resetForm() {
    setTokenInput('');
    setValidatedVisitor(null);
    setIdPhoto(null);
    setCameraActive(false);
  }

  async function handleCompleteTask(taskId: string) {
    try {
      await fetch('/api/front-desk', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ taskId }),
      });
      loadTasks();
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">前台工作台</h1>
        <p className="text-gray-600 mt-1">访客证件核验与待办任务处理</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">扫码核验</h2>

          {!validatedVisitor ? (
            <div className="space-y-4">
              <div>
                <label className="label">输入或扫描访客二维码 Token</label>
                <textarea
                  className="input min-h-[100px]"
                  placeholder="请扫描访客二维码或手动输入 Token"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                />
              </div>
              <button
                onClick={handleValidateToken}
                className="btn btn-primary w-full"
                disabled={!tokenInput.trim()}
              >
                验证二维码
              </button>
            </div>
          ) : validatedVisitor.valid && validatedVisitor.visitor ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700 font-medium">✓ 二维码验证成功</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">访客姓名</p>
                  <p className="font-medium">{validatedVisitor.visitor.name}</p>
                </div>
                <div>
                  <p className="text-gray-500">手机号</p>
                  <p className="font-medium">{validatedVisitor.visitor.phone}</p>
                </div>
                <div>
                  <p className="text-gray-500">公司</p>
                  <p className="font-medium">{validatedVisitor.visitor.company || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">会议</p>
                  <p className="font-medium">{validatedVisitor.visitor.meeting.title}</p>
                </div>
                <div>
                  <p className="text-gray-500">会议室</p>
                  <p className="font-medium">{validatedVisitor.visitor.meeting.room?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">会议时间</p>
                  <p className="font-medium">
                    {format(new Date(validatedVisitor.visitor.meeting.startTime), 'MM-dd HH:mm', { locale: zhCN })}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="font-medium mb-3">证件拍照</p>
                {cameraActive ? (
                  <div className="space-y-3">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full rounded-lg border bg-black"
                    />
                    <button onClick={capturePhoto} className="btn btn-primary w-full">
                      拍照
                    </button>
                    <canvas ref={canvasRef} className="hidden" />
                  </div>
                ) : idPhoto ? (
                  <div className="space-y-3">
                    <img
                      src={idPhoto}
                      alt="证件照片"
                      className="w-full rounded-lg border"
                    />
                    <div className="flex space-x-3">
                      <button
                        onClick={() => {
                          setIdPhoto(null);
                          setCameraActive(true);
                          setTimeout(() => startCamera(), 100);
                        }}
                        className="btn btn-secondary flex-1"
                      >
                        重新拍照
                      </button>
                      <button
                        onClick={handleVerifyAndCheckIn}
                        className="btn btn-primary flex-1"
                      >
                        确认核验并签到
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setCameraActive(true);
                      setTimeout(() => startCamera(), 100);
                    }}
                    className="btn btn-secondary w-full"
                  >
                    启动摄像头拍照
                  </button>
                )}
              </div>

              <button
                onClick={resetForm}
                className="btn btn-secondary w-full"
              >
                取消，核验下一位
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 font-medium">✗ 二维码无效或已过期</p>
              </div>
              <button onClick={resetForm} className="btn btn-primary w-full">
                重新扫描
              </button>
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">待办任务</h2>
            <span className="badge badge-warning">{tasks.length} 项待办</span>
          </div>

          {loading ? (
            <p className="text-center py-8 text-gray-500">加载中...</p>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">🎉 暂无待办任务</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="badge badge-warning">
                          {taskTypeMap[task.taskType] || task.taskType}
                        </span>
                        <span className="text-xs text-gray-500">
                          {format(new Date(task.createdAt), 'MM-dd HH:mm', { locale: zhCN })}
                        </span>
                      </div>
                      <p className="font-medium mt-2">访客: {task.visitorName}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        会议: {task.meeting.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(task.meeting.startTime), 'MM-dd HH:mm', { locale: zhCN })}
                        {' · '}
                        {task.meeting.room?.name || '无会议室'}
                      </p>
                      {task.notes && (
                        <p className="text-sm text-orange-600 mt-2 bg-orange-50 p-2 rounded">
                          ⚠️ {task.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex space-x-2">
                    <button
                      onClick={() => handleCompleteTask(task.id)}
                      className="btn btn-primary text-sm"
                    >
                      标记完成
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-800 mb-2">📋 前台工作流程</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-blue-700">
          <div className="flex items-center">
            <span className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center mr-2 font-bold">1</span>
            <span>访客出示二维码</span>
          </div>
          <div className="flex items-center">
            <span className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center mr-2 font-bold">2</span>
            <span>扫描验证身份</span>
          </div>
          <div className="flex items-center">
            <span className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center mr-2 font-bold">3</span>
            <span>拍摄证件照片留存</span>
          </div>
          <div className="flex items-center">
            <span className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center mr-2 font-bold">4</span>
            <span>确认签到，放行</span>
          </div>
        </div>
        <p className="text-xs text-blue-600 mt-3">
          * 证件照片将在72小时后自动删除，符合数据保护规定
        </p>
      </div>
    </div>
  );
}
