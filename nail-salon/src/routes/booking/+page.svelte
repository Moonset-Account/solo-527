<script lang="ts">
	interface Service {
		id: string;
		name: string;
		category: string;
		duration: number;
		price: string;
		description: string | null;
		image: string | null;
	}

	interface Technician {
		id: string;
		name: string;
		avatar: string | null;
		specialty: string | null;
		level: string | null;
		bio: string | null;
		isActive: boolean;
	}

	interface Customer {
		id: string;
		name: string;
		phone: string;
		gender: string | null;
		birthday: string | null;
		source: string | null;
	}

	let step = $state(1);
	let services = $state<Service[]>([]);
	let technicians = $state<Technician[]>([]);
	let selectedServiceId = $state('');
	let selectedTechnicianId = $state('');
	let appointmentDate = $state('');
	let appointmentTime = $state('');
	let customerName = $state('');
	let customerPhone = $state('');
	let customerGender = $state('');
	let customerBirthday = $state('');
	let remark = $state('');
	let customerId = $state('');
	let loading = $state(false);
	let submitting = $state(false);
	let submitted = $state(false);
	let phoneFound = $state(false);

	$effect(() => {
		loadData();
	});

	async function loadData() {
		loading = true;
		try {
			const [svcRes, techRes] = await Promise.all([
				fetch('/api/services'),
				fetch('/api/technicians?active=true')
			]);
			if (svcRes.ok) services = await svcRes.json();
			if (techRes.ok) technicians = await techRes.json();
		} catch (e) {
			console.error('Failed to load data', e);
		} finally {
			loading = false;
		}
	}

	let selectedService = $derived(services.find((s) => s.id === selectedServiceId));
	let selectedTechnician = $derived(technicians.find((t) => t.id === selectedTechnicianId));

	let serviceCategories = $derived.by(() => {
		const cats = new Set<string>();
		for (const s of services) cats.add(s.category);
		return Array.from(cats);
	});

	let timeSlots = $derived.by(() => {
		const slots: string[] = [];
		for (let h = 10; h <= 20; h++) {
			slots.push(`${String(h).padStart(2, '0')}:00`);
			slots.push(`${String(h).padStart(2, '0')}:30`);
		}
		return slots;
	});

	let minDate = $derived.by(() => {
		const d = new Date();
		return d.toISOString().split('T')[0];
	});

	const steps = [
		{ num: 1, label: '选择服务' },
		{ num: 2, label: '选择技师' },
		{ num: 3, label: '选择时间' },
		{ num: 4, label: '填写信息' },
		{ num: 5, label: '确认预约' }
	];

	function nextStep() {
		if (step < 5) step++;
	}

	function prevStep() {
		if (step > 1) step--;
	}

	function canProceed(): boolean {
		switch (step) {
			case 1: return !!selectedServiceId;
			case 2: return !!selectedTechnicianId;
			case 3: return !!appointmentDate && !!appointmentTime;
			case 4: return !!customerName.trim() && !!customerPhone.trim();
			case 5: return true;
			default: return false;
		}
	}

	async function searchCustomer() {
		if (!customerPhone.trim() || customerPhone.length < 8) return;
		try {
			const res = await fetch(`/api/customers?search=${encodeURIComponent(customerPhone)}`);
			if (res.ok) {
				const data: Customer[] = await res.json();
				const found = data.find((c) => c.phone === customerPhone);
				if (found) {
					customerId = found.id;
					customerName = found.name;
					customerGender = found.gender ?? '';
					customerBirthday = found.birthday ?? '';
					phoneFound = true;
				} else {
					customerId = '';
					phoneFound = false;
				}
			}
		} catch (e) {
			console.error('Failed to search customer', e);
		}
	}

	async function submitAppointment() {
		submitting = true;
		try {
			if (!customerId) {
				const custRes = await fetch('/api/customers', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						name: customerName,
						phone: customerPhone,
						gender: customerGender || undefined,
						birthday: customerBirthday || undefined,
						source: '在线预约'
					})
				});
				if (custRes.ok) {
					const cust = await custRes.json();
					customerId = cust.id;
				} else {
					return;
				}
			}

			const aptRes = await fetch('/api/appointments', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					customerId,
					technicianId: selectedTechnicianId,
					serviceId: selectedServiceId,
					appointmentDate,
					appointmentTime,
					remark: remark || undefined
				})
			});

			if (aptRes.ok) {
				submitted = true;
			}
		} catch (e) {
			console.error('Failed to submit appointment', e);
		} finally {
			submitting = false;
		}
	}

	function formatPrice(price: string): string {
		return `¥${price}`;
	}

	function getLevelBadge(level: string | null): { text: string; class: string } {
		switch (level) {
			case 'master': return { text: '首席', class: 'bg-amber-100 text-amber-700' };
			case 'senior': return { text: '高级', class: 'bg-purple-100 text-purple-700' };
			case 'junior': return { text: '初级', class: 'bg-blue-100 text-blue-700' };
			default: return { text: '美甲师', class: 'bg-pink-100 text-primary' };
		}
	}

	function resetBooking() {
		step = 1;
		selectedServiceId = '';
		selectedTechnicianId = '';
		appointmentDate = '';
		appointmentTime = '';
		customerName = '';
		customerPhone = '';
		customerGender = '';
		customerBirthday = '';
		remark = '';
		customerId = '';
		submitted = false;
		phoneFound = false;
	}
</script>

<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
	<div class="text-center mb-8">
		<h1 class="text-3xl font-bold text-gray-900 mb-2">在线预约</h1>
		<p class="text-gray-500">轻松几步，预约您的专属美甲服务</p>
	</div>

	{#if submitted}
		<div class="text-center py-16">
			<div class="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/30">
				<svg class="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
				</svg>
			</div>
			<h2 class="text-2xl font-bold text-gray-900 mb-2">预约成功！</h2>
			<p class="text-gray-500 mb-8">我们已收到您的预约，请按时到店</p>
			<div class="bg-white rounded-2xl p-6 max-w-sm mx-auto shadow-sm border border-pink-100 mb-8">
				<div class="space-y-3 text-sm">
					<div class="flex justify-between">
						<span class="text-gray-500">服务项目</span>
						<span class="font-medium text-gray-900">{selectedService?.name}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-gray-500">指定技师</span>
						<span class="font-medium text-gray-900">{selectedTechnician?.name}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-gray-500">预约日期</span>
						<span class="font-medium text-gray-900">{appointmentDate}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-gray-500">预约时间</span>
						<span class="font-medium text-gray-900">{appointmentTime}</span>
					</div>
				</div>
			</div>
			<button
				onclick={resetBooking}
				class="px-6 py-2.5 rounded-full bg-gradient-to-r from-primary to-primary-light text-white font-medium shadow-md shadow-primary/25 hover:shadow-primary/40 transition-all"
			>
				继续预约
			</button>
		</div>
	{:else}
		<div class="flex items-center justify-between mb-10 px-2">
			{#each steps as s, i}
				<div class="flex items-center {i < steps.length - 1 ? 'flex-1' : ''}">
					<div class="flex flex-col items-center">
						<div class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 {step >= s.num
							? 'bg-gradient-to-br from-primary to-primary-light text-white shadow-md shadow-primary/25'
							: 'bg-gray-100 text-gray-400'}">
							{#if step > s.num}
								<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
								</svg>
							{:else}
								{s.num}
							{/if}
						</div>
						<span class="text-xs mt-1.5 font-medium {step >= s.num ? 'text-primary' : 'text-gray-400'}">{s.label}</span>
					</div>
					{#if i < steps.length - 1}
						<div class="flex-1 h-0.5 mx-2 mt-[-18px] transition-all duration-300 {step > s.num ? 'bg-primary' : 'bg-gray-200'}"></div>
					{/if}
				</div>
			{/each}
		</div>

		<div class="bg-white rounded-3xl shadow-sm border border-pink-100 p-6 sm:p-8">
			{#if loading}
				<div class="space-y-4 animate-pulse">
					<div class="h-8 bg-pink-50 rounded w-1/4"></div>
					<div class="grid grid-cols-2 gap-4">
						{#each Array(4) as _}
							<div class="h-32 bg-pink-50 rounded-2xl"></div>
						{/each}
					</div>
				</div>
			{:else if step === 1}
				<h2 class="text-xl font-bold text-gray-900 mb-6">选择服务项目</h2>
				{#each serviceCategories as category}
					<h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">{category}</h3>
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
						{#each services.filter((s) => s.category === category) as svc}
							<button
								onclick={() => { selectedServiceId = svc.id; }}
								class="relative p-4 rounded-2xl border-2 text-left transition-all duration-200 {selectedServiceId === svc.id
									? 'border-primary bg-pink-50 shadow-md shadow-primary/10'
									: 'border-gray-100 hover:border-pink-200 hover:bg-pink-50/50'}"
							>
								{#if selectedServiceId === svc.id}
									<div class="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
										<svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
										</svg>
									</div>
								{/if}
								<div class="flex items-start justify-between mb-2">
									<h4 class="font-semibold text-gray-900 pr-6">{svc.name}</h4>
									<span class="text-lg font-bold text-primary whitespace-nowrap">{formatPrice(svc.price)}</span>
								</div>
								{#if svc.description}
									<p class="text-sm text-gray-500 mb-2">{svc.description}</p>
								{/if}
								<div class="flex items-center gap-3 text-xs text-gray-400">
									<span class="flex items-center gap-1">
										<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
										{svc.duration}分钟
									</span>
								</div>
							</button>
						{/each}
					</div>
				{/each}

			{:else if step === 2}
				<h2 class="text-xl font-bold text-gray-900 mb-6">选择技师</h2>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					{#each technicians as tech}
						{@const badge = getLevelBadge(tech.level)}
						<button
							onclick={() => { selectedTechnicianId = tech.id; }}
							class="relative p-5 rounded-2xl border-2 text-left transition-all duration-200 {selectedTechnicianId === tech.id
								? 'border-primary bg-pink-50 shadow-md shadow-primary/10'
								: 'border-gray-100 hover:border-pink-200 hover:bg-pink-50/50'}"
						>
							{#if selectedTechnicianId === tech.id}
								<div class="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
									<svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
									</svg>
								</div>
							{/if}
							<div class="flex items-center gap-4">
								{#if tech.avatar}
									<img src={tech.avatar} alt={tech.name} class="w-14 h-14 rounded-full object-cover ring-2 ring-pink-100" />
								{:else}
									<div class="w-14 h-14 rounded-full bg-gradient-to-br from-primary-light to-primary flex items-center justify-center text-white text-xl font-bold ring-2 ring-pink-100">
										{tech.name[0]}
									</div>
								{/if}
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-2 mb-1">
										<h4 class="font-semibold text-gray-900">{tech.name}</h4>
										<span class="px-2 py-0.5 rounded-full text-xs font-medium {badge.class}">{badge.text}</span>
									</div>
									{#if tech.specialty}
										<p class="text-sm text-gray-500">擅长：{tech.specialty}</p>
									{/if}
									{#if tech.bio}
										<p class="text-xs text-gray-400 mt-1 truncate">{tech.bio}</p>
									{/if}
								</div>
							</div>
						</button>
					{/each}
				</div>

			{:else if step === 3}
				<h2 class="text-xl font-bold text-gray-900 mb-6">选择预约时间</h2>
				<div class="space-y-6">
					<div>
						<label for="apt-date" class="block text-sm font-medium text-gray-700 mb-2">预约日期</label>
						<input
							id="apt-date"
							type="date"
							bind:value={appointmentDate}
							min={minDate}
							class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-gray-900"
						/>
					</div>
					{#if appointmentDate}
						<div>
							<span class="block text-sm font-medium text-gray-700 mb-3">预约时段</span>
							<div class="grid grid-cols-4 sm:grid-cols-6 gap-2">
								{#each timeSlots as slot}
									<button
										onclick={() => { appointmentTime = slot; }}
										class="py-2.5 px-2 rounded-xl text-sm font-medium transition-all duration-200 {appointmentTime === slot
											? 'bg-gradient-to-r from-primary to-primary-light text-white shadow-md shadow-primary/20'
											: 'bg-gray-50 text-gray-600 hover:bg-pink-50 hover:text-primary border border-gray-100'}"
									>
										{slot}
									</button>
								{/each}
							</div>
						</div>
					{/if}
				</div>

			{:else if step === 4}
				<h2 class="text-xl font-bold text-gray-900 mb-6">填写个人信息</h2>
				<div class="space-y-5 max-w-md">
					<div>
						<label for="phone" class="block text-sm font-medium text-gray-700 mb-1.5">
							手机号 <span class="text-red-400">*</span>
						</label>
						<input
							id="phone"
							type="tel"
							bind:value={customerPhone}
							onblur={searchCustomer}
							placeholder="请输入手机号"
							class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
						/>
						{#if phoneFound}
							<p class="mt-1 text-xs text-green-500 flex items-center gap-1">
								<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
								已找到您的信息，已自动填充
							</p>
						{/if}
					</div>
					<div>
						<label for="name" class="block text-sm font-medium text-gray-700 mb-1.5">
							姓名 <span class="text-red-400">*</span>
						</label>
						<input
							id="name"
							type="text"
							bind:value={customerName}
							placeholder="请输入姓名"
							class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
						/>
					</div>
					<div>
						<label for="gender" class="block text-sm font-medium text-gray-700 mb-1.5">性别</label>
						<div class="flex gap-3">
							{#each ['女', '男'] as g}
								<button
									onclick={() => { customerGender = g; }}
									class="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all {customerGender === g
										? 'bg-gradient-to-r from-primary to-primary-light text-white shadow-md'
										: 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-pink-50'}"
								>
									{g}
								</button>
							{/each}
						</div>
					</div>
					<div>
						<label for="birthday" class="block text-sm font-medium text-gray-700 mb-1.5">生日</label>
						<input
							id="birthday"
							type="date"
							bind:value={customerBirthday}
							class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
						/>
					</div>
					<div>
						<label for="remark" class="block text-sm font-medium text-gray-700 mb-1.5">备注</label>
						<textarea
							id="remark"
							bind:value={remark}
							placeholder="如有特殊需求请备注"
							rows="3"
							class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
						></textarea>
					</div>
				</div>

			{:else if step === 5}
				<h2 class="text-xl font-bold text-gray-900 mb-6">确认预约信息</h2>
				<div class="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-6 space-y-4">
					<div class="flex justify-between items-center pb-4 border-b border-pink-200/50">
						<span class="text-gray-500">服务项目</span>
						<span class="font-semibold text-gray-900">{selectedService?.name}</span>
					</div>
					<div class="flex justify-between items-center pb-4 border-b border-pink-200/50">
						<span class="text-gray-500">服务价格</span>
						<span class="font-semibold text-primary text-lg">{selectedService ? formatPrice(selectedService.price) : ''}</span>
					</div>
					<div class="flex justify-between items-center pb-4 border-b border-pink-200/50">
						<span class="text-gray-500">服务时长</span>
						<span class="font-semibold text-gray-900">{selectedService?.duration}分钟</span>
					</div>
					<div class="flex justify-between items-center pb-4 border-b border-pink-200/50">
						<span class="text-gray-500">指定技师</span>
						<div class="flex items-center gap-2">
							{#if selectedTechnician?.avatar}
								<img src={selectedTechnician.avatar} alt="" class="w-6 h-6 rounded-full object-cover" />
							{:else}
								<div class="w-6 h-6 rounded-full bg-gradient-to-br from-primary-light to-primary flex items-center justify-center text-white text-xs font-bold">
									{selectedTechnician?.name?.[0] ?? '?'}
								</div>
							{/if}
							<span class="font-semibold text-gray-900">{selectedTechnician?.name}</span>
						</div>
					</div>
					<div class="flex justify-between items-center pb-4 border-b border-pink-200/50">
						<span class="text-gray-500">预约日期</span>
						<span class="font-semibold text-gray-900">{appointmentDate}</span>
					</div>
					<div class="flex justify-between items-center pb-4 border-b border-pink-200/50">
						<span class="text-gray-500">预约时间</span>
						<span class="font-semibold text-gray-900">{appointmentTime}</span>
					</div>
					<div class="flex justify-between items-center pb-4 border-b border-pink-200/50">
						<span class="text-gray-500">客户姓名</span>
						<span class="font-semibold text-gray-900">{customerName}</span>
					</div>
					<div class="flex justify-between items-center pb-4 border-b border-pink-200/50">
						<span class="text-gray-500">联系电话</span>
						<span class="font-semibold text-gray-900">{customerPhone}</span>
					</div>
					{#if remark}
						<div class="flex justify-between items-start">
							<span class="text-gray-500 shrink-0">备注</span>
							<span class="font-medium text-gray-900 text-right">{remark}</span>
						</div>
					{/if}
				</div>
			{/if}

			<div class="flex items-center justify-between mt-8 pt-6 border-t border-pink-100">
				{#if step > 1}
					<button
						onclick={prevStep}
						class="px-6 py-2.5 rounded-full text-gray-600 hover:text-primary hover:bg-pink-50 font-medium transition-all"
					>
						← 上一步
					</button>
				{:else}
					<div></div>
				{/if}

				{#if step < 5}
					<button
						onclick={nextStep}
						disabled={!canProceed()}
						class="px-8 py-2.5 rounded-full bg-gradient-to-r from-primary to-primary-light text-white font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
					>
						下一步
					</button>
				{:else}
					<button
						onclick={submitAppointment}
						disabled={submitting}
						class="px-8 py-2.5 rounded-full bg-gradient-to-r from-primary to-primary-light text-white font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
					>
						{submitting ? '提交中...' : '确认预约'}
					</button>
				{/if}
			</div>
		</div>
	{/if}
</div>
