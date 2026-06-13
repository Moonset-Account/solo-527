export default function Login() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <h1 className="mb-6 text-center text-2xl font-bold text-slate-800">宿舍报修审核系统</h1>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">用户名</label>
            <input
              type="text"
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="请输入用户名"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">密码</label>
            <input
              type="password"
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="请输入密码"
            />
          </div>
          <button className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700">
            登录
          </button>
        </div>
      </div>
    </div>
  );
}
