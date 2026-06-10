import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function DataTable({ columns, data, loading, total, page, pageSize, onPageChange, onPageSizeChange, rowKey, actions, emptyText = '暂无数据', }) {
    const totalPages = Math.ceil(total / pageSize);
    const handlePrev = () => {
        if (page > 1)
            onPageChange(page - 1);
    };
    const handleNext = () => {
        if (page < totalPages)
            onPageChange(page + 1);
    };
    const renderPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        let start = Math.max(1, page - Math.floor(maxVisible / 2));
        let end = Math.min(totalPages, start + maxVisible - 1);
        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    };
    return (_jsxs("div", { className: "bg-white rounded-lg shadow overflow-hidden", children: [_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [columns.map((col) => (_jsx("th", { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", style: { width: col.width }, children: col.title }, col.key))), actions && (_jsx("th", { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "\u64CD\u4F5C" }))] }) }), _jsx("tbody", { className: "divide-y divide-gray-200", children: loading ? (_jsx("tr", { children: _jsx("td", { colSpan: columns.length + (actions ? 1 : 0), className: "px-4 py-12 text-center text-gray-500", children: "\u52A0\u8F7D\u4E2D..." }) })) : data.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: columns.length + (actions ? 1 : 0), className: "px-4 py-12 text-center text-gray-500", children: emptyText }) })) : (data.map((record, index) => (_jsxs("tr", { className: "hover:bg-gray-50", children: [columns.map((col) => (_jsx("td", { className: "px-4 py-3 text-sm text-gray-900", children: col.render ? col.render(record) : record[col.key] }, col.key))), actions && (_jsx("td", { className: "px-4 py-3 text-sm", children: _jsx("div", { className: "flex gap-2", children: actions(record) }) }))] }, rowKey ? rowKey(record) : index)))) })] }) }), _jsxs("div", { className: "px-4 py-3 border-t flex items-center justify-between", children: [_jsxs("div", { className: "text-sm text-gray-500", children: ["\u5171 ", total, " \u6761\uFF0C\u7B2C ", page, " / ", totalPages || 1, " \u9875"] }), _jsxs("div", { className: "flex items-center gap-2", children: [onPageSizeChange && (_jsxs("select", { value: pageSize, onChange: (e) => onPageSizeChange(Number(e.target.value)), className: "px-2 py-1 border border-gray-300 rounded text-sm", children: [_jsx("option", { value: 10, children: "10\u6761/\u9875" }), _jsx("option", { value: 20, children: "20\u6761/\u9875" }), _jsx("option", { value: 50, children: "50\u6761/\u9875" })] })), _jsxs("div", { className: "flex gap-1", children: [_jsx("button", { onClick: handlePrev, disabled: page <= 1, className: "px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50", children: "\u4E0A\u4E00\u9875" }), renderPageNumbers().map((p) => (_jsx("button", { onClick: () => onPageChange(p), className: `px-3 py-1 border rounded text-sm ${p === page
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'border-gray-300 hover:bg-gray-50'}`, children: p }, p))), _jsx("button", { onClick: handleNext, disabled: page >= totalPages, className: "px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50", children: "\u4E0B\u4E00\u9875" })] })] })] })] }));
}
