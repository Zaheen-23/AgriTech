import { useMemo, useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

const LIMITS = { nitrogen: 35, phosphorus: 25, potassium: 30 };
const tip = {
  contentStyle: { background: '#122019', border: '1px solid #2b4030', borderRadius: 10, color: '#fff' },
  itemStyle: { color: '#fff' },
  labelStyle: { color: '#a3e635' }
};
const box = { background: '#122019', border: '1px solid #263b2c', borderRadius: 18, padding: 20 };
const axis = { stroke: '#8fa292', fontSize: 12 };

function ChartBox({ title, note, children }) {
  return (
    <div style={box}>
      <h4 style={{ margin: 0, fontSize: 17, color: '#d8f5cf' }}>{title}</h4>
      <p className="ag-muted" style={{ fontSize: 12, margin: '4px 0 14px' }}>{note}</p>
      <div style={{ height: 260 }}>{children}</div>
    </div>
  );
}

function SoilCharts({ reports, farms }) {
  const [farmId, setFarmId] = useState('all');

  const list = useMemo(
    () => reports.filter((r) => farmId === 'all' || String(r.farm?._id) === farmId),
    [reports, farmId]
  );

  if (reports.length === 0) return null;

  const latest = list[0]; // reports are sorted newest first

  let content = (
    <div className="ag-empty">No reports for this farm yet.</div>
  );

  if (latest) {
    const barData = [
      { name: 'Nitrogen', 'Your soil': latest.nitrogen, Needed: LIMITS.nitrogen },
      { name: 'Phosphorus', 'Your soil': latest.phosphorus, Needed: LIMITS.phosphorus },
      { name: 'Potassium', 'Your soil': latest.potassium, Needed: LIMITS.potassium }
    ];

    const trend = [...list].reverse().map((r) => ({
      date: new Date(r.testedAt).toLocaleDateString(),
      N: r.nitrogen,
      P: r.phosphorus,
      K: r.potassium
    }));

    let ok = 0;
    let low = 0;
    list.forEach((r) => {
      [
        [r.nitrogen, LIMITS.nitrogen],
        [r.phosphorus, LIMITS.phosphorus],
        [r.potassium, LIMITS.potassium]
      ].forEach(([v, min]) => (v < min ? low++ : ok++));
    });
    const pieData = [
      { name: 'Optimal', value: ok, color: '#a3e635' },
      { name: 'Low', value: low, color: '#f59e0b' }
    ].filter((d) => d.value > 0);

    const radarData = [
      { nutrient: 'Nitrogen', Yours: Math.min(200, Math.round((latest.nitrogen / LIMITS.nitrogen) * 100)), Needed: 100 },
      { nutrient: 'Phosphorus', Yours: Math.min(200, Math.round((latest.phosphorus / LIMITS.phosphorus) * 100)), Needed: 100 },
      { nutrient: 'Potassium', Yours: Math.min(200, Math.round((latest.potassium / LIMITS.potassium) * 100)), Needed: 100 }
    ];

    content = (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 }}>
        <ChartBox title="Latest soil vs needed" note={`Bar chart, latest report (pH ${latest.pHLevel})`}>
          <ResponsiveContainer>
            <BarChart data={barData}>
              <CartesianGrid stroke="#263b2c" strokeDasharray="3 3" />
              <XAxis dataKey="name" {...axis} />
              <YAxis {...axis} />
              <Tooltip {...tip} />
              <Legend />
              <Bar dataKey="Your soil" fill="#a3e635" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Needed" fill="#38bdf8" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>

        <ChartBox title="Nutrient trend" note="Line chart, how N, P and K changed over time">
          <ResponsiveContainer>
            <LineChart data={trend}>
              <CartesianGrid stroke="#263b2c" strokeDasharray="3 3" />
              <XAxis dataKey="date" {...axis} />
              <YAxis {...axis} />
              <Tooltip {...tip} />
              <Legend />
              <Line type="monotone" dataKey="N" stroke="#a3e635" strokeWidth={2} dot />
              <Line type="monotone" dataKey="P" stroke="#38bdf8" strokeWidth={2} dot />
              <Line type="monotone" dataKey="K" stroke="#f59e0b" strokeWidth={2} dot />
            </LineChart>
          </ResponsiveContainer>
        </ChartBox>

        <ChartBox title="Nutrient health" note="Pie chart, how many readings are optimal or low">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                {pieData.map((d) => (
                  <Cell key={d.name} fill={d.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip {...tip} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartBox>

        <ChartBox title="Soil balance" note="Radar chart, 100 means the minimum needed">
          <ResponsiveContainer>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#263b2c" />
              <PolarAngleAxis dataKey="nutrient" stroke="#bdcdbf" fontSize={12} />
              <PolarRadiusAxis stroke="#8fa292" fontSize={10} />
              <Radar name="Needed" dataKey="Needed" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.15} />
              <Radar name="Yours" dataKey="Yours" stroke="#a3e635" fill="#a3e635" fillOpacity={0.35} />
              <Legend />
              <Tooltip {...tip} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartBox>
      </div>
    );
  }

  return (
    <section style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
        <h3 className="ag-section-title" style={{ margin: 0 }}>Soil graphs</h3>
        <select
          className="ag-input"
          style={{ width: 'auto', minWidth: 200 }}
          value={farmId}
          onChange={(e) => setFarmId(e.target.value)}
        >
          <option value="all">All farms</option>
          {farms.map((f) => (
            <option key={f._id} value={f._id}>{f.farmName}</option>
          ))}
        </select>
      </div>
      {content}
    </section>
  );
}

export default SoilCharts;