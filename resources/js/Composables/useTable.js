import { ref, reactive, computed, watch } from 'vue';

export function useTable(options = {}) {
    const rows = ref(options.initialData || []);
    const loading = ref(false);
    const search = ref('');
    const page = ref(options.initialPage || 1);
    const perPage = ref(options.perPage || 15);
    const lastPage = ref(1);
    const total = ref(0);
    const sortField = ref(options.sortField || 'id');
    const sortDirection = ref(options.sortDirection || 'desc');
    const selectedRows = ref([]);
    const filters = reactive({ ...(options.filters || {}) });

    const data = computed(() => rows.value);

    const sortedData = computed(() => {
        const sorted = [...rows.value];
        sorted.sort((a, b) => {
            let aVal = a[sortField.value];
            let bVal = b[sortField.value];

            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }

            if (aVal < bVal) return sortDirection.value === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDirection.value === 'asc' ? 1 : -1;
            return 0;
        });

        return sorted;
    });

    const filteredData = computed(() => {
        if (!search.value) return sortedData.value;

        const searchLower = search.value.toLowerCase();
        return sortedData.value.filter(row => {
            return Object.values(row).some(val => {
                if (val === null || val === undefined) return false;
                return String(val).toLowerCase().includes(searchLower);
            });
        });
    });

    const paginatedData = computed(() => {
        const start = (page.value - 1) * perPage.value;
        const end = start + perPage.value;
        return filteredData.value.slice(start, end);
    });

    const totalPages = computed(() => {
        return Math.ceil(filteredData.value.length / perPage.value);
    });

    const hasNextPage = computed(() => page.value < totalPages.value);
    const hasPreviousPage = computed(() => page.value > 1);

    const isAllSelected = computed(() => {
        return paginatedData.value.length > 0 &&
            paginatedData.value.every(row => selectedRows.value.includes(row.id));
    });

    const isSomeSelected = computed(() => {
        return selectedRows.value.length > 0 && !isAllSelected.value;
    });

    const sort = (field) => {
        if (sortField.value === field) {
            sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
        } else {
            sortField.value = field;
            sortDirection.value = 'asc';
        }
    };

    const toggleSort = (field) => {
        sort(field);
    };

    const nextPage = () => {
        if (hasNextPage.value) {
            page.value++;
        }
    };

    const previousPage = () => {
        if (hasPreviousPage.value) {
            page.value--;
        }
    };

    const goToPage = (pageNum) => {
        if (pageNum >= 1 && pageNum <= totalPages.value) {
            page.value = pageNum;
        }
    };

    const toggleSelectAll = () => {
        if (isAllSelected.value) {
            selectedRows.value = selectedRows.value.filter(
                id => !paginatedData.value.some(row => row.id === id)
            );
        } else {
            paginatedData.value.forEach(row => {
                if (!selectedRows.value.includes(row.id)) {
                    selectedRows.value.push(row.id);
                }
            });
        }
    };

    const toggleSelect = (id) => {
        const index = selectedRows.value.indexOf(id);
        if (index === -1) {
            selectedRows.value.push(id);
        } else {
            selectedRows.value.splice(index, 1);
        }
    };

    const clearSelection = () => {
        selectedRows.value = [];
    };

    const setData = (newData) => {
        rows.value = newData;
    };

    const setTotal = (value) => {
        total.value = value;
    };

    const setLastPage = (value) => {
        lastPage.value = value;
    };

    const reset = () => {
        search.value = '';
        page.value = 1;
        sortField.value = options.sortField || 'id';
        sortDirection.value = options.sortDirection || 'desc';
        selectedRows.value = [];
        Object.keys(filters).forEach(key => {
            filters[key] = options.filters?.[key] || '';
        });
    };

    watch(search, () => {
        page.value = 1;
    });

    watch(perPage, () => {
        page.value = 1;
    });

    return {
        rows,
        data,
        loading,
        search,
        page,
        perPage,
        lastPage,
        total,
        sortField,
        sortDirection,
        selectedRows,
        filters,
        sortedData,
        filteredData,
        paginatedData,
        totalPages,
        hasNextPage,
        hasPreviousPage,
        isAllSelected,
        isSomeSelected,
        sort,
        toggleSort,
        nextPage,
        previousPage,
        goToPage,
        toggleSelectAll,
        toggleSelect,
        clearSelection,
        setData,
        setTotal,
        setLastPage,
        reset,
    };
}
