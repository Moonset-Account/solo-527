document.addEventListener('alpine:init', () => {
    Alpine.data('dashboard', function() {
        return {
            filters: {
                startDate: '',
                endDate: '',
                excludeTrial: true,
                period: 'day'
            },
            metrics: {
                totalLossRate: 0,
                totalLossAmount: 0,
                abnormalStoreCount: 0,
                trialMaterialRatio: 0,
                comparedToLastPeriod: {
                    lossRate: 0,
                    lossAmount: 0
                }
            },
            trendData: [],
            storeRanking: [],
            materialRanking: [],
            loading: true,
            chartInstances: {},

            init() {
                const range = getDateRange(30);
                this.filters.startDate = range.startDate;
                this.filters.endDate = range.endDate;
                this.loadData();
                this.$watch('filters', () => {
                    this.loadData();
                }, { deep: true });
            },

            async loadData() {
                this.loading = true;
                try {
                    await Promise.all([
                        this.loadMetrics(),
                        this.loadTrend(),
                        this.loadRanking()
                    ]);
                } catch (error) {
                    console.error('Failed to load dashboard data:', error);
                } finally {
                    this.loading = false;
                }
            },

            async loadMetrics() {
                const params = {
                    start_date: this.filters.startDate,
                    end_date: this.filters.endDate,
                    exclude_trial: this.filters.excludeTrial
                };
                const qs = buildQueryString(params);
                const response = await fetchAPI(`/api/v1/dashboard/metrics/?${qs}`);
                if (response.code === 200) {
                    this.metrics = response.data;
                }
            },

            async loadTrend() {
                const params = {
                    start_date: this.filters.startDate,
                    end_date: this.filters.endDate,
                    exclude_trial: this.filters.excludeTrial,
                    period: this.filters.period
                };
                const qs = buildQueryString(params);
                const response = await fetchAPI(`/api/v1/dashboard/trend/?${qs}`);
                if (response.code === 200) {
                    this.trendData = response.data;
                    this.renderTrendChart();
                }
            },

            async loadRanking() {
                const params = {
                    start_date: this.filters.startDate,
                    end_date: this.filters.endDate,
                    exclude_trial: this.filters.excludeTrial
                };
                const qs = buildQueryString(params);
                const [storeRes, materialRes] = await Promise.all([
                    fetchAPI(`/api/v1/dashboard/store_ranking/?${qs}`),
                    fetchAPI(`/api/v1/dashboard/material_ranking/?${qs}`)
                ]);
                if (storeRes.code === 200) {
                    this.storeRanking = storeRes.data;
                }
                if (materialRes.code === 200) {
                    this.materialRanking = materialRes.data;
                    this.renderMaterialChart();
                }
            },

            renderTrendChart() {
                const dom = document.getElementById('trendChart');
                if (!dom) return;
                
                if (this.chartInstances.trend) {
                    this.chartInstances.trend.dispose();
                }
                
                const chart = echarts.init(dom);
                this.chartInstances.trend = chart;
                
                const dates = this.trendData.map(d => d.date);
                const rates = this.trendData.map(d => d.lossRate);
                const amounts = this.trendData.map(d => d.lossAmount);
                
                const option = {
                    tooltip: {
                        trigger: 'axis',
                        axisPointer: { type: 'cross' }
                    },
                    legend: {
                        data: ['损耗率(%)', '损耗金额(元)'],
                        top: 0
                    },
                    grid: {
                        left: '3%',
                        right: '4%',
                        bottom: '3%',
                        containLabel: true
                    },
                    xAxis: {
                        type: 'category',
                        data: dates,
                        axisLabel: { rotate: 45, fontSize: 11 }
                    },
                    yAxis: [
                        {
                            type: 'value',
                            name: '损耗率(%)',
                            position: 'left',
                            axisLabel: { formatter: '{value}%' }
                        },
                        {
                            type: 'value',
                            name: '损耗金额(元)',
                            position: 'right',
                            axisLabel: { formatter: '¥{value}' }
                        }
                    ],
                    series: [
                        {
                            name: '损耗率(%)',
                            type: 'line',
                            data: rates,
                            smooth: true,
                            itemStyle: { color: COLORS.primary },
                            areaStyle: {
                                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                    { offset: 0, color: 'rgba(45, 90, 39, 0.3)' },
                                    { offset: 1, color: 'rgba(45, 90, 39, 0.05)' }
                                ])
                            }
                        },
                        {
                            name: '损耗金额(元)',
                            type: 'bar',
                            yAxisIndex: 1,
                            data: amounts,
                            itemStyle: { color: COLORS.warning }
                        }
                    ]
                };
                
                chart.setOption(option);
                window.addEventListener('resize', () => chart.resize());
            },

            renderMaterialChart() {
                const dom = document.getElementById('materialChart');
                if (!dom) return;
                
                if (this.chartInstances.material) {
                    this.chartInstances.material.dispose();
                }
                
                const chart = echarts.init(dom);
                this.chartInstances.material = chart;
                
                const data = this.materialRanking.slice(0, 10).reverse();
                
                const option = {
                    tooltip: {
                        trigger: 'axis',
                        axisPointer: { type: 'shadow' },
                        formatter: params => {
                            const item = params[0];
                            return `${item.name}<br/>损耗金额: ¥${formatNumber(item.value)}`;
                        }
                    },
                    grid: {
                        left: '3%',
                        right: '10%',
                        bottom: '3%',
                        containLabel: true
                    },
                    xAxis: {
                        type: 'value',
                        axisLabel: { formatter: '¥{value}' }
                    },
                    yAxis: {
                        type: 'category',
                        data: data.map(d => d.name),
                        axisLabel: { fontSize: 12 }
                    },
                    series: [{
                        type: 'bar',
                        data: data.map(d => ({
                            value: d.lossAmount,
                            itemStyle: {
                                color: d.isTrial ? COLORS.trial : COLORS.primary
                            }
                        })),
                        barWidth: 16,
                        label: {
                            show: true,
                            position: 'right',
                            formatter: '¥{c}',
                            fontSize: 11
                        }
                    }]
                };
                
                chart.setOption(option);
                window.addEventListener('resize', () => chart.resize());
            }
        };
    });
});
