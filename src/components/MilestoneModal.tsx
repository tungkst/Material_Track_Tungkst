import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Calendar, AlertCircle } from 'lucide-react';
import { Milestone, MilestoneType, MilestoneStatus } from '../data/milestones';

interface MilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (milestone: Omit<Milestone, 'id'> & { id?: string }) => Promise<void>;
  milestone?: Milestone | null;
}

export function MilestoneModal({ isOpen, onClose, onSave, milestone }: MilestoneModalProps) {
  const [formData, setFormData] = useState<Omit<Milestone, 'id'>>({
    name: '',
    date: '',
    actualDate: '',
    type: 'Standard',
    status: 'Upcoming',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (milestone) {
      setFormData({
        name: milestone.name,
        date: milestone.date,
        actualDate: milestone.actualDate || '',
        type: milestone.type,
        status: milestone.status,
        description: milestone.description || '',
      });
    } else {
      setFormData({
        name: '',
        date: '',
        actualDate: '',
        type: 'Standard',
        status: 'Upcoming',
        description: '',
      });
    }
  }, [milestone, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave({ ...formData, id: milestone?.id });
      onClose();
    } catch (error) {
      console.error('Error saving milestone:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
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
          <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title as="h3" className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-500" />
                    {milestone ? 'Chỉnh sửa mốc thời gian' : 'Thêm mốc thời gian mới'}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Tên mốc thời gian *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      placeholder="VD: Phê duyệt mẫu căn hộ"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Ngày (DD/MM/YYYY) *
                      </label>
                      <input
                        type="text"
                        required
                        pattern="\d{2}/\d{2}/\d{4}"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        placeholder="15/03/2026"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Hoàn thành thực tế
                      </label>
                      <input
                        type="text"
                        pattern="\d{2}/\d{2}/\d{4}"
                        value={formData.actualDate}
                        onChange={(e) => setFormData({ ...formData, actualDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        placeholder="15/03/2026"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Loại
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as MilestoneType })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      >
                        <option value="Standard">Tiêu chuẩn</option>
                        <option value="Critical">Quan trọng</option>
                        <option value="Payment">Thanh toán</option>
                        <option value="Approval">Phê duyệt</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Trạng thái
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as MilestoneStatus })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      >
                        <option value="Upcoming">Sắp tới</option>
                        <option value="Completed">Đã hoàn thành</option>
                        <option value="Delayed">Chậm trễ</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Mô tả / Ghi chú
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
                      placeholder="Thông tin chi tiết về mốc thời gian..."
                    />
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Đang lưu...' : 'Lưu'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
