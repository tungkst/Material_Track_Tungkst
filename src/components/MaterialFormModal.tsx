import React, { Fragment, useState, useEffect, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Material, MaterialStatus, MaterialType } from '../data/materials';
import { X, AlertTriangle, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Info, FileText, Calculator, ShoppingCart, Activity, Plus, Trash2, Upload, Image as ImageIcon, Search, Layers } from 'lucide-react';
import { cn } from '../lib/utils';
import { auth } from '../firebase';

interface MaterialFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (material: Material) => void;
  initialData?: Material | null;
  existingMaterials: Material[];
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}

interface MaterialFormState extends Partial<Material> {
  _showBasicInfo?: boolean;
  _showSpecInfo?: boolean;
  _showBOQInfo?: boolean;
  _showTimeline?: boolean;
  _showSubmittalInfo?: boolean;
}

export function MaterialFormModal({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData, 
  existingMaterials,
  onNext,
  onPrev,
  hasNext,
  hasPrev
}: MaterialFormModalProps) {
  const [formData, setFormData] = useState<MaterialFormState>({
    type: 'BasicFinish',
    status: 'Pending',
    hasSample: true,
    _showBasicInfo: true,
    _showSpecInfo: true,
    _showBOQInfo: true,
    _showTimeline: true,
    _showSubmittalInfo: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'spec' | 'boq' | 'procurement' | 'sample' | 'contractor_submittal'>('spec');
  const [materialSearchTerm, setMaterialSearchTerm] = useState('');
  const [showMaterialSelector, setShowMaterialSelector] = useState(false);
  const submitActionRef = useRef<'save' | 'saveAndNext'>('save');

  const tabs = [
    { id: 'spec', label: 'Thông tin SPEC', icon: FileText, color: 'text-emerald-500' },
    { id: 'boq', label: 'Thông tin BOQ', icon: Calculator, color: 'text-amber-500' },
    { id: 'procurement', label: 'Đặt hàng', icon: ShoppingCart, color: 'text-blue-500' },
    { id: 'sample', label: 'Thông tin trình mẫu', icon: Activity, color: 'text-purple-500' },
    { id: 'contractor_submittal', label: 'Thông tin mẫu đệ trình của Nhà thầu', icon: FileText, color: 'text-indigo-500' },
  ] as const;

  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (initialData) {
        setFormData(initialData);
      } else {
        const generateId = (prefix: string = 'MAT') => {
          const length = 10;
          const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
          let result = prefix.toUpperCase();
          // Ensure prefix doesn't exceed length
          if (result.length > length) result = result.substring(0, length);
          
          for (let i = 0; i < length - result.length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
          }
          return result;
        };

        setFormData({
          id: generateId(),
          type: 'BasicFinish',
          status: 'Pending',
          hasSample: true,
          category: '',
          code: '',
          name: '',
          area: '',
          supplier: '',
          contractor: '',
          submissionDate: '',
          approvalDate: '',
          requiredDeliveryDate: '',
          feedback: '',
          specs: '',
          technicalSpecs: '',
          notes: '',
          imageUrl: '',
          providedBy: 'Contractor',
          submittalNo: '',
          revision: '00',
          submittalImageUrl: '',
          unit: '',
          boqQuantity: undefined,
          constituentMaterials: [],
        });
      }
    }
  }, [initialData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let finalValue: any = value;
    
    if (type === 'number') {
      finalValue = value === '' ? undefined : Number(value);
    }
    
    setFormData((prev) => ({ ...prev, [name]: finalValue }));
  };

  const handleAddLog = () => {
    setFormData(prev => ({
      ...prev,
      submissionLogs: [
        ...(prev.submissionLogs || []),
        {
          id: Math.random().toString(36).substr(2, 9),
          submissionDate: '',
          status: 'Pending',
          notes: ''
        }
      ]
    }));
  };

  const handleUpdateLog = (id: string, field: 'submissionDate' | 'status' | 'notes', value: string) => {
    setFormData(prev => ({
      ...prev,
      submissionLogs: prev.submissionLogs?.map(log => 
        log.id === id ? { ...log, [field]: value } : log
      )
    }));
  };

  const handleRemoveLog = (id: string) => {
    setFormData(prev => ({
      ...prev,
      submissionLogs: prev.submissionLogs?.filter(log => log.id !== id)
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'imageUrl' | 'submittalImageUrl') => {
    const file = e.target.files?.[0];
    if (file) {
      // Limit file size to 2MB for base64
      if (file.size > 2 * 1024 * 1024) {
        alert('Dung lượng ảnh quá lớn (tối đa 2MB)');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (field: 'imageUrl' | 'submittalImageUrl') => {
    setFormData(prev => ({ ...prev, [field]: '' }));
  };

  const handlePaste = (e: React.ClipboardEvent, field: 'imageUrl' | 'submittalImageUrl') => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          // Limit file size to 2MB for base64
          if (file.size > 2 * 1024 * 1024) {
            alert('Dung lượng ảnh quá lớn (tối đa 2MB)');
            return;
          }
          const reader = new FileReader();
          reader.onloadend = () => {
            setFormData(prev => ({ ...prev, [field]: reader.result as string }));
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check for duplicates
    const isDuplicate = existingMaterials.some(m => {
      // If editing, ignore the current material
      if (initialData && m.id === initialData.id) return false;
      
      // Check if code matches (case-insensitive)
      if (!formData.code) return false;
      return m.code.trim().toLowerCase() === formData.code.trim().toLowerCase();
    });

    if (isDuplicate) {
      setError(`Mã vật tư "${formData.code}" đã tồn tại trong hệ thống. Vui lòng sử dụng mã khác!`);
      return;
    }

    // Strip internal UI state properties
    const { _showBasicInfo, _showSpecInfo, _showBOQInfo, _showTimeline, _showSubmittalInfo, ...cleanData } = formData;
    
    const materialToSave = { ...cleanData } as Material;
    if (!initialData) {
      materialToSave.createdBy = auth.currentUser?.uid;
    }
    
    onSave(materialToSave);
    
    if (submitActionRef.current === 'saveAndNext' && onNext) {
      onNext();
    } else {
      onClose();
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-6xl">
                <form onSubmit={handleSubmit} className="flex flex-col h-[85vh] sm:h-[800px]">
                  <div className="flex flex-1 overflow-hidden">
                    {/* LEFT SIDEBAR: THÔNG TIN CHUNG */}
                    <div className="w-80 sm:w-96 bg-gray-50 border-r border-gray-200 flex flex-col overflow-hidden">
                      <div className="p-6 border-b border-gray-200 bg-white">
                        <div className="flex justify-between items-center mb-4">
                          <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-gray-900">
                            {initialData ? 'Chỉnh sửa vật tư' : 'Thêm vật tư mới'}
                          </Dialog.Title>
                          <button
                            type="button"
                            className="text-gray-400 hover:text-gray-500 sm:hidden"
                            onClick={onClose}
                          >
                            <X className="h-6 w-6" />
                          </button>
                        </div>

                        {initialData && (
                          <div className="flex items-center justify-between bg-gray-100 rounded-xl p-2">
                            <span className="text-xs font-bold text-gray-500 uppercase ml-2">Điều hướng</span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={onPrev}
                                disabled={!hasPrev}
                                className="p-1.5 rounded-lg text-gray-500 hover:bg-white hover:text-gray-900 disabled:opacity-50 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all shadow-sm"
                                title="Vật tư trước"
                              >
                                <ChevronLeft className="w-5 h-5" />
                              </button>
                              <button
                                type="button"
                                onClick={onNext}
                                disabled={!hasNext}
                                className="p-1.5 rounded-lg text-gray-500 hover:bg-white hover:text-gray-900 disabled:opacity-50 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all shadow-sm"
                                title="Vật tư tiếp theo"
                              >
                                <ChevronRight className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
                        {error && (
                          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-sm">
                            <AlertTriangle className="w-5 h-5 shrink-0" />
                            <p>{error}</p>
                          </div>
                        )}

                        <div className="space-y-4">
                          <button 
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, _showBasicInfo: !prev._showBasicInfo }))}
                            className="w-full flex items-center justify-between text-indigo-600 mb-2 hover:bg-indigo-50 p-1 rounded transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <Info className="w-4 h-4" />
                              <span className="text-sm font-bold uppercase tracking-wider">Thông tin cơ bản</span>
                            </div>
                            {formData._showBasicInfo !== false ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          
                          {formData._showBasicInfo !== false && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                              <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">ID Hệ thống</label>
                                <input
                                  type="text"
                                  name="id"
                                  readOnly
                                  value={formData.id || ''}
                                  className="block w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-gray-500 text-sm cursor-not-allowed"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Mã vật tư (Code) *</label>
                                <input
                                  type="text"
                                  name="code"
                                  required
                                  value={formData.code || ''}
                                  onChange={handleChange}
                                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Tên vật tư *</label>
                                <input
                                  type="text"
                                  name="name"
                                  required
                                  value={formData.name || ''}
                                  onChange={handleChange}
                                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Loại (Tab)</label>
                                <select
                                  name="type"
                                  value={formData.type || 'BasicFinish'}
                                  onChange={handleChange}
                                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                >
                                  <option value="BasicFinish">Hoàn thiện cơ bản</option>
                                  <option value="Fitout">Nội thất Fitout</option>
                                  <option value="Architecture">Kiến trúc mặt ngoài</option>
                                  <option value="Furniture">Nội thất rời</option>
                                  <option value="Decor">Đồ Decor</option>
                                  <option value="MEP">Cơ điện (MEP)</option>
                                  <option value="Equipment">Thiết bị</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Hạng mục (Category) *</label>
                                <input
                                  type="text"
                                  name="category"
                                  required
                                  value={formData.category || ''}
                                  onChange={handleChange}
                                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Khu vực</label>
                                <input
                                  type="text"
                                  name="area"
                                  value={formData.area || ''}
                                  onChange={handleChange}
                                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Người cấp</label>
                                <div className="mt-2 flex items-center gap-4">
                                  <label className="inline-flex items-center cursor-pointer">
                                    <input
                                      type="radio"
                                      name="providedBy"
                                      value="Contractor"
                                      checked={formData.providedBy === 'Contractor'}
                                      onChange={handleChange}
                                      className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                                    />
                                    <span className="ml-2 text-xs text-gray-700 font-medium">Nhà thầu</span>
                                  </label>
                                  <label className="inline-flex items-center cursor-pointer">
                                    <input
                                      type="radio"
                                      name="providedBy"
                                      value="Client"
                                      checked={formData.providedBy === 'Client'}
                                      onChange={handleChange}
                                      className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                                    />
                                    <span className="ml-2 text-xs text-gray-700 font-medium">Chủ đầu tư</span>
                                  </label>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="p-6 bg-white border-t border-gray-200 space-y-3">
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            onClick={() => submitActionRef.current = 'save'}
                            className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all"
                          >
                            Lưu thay đổi
                          </button>
                          <button
                            type="button"
                            className="rounded-xl bg-white border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 active:scale-95 transition-all"
                            onClick={onClose}
                          >
                            Hủy
                          </button>
                        </div>
                        {initialData && hasNext && (
                          <button
                            type="submit"
                            onClick={() => submitActionRef.current = 'saveAndNext'}
                            className="w-full rounded-xl bg-indigo-50 px-4 py-2.5 text-sm font-bold text-indigo-700 hover:bg-indigo-100 active:scale-95 transition-all"
                          >
                            Lưu & Tiếp tục
                          </button>
                        )}
                      </div>
                    </div>

                    {/* MAIN CONTENT: TABS */}
                    <div className="flex-1 flex flex-col bg-white overflow-hidden">
                      <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                        <div className="flex gap-1 overflow-x-auto no-scrollbar">
                          {tabs.map((tab) => (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => setActiveTab(tab.id)}
                              className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                                activeTab === tab.id
                                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                              )}
                            >
                              <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "text-white" : tab.color)} />
                              {tab.label}
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          className="text-gray-400 hover:text-gray-500 hidden sm:block"
                          onClick={onClose}
                        >
                          <X className="h-6 w-6" />
                        </button>
                      </div>

                      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        <div className="max-w-3xl mx-auto">
                          {/* SECTION: THÔNG TIN SPEC */}
                          {activeTab === 'spec' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                              <button 
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, _showSpecInfo: !prev._showSpecInfo }))}
                                className="w-full flex items-center justify-between gap-3 mb-2 hover:bg-gray-50 p-2 rounded-lg transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-emerald-50 rounded-lg">
                                    <FileText className="w-5 h-5 text-emerald-600" />
                                  </div>
                                  <h4 className="text-lg font-bold text-gray-900">Thông tin SPEC</h4>
                                </div>
                                {formData._showSpecInfo !== false ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                              </button>
                              
                              {formData._showSpecInfo !== false && (
                                <div className="grid grid-cols-1 gap-6 animate-in fade-in slide-in-from-top-2 duration-200">
                                  <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Thông số kỹ thuật</label>
                                    <textarea
                                      name="technicalSpecs"
                                      rows={4}
                                      value={formData.technicalSpecs || ''}
                                      onChange={handleChange}
                                      className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                      placeholder="Nhập thông số kỹ thuật chi tiết..."
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nhà cung cấp (SPEC)</label>
                                      <input
                                        type="text"
                                        name="supplier"
                                        value={formData.supplier || ''}
                                        onChange={handleChange}
                                        className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Mã sản phẩm</label>
                                      <input
                                        type="text"
                                        name="productCode"
                                        value={formData.productCode || ''}
                                        onChange={handleChange}
                                        className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Hình ảnh mẫu (SPEC)</label>
                                    <div className="space-y-4">
                                      <div className="flex items-center gap-4">
                                        <div className="flex-1">
                                          <input
                                            type="url"
                                            name="imageUrl"
                                            value={formData.imageUrl || ''}
                                            onChange={handleChange}
                                            onPaste={(e) => handlePaste(e, 'imageUrl')}
                                            className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                            placeholder="Nhập link hình ảnh hoặc dán ảnh trực tiếp..."
                                          />
                                        </div>
                                        <label className="flex items-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl cursor-pointer transition-colors text-sm font-bold">
                                          <Upload className="w-4 h-4" />
                                          Upload
                                          <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => handleImageUpload(e, 'imageUrl')}
                                          />
                                        </label>
                                      </div>
                                      
                                      {formData.imageUrl && (
                                        <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-gray-200 group">
                                          <img 
                                            src={formData.imageUrl} 
                                            alt="SPEC Sample" 
                                            className="w-full h-full object-contain bg-gray-50"
                                            referrerPolicy="no-referrer"
                                          />
                                          <button
                                            type="button"
                                            onClick={() => removeImage('imageUrl')}
                                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                          >
                                            <X className="w-4 h-4" />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Ghi chú (SPEC)</label>
                                    <textarea
                                      name="specs"
                                      rows={4}
                                      value={formData.specs || ''}
                                      onChange={handleChange}
                                      className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                      placeholder="Nhập các yêu cầu SPEC..."
                                    />
                                  </div>

                                  {/* CONSTITUENT MATERIALS FOR FURNITURE */}
                                  {formData.type === 'Furniture' && (
                                    <div className="pt-6 border-t border-gray-100">
                                      <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                          <Layers className="w-4 h-4 text-indigo-500" />
                                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Vật tư cấu thành</label>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => setShowMaterialSelector(!showMaterialSelector)}
                                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                                        >
                                          <Plus className="w-3.5 h-3.5" />
                                          Thêm vật tư
                                        </button>
                                      </div>

                                      {showMaterialSelector && (
                                        <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200 animate-in fade-in slide-in-from-top-2 duration-200">
                                          <div className="relative mb-3">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                              type="text"
                                              placeholder="Tìm kiếm vật tư..."
                                              value={materialSearchTerm}
                                              onChange={(e) => setMaterialSearchTerm(e.target.value)}
                                              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                          </div>
                                          <div className="max-h-48 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                                            {existingMaterials
                                              .filter(m => 
                                                m.id !== formData.id && // Don't include self
                                                m.type !== 'Equipment' && 
                                                m.type !== 'Furniture' && // Exclude Equipment and Furniture as per request
                                                (m.name.toLowerCase().includes(materialSearchTerm.toLowerCase()) || 
                                                 m.code.toLowerCase().includes(materialSearchTerm.toLowerCase())) &&
                                                !(formData.constituentMaterials || []).includes(m.id)
                                              )
                                              .map(m => (
                                                <button
                                                  key={m.id}
                                                  type="button"
                                                  onClick={() => {
                                                    setFormData(prev => ({
                                                      ...prev,
                                                      constituentMaterials: [...(prev.constituentMaterials || []), m.id]
                                                    }));
                                                    setMaterialSearchTerm('');
                                                  }}
                                                  className="w-full flex items-center justify-between p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-left group"
                                                >
                                                  <div>
                                                    <div className="text-sm font-medium text-gray-900">{m.name}</div>
                                                    <div className="text-xs text-gray-500">{m.code} • {m.type}</div>
                                                  </div>
                                                  <Plus className="w-4 h-4 text-gray-400 group-hover:text-indigo-600" />
                                                </button>
                                              ))}
                                            {existingMaterials.filter(m => 
                                              m.id !== formData.id && 
                                              m.type !== 'Equipment' && 
                                              m.type !== 'Furniture' &&
                                              (m.name.toLowerCase().includes(materialSearchTerm.toLowerCase()) || 
                                               m.code.toLowerCase().includes(materialSearchTerm.toLowerCase())) &&
                                              !(formData.constituentMaterials || []).includes(m.id)
                                            ).length === 0 && (
                                              <div className="text-center py-4 text-xs text-gray-500 italic">
                                                Không tìm thấy vật tư phù hợp
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}

                                      <div className="space-y-2">
                                        {(formData.constituentMaterials || []).map(matId => {
                                          const mat = existingMaterials.find(m => m.id === matId);
                                          if (!mat) return null;
                                          return (
                                            <div key={matId} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl shadow-sm group hover:border-indigo-200 transition-colors">
                                              <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden">
                                                  {mat.imageUrl ? (
                                                    <img src={mat.imageUrl} alt={mat.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                                  ) : (
                                                    <Layers className="w-5 h-5 text-gray-400" />
                                                  )}
                                                </div>
                                                <div>
                                                  <div className="text-sm font-bold text-gray-900">{mat.name}</div>
                                                  <div className="text-xs text-gray-500">{mat.code} • {mat.type}</div>
                                                </div>
                                              </div>
                                              <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({
                                                  ...prev,
                                                  constituentMaterials: prev.constituentMaterials?.filter(id => id !== matId)
                                                }))}
                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                              >
                                                <Trash2 className="w-4 h-4" />
                                              </button>
                                            </div>
                                          );
                                        })}
                                        {(!formData.constituentMaterials || formData.constituentMaterials.length === 0) && (
                                          <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl text-xs text-gray-400 italic">
                                            Chưa có vật tư cấu thành. Nhấn "Thêm vật tư" để bắt đầu.
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* SECTION: THÔNG TIN BOQ */}
                          {activeTab === 'boq' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                              <button 
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, _showBOQInfo: !prev._showBOQInfo }))}
                                className="w-full flex items-center justify-between gap-3 mb-2 hover:bg-gray-50 p-2 rounded-lg transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-amber-50 rounded-lg">
                                    <Calculator className="w-5 h-5 text-amber-600" />
                                  </div>
                                  <h4 className="text-lg font-bold text-gray-900">Khối lượng & Dự toán</h4>
                                </div>
                                {formData._showBOQInfo !== false ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                              </button>

                              {formData._showBOQInfo !== false && (
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                  <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Đơn vị tính</label>
                                    <select
                                      name="unit"
                                      value={formData.unit || ''}
                                      onChange={handleChange}
                                      className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all bg-white"
                                    >
                                      <option value="">Chọn đơn vị...</option>
                                      <option value="Cái">Cái</option>
                                      <option value="gói">gói</option>
                                      <option value="Bộ">Bộ</option>
                                      <option value="m2">m2</option>
                                      <option value="m3">m3</option>
                                      <option value="md">md</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Khối lượng dự toán (BOQ)</label>
                                    <input
                                      type="number"
                                      name="boqQuantity"
                                      value={formData.boqQuantity || ''}
                                      onChange={handleChange}
                                      className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* SECTION: THÔNG TIN ĐẶT HÀNG */}
                          {activeTab === 'procurement' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                  <ShoppingCart className="w-5 h-5 text-blue-600" />
                                </div>
                                <h4 className="text-lg font-bold text-gray-900">Tiến độ đặt hàng & Cung ứng</h4>
                              </div>

                              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Trạng thái đặt hàng</label>
                                  <select
                                    name="procurementStatus"
                                    value={formData.procurementStatus || 'Not Ordered'}
                                    onChange={handleChange}
                                    className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                  >
                                    <option value="Not Ordered">Chưa đặt hàng</option>
                                    <option value="Ordered">Đã đặt hàng (Ordered)</option>
                                    <option value="In Transit">Đang vận chuyển (In Transit)</option>
                                    <option value="Received">Đã nhận tại kho (Received)</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nhà thầu</label>
                                  <input
                                    type="text"
                                    name="contractor"
                                    value={formData.contractor || ''}
                                    onChange={handleChange}
                                    className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nhà cung cấp</label>
                                  <input
                                    type="text"
                                    name="supplier"
                                    value={formData.supplier || ''}
                                    onChange={handleChange}
                                    className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Lead-time (ngày)</label>
                                  <input
                                    type="number"
                                    name="leadTime"
                                    value={formData.leadTime || ''}
                                    onChange={handleChange}
                                    className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Khối lượng đã đặt</label>
                                  <input
                                    type="number"
                                    name="orderedQuantity"
                                    value={formData.orderedQuantity || ''}
                                    onChange={handleChange}
                                    className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Khối lượng thực tế về kho</label>
                                  <input
                                    type="number"
                                    name="receivedQuantity"
                                    value={formData.receivedQuantity || ''}
                                    onChange={handleChange}
                                    className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                  />
                                </div>
                                
                                <div className="sm:col-span-2 pt-4 border-t border-gray-100 mt-2">
                                  <button 
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, _showTimeline: !prev._showTimeline }))}
                                    className="w-full text-sm font-bold text-gray-900 mb-4 flex items-center justify-between hover:bg-gray-50 p-2 rounded-lg transition-colors"
                                  >
                                    <div className="flex items-center gap-2">
                                      <Activity className="w-4 h-4 text-indigo-500" />
                                      Mốc thời gian quan trọng
                                    </div>
                                    {formData._showTimeline ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                  </button>
                                  
                                  {(formData._showTimeline !== false) && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                      <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Ngày trình</label>
                                        <input
                                          type="text"
                                          name="submissionDate"
                                          placeholder="DD/MM/YYYY"
                                          value={formData.submissionDate || ''}
                                          onChange={handleChange}
                                          className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Ngày duyệt</label>
                                        <input
                                          type="text"
                                          name="approvalDate"
                                          placeholder="DD/MM/YYYY"
                                          value={formData.approvalDate || ''}
                                          onChange={handleChange}
                                          className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Ngày cần phê duyệt cuối</label>
                                        <input
                                          type="text"
                                          name="latestApprovalDate"
                                          placeholder="DD/MM/YYYY"
                                          value={formData.latestApprovalDate || ''}
                                          onChange={handleChange}
                                          className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Ngày cấp hàng yêu cầu</label>
                                        <input
                                          type="text"
                                          name="requiredDeliveryDate"
                                          placeholder="DD/MM/YYYY"
                                          value={formData.requiredDeliveryDate || ''}
                                          onChange={handleChange}
                                          className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Ngày dự kiến hàng về</label>
                                        <input
                                          type="text"
                                          name="expectedArrivalDate"
                                          placeholder="DD/MM/YYYY"
                                          value={formData.expectedArrivalDate || ''}
                                          onChange={handleChange}
                                          className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                          {/* SECTION: THÔNG TIN TRÌNH MẪU */}
                          {activeTab === 'sample' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-purple-50 rounded-lg">
                                  <Activity className="w-5 h-5 text-purple-600" />
                                </div>
                                <h4 className="text-lg font-bold text-gray-900">Thông tin trình mẫu</h4>
                              </div>
                              
                              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div>
                                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Chuẩn bị mẫu trình</label>
                                  <div className="flex items-center gap-4 py-3">
                                    <label className="inline-flex items-center cursor-pointer">
                                      <input
                                        type="checkbox"
                                        name="hasSample"
                                        checked={formData.hasSample || false}
                                        onChange={(e) => setFormData(prev => ({ ...prev, hasSample: e.target.checked }))}
                                        className="h-5 w-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                      />
                                      <span className="ml-2 text-sm text-gray-700">Có cần mẫu</span>
                                    </label>
                                    <label className="inline-flex items-center cursor-pointer">
                                      <input
                                        type="checkbox"
                                        name="sampleMatchesSpec"
                                        checked={formData.sampleMatchesSpec || false}
                                        onChange={(e) => setFormData(prev => ({ ...prev, sampleMatchesSpec: e.target.checked }))}
                                        className="h-5 w-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                      />
                                      <span className="ml-2 text-sm text-gray-700">Đã đúng SPEC</span>
                                    </label>
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Số lượng mẫu</label>
                                  <input
                                    type="number"
                                    name="sampleQuantity"
                                    value={formData.sampleQuantity || ''}
                                    onChange={handleChange}
                                    className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-sm shadow-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Ngày trình mẫu</label>
                                  <input
                                    type="text"
                                    name="submissionDate"
                                    placeholder="DD/MM/YYYY"
                                    value={formData.submissionDate || ''}
                                    onChange={handleChange}
                                    className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-sm shadow-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                                  />
                                </div>
                                <div className="sm:col-span-2">
                                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Trạng thái phê duyệt</label>
                                  <select
                                    name="status"
                                    value={formData.status || 'Pending'}
                                    onChange={handleChange}
                                    className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-sm shadow-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                                  >
                                    <option value="Approved">Đã phê duyệt (Approved)</option>
                                    <option value="Approved as Noted">Phê duyệt kèm ghi chú (Approved as Noted)</option>
                                    <option value="Revise & Resubmit">Yêu cầu chỉnh sửa (Revise & Resubmit)</option>
                                    <option value="Pending">Đang chờ duyệt (Pending)</option>
                                    <option value="Rejected">Bị từ chối (Rejected)</option>
                                    <option value="Omitted">Omitted</option>
                                    <option value="No Sample Required">Không cần mẫu</option>
                                  </select>
                                </div>
                                <div className="sm:col-span-2">
                                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Link hình ảnh minh họa</label>
                                  <input
                                    type="url"
                                    name="imageUrl"
                                    value={formData.imageUrl || ''}
                                    onChange={handleChange}
                                    className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-sm shadow-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                                  />
                                </div>
                                <div className="sm:col-span-2">
                                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Ghi chú</label>
                                  <textarea
                                    name="notes"
                                    rows={3}
                                    value={formData.notes || ''}
                                    onChange={handleChange}
                                    className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-sm shadow-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* SECTION: THÔNG TIN MẪU ĐỆ TRÌNH CỦA NHÀ THẦU */}
                          {activeTab === 'contractor_submittal' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                              <button 
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, _showSubmittalInfo: !prev._showSubmittalInfo }))}
                                className="w-full flex items-center justify-between gap-3 mb-2 hover:bg-gray-50 p-2 rounded-lg transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-indigo-50 rounded-lg">
                                    <FileText className="w-5 h-5 text-indigo-600" />
                                  </div>
                                  <h4 className="text-lg font-bold text-gray-900">Thông tin mẫu đệ trình của Nhà thầu</h4>
                                </div>
                                {formData._showSubmittalInfo !== false ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                              </button>

                              {formData._showSubmittalInfo !== false && (
                                <div className="grid grid-cols-1 gap-6 animate-in fade-in slide-in-from-top-2 duration-200">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Mã đệ trình (Submittal No)</label>
                                      <input
                                        type="text"
                                        name="submittalNo"
                                        value={formData.submittalNo || ''}
                                        onChange={handleChange}
                                        className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                        placeholder="VD: SUB-001"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Lần trình (Revision)</label>
                                      <input
                                        type="text"
                                        name="revision"
                                        value={formData.revision || ''}
                                        onChange={handleChange}
                                        className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                        placeholder="VD: 00, 01, 02..."
                                      />
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nhà thầu đệ trình</label>
                                      <input
                                        type="text"
                                        name="contractor"
                                        value={formData.contractor || ''}
                                        onChange={handleChange}
                                        className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Ngày trình hiện tại</label>
                                      <input
                                        type="text"
                                        name="submissionDate"
                                        placeholder="DD/MM/YYYY"
                                        value={formData.submissionDate || ''}
                                        onChange={handleChange}
                                        className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                      />
                                    </div>
                                  </div>

                                  <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nhà cung cấp đề xuất</label>
                                    <input
                                      type="text"
                                      name="supplier"
                                      value={formData.supplier || ''}
                                      onChange={handleChange}
                                      className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Hình ảnh mẫu đệ trình (Contractor Sample)</label>
                                    <div className="space-y-4">
                                      <div className="flex items-center gap-4">
                                        <div className="flex-1">
                                          <input
                                            type="url"
                                            name="submittalImageUrl"
                                            value={formData.submittalImageUrl || ''}
                                            onChange={handleChange}
                                            onPaste={(e) => handlePaste(e, 'submittalImageUrl')}
                                            className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                            placeholder="Nhập link hình ảnh hoặc dán ảnh trực tiếp..."
                                          />
                                        </div>
                                        <label className="flex items-center gap-2 px-4 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl cursor-pointer transition-colors text-sm font-bold border border-indigo-100">
                                          <Upload className="w-4 h-4" />
                                          Upload
                                          <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => handleImageUpload(e, 'submittalImageUrl')}
                                          />
                                        </label>
                                      </div>
                                      
                                      {formData.submittalImageUrl && (
                                        <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-gray-200 group">
                                          <img 
                                            src={formData.submittalImageUrl} 
                                            alt="Submittal Sample" 
                                            className="w-full h-full object-contain bg-gray-50"
                                            referrerPolicy="no-referrer"
                                          />
                                          <button
                                            type="button"
                                            onClick={() => removeImage('submittalImageUrl')}
                                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                          >
                                            <X className="w-4 h-4" />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Phản hồi / Ý kiến tư vấn</label>
                                    <textarea
                                      name="feedback"
                                      rows={3}
                                      value={formData.feedback || ''}
                                      onChange={handleChange}
                                      className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                      placeholder="Nhập phản hồi từ tư vấn hoặc chủ đầu tư..."
                                    />
                                  </div>

                                  <div className="pt-4 border-t border-gray-100 mt-2">
                                    <div className="flex items-center justify-between mb-4">
                                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Nhật ký trình mẫu (Lịch sử đệ trình)</label>
                                      <button
                                        type="button"
                                        onClick={handleAddLog}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                                      >
                                        <Plus className="w-3.5 h-3.5" />
                                        Thêm nhật ký
                                      </button>
                                    </div>
                                    
                                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                                      <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                          <tr>
                                            <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider w-32">Ngày trình</th>
                                            <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider w-48">Trạng thái</th>
                                            <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Ghi chú</th>
                                            <th scope="col" className="px-4 py-3 text-right text-[10px] font-bold text-gray-500 uppercase tracking-wider w-16">Xóa</th>
                                          </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                          {formData.submissionLogs?.length ? (
                                            formData.submissionLogs.map((log) => (
                                              <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-2">
                                                  <input
                                                    type="text"
                                                    placeholder="DD/MM/YYYY"
                                                    value={log.submissionDate}
                                                    onChange={(e) => handleUpdateLog(log.id, 'submissionDate', e.target.value)}
                                                    className="block w-full rounded-lg border-0 py-1.5 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                                  />
                                                </td>
                                                <td className="px-4 py-2">
                                                  <select
                                                    value={log.status}
                                                    onChange={(e) => handleUpdateLog(log.id, 'status', e.target.value)}
                                                    className="block w-full rounded-lg border-0 py-1.5 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                                  >
                                                    <option value="Approved">Đã phê duyệt</option>
                                                    <option value="Approved as Noted">Phê duyệt kèm ghi chú</option>
                                                    <option value="Revise & Resubmit">Yêu cầu chỉnh sửa</option>
                                                    <option value="Pending">Đang chờ duyệt</option>
                                                    <option value="Rejected">Bị từ chối</option>
                                                    <option value="Omitted">Omitted</option>
                                                    <option value="No Sample Required">Không cần mẫu</option>
                                                  </select>
                                                </td>
                                                <td className="px-4 py-2">
                                                  <input
                                                    type="text"
                                                    placeholder="Ghi chú..."
                                                    value={log.notes}
                                                    onChange={(e) => handleUpdateLog(log.id, 'notes', e.target.value)}
                                                    className="block w-full rounded-lg border-0 py-1.5 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                                  />
                                                </td>
                                                <td className="px-4 py-2 text-right">
                                                  <button
                                                    type="button"
                                                    onClick={() => handleRemoveLog(log.id)}
                                                    className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50"
                                                  >
                                                    <Trash2 className="w-4 h-4" />
                                                  </button>
                                                </td>
                                              </tr>
                                            ))
                                          ) : (
                                            <tr>
                                              <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                                                Chưa có nhật ký trình mẫu nào. Nhấn "Thêm nhật ký" để bắt đầu.
                                              </td>
                                            </tr>
                                          )}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
