import React, { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Material, MaterialStatus, MaterialType } from '../data/materials';
import { X } from 'lucide-react';

interface MaterialFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (material: Material) => void;
  initialData?: Material | null;
  existingMaterials: Material[];
}

export function MaterialFormModal({ isOpen, onClose, onSave, initialData, existingMaterials }: MaterialFormModalProps) {
  const [formData, setFormData] = useState<Partial<Material>>({
    type: 'BasicFinish',
    status: 'Pending',
    hasSample: true,
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      const generateId = () => {
        const prefix = 'MAT';
        const random = Math.floor(1000 + Math.random() * 9000);
        const timestamp = Date.now().toString().slice(-4);
        return `${prefix}-${timestamp}-${random}`;
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
        feedback: '',
        specs: '',
        imageUrl: '',
        providedBy: 'Contractor',
      });
    }
  }, [initialData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check for duplicates
    const isDuplicate = existingMaterials.some(m => {
      // If editing, ignore the current material
      if (initialData && m.id === initialData.id) return false;
      
      // Check if code or name matches (case-insensitive)
      const codeMatch = m.code.toLowerCase() === (formData.code || '').toLowerCase();
      const nameMatch = m.name.toLowerCase() === (formData.name || '').toLowerCase();
      
      return codeMatch || nameMatch;
    });

    if (isDuplicate) {
      alert('Mã vật tư hoặc tên vật tư đã tồn tại trong hệ thống. Vui lòng kiểm tra lại!');
      return;
    }

    onSave(formData as Material);
    onClose();
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
                <form onSubmit={handleSubmit}>
                  <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                    <div className="flex justify-between items-center mb-5">
                      <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-gray-900">
                        {initialData ? 'Chỉnh sửa vật tư' : 'Thêm vật tư mới'}
                      </Dialog.Title>
                      <button
                        type="button"
                        className="text-gray-400 hover:text-gray-500"
                        onClick={onClose}
                      >
                        <X className="h-6 w-6" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">ID Hệ thống (Tự động)</label>
                        <input
                          type="text"
                          name="id"
                          readOnly
                          value={formData.id || ''}
                          className="mt-1 block w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-gray-500 shadow-sm focus:outline-none sm:text-sm cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Mã vật tư (Code)</label>
                        <input
                          type="text"
                          name="code"
                          required
                          value={formData.code || ''}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Tên vật tư</label>
                        <input
                          type="text"
                          name="name"
                          required
                          value={formData.name || ''}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Loại (Tab)</label>
                        <select
                          name="type"
                          value={formData.type || 'BasicFinish'}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
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
                        <label className="block text-sm font-medium text-gray-700">Hạng mục (Category)</label>
                        <input
                          type="text"
                          name="category"
                          required
                          value={formData.category || ''}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Khu vực</label>
                        <input
                          type="text"
                          name="area"
                          value={formData.area || ''}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Nhà thầu</label>
                        <input
                          type="text"
                          name="contractor"
                          value={formData.contractor || ''}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Nhà cung cấp</label>
                        <input
                          type="text"
                          name="supplier"
                          value={formData.supplier || ''}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
                        <select
                          name="status"
                          value={formData.status || 'Pending'}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                        >
                          <option value="Approved">Đã phê duyệt</option>
                          <option value="Pending">Đang chờ duyệt</option>
                          <option value="Rejected">Bị từ chối</option>
                          <option value="Omitted">Omitted</option>
                          <option value="No Sample Required">Không cần mẫu</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Người cấp</label>
                        <div className="mt-2 flex items-center gap-6">
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              name="providedBy"
                              value="Contractor"
                              checked={formData.providedBy === 'Contractor'}
                              onChange={handleChange}
                              className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Nhà thầu</span>
                          </label>
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              name="providedBy"
                              value="Client"
                              checked={formData.providedBy === 'Client'}
                              onChange={handleChange}
                              className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Chủ đầu tư</span>
                          </label>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Ngày trình</label>
                        <input
                          type="text"
                          name="submissionDate"
                          placeholder="DD/MM/YYYY"
                          value={formData.submissionDate || ''}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Ngày duyệt</label>
                        <input
                          type="text"
                          name="approvalDate"
                          placeholder="DD/MM/YYYY"
                          value={formData.approvalDate || ''}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Link hình ảnh minh họa (URL)</label>
                        <input
                          type="url"
                          name="imageUrl"
                          value={formData.imageUrl || ''}
                          onChange={handleChange}
                          placeholder="https://example.com/image.jpg"
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Thông số kỹ thuật / Ghi chú</label>
                        <textarea
                          name="specs"
                          rows={2}
                          value={formData.specs || ''}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Phản hồi</label>
                        <textarea
                          name="feedback"
                          rows={2}
                          value={formData.feedback || ''}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                    <button
                      type="submit"
                      className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto"
                    >
                      Lưu
                    </button>
                    <button
                      type="button"
                      className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                      onClick={onClose}
                    >
                      Hủy
                    </button>
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
