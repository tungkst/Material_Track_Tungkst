import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { QRCodeSVG } from 'qrcode.react';
import { Material, MaterialStatus } from '../data/materials';
import { X, FileText, Calendar, Building2, MapPin, Info, MessageSquare, QrCode, Zap } from 'lucide-react';
import { cn } from '../lib/utils';

interface MaterialDetailProps {
  material: Material | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (id: string, newStatus: MaterialStatus, newFeedback: string) => void;
}

const statusColors: Record<MaterialStatus, string> = {
  Approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Rejected: 'bg-red-100 text-red-800 border-red-200',
  Pending: 'bg-amber-100 text-amber-800 border-amber-200',
  Omitted: 'bg-gray-100 text-gray-800 border-gray-200',
  'No Sample Required': 'bg-blue-100 text-blue-800 border-blue-200',
};

export function MaterialDetail({ material, isOpen, onClose, onUpdateStatus }: MaterialDetailProps) {
  if (!material) return null;

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as MaterialStatus;
    // In a real app, you'd probably prompt for feedback or open a modal
    onUpdateStatus(material.id, newStatus, material.feedback);
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-500"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500 sm:duration-700"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500 sm:duration-700"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-2xl">
                  <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                    <div className="px-4 py-6 sm:px-6 bg-gray-50 border-b border-gray-200">
                      <div className="flex items-start justify-between">
                        <Dialog.Title className="text-xl font-semibold leading-6 text-gray-900">
                          Chi tiết vật tư mẫu
                        </Dialog.Title>
                        <div className="ml-3 flex h-7 items-center">
                          <button
                            type="button"
                            className="relative rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            onClick={onClose}
                          >
                            <span className="absolute -inset-2.5" />
                            <span className="sr-only">Đóng panel</span>
                            <X className="h-6 w-6" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="relative flex-1 px-4 py-6 sm:px-6">
                      {/* Header Info */}
                      <div className="mb-8">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-4">
                            <h2 className="text-3xl font-bold text-gray-900">{material.code}</h2>
                            <div className="bg-white p-1 rounded border border-gray-200 shadow-sm">
                              <QRCodeSVG 
                                value={`ID: ${material.id}\nName: ${material.name}`}
                                size={64}
                                level="H"
                                includeMargin={false}
                              />
                            </div>
                          </div>
                          <span
                            className={cn(
                              'px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full border',
                              statusColors[material.status]
                            )}
                          >
                            {material.status === 'Approved' && 'Đã duyệt'}
                            {material.status === 'Rejected' && 'Từ chối'}
                            {material.status === 'Pending' && 'Chờ duyệt'}
                            {material.status === 'Omitted' && 'Omitted'}
                            {material.status === 'No Sample Required' && 'Không cần mẫu'}
                          </span>
                        </div>
                        <p className="text-lg text-gray-600">{material.name}</p>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="flex items-start gap-3">
                          <Building2 className="w-5 h-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-500">Nhà thầu / Nhà cung cấp</p>
                            <p className="text-base text-gray-900">{material.contractor}</p>
                            <p className="text-sm text-gray-500">NCC: {material.supplier}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-500">Khu vực thi công</p>
                            <p className="text-base text-gray-900">{material.area}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-500">Hạng mục</p>
                            <p className="text-base text-gray-900">{material.category} ({material.type})</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Zap className="w-5 h-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-500">Người cấp</p>
                            <p className="text-base text-gray-900">
                              {material.providedBy === 'Contractor' ? 'Nhà thầu' : material.providedBy === 'Client' ? 'Chủ đầu tư' : 'Chưa xác định'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-500">Ngày đệ trình / Phê duyệt</p>
                            <p className="text-base text-gray-900">
                              {material.submissionDate} - {material.approvalDate || 'Chưa có'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Specs */}
                      <div className="mb-8 bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-2 mb-3">
                          <Info className="w-5 h-5 text-indigo-500" />
                          <h3 className="text-lg font-medium text-gray-900">Qui cách kỹ thuật</h3>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap">{material.specs}</p>
                      </div>

                      {/* Image */}
                      {material.imageUrl && (
                        <div className="mb-8">
                          <h3 className="text-lg font-medium text-gray-900 mb-3">Hình ảnh minh họa</h3>
                          <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50 flex justify-center p-4">
                            <img 
                              src={material.imageUrl} 
                              alt={material.name} 
                              className="max-w-full max-h-96 object-contain"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        </div>
                      )}

                      {/* Feedback */}
                      <div className="mb-8 bg-amber-50 p-4 rounded-xl border border-amber-100">
                        <div className="flex items-center gap-2 mb-3">
                          <MessageSquare className="w-5 h-5 text-amber-500" />
                          <h3 className="text-lg font-medium text-gray-900">Phản hồi / Ý kiến CĐT</h3>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap">{material.feedback || 'Chưa có phản hồi'}</p>
                      </div>


                      {/* Action Area */}
                      <div className="mt-10 pt-6 border-t border-gray-200">
                        <h3 className="text-sm font-medium text-gray-900 mb-4">Cập nhật trạng thái</h3>
                        <div className="flex items-center gap-4">
                          <select
                            className="block w-full max-w-xs pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                            value={material.status}
                            onChange={handleStatusChange}
                          >
                            <option value="Approved">Đã phê duyệt</option>
                            <option value="Pending">Đang chờ duyệt</option>
                            <option value="Rejected">Bị từ chối</option>
                            <option value="Omitted">Omitted</option>
                            <option value="No Sample Required">Không cần mẫu</option>
                          </select>
                          <p className="text-sm text-gray-500">
                            Cập nhật trạng thái sẽ tự động lưu vào hệ thống.
                          </p>
                        </div>
                      </div>

                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
