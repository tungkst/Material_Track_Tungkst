import { useState, useMemo } from 'react';
import { Material, MaterialStatus } from '../data/materials';
import { Search, Filter, Eye, Plus, Edit2, Trash2, Printer } from 'lucide-react';
import { cn } from '../lib/utils';

interface MaterialListProps {
  materials: Material[];
  onSelect: (material: Material) => void;
  onAdd: () => void;
  onEdit: (material: Material) => void;
  onDelete: (id: string) => void;
}

const statusColors: Record<MaterialStatus, string> = {
  Approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Rejected: 'bg-red-100 text-red-800 border-red-200',
  Pending: 'bg-amber-100 text-amber-800 border-amber-200',
  Omitted: 'bg-gray-100 text-gray-800 border-gray-200',
  'No Sample Required': 'bg-blue-100 text-blue-800 border-blue-200',
};

export function MaterialList({ materials, onSelect, onAdd, onEdit, onDelete }: MaterialListProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<MaterialStatus | 'All'>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  const categories = useMemo(() => {
    const cats = new Set(materials.map((m) => m.category));
    return ['All', ...Array.from(cats)];
  }, [materials]);

  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      const matchesSearch =
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.code.toLowerCase().includes(search.toLowerCase()) ||
        m.supplier.toLowerCase().includes(search.toLowerCase()) ||
        m.contractor.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'All' || m.status === statusFilter;
      const matchesCategory = categoryFilter === 'All' || m.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [materials, search, statusFilter, categoryFilter]);

  const statusSummary = useMemo(() => {
    const summary = {
      Approved: 0,
      Rejected: 0,
      Pending: 0,
      Omitted: 0,
      'No Sample Required': 0,
    };
    filteredMaterials.forEach((m) => {
      summary[m.status]++;
    });
    return summary;
  }, [filteredMaterials]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-full print:border-none print:shadow-none print:block">
      {/* Print Summary Table */}
      <div className="hidden print:block mb-8">
        <h2 className="text-xl font-bold mb-4 text-center">BẢNG TỔNG HỢP TRẠNG THÁI VẬT TƯ</h2>
        <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-center text-sm font-medium text-gray-500 border-r">Trạng thái</th>
              <th className="px-4 py-2 text-center text-sm font-medium text-gray-500 border-r">Đã duyệt</th>
              <th className="px-4 py-2 text-center text-sm font-medium text-gray-500 border-r">Từ chối</th>
              <th className="px-4 py-2 text-center text-sm font-medium text-gray-500 border-r">Chờ duyệt</th>
              <th className="px-4 py-2 text-center text-sm font-medium text-gray-500 border-r">Omitted</th>
              <th className="px-4 py-2 text-center text-sm font-medium text-gray-500 border-r">Không cần mẫu</th>
              <th className="px-4 py-2 text-center text-sm font-bold text-gray-900">Tổng cộng</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr>
              <td className="px-4 py-2 text-center text-sm font-medium text-gray-900 border-r">Số lượng</td>
              <td className="px-4 py-2 text-center text-sm text-gray-900 border-r">{statusSummary.Approved}</td>
              <td className="px-4 py-2 text-center text-sm text-gray-900 border-r">{statusSummary.Rejected}</td>
              <td className="px-4 py-2 text-center text-sm text-gray-900 border-r">{statusSummary.Pending}</td>
              <td className="px-4 py-2 text-center text-sm text-gray-900 border-r">{statusSummary.Omitted}</td>
              <td className="px-4 py-2 text-center text-sm text-gray-900 border-r">{statusSummary['No Sample Required']}</td>
              <td className="px-4 py-2 text-center text-sm font-bold text-gray-900">{filteredMaterials.length}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center print:hidden">
        <div className="relative w-full sm:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Tìm kiếm mã, tên vật tư, nhà cung cấp..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-4 w-full sm:w-auto">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium whitespace-nowrap"
          >
            <Printer className="w-4 h-4" />
            Xuất PDF
          </button>
          <button
            onClick={onAdd}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Thêm vật tư
          </button>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-200 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="All">Tất cả trạng thái</option>
              <option value="Approved">Đã phê duyệt</option>
              <option value="Pending">Đang chờ duyệt</option>
              <option value="Rejected">Bị từ chối</option>
              <option value="Omitted">Omitted</option>
              <option value="No Sample Required">Không cần mẫu</option>
            </select>
          </div>
          <select
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-200 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'All' ? 'Tất cả hạng mục' : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto flex-1 print:overflow-visible">
        <table className="min-w-full divide-y divide-gray-200 print:w-full">
          <thead className="bg-gray-50 sticky top-0 z-10 print:static">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mã / Tên Vật Tư
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hạng Mục
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nhà Thầu / NCC
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Người Cấp
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ngày Trình
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trạng Thái
              </th>
              <th scope="col" className="relative px-6 py-3 print:hidden">
                <span className="sr-only">Chi tiết</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredMaterials.map((material) => (
              <tr
                key={material.id}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onEdit(material)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">{material.code}</span>
                    <span className="text-sm text-gray-500 truncate max-w-xs">{material.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{material.category}</div>
                  <div className="text-xs text-gray-500">{material.area}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{material.contractor}</div>
                  <div className="text-xs text-gray-500">NCC: {material.supplier}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={cn(
                    "px-2 py-0.5 rounded text-xs font-medium",
                    material.providedBy === 'Client' ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                  )}>
                    {material.providedBy === 'Contractor' ? 'Nhà thầu' : material.providedBy === 'Client' ? 'Chủ đầu tư' : '-'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {material.submissionDate}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={cn(
                      'px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border',
                      statusColors[material.status]
                    )}
                  >
                    {material.status === 'Approved' && 'Đã duyệt'}
                    {material.status === 'Rejected' && 'Từ chối'}
                    {material.status === 'Pending' && 'Chờ duyệt'}
                    {material.status === 'Omitted' && 'Omitted'}
                    {material.status === 'No Sample Required' && 'Không cần mẫu'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium print:hidden">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm('Bạn có chắc chắn muốn xóa vật tư này?')) {
                          onDelete(material.id);
                        }
                      }}
                      className="text-gray-500 hover:text-red-600 flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" /> Xóa
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(material);
                      }}
                      className="text-gray-500 hover:text-indigo-600 flex items-center gap-1"
                    >
                      <Edit2 className="w-4 h-4" /> Sửa
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(material);
                      }}
                      className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" /> Chi tiết
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredMaterials.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  Không tìm thấy vật tư nào phù hợp với điều kiện lọc.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
