const buildings = [
  { left: '2%', width: 40, height: 80 },
  { left: '6%', width: 30, height: 120 },
  { left: '10%', width: 50, height: 60 },
  { left: '16%', width: 35, height: 150 },
  { left: '21%', width: 45, height: 90 },
  { left: '27%', width: 55, height: 180 },
  { left: '34%', width: 30, height: 110 },
  { left: '38%', width: 60, height: 70 },
  { left: '45%', width: 40, height: 160 },
  { left: '51%', width: 50, height: 100 },
  { left: '57%', width: 35, height: 200 },
  { left: '62%', width: 45, height: 130 },
  { left: '68%', width: 55, height: 85 },
  { left: '74%', width: 30, height: 170 },
  { left: '79%', width: 50, height: 95 },
  { left: '85%', width: 40, height: 140 },
  { left: '90%', width: 35, height: 110 },
  { left: '95%', width: 45, height: 75 },
]

const particles = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  size: 2 + Math.random() * 3,
  duration: 4 + Math.random() * 6,
  delay: Math.random() * 8,
  color: Math.random() > 0.5 ? '#00ff88' : '#ff8800',
  startBottom: 20 + Math.random() * 30,
}))

export default function MenuBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #0a0e1a 0%, #0d1526 60%, #111b33 100%)',
        }}
      />

      <div className="absolute bottom-0 left-0 right-0 flex items-end" style={{ height: 220 }}>
        {buildings.map((b, i) => (
          <div
            key={i}
            className="absolute bottom-0"
            style={{
              left: b.left,
              width: b.width,
              height: b.height,
              backgroundColor: '#070b14',
              borderTop: '1px solid rgba(0,255,136,0.08)',
            }}
          >
            {Array.from({ length: Math.floor(b.height / 20) }, (_, row) => (
              <div
                key={row}
                className="flex justify-evenly"
                style={{ height: 20, padding: '4px 6px' }}
              >
                {Array.from({ length: Math.floor(b.width / 12) }, (_, col) => (
                  <div
                    key={col}
                    style={{
                      width: 4,
                      height: 6,
                      backgroundColor:
                        Math.random() > 0.6
                          ? 'rgba(255,136,0,0.4)'
                          : 'rgba(0,255,136,0.25)',
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>

      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: p.left,
            bottom: `${p.startBottom}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            opacity: 0,
            animation: `menuFloatUp ${p.duration}s ${p.delay}s infinite ease-out`,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
          }}
        />
      ))}

      <style>{`
        @keyframes menuFloatUp {
          0% {
            opacity: 0;
            transform: translateY(0) scale(1);
          }
          15% {
            opacity: 0.8;
          }
          80% {
            opacity: 0.3;
          }
          100% {
            opacity: 0;
            transform: translateY(-300px) scale(0.5);
          }
        }
      `}</style>
    </div>
  )
}
