<template>
  <div class="flex gap-5 h-[calc(100vh-128px)]">
    <div class="w-80 flex-shrink-0 flex flex-col gap-3">
      <div class="card p-4 space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold">待办筛选</h3>
          <button class="text-primary-600 text-xs" @click="loadData">刷新</button>
        </div>
        <div class="flex gap-2">
          <input type="date" v-model="filter.date" class="input text-sm !py-1.5" @change="loadData" />
        </div>
        <div class="flex flex-wrap gap-1.5">
          <button v-for="t in typeTabs" :key="t.v"
            class="px-2.5 py-1 rounded-full text-xs font-medium transition"
            :class="filter.type === t.v ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
            @click="filter.type = t.v; loadData()">
            {{ t.t }} <span v-if="summary[t.k] !== undefined" class="opacity-75">({{ summary[t.k] }})</span>
          </button>
        </div>
        <input v-model="filter.keyword" class="input text-sm !py-1.5" placeholder="搜索客户/场地/设备..." />
      </div>

      <div class="card flex-1 overflow-hidden flex flex-col">
        <div class="p-3 border-b flex items-center justify-between">
          <h3 class="font-semibold text-sm">待办列表</h3>
          <span class="text-xs text-gray-400">{{ todos.length }} 项</span>
        </div>
        <div class="flex-1 overflow-y-auto divide-y divide-gray-50">
          <div v-for="item in todos" :key="`${item.type}-${item.id}`"
            class="p-3 cursor-pointer hover:bg-primary-50/50 transition border-l-4"
            :class="[
              activeId === `${item.type}-${item.id}` ? 'bg-primary-50 border-primary-500' : 'border-transparent',
              item.priority === 'high' ? 'bg-orange-50/40' : ''
            ]"
            @click="selectItem(item)">
            <div class="flex items-start gap-2">
              <div class="text-xl" :class="item.type === 'booking' ? '' : item.type === 'tournament' ? '' : item.type === 'fault' ? '' : ''">
                {{ typeIcon(item.type) }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-1.5 mb-0.5">
                  <span class="text-[10px] px-1.5 py-0.5 rounded" :class="typeTabBg(item.type)">
                    {{ typeName(item.type) }}
                  </span>
                  <span v-if="item.priority === 'high'" class="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded">高优先</span>
                </div>
                <div class="text-sm font-medium text-gray-800 truncate">{{ item.title }}</div>
                <div class="text-xs text-gray-500 truncate mt-0.5">{{ item.subtitle }}</div>
                <div class="flex gap-1 mt-1.5 flex-wrap">
                  <span v-for="b in item.badge?.slice(0, 3)" :key="b" class="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">{{ b }}</span>
                </div>
              </div>
              <span class="badge text-[10px] flex-shrink-0" :class="statusColor(item.status)">{{ item.statusText }}</span>
            </div>
          </div>
          <div v-if="todos.length === 0" class="p-12 text-center text-gray-400">
            <div class="text-4xl mb-2">✅</div>
            <div class="text-sm">暂无待办事项</div>
          </div>
        </div>
      </div>
    </div>

    <div class="flex-1 card overflow-hidden flex flex-col">
      <div v-if="!selected" class="flex-1 flex items-center justify-center text-gray-400">
        <div class="text-center">
          <div class="text-6xl mb-4 opacity-30">📋</div>
          <div class="text-lg">从左侧选择待办事项查看详情</div>
          <div class="text-sm mt-1 opacity-60">预约、赛事、签到、设备故障统一处理</div>
        </div>
      </div>

      <template v-else>
        <div class="p-4 border-b flex items-start justify-between sticky top-0 bg-white z-10">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="text-2xl">{{ typeIcon(selected.type) }}</span>
              <h3 class="text-lg font-semibold">{{ selected.title }}</h3>
              <span class="badge" :class="statusColor(selected.status)">{{ selected.statusText }}</span>
              <span v-if="selected.priority === 'high'" class="badge bg-red-100 text-red-700">⚠️ 高优先</span>
            </div>
            <div class="text-sm text-gray-500">{{ selected.subtitle }}</div>
          </div>
          <div class="flex gap-2">
            <button v-if="selected.type === 'booking'" class="btn-secondary !py-1.5 text-sm" @click="router.push(`/bookings`)">
              跳转完整管理 →
            </button>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-5">
          <div v-if="selected.type === 'booking'">
            <div class="grid grid-cols-12 gap-4">
              <div class="col-span-8 space-y-4">
                <div class="grid grid-cols-2 gap-3">
                  <div class="card p-4">
                    <div class="text-xs text-gray-500 mb-1">📅 场地时段</div>
                    <div class="font-semibold">{{ selected.data?.booking?.court?.courtNumber }} · {{ selected.data?.booking?.court?.name }}</div>
                    <div class="text-sm text-gray-600 mt-0.5">{{ formatDate(selected.data?.booking?.bookingDate) }} {{ selected.data?.booking?.startTime }} - {{ selected.data?.booking?.endTime }}</div>
                    <div class="flex gap-2 mt-2">
                      <span class="badge bg-blue-100 text-blue-700">时长 {{ Math.round((selected.data?.booking?.duration||0)/60*10)/10 }}h</span>
                      <span class="badge bg-gray-100 text-gray-700">{{ selected.data?.booking?.peopleCount }}人</span>
                      <span v-if="selected.data?.booking?.isPeakHour" class="badge bg-orange-100 text-orange-700">高峰时段</span>
                    </div>
                  </div>
                  <div class="card p-4">
                    <div class="text-xs text-gray-500 mb-1">💰 费用信息</div>
                    <div class="text-2xl font-bold text-red-600">¥{{ Number(selected.data?.booking?.actualAmount||0).toFixed(2) }}</div>
                    <div class="flex items-center gap-2 mt-1">
                      <span class="text-xs">已付</span>
                      <span class="font-medium" :class="Number(selected.data?.booking?.paidAmount||0) > 0 ? 'text-green-600' : 'text-orange-600'">
                        ¥{{ Number(selected.data?.booking?.paidAmount||0).toFixed(2) }}
                      </span>
                      <span class="text-xs text-gray-400">/ 原价 ¥{{ Number(selected.data?.booking?.originalPrice||0).toFixed(2) }}</span>
                    </div>
                    <div class="mt-2 flex gap-1.5">
                      <span class="badge" :class="selected.data?.booking?.payments?.[0]?.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'">
                        {{ selected.data?.booking?.payments?.[0] ? selected.data.booking.payments[0].status : '未创建支付' }}
                      </span>
                      <span v-if="selected.data?.booking?.payments?.[0]" class="text-xs text-gray-500">{{ selected.data.booking.payments[0].method }}</span>
                    </div>
                  </div>
                </div>

                <div class="card p-4 space-y-3">
                  <h4 class="font-semibold border-b pb-2 mb-2">✋ 快速操作</h4>
                  <div class="flex flex-wrap gap-2">
                    <template v-if="selected.status === 'PENDING'">
                      <button class="btn-primary !py-1.5" @click="doBookingAction('confirm')">✓ 确认预约</button>
                      <button class="btn-success !py-1.5" @click="openPay = true">💳 去支付</button>
                      <button class="btn-danger !py-1.5" @click="openAbnormal = true">⚠️ 异常结束</button>
                    </template>
                    <template v-else-if="['CONFIRMED','PAID'].includes(selected.status)">
                      <button class="btn-primary !py-1.5" @click="doBookingAction('checkin')">✋ 签到入场</button>
                      <button v-if="selected.status !== 'PAID'" class="btn-success !py-1.5" @click="openPay = true">💳 支付</button>
                      <button class="btn-danger !py-1.5" @click="openAbnormal = true">⚠️ 异常结束</button>
                    </template>
                    <template v-else-if="selected.status === 'CHECKED_IN'">
                      <button class="btn-success !py-1.5" @click="doBookingAction('complete')">🏁 完成结算</button>
                      <button class="btn-danger !py-1.5" @click="openAbnormal = true">⚠️ 异常结束</button>
                    </template>
                    <button class="btn-secondary !py-1.5" @click="copyCode()">📋 复制核销码</button>
                    <button class="btn-secondary !py-1.5" @click="router.push(`/checkin`)">🏃 签到台</button>
                  </div>
                  <div class="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <div class="text-xs text-gray-500">核销码</div>
                      <div class="text-xl font-mono font-bold tracking-widest">{{ selected.data?.booking?.checkInCode }}</div>
                    </div>
                    <div class="text-right">
                      <div class="text-xs text-gray-500">订单号</div>
                      <div class="text-sm font-mono text-gray-700">{{ selected.data?.booking?.orderNo }}</div>
                    </div>
                  </div>
                </div>

                <div v-if="selected.data?.booking?.coachAssignments?.length" class="card p-4">
                  <h4 class="font-semibold mb-3 border-b pb-2">🎾 教练安排</h4>
                  <div v-for="a in selected.data.booking.coachAssignments" :key="a.id" class="flex items-center justify-between py-2 border-b last:border-0">
                    <div class="flex items-center gap-3">
                      <div class="w-9 h-9 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                        {{ a.coach?.user?.realName?.charAt(0) }}
                      </div>
                      <div>
                        <div class="font-medium">{{ a.coach?.user?.realName }} <span class="text-xs text-gray-400 ml-1">{{ a.coach?.level }}</span></div>
                        <div class="text-xs text-gray-500">{{ a.startTime }} - {{ a.endTime }} · ¥{{ Number(a.hourlyRate).toFixed(0) }}/小时</div>
                      </div>
                    </div>
                    <div class="text-right">
                      <div class="font-semibold">¥{{ Number(a.totalCost).toFixed(2) }}</div>
                    </div>
                  </div>
                </div>

                <div v-if="selected.status === 'ABNORMAL'" class="card p-4 bg-orange-50/50 border-orange-200">
                  <h4 class="font-semibold mb-2 text-orange-800">⚠️ 异常记录</h4>
                  <div class="text-sm space-y-1">
                    <div>原因: <span class="font-medium">{{ abnormalReasonText(selected.data?.booking?.abnormalReason) }}</span></div>
                    <div v-if="selected.data?.booking?.abnormalRemark">说明: <span class="text-gray-700">{{ selected.data.booking.abnormalRemark }}</span></div>
                  </div>
                </div>
              </div>

              <div class="col-span-4 space-y-4">
                <div class="card p-4">
                  <h4 class="font-semibold mb-3 border-b pb-2">👤 客户信息</h4>
                  <div class="flex items-center gap-3 mb-3">
                    <div class="w-12 h-12 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xl">
                      {{ (selected.data?.booking?.customer?.realName || 'U').charAt(0) }}
                    </div>
                    <div class="flex-1">
                      <div class="font-semibold text-gray-800">{{ selected.data?.booking?.customer?.realName || selected.data?.booking?.customer?.username }}</div>
                      <div class="text-xs text-gray-500">{{ selected.data?.booking?.customer?.phone }}</div>
                      <div class="text-xs text-gray-400 mt-0.5">{{ selected.data?.booking?.customer?.email || '无邮箱' }}</div>
                    </div>
                  </div>
                  <div class="grid grid-cols-2 gap-2 text-xs">
                    <div class="bg-gray-50 p-2 rounded">
                      <div class="text-gray-400">账户余额</div>
                      <div class="font-semibold text-green-600 mt-0.5">¥{{ Number(selected.data?.booking?.customer?.balance||0).toFixed(2) }}</div>
                    </div>
                    <div class="bg-gray-50 p-2 rounded">
                      <div class="text-gray-400">操作员</div>
                      <div class="font-medium text-gray-700 mt-0.5">{{ selected.data?.booking?.staff?.realName || '客户自约' }}</div>
                    </div>
                  </div>
                  <div class="flex gap-2 mt-3">
                    <button class="flex-1 btn-secondary !py-1.5 text-xs">📞 拨号</button>
                    <button class="flex-1 btn-secondary !py-1.5 text-xs">💬 通知</button>
                  </div>
                </div>

                <div class="card p-4">
                  <h4 class="font-semibold mb-3 border-b pb-2">📝 操作日志</h4>
                  <div class="space-y-2 max-h-52 overflow-y-auto">
                    <div v-for="(l, i) in (selected.data?.booking?.logs||[]).slice(0,8)" :key="i" class="text-xs border-l-2 border-gray-200 pl-3 py-1">
                      <div class="flex justify-between items-center">
                        <span class="font-medium">{{ l.action }} <span v-if="l.oldStatus" class="text-gray-400 font-normal">{{ l.oldStatus }}→{{ l.newStatus }}</span></span>
                        <span class="text-gray-400">{{ formatDate(l.createdAt, 'HH:mm') }}</span>
                      </div>
                      <div v-if="l.remark" class="text-gray-500 mt-0.5">{{ l.remark }}</div>
                    </div>
                    <div v-if="!selected.data?.booking?.logs?.length" class="text-gray-400 text-center py-3 text-xs">暂无日志</div>
                  </div>
                </div>

                <div class="card p-4">
                  <h4 class="font-semibold mb-3 border-b pb-2">ℹ️ 更多信息</h4>
                  <div class="text-xs space-y-2">
                    <div v-if="selected.data?.booking?.source"><span class="text-gray-500">来源:</span> {{ selected.data.booking.source }}</div>
                    <div v-if="selected.data?.booking?.remark"><span class="text-gray-500">备注:</span> {{ selected.data.booking.remark }}</div>
                    <div><span class="text-gray-500">创建时间:</span> {{ formatDate(selected.data?.booking?.createdAt, 'YYYY-MM-DD HH:mm') }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="selected.type === 'tournament'">
            <div class="grid grid-cols-12 gap-4">
              <div class="col-span-8 space-y-4">
                <div class="grid grid-cols-2 gap-3">
                  <div class="card p-4">
                    <div class="text-xs text-gray-500 mb-1">🏆 赛事基本信息</div>
                    <div class="font-semibold text-lg">{{ selected.data?.tournament?.name }}</div>
                    <div class="text-sm text-gray-600 mt-1 space-y-0.5">
                      <div>📅 {{ formatDate(selected.data?.tournament?.startDate) }} ~ {{ formatDate(selected.data?.tournament?.endDate) }}</div>
                      <div>⏰ 报名截止: {{ formatDate(selected.data?.tournament?.regDeadline, 'YYYY-MM-DD HH:mm') }}</div>
                    </div>
                    <div class="flex gap-1.5 mt-2 flex-wrap">
                      <span v-if="selected.data?.tournament?.formatType" class="badge bg-blue-100 text-blue-700">{{ selected.data.tournament.formatType }}</span>
                      <span v-if="selected.data?.tournament?.level" class="badge bg-purple-100 text-purple-700">{{ selected.data.tournament.level }}</span>
                      <span v-if="selected.data?.tournament?.category" class="badge bg-teal-100 text-teal-700">{{ selected.data.tournament.category }}</span>
                      <span class="badge bg-orange-100 text-orange-700">
                        {{ selected.data?.tournament?.currentPlayers || 0 }} / {{ selected.data?.tournament?.maxPlayers }}
                      </span>
                    </div>
                  </div>
                  <div class="card p-4">
                    <div class="text-xs text-gray-500 mb-1">💰 费用/奖金</div>
                    <div class="grid grid-cols-2 gap-3 mt-1">
                      <div>
                        <div class="text-xs text-gray-400">报名费</div>
                        <div class="text-xl font-bold">¥{{ Number(selected.data?.tournament?.registrationFee||0).toFixed(0) }}</div>
                      </div>
                      <div>
                        <div class="text-xs text-gray-400">奖金池</div>
                        <div class="text-xl font-bold text-orange-600">¥{{ Number(selected.data?.tournament?.prizePool||0).toFixed(0) }}</div>
                      </div>
                    </div>
                    <div class="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div class="bg-gray-50 p-2 rounded"><span class="text-gray-400">主办方:</span> {{ selected.data?.tournament?.organizer || '-' }}</div>
                      <div class="bg-gray-50 p-2 rounded"><span class="text-gray-400">联系人:</span> {{ selected.data?.tournament?.contactPerson || '-' }}</div>
                    </div>
                  </div>
                </div>

                <div class="card p-4">
                  <div class="flex items-center justify-between mb-3">
                    <h4 class="font-semibold">👥 赛事签到 / 报名管理 <span class="text-xs text-gray-400 ml-2">同屏操作 无需跳转</span></h4>
                    <div class="flex gap-1.5 text-xs">
                      <input v-model="tournSearch" placeholder="搜索姓名/手机" class="input !w-auto !py-1 !px-2 !text-xs" />
                    </div>
                  </div>
                  <table class="w-full text-sm">
                    <thead class="text-xs text-gray-500 bg-gray-50">
                      <tr>
                        <th class="text-left p-2">选手</th>
                        <th class="text-left p-2">手机</th>
                        <th class="text-left p-2">报名信息</th>
                        <th class="text-center p-2">签到状态</th>
                        <th class="text-right p-2">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="reg in filteredRegList" :key="reg.id" class="border-t hover:bg-gray-50/50">
                        <td class="p-2">
                          <div class="font-medium">{{ reg.user?.realName || reg.user?.username }}</div>
                        </td>
                        <td class="p-2 text-gray-600">{{ reg.user?.phone }}</td>
                        <td class="p-2 text-xs text-gray-600">
                          <div v-if="reg.teamName">队伍: {{ reg.teamName }}</div>
                          <div v-if="reg.partnerName">搭档: {{ reg.partnerName }}</div>
                          <div v-if="reg.seedNumber" class="text-primary-600">种子 {{ reg.seedNumber }}号</div>
                          <div class="text-gray-400">{{ formatDate(reg.registeredAt, 'MM-DD HH:mm') }} 报名</div>
                        </td>
                        <td class="p-2 text-center">
                          <span class="badge" :class="reg.checkIn?.status === 'CHECKED_IN' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'">
                            {{ reg.checkIn?.status === 'CHECKED_IN' ? '已签到' : '未签到' }}
                          </span>
                        </td>
                        <td class="p-2 text-right">
                          <div class="flex justify-end gap-1">
                            <button v-if="reg.checkIn?.status !== 'CHECKED_IN'"
                              class="px-2 py-0.5 text-xs bg-teal-100 text-teal-700 rounded hover:bg-teal-200"
                              @click="checkInTournament(reg)">
                              签到
                            </button>
                            <button class="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200">详情</button>
                          </div>
                        </td>
                      </tr>
                      <tr v-if="!selected.data?.registrations?.length"><td colspan="5" class="text-center text-gray-400 p-6">暂无报名选手</td></tr>
                    </tbody>
                  </table>
                </div>

                <div v-if="selected.data?.tournament?.description" class="card p-4">
                  <h4 class="font-semibold mb-2">📄 赛事描述</h4>
                  <div class="text-sm text-gray-700 whitespace-pre-wrap">{{ selected.data.tournament.description }}</div>
                </div>

                <div v-if="selected.data?.tournament?.rules" class="card p-4">
                  <h4 class="font-semibold mb-2">📜 赛事规则</h4>
                  <div class="text-sm text-gray-700 whitespace-pre-wrap">{{ selected.data.tournament.rules }}</div>
                </div>
              </div>

              <div class="col-span-4 space-y-4">
                <div class="card p-4">
                  <h4 class="font-semibold mb-3 border-b pb-2">🎯 快速操作</h4>
                  <div class="space-y-2">
                    <button v-if="selected.status === 'DRAFT'" class="btn-primary w-full !py-2" @click="changeTournamentStatus('REGISTERING')">🚀 开启报名</button>
                    <button v-if="selected.status === 'REGISTERING'" class="btn-primary w-full !py-2" @click="changeTournamentStatus('UPCOMING')">📋 截止报名</button>
                    <button v-if="selected.status === 'UPCOMING'" class="btn-success w-full !py-2" @click="changeTournamentStatus('ONGOING')">🎾 开始比赛</button>
                    <button v-if="selected.status === 'ONGOING'" class="btn-success w-full !py-2" @click="changeTournamentStatus('COMPLETED')">🏆 赛事结束</button>
                    <button class="btn-secondary w-full !py-2" @click="router.push(`/tournaments`)">📋 完整赛事管理</button>
                  </div>
                </div>

                <div class="card p-4">
                  <h4 class="font-semibold mb-3 border-b pb-2">📊 报名进度</h4>
                  <div class="text-center py-3">
                    <div class="text-3xl font-bold text-primary-600">
                      {{ selected.data?.tournament?.currentPlayers || 0 }}
                      <span class="text-lg text-gray-400 font-normal">/ {{ selected.data?.tournament?.maxPlayers }}</span>
                    </div>
                    <div class="mt-2 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                      <div class="bg-primary-600 h-full rounded-full transition-all"
                        :style="{ width: ((selected.data?.tournament?.currentPlayers||0) / (selected.data?.tournament?.maxPlayers||1) * 100) + '%' }"></div>
                    </div>
                    <div class="text-xs text-gray-500 mt-1">
                      满员率 {{ Math.round((selected.data?.tournament?.currentPlayers||0) / (selected.data?.tournament?.maxPlayers||1) * 100) }}%
                    </div>
                  </div>
                </div>

                <div class="card p-4">
                  <h4 class="font-semibold mb-3 border-b pb-2">📞 联系方式</h4>
                  <div class="text-sm space-y-2">
                    <div v-if="selected.data?.tournament?.contactPerson"><span class="text-gray-500">联系人:</span> {{ selected.data.tournament.contactPerson }}</div>
                    <div v-if="selected.data?.tournament?.contactPhone">
                      <span class="text-gray-500">联系电话:</span>
                      <span class="font-medium ml-1">{{ selected.data.tournament.contactPhone }}</span>
                      <button class="ml-2 text-primary-600 text-xs">📞</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="selected.type === 'checkin'">
            <div class="text-gray-500 text-center py-12">签到详情请查看预约详情</div>
          </div>

          <div v-else-if="selected.type === 'fault'">
            <div class="grid grid-cols-12 gap-4">
              <div class="col-span-8 space-y-4">
                <div class="card p-4">
                  <div class="flex items-start justify-between mb-3">
                    <div>
                      <div class="text-xs text-gray-500">故障单号</div>
                      <div class="font-mono font-semibold text-lg">{{ selected.data?.fault?.faultNo }}</div>
                    </div>
                    <span class="badge" :class="faultStatusClass(selected.status)">
                      {{ selected.statusText }}
                    </span>
                  </div>
                  <div class="grid grid-cols-2 gap-3 mt-4">
                    <div class="bg-red-50 rounded-lg p-3">
                      <div class="text-xs text-red-500 mb-1">设备 / 故障</div>
                      <div class="font-semibold">{{ selected.data?.fault?.deviceName }} <span class="text-xs text-gray-500">({{ selected.data?.fault?.deviceType }})</span></div>
                      <div class="text-xs mt-1 flex gap-1.5">
                        <span class="px-1.5 py-0.5 bg-red-100 text-red-700 rounded">{{ selected.data?.fault?.faultLevel }}</span>
                        <span class="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">{{ selected.data?.fault?.court?.courtNumber || '公共设备' }}</span>
                      </div>
                    </div>
                    <div class="bg-gray-50 rounded-lg p-3">
                      <div class="text-xs text-gray-500 mb-1">报修信息</div>
                      <div class="text-sm">{{ selected.data?.fault?.reporter?.realName }} · {{ selected.data?.fault?.reporter?.phone }}</div>
                      <div class="text-xs text-gray-500 mt-0.5">{{ formatDate(selected.data?.fault?.reportedAt, 'YYYY-MM-DD HH:mm') }}</div>
                    </div>
                  </div>
                  <div class="mt-4 bg-orange-50 border-l-4 border-orange-400 p-3 rounded">
                    <div class="text-xs font-semibold text-orange-800 mb-1">📝 故障描述</div>
                    <div class="text-sm text-orange-900">{{ selected.data?.fault?.description }}</div>
                  </div>
                  <div v-if="selected.data?.fault?.repairResult" class="mt-3 bg-green-50 border-l-4 border-green-400 p-3 rounded">
                    <div class="text-xs font-semibold text-green-800 mb-1">✅ 维修结果</div>
                    <div class="text-sm text-green-900">{{ selected.data.fault.repairResult }}</div>
                    <div v-if="selected.data?.fault?.repairCost" class="text-xs text-green-700 mt-1">维修费用: ¥{{ Number(selected.data.fault.repairCost).toFixed(2) }}</div>
                  </div>
                </div>

                <div class="card p-4">
                  <h4 class="font-semibold mb-3 border-b pb-2">🔧 处理流程</h4>
                  <div class="space-y-3">
                    <div v-for="(s, i) in faultSteps" :key="i" class="flex items-start gap-3">
                      <div class="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 mt-0.5"
                        :class="faultStepReached(s.v, selected.status) ? 'bg-green-500' : 'bg-gray-300'">
                        {{ i + 1 }}
                      </div>
                      <div class="flex-1 pb-2 border-b last:border-0">
                        <div class="flex justify-between">
                          <div class="font-medium" :class="faultStepReached(s.v, selected.status) ? 'text-gray-800' : 'text-gray-400'">{{ s.t }}</div>
                          <div class="text-xs text-gray-400">{{ faultStepTime(s.v, selected.data?.fault) }}</div>
                        </div>
                        <div class="text-xs text-gray-500 mt-0.5">{{ s.desc }}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div v-if="selected.data?.fault?.affectCoach" class="card p-4 bg-yellow-50/50 border-yellow-200">
                  <h4 class="font-semibold mb-2 text-yellow-800">🎾 教练产能影响</h4>
                  <div class="text-sm text-yellow-700">此故障已自动关联到受影响教练的本周产能报表，将记录为故障影响小时数。</div>
                </div>
              </div>

              <div class="col-span-4 space-y-4">
                <div class="card p-4">
                  <h4 class="font-semibold mb-3 border-b pb-2">⚡ 快速操作</h4>
                  <div class="space-y-2">
                    <template v-if="selected.status === 'FAULT_REPORTED'">
                      <button class="btn-primary w-full !py-2" @click="doFaultAction('accept')">🙋 我来处理</button>
                    </template>
                    <template v-else-if="selected.status === 'REPAIRING'">
                      <button class="btn-success w-full !py-2" @click="openFaultRepair = true">🔧 填写维修结果</button>
                    </template>
                    <template v-else-if="selected.status === 'REPAIRED'">
                      <button class="btn-success w-full !py-2" @click="doFaultAction('complete')">✅ 确认恢复正常</button>
                    </template>
                    <button v-if="['FAULT_REPORTED','REPAIRING'].includes(selected.status)" class="btn-secondary w-full !py-2" @click="doFaultAction('scrap')">🗑️ 设备报废</button>
                    <button class="btn-secondary w-full !py-2" @click="router.push(`/devices/faults`)">📋 完整故障管理</button>
                  </div>
                </div>

                <div class="card p-4">
                  <h4 class="font-semibold mb-3 border-b pb-2">👷 处理信息</h4>
                  <div v-if="selected.data?.fault?.handlerId" class="space-y-2 text-sm">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold">
                        {{ selected.data.fault.handler?.realName?.charAt(0) }}
                      </div>
                      <div>
                        <div class="font-medium">{{ selected.data.fault.handler?.realName }}</div>
                        <div class="text-xs text-gray-500">{{ selected.data.fault.handler?.phone }}</div>
                      </div>
                    </div>
                    <div v-if="selected.data?.fault?.acceptedAt" class="text-xs text-gray-500">接单时间: {{ formatDate(selected.data.fault.acceptedAt, 'YYYY-MM-DD HH:mm') }}</div>
                    <div v-if="selected.data?.fault?.repairedAt" class="text-xs text-gray-500">处理完成: {{ formatDate(selected.data.fault.repairedAt, 'YYYY-MM-DD HH:mm') }}</div>
                  </div>
                  <div v-else class="text-center text-gray-400 text-sm py-4">暂无人处理</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <div v-if="openPay" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" @click.self="openPay = false">
      <div class="bg-white rounded-2xl w-full max-w-md">
        <div class="p-5 border-b"><h3 class="font-semibold text-lg">确认收款</h3></div>
        <div class="p-5 space-y-4">
          <div class="bg-red-50 rounded-xl p-4 text-center">
            <div class="text-xs text-gray-500">应收金额</div>
            <div class="text-3xl font-bold text-red-600">¥{{ Number(selected?.data?.booking?.actualAmount||0).toFixed(2) }}</div>
          </div>
          <div>
            <label class="label">支付方式</label>
            <select v-model="payForm.method" class="input">
              <option value="WECHAT">微信</option><option value="ALIPAY">支付宝</option>
              <option value="CASH">现金</option><option value="CARD">刷卡</option>
              <option value="BALANCE">余额</option><option value="OTHER">其他</option>
            </select>
          </div>
          <div>
            <label class="label">实收金额</label>
            <input v-model.number="payForm.paidAmount" type="number" class="input" />
          </div>
        </div>
        <div class="p-5 border-t flex justify-end gap-2">
          <button class="btn-secondary" @click="openPay = false">取消</button>
          <button class="btn-success" @click="confirmPay">确认收款</button>
        </div>
      </div>
    </div>

    <div v-if="openAbnormal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" @click.self="openAbnormal = false">
      <div class="bg-white rounded-2xl w-full max-w-md">
        <div class="p-5 border-b bg-orange-50 rounded-t-2xl">
          <h3 class="font-semibold text-lg text-orange-800">⚠️ 异常结束预约</h3>
          <p class="text-xs text-orange-600 mt-1">异常结束不会标记为完成，将作为单独状态记录</p>
        </div>
        <div class="p-5 space-y-4">
          <div>
            <label class="label">异常原因 *</label>
            <select v-model="abnormalForm.reason" class="input">
              <option v-for="r in abnormalReasons" :key="r.v" :value="r.v">{{ r.t }}</option>
            </select>
          </div>
          <div>
            <label class="label">详细说明</label>
            <textarea v-model="abnormalForm.remark" rows="3" class="input" placeholder="请补充详细说明，便于后续分析"></textarea>
          </div>
        </div>
        <div class="p-5 border-t flex justify-end gap-2">
          <button class="btn-secondary" @click="openAbnormal = false">取消</button>
          <button class="btn-danger" @click="confirmAbnormal">确认异常结束</button>
        </div>
      </div>
    </div>

    <div v-if="openFaultRepair" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" @click.self="openFaultRepair = false">
      <div class="bg-white rounded-2xl w-full max-w-md">
        <div class="p-5 border-b"><h3 class="font-semibold text-lg">维修完成</h3></div>
        <div class="p-5 space-y-4">
          <div>
            <label class="label">维修结果 *</label>
            <textarea v-model="faultRepairForm.result" rows="3" class="input" placeholder="请描述维修过程和结果"></textarea>
          </div>
          <div>
            <label class="label">维修费用</label>
            <input v-model.number="faultRepairForm.cost" type="number" class="input" placeholder="选填" />
          </div>
        </div>
        <div class="p-5 border-t flex justify-end gap-2">
          <button class="btn-secondary" @click="openFaultRepair = false">取消</button>
          <button class="btn-primary" @click="confirmFaultRepair">提交</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'

const { get, put, post } = useApi()
const router = useRouter()

const filter = reactive({ date: new Date().toISOString().slice(0, 10), type: 'all', keyword: '' })
const rawData = ref<any>(null)
const summary = ref<any>({})
const selected = ref<any>(null)
const activeId = ref('')

const openPay = ref(false)
const openAbnormal = ref(false)
const openFaultRepair = ref(false)
const payForm = reactive({ method: 'WECHAT', paidAmount: 0 })
const abnormalForm = reactive({ reason: 'OTHER', remark: '' })
const faultRepairForm = reactive({ result: '', cost: 0 })
const tournSearch = ref('')

const abnormalReasons = [
  { v: 'CUSTOMER_NO_SHOW', t: '客户未到场' }, { v: 'CUSTOMER_EARLY_LEAVE', t: '客户提前离开' },
  { v: 'EQUIPMENT_FAILURE', t: '设备故障' }, { v: 'WEATHER_ISSUE', t: '天气原因' },
  { v: 'DOUBLE_BOOKING', t: '重复预约冲突' }, { v: 'STAFF_ERROR', t: '操作失误' }, { v: 'OTHER', t: '其他原因' }
]

const typeTabs = [
  { v: 'all', t: '全部', k: 'pendingBookings' },
  { v: 'booking', t: '场地预约', k: 'pendingBookings' },
  { v: 'tournament', t: '赛事报名', k: 'pendingRegistrations' },
  { v: 'fault', t: '设备故障', k: 'pendingFaults' }
]

const faultSteps = [
  { v: 'FAULT_REPORTED', t: '报告故障', desc: '工作人员发现并提交故障报告' },
  { v: 'REPAIRING', t: '接单维修', desc: '负责人接单，开始处理' },
  { v: 'REPAIRED', t: '维修完成', desc: '维修完毕，待确认' },
  { v: 'NORMAL', t: '恢复正常', desc: '设备确认可正常使用' }
]

const todos = computed(() => {
  const items = rawData.value?.items || []
  if (!filter.keyword) return items
  const kw = filter.keyword.toLowerCase()
  return items.filter((i: any) =>
    (i.title + i.subtitle + JSON.stringify(i.badge || [])).toLowerCase().includes(kw)
  )
})

const filteredRegList = computed(() => {
  const list = selected.value?.data?.registrations || []
  if (!tournSearch.value) return list
  const kw = tournSearch.value.toLowerCase()
  return list.filter((r: any) =>
    (r.user?.realName || '').toLowerCase().includes(kw) ||
    (r.user?.phone || '').includes(kw) ||
    (r.user?.username || '').toLowerCase().includes(kw)
  )
})

function typeIcon(t: string) {
  return { booking: '📅', tournament: '🏆', fault: '🔧', checkin: '✋' }[t] || '📋'
}
function typeName(t: string) {
  return { booking: '预约', tournament: '赛事', fault: '故障', checkin: '签到' }[t] || t
}
function typeTabBg(t: string) {
  return { booking: 'bg-blue-100 text-blue-700', tournament: 'bg-purple-100 text-purple-700', fault: 'bg-orange-100 text-orange-700', checkin: 'bg-teal-100 text-teal-700' }[t] || ''
}
function abnormalReasonText(r: string) { return abnormalReasons.find(x => x.v === r)?.t || r || '-' }
function faultStatusClass(s: string) {
  return {
    FAULT_REPORTED: 'bg-red-100 text-red-700', REPAIRING: 'bg-yellow-100 text-yellow-700',
    REPAIRED: 'bg-blue-100 text-blue-700', NORMAL: 'bg-green-100 text-green-700', SCRAPPED: 'bg-gray-100 text-gray-600'
  }[s] || 'bg-gray-100 text-gray-600'
}
function faultStepReached(target: string, current: string) {
  const order = ['FAULT_REPORTED', 'REPAIRING', 'REPAIRED', 'NORMAL', 'SCRAPPED']
  return order.indexOf(current) >= order.indexOf(target)
}
function faultStepTime(v: string, f: any) {
  if (!f) return ''
  const tMap: Record<string, any> = { FAULT_REPORTED: f.reportedAt, REPAIRING: f.acceptedAt, REPAIRED: f.repairedAt }
  return tMap[v] ? formatDate(tMap[v], 'MM-DD HH:mm') : ''
}

function selectItem(item: any) {
  selected.value = item
  activeId.value = `${item.type}-${item.id}`
  if (item.type === 'booking' && item.data?.booking) {
    payForm.paidAmount = Number(item.data.booking.actualAmount)
  }
}

async function loadData() {
  try {
    const r = await get('/api/todos', { date: filter.date, type: filter.type })
    if (r.code === 0) {
      rawData.value = r.data
      summary.value = r.data.summary || {}
      if (!selected.value && r.data.items?.length) selectItem(r.data.items[0])
    }
  } catch {}
}

async function doBookingAction(action: string) {
  if (!confirm(`执行「${action === 'confirm' ? '确认预约' : action === 'checkin' ? '签到' : '完成'}」操作？`)) return
  const id = selected.value.data.booking.id
  try {
    const r = await put(`/api/bookings/${id}/status`, { action })
    if (r.code === 0) { alert('操作成功'); loadData(); setTimeout(() => refreshSelected(), 200) }
    else alert(r.message)
  } catch (e: any) { alert(e.message) }
}

async function confirmPay() {
  const id = selected.value.data.booking.id
  try {
    const r = await put(`/api/bookings/${id}/status`, { action: 'pay', method: payForm.method, paidAmount: payForm.paidAmount })
    if (r.code === 0) { openPay.value = false; alert('支付成功'); loadData(); setTimeout(() => refreshSelected(), 200) }
    else alert(r.message)
  } catch (e: any) { alert(e.message) }
}

async function confirmAbnormal() {
  if (!abnormalForm.reason) return alert('请选择异常原因')
  const id = selected.value.data.booking.id
  try {
    const r = await put(`/api/bookings/${id}/status`, { action: 'abnormal', abnormalReason: abnormalForm.reason, abnormalRemark: abnormalForm.remark })
    if (r.code === 0) { openAbnormal.value = false; alert('已记录异常'); loadData(); setTimeout(() => refreshSelected(), 200) }
    else alert(r.message)
  } catch (e: any) { alert(e.message) }
}

async function refreshSelected() {
  if (!selected.value) return
  const { type, id } = selected.value
  try {
    if (type === 'booking') {
      const r = await get(`/api/bookings/${id}`)
      if (r.code === 0 && rawData.value?.items) {
        const found = rawData.value.items.find((i: any) => i.type === 'booking' && i.id === id)
        if (found) { found.status = r.data.status; found.statusText = statusText(r.data.status); found.data.booking = r.data }
      }
    }
  } catch {}
}

async function doFaultAction(action: string) {
  try {
    const r = await put('/api/devices/faults', { id: selected.value.data.fault.id, action })
    if (r.code === 0) { alert('操作成功'); loadData() }
    else alert(r.message)
  } catch (e: any) { alert(e.message) }
}

async function confirmFaultRepair() {
  if (!faultRepairForm.result) return alert('请填写维修结果')
  try {
    const r = await put('/api/devices/faults', {
      id: selected.value.data.fault.id, action: 'repair',
      repairResult: faultRepairForm.result, repairCost: faultRepairForm.cost || undefined
    })
    if (r.code === 0) { openFaultRepair.value = false; alert('已提交维修结果'); loadData() }
    else alert(r.message)
  } catch (e: any) { alert(e.message) }
}

async function checkInTournament(reg: any) {
  try {
    const r = await post('/api/checkins', { type: 'MANUAL', userId: reg.userId, remark: '赛事签到' })
    if (r.code === 0) { alert('签到成功'); reg.checkIn = { status: 'CHECKED_IN', checkInTime: new Date() } }
    else alert(r.message)
  } catch (e: any) { alert(e.message) }
}

async function changeTournamentStatus(s: string) {
  alert(`状态变更为「${s}」（在完整赛事管理页可实现）`)
}

function copyCode() {
  const code = selected.value?.data?.booking?.checkInCode
  if (code) { navigator.clipboard?.writeText(code); alert(`核销码 ${code} 已复制`) }
}

watch(() => filter.type, loadData)
onMounted(loadData)

definePageMeta({ layout: 'default', middleware: 'auth' })
</script>
