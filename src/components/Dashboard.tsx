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
import { Material } from '../data/materials';
import { CheckCircle2, XCircle, Clock, FileQuestion } from 'lucide-react';

interface DashboardProps {
  materials: Material[];
}

const COLORS = {
  Approved: '#10b981', // emerald-500
  Rejected: '#ef4444', // red-500
  Pending: '#f59e0b', // amber-500
  Omitted: '#6b7280', // gray-500
  'No Sample Required': '#3b82f6', // blue-500
};

export function Dashboard({ materials }: DashboardProps) {
  const stats = useMemo(() => {
    const total = materials.length;
    const approved = materials.filter((m) => m.status === 'Approved').length;
    const rejected = materials.filter((m) => m.status === 'Rejected').length;
    const pending = materials.filter((m) => m.status === 'Pending').length;
    const omitted = materials.filter((m) => m.status === 'Omitted').length;
    const noSample = materials.filter((m) => m.status === 'No Sample Required').length;

    return { total, approved, rejected, pending, omitted, noSample };
  }, [materials]);

  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    materials.forEach((m) => {
      counts[m.category] = (counts[m.category] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [materials]);

  const statusData = useMemo(() => {
    return [
      { name: 'Approved', value: stats.approved },
      { name: 'Rejected', value: stats.rejected },
      { name: 'Pending', value: stats.pending },
      { name: 'Omitted', value: stats.omitted },
      { name: 'No Sample', value: stats.noSample },
    ].filter((d) => d.value > 0);
  }, [stats]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">Tổng quan dự án</h2>

      {/* Stat Cards */}
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
            <p className="text-2xl font-semibold text-gray-900">{stats.approved}</p>
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
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Bị từ chối</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.rejected}</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Trạng thái phê duyệt</h3>
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

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Phân bố theo hạng mục</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
