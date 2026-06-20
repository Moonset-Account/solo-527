import { Table } from 'antd'

const CommonTable = ({ loading, columns, dataSource, pagination, rowKey = 'id', ...rest }) => {
  const defaultPagination = {
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total) => `共 ${total} 条记录`,
    pageSizeOptions: ['10', '20', '50', '100'],
    ...pagination
  }

  return (
    <Table
      loading={loading}
      columns={columns}
      dataSource={dataSource}
      pagination={pagination !== false ? defaultPagination : false}
      rowKey={rowKey}
      scroll={{ x: 'max-content' }}
      {...rest}
    />
  )
}

export default CommonTable
