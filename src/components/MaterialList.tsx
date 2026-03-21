import { useState, useMemo, Fragment, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Material, MaterialStatus } from '../data/materials';
import { Search, Filter, Eye, Plus, Edit2, Trash2, Printer, X, Layers, MapPin, HardHat, Truck, Activity, ChevronDown, Check, ChevronLeft, ChevronRight, Settings2, Download } from 'lucide-react';
import { cn } from '../lib/utils';
import { Listbox, Transition, Popover, Dialog } from '@headlessui/react';
import { ConfirmModal } from './ConfirmModal';

interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
}

interface MaterialListProps {
  materials: Material[];
  onSelect: (material: Material) => void;
  onAdd: () => void;
  onEdit: (material: Material, list: Material[]) => void;
  onDelete: (id: string) => void;
  onUpdateCode?: (id: string, newCode: string) => Promise<boolean>;
  onUpdateField?: (id: string, field: keyof Material, newValue: string) => Promise<boolean>;
}

const statusColors: Record<MaterialStatus, string> = {
  Approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Approved as Noted': 'bg-blue-100 text-blue-800 border-blue-200',
  'Revise & Resubmit': 'bg-orange-100 text-orange-800 border-orange-200',
  Rejected: 'bg-red-100 text-red-800 border-red-200',
  Pending: 'bg-amber-100 text-amber-800 border-amber-200',
  Omitted: 'bg-gray-100 text-gray-800 border-gray-200',
  'No Sample Required': 'bg-slate-100 text-slate-800 border-slate-200',
};

export function MaterialList({ materials, onSelect, onAdd, onEdit, onDelete, onUpdateCode, onUpdateField }: MaterialListProps) {
  const [search, setSearch] = useState('');
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState<MaterialStatus | 'All'>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [supplierFilter, setSupplierFilter] = useState<string>('All');
  const [contractorFilter, setContractorFilter] = useState<string>('All');
  const [areaFilter, setAreaFilter] = useState<string>('All');

  const [columns, setColumns] = useState<ColumnConfig[]>([
    { id: 'code_name', label: 'Mã / Tên Vật Tư', visible: true },
    { id: 'category_area', label: 'Hạng Mục / Khu vực', visible: true },
    { id: 'technical_specs', label: 'Thông số kỹ thuật', visible: true },
    { id: 'specs', label: 'Yêu cầu SPEC', visible: true },
    { id: 'notes', label: 'Ghi chú', visible: true },
    { id: 'contractor', label: 'Nhà Thầu', visible: true },
    { id: 'supplier', label: 'Nhà Cung Cấp', visible: true },
    { id: 'provided_by', label: 'Người Cấp', visible: true },
    { id: 'submission_date', label: 'Ngày Trình', visible: true },
    { id: 'required_delivery_date', label: 'Ngày Cấp Hàng Yêu Cầu', visible: true },
    { id: 'status', label: 'Trạng Thái', visible: true },
  ]);

  const toggleColumn = (id: string) => {
    setColumns(prev => prev.map(col => 
      col.id === id ? { ...col, visible: !col.visible } : col
    ));
  };

  const isColumnVisible = (id: string) => {
    return columns.find(col => col.id === id)?.visible ?? false;
  };

  const [showFilters, setShowFilters] = useState(false);

  const ITEMS_PER_PAGE = 50;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, categoryFilter, supplierFilter, contractorFilter, areaFilter]);

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
    const summary: Record<MaterialStatus, number> = {
      Approved: 0,
      'Approved as Noted': 0,
      'Revise & Resubmit': 0,
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

  const exportToExcel = () => {
    const visibleColumns = columns.filter(col => col.visible);
    
    const dataToExport = filteredMaterials.map(material => {
      const row: any = {};
      visibleColumns.forEach(col => {
        switch (col.id) {
          case 'code_name':
            row['Mã Vật Tư'] = material.code;
            row['Tên Vật Tư'] = material.name;
            break;
          case 'category_area':
            row['Hạng Mục'] = material.category;
            row['Khu vực'] = material.area;
            break;
          case 'technical_specs':
            row['Thông số kỹ thuật'] = material.technicalSpecs;
            break;
          case 'specs':
            row['Yêu cầu SPEC'] = material.specs;
            break;
          case 'notes':
            row['Ghi chú'] = material.notes;
            break;
          case 'contractor':
            row['Nhà Thầu'] = material.contractor;
            break;
          case 'supplier':
            row['Nhà Cung Cấp'] = material.supplier;
            break;
          case 'provided_by':
            row['Người Cấp'] = material.providedBy;
            break;
          case 'submission_date':
            row['Ngày Trình'] = material.submissionDate;
            break;
          case 'required_delivery_date':
            row['Ngày Cấp Hàng Yêu Cầu'] = material.requiredDeliveryDate;
            break;
          case 'status':
            row['Trạng Thái'] = material.status;
            break;
        }
      });
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Vật tư');
    XLSX.writeFile(workbook, 'TongHopVatTu.xlsx');
  };

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
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1 flex items-center gap-1">
          <Icon className="w-3 h-3" /> {label}
        </label>
        <Listbox value={value} onChange={onChange}>
          <div className="relative">
            <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-white py-1.5 pl-3 pr-8 text-left border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 sm:text-sm shadow-sm transition-all hover:bg-gray-50/50">
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
              <Listbox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
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

  const InlineEditCode = ({ material }: { material: Material }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(material.code);
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
      const trimmedValue = value.trim();
      if (trimmedValue === material.code) {
        setIsEditing(false);
        return;
      }
      if (!trimmedValue) {
        setError('Mã không được trống');
        return;
      }
      if (onUpdateCode) {
        setIsSaving(true);
        const success = await onUpdateCode(material.id, trimmedValue);
        setIsSaving(false);
        if (success) {
          setIsEditing(false);
          setError('');
        } else {
          setError('Mã đã tồn tại hoặc lỗi');
        }
      }
    };

    if (isEditing) {
      return (
        <div className="flex flex-col gap-1" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-2">
            <input
              autoFocus
              type="text"
              value={value}
              onChange={e => setValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') {
                  setIsEditing(false);
                  setValue(material.code);
                  setError('');
                }
              }}
              disabled={isSaving}
              className="border border-indigo-300 rounded px-2 py-1 text-xs w-32 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button onClick={handleSave} disabled={isSaving} className="text-emerald-600 hover:text-emerald-700 disabled:opacity-50">
              <Check className="w-4 h-4" />
            </button>
            <button onClick={() => { setIsEditing(false); setValue(material.code); setError(''); }} disabled={isSaving} className="text-gray-400 hover:text-gray-600 disabled:opacity-50">
              <X className="w-4 h-4" />
            </button>
          </div>
          {error && <span className="text-xs text-red-500 font-medium">{error}</span>}
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 group" onClick={e => e.stopPropagation()}>
        <span className="text-xs font-medium text-gray-900">{material.code}</span>
        <button 
          onClick={() => setIsEditing(true)} 
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-indigo-600 transition-opacity"
          title="Sửa mã vật tư"
        >
          <Edit2 className="w-3 h-3" />
        </button>
      </div>
    );
  };

  const InlineEditStatus = ({ material }: { material: Material }) => {
    const [isSaving, setIsSaving] = useState(false);

    const handleStatusChange = async (newStatus: MaterialStatus) => {
      if (newStatus === material.status) return;
      if (onUpdateField) {
        setIsSaving(true);
        await onUpdateField(material.id, 'status', newStatus);
        setIsSaving(false);
      }
    };

    return (
      <div onClick={e => e.stopPropagation()} className="relative">
        <Listbox value={material.status} onChange={handleStatusChange} disabled={isSaving}>
          <div className="relative">
            <Listbox.Button className={cn(
              'px-2.5 py-1 inline-flex text-[10px] leading-4 font-bold rounded-lg border uppercase tracking-wider cursor-pointer transition-all hover:ring-2 hover:ring-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed',
              statusColors[material.status]
            )}>
              {material.status === 'Approved' && 'Đã duyệt'}
              {material.status === 'Approved as Noted' && 'Duyệt kèm ghi chú'}
              {material.status === 'Revise & Resubmit' && 'Yêu cầu chỉnh sửa'}
              {material.status === 'Rejected' && 'Từ chối'}
              {material.status === 'Pending' && 'Chờ duyệt'}
              {material.status === 'Omitted' && 'Omitted'}
              {material.status === 'No Sample Required' && 'Không cần mẫu'}
              <ChevronDown className="ml-1 w-3 h-3 opacity-50" />
            </Listbox.Button>
            <Transition
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options className="absolute z-50 mt-1 max-h-60 w-56 overflow-auto rounded-lg bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm right-0">
                {(['Approved', 'Approved as Noted', 'Revise & Resubmit', 'Pending', 'Rejected', 'Omitted', 'No Sample Required'] as MaterialStatus[]).map((status) => (
                  <Listbox.Option
                    key={status}
                    className={({ active }) =>
                      cn(
                        "relative cursor-pointer select-none py-2 pl-10 pr-4 transition-colors",
                        active ? "bg-indigo-50 text-indigo-900" : "text-gray-900"
                      )
                    }
                    value={status}
                  >
                    {({ selected }) => (
                      <>
                        <span className={cn(
                          "block truncate px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border",
                          statusColors[status],
                          selected ? "ring-1 ring-indigo-500" : ""
                        )}>
                          {status === 'Approved' && 'Đã duyệt'}
                          {status === 'Approved as Noted' && 'Duyệt kèm ghi chú'}
                          {status === 'Revise & Resubmit' && 'Yêu cầu chỉnh sửa'}
                          {status === 'Rejected' && 'Từ chối'}
                          {status === 'Pending' && 'Chờ duyệt'}
                          {status === 'Omitted' && 'Omitted'}
                          {status === 'No Sample Required' && 'Không cần mẫu'}
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

  const InlineEditField = ({ material, field, placeholder = '-' }: { material: Material, field: keyof Material, placeholder?: string }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState((material[field] as string) || '');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
      const trimmedValue = value.trim();
      if (trimmedValue === ((material[field] as string) || '')) {
        setIsEditing(false);
        return;
      }
      if (onUpdateField) {
        setIsSaving(true);
        const success = await onUpdateField(material.id, field, trimmedValue);
        setIsSaving(false);
        if (success) {
          setIsEditing(false);
        }
      }
    };

    if (isEditing) {
      return (
        <div className="flex flex-col gap-1" onClick={e => e.stopPropagation()}>
          <div className="flex items-start gap-2">
            <textarea
              autoFocus
              value={value}
              onChange={e => setValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSave();
                }
                if (e.key === 'Escape') {
                  setIsEditing(false);
                  setValue((material[field] as string) || '');
                }
              }}
              disabled={isSaving}
              rows={2}
              className="border border-indigo-300 rounded px-2 py-1 text-xs w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
            <div className="flex flex-col gap-1">
              <button onClick={handleSave} disabled={isSaving} className="text-emerald-600 hover:text-emerald-700 disabled:opacity-50">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={() => { setIsEditing(false); setValue((material[field] as string) || ''); }} disabled={isSaving} className="text-gray-400 hover:text-gray-600 disabled:opacity-50">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-start gap-2 group" onClick={e => e.stopPropagation()}>
        <div className="text-xs text-gray-500 max-w-xs line-clamp-2" title={(material[field] as string)}>
          {(material[field] as string) || placeholder}
        </div>
        <button 
          onClick={() => setIsEditing(true)} 
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-indigo-600 transition-opacity mt-0.5 shrink-0"
          title="Chỉnh sửa"
        >
          <Edit2 className="w-3 h-3" />
        </button>
      </div>
    );
  };

  const totalPages = Math.ceil(filteredMaterials.length / ITEMS_PER_PAGE);
  const paginatedMaterials = filteredMaterials.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

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
              <th className="px-4 py-2 text-center text-sm font-medium text-gray-500 border-r">Duyệt kèm ghi chú</th>
              <th className="px-4 py-2 text-center text-sm font-medium text-gray-500 border-r">Yêu cầu chỉnh sửa</th>
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
              <td className="px-4 py-2 text-center text-sm text-gray-900 border-r">{statusSummary['Approved as Noted']}</td>
              <td className="px-4 py-2 text-center text-sm text-gray-900 border-r">{statusSummary['Revise & Resubmit']}</td>
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
        <div className="p-3 sm:p-4 flex flex-col md:flex-row gap-3 justify-between items-start md:items-center">
          <div className="flex flex-1 items-center gap-2 w-full">
            <div className="relative flex-1 group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
              </div>
              <input
                type="text"
                className="block w-full pl-9 pr-8 py-1.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 sm:text-sm transition-all shadow-sm"
                placeholder="Tìm kiếm mã, tên vật tư..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute inset-y-0 right-0 pr-2 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all text-sm font-medium shadow-sm whitespace-nowrap",
                showFilters 
                  ? "bg-indigo-50 border-indigo-200 text-indigo-700" 
                  : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
              )}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">{showFilters ? 'Ẩn lọc' : 'Lọc'}</span>
              {isFiltered && !showFilters && (
                <span className="flex h-2 w-2 rounded-full bg-indigo-600 ml-0.5"></span>
              )}
            </button>
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            {isFiltered && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors whitespace-nowrap"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Xóa lọc</span>
              </button>
            )}
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium shadow-sm whitespace-nowrap"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Xuất PDF</span>
            </button>
            <button
              onClick={exportToExcel}
              className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium shadow-sm whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Xuất Excel</span>
            </button>

            {/* Column Visibility Toggle */}
            <Popover className="relative">
              <Popover.Button className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium shadow-sm whitespace-nowrap">
                <Settings2 className="w-4 h-4" />
                <span className="hidden sm:inline">Cột hiển thị</span>
              </Popover.Button>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-200"
                enterFrom="opacity-0 translate-y-1"
                enterTo="opacity-100 translate-y-0"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-1"
              >
                <Popover.Panel className="absolute right-0 z-50 mt-2 w-64 origin-top-right rounded-xl bg-white p-4 shadow-xl ring-1 ring-black/5 focus:outline-none">
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-gray-900 border-b pb-2">Tùy chỉnh cột hiển thị</h3>
                    <div className="max-h-64 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                      {columns.map((col) => (
                        <label
                          key={col.id}
                          className="flex items-center gap-3 px-2 py-1.5 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={col.visible}
                            onChange={() => toggleColumn(col.id)}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700 font-medium">{col.label}</span>
                        </label>
                      ))}
                    </div>
                    <div className="pt-2 border-t flex justify-between">
                      <button 
                        onClick={() => setColumns(prev => prev.map(c => ({ ...c, visible: true })))}
                        className="text-xs text-indigo-600 font-bold hover:underline"
                      >
                        Hiện tất cả
                      </button>
                      <button 
                        onClick={() => setColumns(prev => prev.map(c => ({ ...c, visible: c.id === 'code_name' })))}
                        className="text-xs text-gray-500 font-bold hover:underline"
                      >
                        Ẩn bớt
                      </button>
                    </div>
                  </div>
                </Popover.Panel>
              </Transition>
            </Popover>

            <button
              onClick={onAdd}
              className="flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-all text-sm font-medium shadow-sm shadow-indigo-200 active:scale-95 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm mới</span>
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="px-3 sm:px-4 pb-3 sm:pb-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <FilterDropdown 
              label="Trạng thái" 
              value={statusFilter} 
              onChange={(val) => setStatusFilter(val as any)} 
              options={['All', 'Approved', 'Approved as Noted', 'Revise & Resubmit', 'Pending', 'Rejected', 'Omitted', 'No Sample Required']} 
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
              {isColumnVisible('code_name') && (
                <th scope="col" className="px-6 py-3 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider w-64">
                  Mã / Tên Vật Tư
                </th>
              )}
              {isColumnVisible('category_area') && (
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hạng Mục
                </th>
              )}
              {isColumnVisible('technical_specs') && (
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thông số kỹ thuật
                </th>
              )}
              {isColumnVisible('specs') && (
                <th scope="col" className="px-6 py-3 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider w-80">
                  Yêu cầu SPEC
                </th>
              )}
              {isColumnVisible('notes') && (
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ghi chú
                </th>
              )}
              {isColumnVisible('contractor') && (
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nhà Thầu
                </th>
              )}
              {isColumnVisible('supplier') && (
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nhà Cung Cấp
                </th>
              )}
              {isColumnVisible('provided_by') && (
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Người Cấp
                </th>
              )}
              {isColumnVisible('submission_date') && (
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày Trình
                </th>
              )}
              {isColumnVisible('required_delivery_date') && (
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày Cấp Hàng Yêu Cầu
                </th>
              )}
              {isColumnVisible('status') && (
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng Thái
                </th>
              )}
              <th scope="col" className="relative px-6 py-3 print:hidden">
                <span className="sr-only">Chi tiết</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedMaterials.map((material) => (
              <tr
                key={material.id}
                className="hover:bg-gray-50 cursor-pointer transition-colors select-none"
                onClick={() => onSelect(material)}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  onEdit(material, filteredMaterials);
                }}
              >
                {isColumnVisible('code_name') && (
                  <td className="px-6 py-4 whitespace-normal break-words">
                    <div className="flex items-center gap-3">
                      {(material.imageUrl || material.submittalImageUrl) && (
                        <div 
                          className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shrink-0 flex items-center justify-center cursor-zoom-in hover:ring-2 hover:ring-indigo-500 transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewImage({ 
                              url: (material.submittalImageUrl || material.imageUrl)!, 
                              title: material.name 
                            });
                          }}
                        >
                          <img 
                            src={material.submittalImageUrl || material.imageUrl} 
                            alt={material.name} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}
                      <div className="flex flex-col gap-1 overflow-hidden">
                        <InlineEditCode material={material} />
                        <span className="text-xs text-gray-500 truncate max-w-[150px]" title={material.name}>{material.name}</span>
                      </div>
                    </div>
                  </td>
                )}
                {isColumnVisible('category_area') && (
                  <td className="px-6 py-4 whitespace-normal break-words">
                    <div className="text-sm text-gray-900 truncate max-w-[120px]" title={material.category}>{material.category}</div>
                    <div className="text-xs text-gray-500 truncate max-w-[120px]" title={material.area}>{material.area}</div>
                  </td>
                )}
                {isColumnVisible('technical_specs') && (
                  <td className="px-6 py-4">
                    <InlineEditField material={material} field="technicalSpecs" />
                  </td>
                )}
                {isColumnVisible('specs') && (
                  <td className="px-6 py-4">
                    <InlineEditField material={material} field="specs" />
                  </td>
                )}
                {isColumnVisible('notes') && (
                  <td className="px-6 py-4">
                    <InlineEditField material={material} field="notes" />
                  </td>
                )}
                {isColumnVisible('contractor') && (
                  <td className="px-6 py-4 whitespace-normal break-words">
                    <div className="text-sm text-gray-900 truncate max-w-[120px]" title={material.contractor || ''}>{material.contractor || '-'}</div>
                  </td>
                )}
                {isColumnVisible('supplier') && (
                  <td className="px-6 py-4 whitespace-normal break-words">
                    <div className="text-sm text-gray-900 truncate max-w-[120px]" title={material.supplier || ''}>{material.supplier || '-'}</div>
                  </td>
                )}
                {isColumnVisible('provided_by') && (
                  <td className="px-6 py-4 whitespace-normal break-words">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-xs font-medium",
                      material.providedBy === 'Client' ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                    )}>
                      {material.providedBy === 'Contractor' ? 'Nhà thầu' : material.providedBy === 'Client' ? 'Chủ đầu tư' : '-'}
                    </span>
                  </td>
                )}
                {isColumnVisible('submission_date') && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {material.submissionDate}
                  </td>
                )}
                {isColumnVisible('required_delivery_date') && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {material.requiredDeliveryDate || '-'}
                  </td>
                )}
                {isColumnVisible('status') && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <InlineEditStatus material={material} />
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium print:hidden">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmId(material.id);
                      }}
                      className="text-gray-500 hover:text-red-600 flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" /> Xóa
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(material, filteredMaterials);
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
                <td colSpan={columns.filter(c => c.visible).length + 1} className="px-6 py-20 text-center">
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

      {/* Pagination UI */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-b-xl print:hidden">
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Hiển thị <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> đến{' '}
                <span className="font-medium">
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredMaterials.length)}
                </span>{' '}
                trong số <span className="font-medium">{filteredMaterials.length}</span> kết quả
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Trang trước</span>
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={cn(
                          "relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 focus:outline-offset-0 ring-1 ring-inset ring-gray-300",
                          page === currentPage
                            ? "z-10 bg-indigo-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                            : "text-gray-900 hover:bg-gray-50"
                        )}
                      >
                        {page}
                      </button>
                    );
                  } else if (
                    page === currentPage - 2 ||
                    page === currentPage + 2
                  ) {
                    return (
                      <span key={page} className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Trang sau</span>
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
          
          {/* Mobile pagination */}
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Trước
            </button>
            <span className="text-sm text-gray-700 self-center">
              Trang {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      <Transition show={!!previewImage} as={Fragment}>
        <Dialog as="div" className="relative z-[60]" onClose={() => setPreviewImage(null)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/90 backdrop-blur-sm transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="relative w-full max-w-5xl transform overflow-hidden rounded-2xl bg-transparent text-left align-middle transition-all">
                  <div className="absolute top-4 right-4 z-10">
                    <button
                      onClick={() => setPreviewImage(null)}
                      className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  <div className="flex flex-col items-center">
                    <img
                      src={previewImage?.url}
                      alt={previewImage?.title}
                      className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                      referrerPolicy="no-referrer"
                    />
                    <p className="mt-4 text-white font-medium text-lg bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">
                      {previewImage?.title}
                    </p>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      <ConfirmModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => {
          if (deleteConfirmId) {
            onDelete(deleteConfirmId);
            setDeleteConfirmId(null);
          }
        }}
        title="Xác nhận xóa"
        message={`Bạn có chắc chắn muốn xóa vật tư ${materials.find(m => m.id === deleteConfirmId)?.code || ''} - ${materials.find(m => m.id === deleteConfirmId)?.name || ''}? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
        type="danger"
      />
    </div>
  );
}
