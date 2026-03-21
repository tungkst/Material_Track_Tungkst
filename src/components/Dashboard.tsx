import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Material, MaterialStatus, ProcurementStatus } from '../data/materials';
import { Milestone } from '../data/milestones';
import { CheckCircle2, XCircle, Clock, FileQuestion, CalendarDays, AlertTriangle, Truck, Package, ShoppingCart, Timer, Flag } from 'lucide-react';
import { cn } from '../lib/utils';

interface DashboardProps {
  materials: Material[];
  milestones?: Milestone[];
  onNavigateToSchedule?: () => void;
}

const COLORS = {
  Approved: '#10b981', // emerald-500
  'Approved as Noted': '#84cc16', // lime-500
  'Revise & Resubmit': '#f97316', // orange-500
  Rejected: '#ef4444', // red-500
  Pending: '#f59e0b', // amber-500
  Omitted: '#6b7280', // gray-500
  'No Sample Required': '#3b82f6', // blue-500
};

const PROCUREMENT_COLORS = {
  'Not Ordered': '#94a3b8', // slate-400
  Ordered: '#3b82f6', // blue-500
  'In Transit': '#8b5cf6', // violet-500
  Received: '#10b981', // emerald-500
};

export function Dashboard({ materials, milestones = [], onNavigateToSchedule }: DashboardProps) {
  const stats = useMemo(() => {
    const total = materials.length;
    const approved = materials.filter((m) => m.status === 'Approved').length;
    const approvedAsNoted = materials.filter((m) => m.status === 'Approved as Noted').length;
    const reviseResubmit = materials.filter((m) => m.status === 'Revise & Resubmit').length;
    const pending = materials.filter((m) => m.status === 'Pending').length;
    const omitted = materials.filter((m) => m.status === 'Omitted').length;
    const noSample = materials.filter((m) => m.status === 'No Sample Required').length;

    // Overdue calculation: Pending and requiredDeliveryDate is in the past
    const today = new Date();
    const overdue = materials.filter((m) => {
      if (m.status !== 'Pending' || !m.requiredDeliveryDate || typeof m.requiredDeliveryDate !== 'string') return false;
      const parts = m.requiredDeliveryDate.split('/');
      if (parts.length !== 3) return false;
      const [day, month, year] = parts.map(Number);
      const deliveryDate = new Date(year, month - 1, day);
      return deliveryDate < today;
    }).length;

    return { total, approved, approvedAsNoted, reviseResubmit, pending, omitted, noSample, overdue };
  }, [materials]);

  const approachingMilestones = useMemo(() => {
    const today = new Date();
    // For demo/consistency with Schedule.tsx
    const demoToday = new Date(2026, 2, 15);

    return milestones.filter(ms => {
      if (ms.status === 'Completed' || !ms.date || typeof ms.date !== 'string') return false;
      const parts = ms.date.split('/');
      if (parts.length !== 3) return false;
      const [day, month, year] = parts.map(Number);
      const msDate = new Date(year, month - 1, day);
      const diffTime = msDate.getTime() - demoToday.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7;
    });
  }, [milestones]);

  const procurementStats = useMemo(() => {
    const counts: Record<ProcurementStatus, number> = {
      'Not Ordered': 0,
      Ordered: 0,
      'In Transit': 0,
      Received: 0,
    };
    materials.forEach((m) => {
      const status = m.procurementStatus || 'Not Ordered';
      counts[status]++;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [materials]);

  const quantityData = useMemo(() => {
    // Top 5 materials by BOQ quantity for comparison
    return materials
      .filter(m => m.boqQuantity)
      .sort((a, b) => (b.boqQuantity || 0) - (a.boqQuantity || 0))
      .slice(0, 5)
      .map(m => ({
        name: m.code,
        BOQ: m.boqQuantity || 0,
        Ordered: m.orderedQuantity || 0,
        Received: m.receivedQuantity || 0,
      }));
  }, [materials]);

  const upcomingMaterials = useMemo(() => {
    const today = new Date();
    const rangeEnd = new Date();
    rangeEnd.setDate(today.getDate() + 14);

    const parseDate = (dateStr: string | undefined) => {
      if (!dateStr || typeof dateStr !== 'string') return new Date(0);
      const parts = dateStr.split('/');
      if (parts.length !== 3) return new Date(0);
      const [d, m, y] = parts.map(Number);
      return new Date(y, m - 1, d);
    };

    return materials
      .filter(m => {
        if (!m.requiredDeliveryDate || m.procurementStatus === 'Received') return false;
        const deliveryDate = parseDate(m.requiredDeliveryDate);
        return deliveryDate >= today && deliveryDate <= rangeEnd;
      })
      .sort((a, b) => {
        return parseDate(a.requiredDeliveryDate).getTime() - parseDate(b.requiredDeliveryDate).getTime();
      })
      .slice(0, 5);
  }, [materials]);

  const statusData = useMemo(() => {
    return [
      { name: 'Approved', value: stats.approved },
      { name: 'Approved as Noted', value: stats.approvedAsNoted },
      { name: 'Revise & Resubmit', value: stats.reviseResubmit },
      { name: 'Pending', value: stats.pending },
      { name: 'Omitted', value: stats.omitted },
      { name: 'No Sample Required', value: stats.noSample },
    ].filter((d) => d.value > 0);
  }, [stats]);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">Tổng quan dự án</h2>
        <div className="flex items-center gap-4">
          {approachingMilestones.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg text-red-700 animate-pulse">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs font-bold">Cảnh báo: {approachingMilestones.length} mốc tiến độ sắp đến hạn!</span>
            </div>
          )}
          {onNavigateToSchedule && (
            <button
              onClick={onNavigateToSchedule}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg font-medium transition-colors"
            >
              <CalendarDays className="w-5 h-5" />
              Xem tiến độ dự án
            </button>
          )}
        </div>
      </div>

      {/* Main Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <FileQuestion className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Tổng số mẫu</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Đã phê duyệt</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.approved + stats.approvedAsNoted}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Đang chờ duyệt</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.pending}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-lg">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Tồn đọng (Quá hạn)</p>
            <p className="text-2xl font-semibold text-red-600">{stats.overdue}</p>
          </div>
        </div>
      </div>

      {/* Submittal & Procurement Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Submittal Status Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-indigo-500" />
            Trạng thái phê duyệt (Submittal Status)
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Procurement Status Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-indigo-500" />
            Trạng thái đặt hàng (Procurement Status)
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={procurementStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {procurementStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PROCUREMENT_COLORS[entry.name as keyof typeof PROCUREMENT_COLORS]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quantity Comparison & Upcoming Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quantity Comparison Bar Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-500" />
            So sánh khối lượng (BOQ vs Ordered vs Received)
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={quantityData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="BOQ" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Ordered" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Received" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Upcoming Material Alerts */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Cảnh báo vật tư tới hạn (7-14 ngày)
          </h3>
          <div className="space-y-4">
            {upcomingMaterials.length > 0 ? (
              upcomingMaterials.map((m) => (
                <div key={m.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-indigo-200 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">{m.code}</span>
                    <span className="text-xs font-medium text-amber-600 flex items-center gap-1">
                      <Timer className="w-3 h-3" />
                      {m.requiredDeliveryDate}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 truncate">{m.name}</p>
                  <p className="text-xs text-gray-500 mt-1">Lead-time: {m.leadTime || '-'} ngày</p>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <CheckCircle2 className="w-12 h-12 mb-2 opacity-20" />
                <p className="text-sm">Không có vật tư tới hạn</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Key Dates & Deadlines Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Milestones */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center gap-2">
            <Flag className="w-5 h-5 text-indigo-500" />
            Mốc tiến độ quan trọng (Project Milestones)
          </h3>
          <div className="space-y-4">
            {milestones.length > 0 ? (
              milestones
                .sort((a, b) => {
                  const parseDate = (dateStr: string) => {
                    if (!dateStr || typeof dateStr !== 'string') return new Date(0).getTime();
                    const parts = dateStr.split('/');
                    if (parts.length !== 3) return new Date(0).getTime();
                    const [d, m, y] = parts.map(Number);
                    return new Date(y, m - 1, d).getTime();
                  };
                  return parseDate(a.date) - parseDate(b.date);
                })
                .slice(0, 5)
                .map((ms) => (
                  <div key={ms.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        ms.status === 'Completed' ? "bg-emerald-100 text-emerald-600" : 
                        ms.status === 'Delayed' ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
                      )}>
                        <CalendarDays className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{ms.name}</p>
                        <p className="text-xs text-gray-500">{ms.type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-indigo-600">{ms.date}</p>
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-wider",
                        ms.status === 'Completed' ? "text-emerald-600" : 
                        ms.status === 'Delayed' ? "text-red-600" : "text-blue-600"
                      )}>
                        {ms.status}
                      </span>
                    </div>
                  </div>
                ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Flag className="w-12 h-12 mb-2 opacity-20" />
                <p className="text-sm">Chưa có mốc tiến độ nào</p>
              </div>
            )}
          </div>
        </div>

        {/* Material Deadlines */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center gap-2">
            <Timer className="w-5 h-5 text-indigo-500" />
            Thời hạn phê duyệt vật tư (Material Deadlines)
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã</th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên vật tư</th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hạn phê duyệt</th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {materials
                  .filter(m => m.latestApprovalDate && m.status === 'Pending')
                  .sort((a, b) => {
                    const parseDate = (dateStr: string | undefined) => {
                      if (!dateStr || typeof dateStr !== 'string') return new Date(0).getTime();
                      const parts = dateStr.split('/');
                      if (parts.length !== 3) return new Date(0).getTime();
                      const [d, m, y] = parts.map(Number);
                      return new Date(y, m - 1, d).getTime();
                    };
                    return parseDate(a.latestApprovalDate) - parseDate(b.latestApprovalDate);
                  })
                  .slice(0, 5)
                  .map((m) => (
                    <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-2 py-3 whitespace-nowrap text-xs font-bold text-indigo-600">{m.code}</td>
                      <td className="px-2 py-3 whitespace-nowrap text-xs text-gray-900 truncate max-w-[120px]">{m.name}</td>
                      <td className="px-2 py-3 whitespace-nowrap text-xs font-medium text-red-600">{m.latestApprovalDate}</td>
                      <td className="px-2 py-3 whitespace-nowrap">
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100">
                          {m.status}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

