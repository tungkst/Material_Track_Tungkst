import { useState, useMemo, Fragment } from 'react';
import { Material, MaterialStatus } from '../data/materials';
import { Search, Filter, Eye, Plus, Edit2, Trash2, Printer, X, Layers, MapPin, HardHat, Truck, Activity, ChevronDown, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { Listbox, Transition } from '@headlessui/react';

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
  const [supplierFilter, setSupplierFilter] = useState<string>('All');
  const [contractorFilter, setContractorFilter] = useState<string>('All');
  const [areaFilter, setAreaFilter] = useState<string>('All');

  const [showFilters, setShowFilters] = useState(true);

  const categories = useMemo(() => {
    const cats = new Set(materials.map((m) => m.category).filter(Boolean));
    return ['All', ...Array.from(cats).sort()];
  }, [materials]);

  const suppliers = useMemo(() => {
    const sups = new Set(materials.map((m) => m.supplier).filter(Boolean));
    return ['All', ...Array.from(sups).sort()];
  }, [materials]);

  const contractors = useMemo(() => {
    const cons = new Set(materials.map((m) => m.contractor).filter(Boolean));
    return ['All', ...Array.from(cons).sort()];
  }, [materials]);

  const areas = useMemo(() => {
    const ars = new Set(materials.map((m) => m.area).filter(Boolean));
    return ['All', ...Array.from(ars).sort()];
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
      const matchesSupplier = supplierFilter === 'All' || m.supplier === supplierFilter;
      const matchesContractor = contractorFilter === 'All' || m.contractor === contractorFilter;
      const matchesArea = areaFilter === 'All' || m.area === areaFilter;

      return matchesSearch && matchesStatus && matchesCategory && matchesSupplier && matchesContractor && matchesArea;
    });
  }, [materials, search, statusFilter, categoryFilter, supplierFilter, contractorFilter, areaFilter]);

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

  const isFiltered = search !== '' || statusFilter !== 'All' || categoryFilter !== 'All' || supplierFilter !== 'All' || contractorFilter !== 'All' || areaFilter !== 'All';

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('All');
    setCategoryFilter('All');
    setSupplierFilter('All');
    setContractorFilter('All');
    setAreaFilter('All');
  };

  const FilterDropdown = ({ 
    label, 
    value, 
    onChange, 
    options, 
    icon: Icon 
  }: { 
    label: string; 
    value: string; 
    onChange: (val: string) => void; 
    options: string[]; 
    icon: any 
  }) => {
    return (
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1 flex items-center gap-1">
          <Icon className="w-3 h-3" /> {label}
        </label>
        <Listbox value={value} onChange={onChange}>
          <div className="relative">
            <Listbox.Button className="relative w-full cursor-pointer rounded-xl bg-white py-2.5 pl-3 pr-10 text-left border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 sm:text-sm shadow-sm transition-all hover:bg-gray-50/50">
              <span className="block truncate font-medium text-gray-700">
                {value === 'All' ? 'Tất cả' : value}
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
              </span>
            </Listbox.Button>
            <Transition
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
                {options.map((option, idx) => (
                  <Listbox.Option
                    key={idx}
                    className={({ active }) =>
                      cn(
                        "relative cursor-pointer select-none py-2 pl-10 pr-4 transition-colors",
                        active ? "bg-indigo-50 text-indigo-900" : "text-gray-900"
                      )
                    }
                    value={option}
                  >
                    {({ selected }) => (
                      <>
                        <span className={cn("block truncate", selected ? "font-semibold" : "font-normal")}>
                          {option === 'All' ? 'Tất cả' : option}
                        </span>
                        {selected ? (
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-600">
                            <Check className="h-4 w-4" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </div>
        </Listbox>
      </div>
    );
  };

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

      {/* Filters Section */}
      <div className="border-b border-gray-100 bg-gray-50/30 print:hidden">
        <div className="p-5 flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          <div className="flex items-center gap-4 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-96 group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-12 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 sm:text-sm transition-all shadow-sm"
                placeholder="Tìm kiếm mã, tên vật tư, nhà cung cấp..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-sm font-medium shadow-sm",
                showFilters 
                  ? "bg-indigo-50 border-indigo-200 text-indigo-700" 
                  : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
              )}
            >
              <Filter className="w-4 h-4" />
              {showFilters ? 'Ẩn bộ lọc' : 'Hiện bộ lọc'}
              {isFiltered && !showFilters && (
                <span className="flex h-2 w-2 rounded-full bg-indigo-600 ml-1"></span>
              )}
            </button>
          </div>
          
          <div className="flex flex-wrap gap-3 w-full lg:w-auto">
            {isFiltered && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
              >
                <X className="w-4 h-4" />
                Xóa lọc
              </button>
            )}
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-all text-sm font-medium shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Xuất PDF
            </button>
            <button
              onClick={onAdd}
              className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-all text-sm font-medium shadow-md shadow-indigo-200 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Thêm vật tư
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <FilterDropdown 
              label="Trạng thái" 
              value={statusFilter} 
              onChange={(val) => setStatusFilter(val as any)} 
              options={['All', 'Approved', 'Pending', 'Rejected', 'Omitted', 'No Sample Required']} 
              icon={Activity} 
            />
            <FilterDropdown 
              label="Hạng mục" 
              value={categoryFilter} 
              onChange={setCategoryFilter} 
              options={categories} 
              icon={Layers} 
            />
            <FilterDropdown 
              label="Khu vực" 
              value={areaFilter} 
              onChange={setAreaFilter} 
              options={areas} 
              icon={MapPin} 
            />
            <FilterDropdown 
              label="Nhà thầu" 
              value={contractorFilter} 
              onChange={setContractorFilter} 
              options={contractors} 
              icon={HardHat} 
            />
            <FilterDropdown 
              label="Nhà cung cấp" 
              value={supplierFilter} 
              onChange={setSupplierFilter} 
              options={suppliers} 
              icon={Truck} 
            />
          </div>
        )}
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
                Ngày Cấp Hàng Yêu Cầu
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
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {material.requiredDeliveryDate || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <span className={cn(
                      'px-2.5 py-1 inline-flex text-[10px] leading-4 font-bold rounded-lg border uppercase tracking-wider',
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
                <td colSpan={8} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="p-4 bg-gray-50 rounded-full">
                      <Search className="w-8 h-8 text-gray-300" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-base font-medium text-gray-900">Không tìm thấy vật tư</p>
                      <p className="text-sm text-gray-500 max-w-xs mx-auto">
                        Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm để tìm thấy kết quả mong muốn.
                      </p>
                    </div>
                    {(search || categoryFilter !== 'All' || contractorFilter !== 'All' || areaFilter !== 'All' || supplierFilter !== 'All' || statusFilter !== 'All') && (
                      <button
                        onClick={() => {
                          setSearch('');
                          setCategoryFilter('All');
                          setContractorFilter('All');
                          setAreaFilter('All');
                          setSupplierFilter('All');
                          setStatusFilter('All');
                        }}
                        className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-500"
                      >
                        Xóa tất cả bộ lọc
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
