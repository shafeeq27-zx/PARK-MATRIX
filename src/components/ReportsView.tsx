import React from 'react';
import { Printer } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { ParkingRecord, VehicleType } from '../types';

interface ReportsViewProps {
  records: ParkingRecord[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#0c0c0e] text-white p-3 rounded-none shadow-2xl border border-[#10b981] font-mono text-xs">
        <p className="font-bold text-zinc-300 mb-1 uppercase tracking-wider">{data.monthFull}</p>
        <div className="flex items-center justify-between gap-4">
          <span className="text-zinc-400">GROSS REVENUE:</span>
          <span className="font-bold text-[#10b981]">
            ${data.revenue.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 mt-1 text-[11px]">
          <span className="text-zinc-400">TOTAL CHECKOUTS:</span>
          <span className="text-white">
            {data.vehicleCount} vehicles
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export const ReportsView: React.FC<ReportsViewProps> = ({ records }) => {
  const currentYear = new Date().getFullYear();
  const completedRecords = records.filter(r => r.status === 'Completed' && r.fee !== undefined);
  const totalRevenue = completedRecords.reduce((acc, curr) => acc + (curr.fee || 0), 0);

  // 1. Monthly Revenue Aggregation for Current Year (Jan - Dec)
  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const monthlyData = MONTH_NAMES.map((name, index) => {
    const monthNum = (index + 1).toString().padStart(2, '0');
    const prefix = `${currentYear}-${monthNum}`;

    const monthRecords = completedRecords.filter(r => {
      const time = r.exit_time || r.entry_time;
      return time.startsWith(prefix);
    });

    const revenue = monthRecords.reduce((sum, r) => sum + (r.fee || 0), 0);
    const vehicleCount = monthRecords.length;

    return {
      month: name.toUpperCase(),
      monthFull: `${name.toUpperCase()} ${currentYear}`,
      monthNum,
      revenue: Math.round(revenue * 100) / 100,
      vehicleCount,
    };
  });

  const currentYearRevenue = monthlyData.reduce((acc, curr) => acc + curr.revenue, 0);
  const currentYearVehicles = monthlyData.reduce((acc, curr) => acc + curr.vehicleCount, 0);
  
  const maxRevenueVal = Math.max(...monthlyData.map(m => m.revenue));
  const peakMonth = monthlyData.find(m => m.revenue === maxRevenueVal && m.revenue > 0);

  // 2. Daily ledger aggregation
  const dailyLedger: Record<string, { count: number; revenue: number }> = {};
  completedRecords.forEach(r => {
    const day = r.exit_time?.substring(0, 10) || r.entry_time.substring(0, 10);
    if (!dailyLedger[day]) {
      dailyLedger[day] = { count: 0, revenue: 0 };
    }
    dailyLedger[day].count += 1;
    dailyLedger[day].revenue += r.fee || 0;
  });

  const sortedDays = Object.entries(dailyLedger).sort(
    (a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()
  );

  // 3. Category revenue aggregation
  const categoryRevenue: Record<VehicleType, { count: number; revenue: number }> = {
    Bike: { count: 0, revenue: 0 },
    Car: { count: 0, revenue: 0 },
    Van: { count: 0, revenue: 0 },
    Truck: { count: 0, revenue: 0 },
  };

  completedRecords.forEach(r => {
    if (categoryRevenue[r.vehicle_type]) {
      categoryRevenue[r.vehicle_type].count += 1;
      categoryRevenue[r.vehicle_type].revenue += r.fee || 0;
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="label-mono">Fiscal Metrics</div>
          <h2 className="text-xl font-bold font-mono tracking-tight text-white mt-0.5">
            Revenue Analytics & Annual Trends
          </h2>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 bg-[#10b981] hover:bg-[#059669] text-[#0c0c0e] font-mono text-xs font-bold px-3.5 py-2 uppercase tracking-wider transition-colors shadow-xs"
        >
          <Printer size={14} className="stroke-[3]" />
          <span>PRINT REPORT</span>
        </button>
      </div>

      {/* Top Metrics Grid with 1px hairline border gap */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-[1px] bg-white/10 border border-white/10">
        <div className="bg-[#0c0c0e] p-5">
          <div className="label-mono">Gross Revenue (All-Time)</div>
          <div className="font-mono text-2xl font-bold mt-1 text-[#10b981]">
            ${totalRevenue.toFixed(2)}
          </div>
          <p className="font-mono text-[10px] text-zinc-500 mt-1">{completedRecords.length} sessions settled</p>
        </div>

        <div className="bg-[#0c0c0e] p-5">
          <div className="label-mono">{currentYear} Annual Total</div>
          <div className="font-mono text-2xl font-bold mt-1 text-white">
            ${currentYearRevenue.toFixed(2)}
          </div>
          <p className="font-mono text-[10px] text-zinc-500 mt-1">{currentYearVehicles} checkouts</p>
        </div>

        <div className="bg-[#0c0c0e] p-5">
          <div className="label-mono">Avg Ticket Value</div>
          <div className="font-mono text-2xl font-bold mt-1 text-white">
            ${completedRecords.length > 0 ? (totalRevenue / completedRecords.length).toFixed(2) : '0.00'}
          </div>
          <p className="font-mono text-[10px] text-zinc-500 mt-1">Per parked vehicle</p>
        </div>

        <div className="bg-[#0c0c0e] p-5">
          <div className="label-mono">Peak Earning Month</div>
          <div className="font-mono text-2xl font-bold mt-1 text-[#10b981]">
            {peakMonth ? peakMonth.month : 'N/A'}
          </div>
          <p className="font-mono text-[10px] text-zinc-500 mt-1">
            {peakMonth ? `$${peakMonth.revenue.toFixed(2)} billed` : 'No data'}
          </p>
        </div>
      </div>

      {/* RECHARTS BAR CHART: Monthly Revenue Trends Over Current Year */}
      <div className="border border-white/10 bg-[#0c0c0e] p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-white/10 font-mono">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                MONTHLY REVENUE TRENDS ({currentYear})
              </h2>
              <span className="text-[10px] font-bold border border-[#10b981] text-[#10b981] px-1.5 py-0.2">
                RECHARTS
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Aggregated gross billing collections from database parking records
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-zinc-300">
              <span className="w-2.5 h-2.5 bg-[#10b981] inline-block"></span>
              <span>GROSS FEE ($)</span>
            </div>
            {peakMonth && (
              <span className="text-[11px] text-[#10b981]">
                PEAK: {peakMonth.month} (${peakMonth.revenue.toFixed(2)})
              </span>
            )}
          </div>
        </div>

        {/* Chart Viewport */}
        <div className="w-full h-72 sm:h-80 font-mono">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyData}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.08)" />
              <XAxis 
                dataKey="month" 
                tickLine={false} 
                axisLine={{ stroke: 'rgba(255, 255, 255, 0.15)' }} 
                tick={{ fill: '#a1a1aa', fontSize: 11, fontFamily: 'monospace' }}
              />
              <YAxis 
                tickLine={false} 
                axisLine={false} 
                tick={{ fill: '#a1a1aa', fontSize: 11, fontFamily: 'monospace' }} 
                tickFormatter={(val: number) => `$${val}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="revenue" 
                radius={[2, 2, 0, 0]} 
                maxBarSize={40}
              >
                {monthlyData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.revenue === maxRevenueVal && maxRevenueVal > 0 ? '#10b981' : 'rgba(16, 185, 129, 0.65)'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between text-xs font-mono text-zinc-400 gap-2">
          <span>
            ANNUAL GROSS TOTAL ({currentYear}): <strong className="text-white">${currentYearRevenue.toFixed(2)}</strong>
          </span>
          <span className="text-[11px] text-zinc-500 uppercase">
            SOURCE: SQLITE `parking_records`
          </span>
        </div>
      </div>

      {/* Category Breakdown & Audit Ledgers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Vehicle Category */}
        <div className="border border-white/10 bg-[#0c0c0e] p-5 font-mono">
          <div className="label-mono mb-1">Vehicle Classification</div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Tariff Share by Vehicle Type</h2>
          <div className="space-y-4">
            {(Object.keys(categoryRevenue) as VehicleType[]).map(cat => {
              const item = categoryRevenue[cat];
              const pct = totalRevenue > 0 ? Math.round((item.revenue / totalRevenue) * 100) : 0;
              return (
                <div key={cat} className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="font-bold text-zinc-200">{cat}</span>
                    <span className="text-zinc-400">
                      ${item.revenue.toFixed(2)} ({pct}%) · {item.count} checkouts
                    </span>
                  </div>
                  <div className="h-1 bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-[#10b981]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Daily Audit Table */}
        <div className="border border-white/10 bg-[#0c0c0e] overflow-hidden font-mono">
          <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between bg-white/5">
            <span className="label-mono">Recent Daily Ledger</span>
            <span className="text-[10px] text-zinc-500 uppercase">AUDIT TRAIL</span>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 text-zinc-400 font-bold border-b border-white/10 text-[10px] uppercase">
              <tr>
                <th className="px-4 py-2.5">DATE</th>
                <th className="px-4 py-2.5">VEHICLES</th>
                <th className="px-4 py-2.5 text-right">REVENUE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sortedDays.slice(0, 6).map(([day, val]) => (
                <tr key={day} className="hover:bg-white/5">
                  <td className="px-4 py-2.5 text-zinc-300">{day}</td>
                  <td className="px-4 py-2.5 text-zinc-400">{val.count}</td>
                  <td className="px-4 py-2.5 font-bold text-[#10b981] text-right">
                    ${val.revenue.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
