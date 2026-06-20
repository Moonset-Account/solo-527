import { Card } from 'antd'

const StatCard = ({ title, value, prefix, suffix, extra, style }) => {
  return (
    <Card style={{ borderRadius: 8, ...style }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ color: '#8c8c8c', fontSize: 14, marginBottom: 8 }}>{title}</div>
          <div style={{ fontSize: 28, fontWeight: 600, color: '#262626' }}>
            {prefix && <span style={{ fontSize: 18, marginRight: 4 }}>{prefix}</span>}
            {value}
            {suffix && <span style={{ fontSize: 14, color: '#8c8c8c', marginLeft: 4 }}>{suffix}</span>}
          </div>
        </div>
        {extra && <div>{extra}</div>}
      </div>
    </Card>
  )
}

export default StatCard
