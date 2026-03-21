import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { QRCodeSVG } from 'qrcode.react';
import { Material, MaterialStatus } from '../data/materials';
import { X, FileText, Calendar, Building2, MapPin, Info, MessageSquare, QrCode, Zap, Layers, Image as ImageIcon, Activity } from 'lucide-react';
import { cn } from '../lib/utils';

interface MaterialDetailProps {
  material: Material | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (id: string, newStatus: MaterialStatus, newFeedback: string) => void;
  allMaterials?: Material[];
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

const procurementStatusColors: Record<string, string> = {
  'Not Ordered': 'bg-gray-100 text-gray-800 border-gray-200',
  'Ordered': 'bg-blue-100 text-blue-800 border-blue-200',
  'In Transit': 'bg-amber-100 text-amber-800 border-amber-200',
  'Received': 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

export function MaterialDetail({ material, isOpen, onClose, onUpdateStatus, allMaterials = [] }: MaterialDetailProps) {
  const [previewImage, setPreviewImage] = React.useState<{ url: string; title: string } | null>(null);

  if (!material) return null;

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as MaterialStatus;
    onUpdateStatus(material.id, newStatus, material.feedback);
  };

  const procurementStatus = material.procurementStatus || 'Not Ordered';

  const constituentMaterials = React.useMemo(() => {
    if (!material.constituentMaterials || material.constituentMaterials.length === 0) return [];
    return material.constituentMaterials
      .map(id => allMaterials.find(m => m.id === id))
      .filter((m): m is Material => !!m);
  }, [material.constituentMaterials, allMaterials]);

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
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

        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-500"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" />
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
                <Dialog.Panel className="pointer-events-auto w-screen max-w-4xl">
                  <div className="flex h-full flex-col overflow-y-scroll bg-gray-50/50 shadow-2xl">
                    <div className="px-6 py-4 bg-white border-b border-gray-200 sticky top-0 z-10 flex items-center justify-between">
                      <Dialog.Title className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-600" />
                        Chi tiết vật tư mẫu
                      </Dialog.Title>
                      <button
                        type="button"
                        className="rounded-full p-2 bg-gray-50 text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none transition-colors"
                        onClick={onClose}
                      >
                        <span className="sr-only">Đóng panel</span>
                        <X className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </div>
                    
                    <div className="relative flex-1 px-4 py-6 sm:px-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        {/* Left Column - Main Content */}
                        <div className="flex-1 space-y-6">
                          {/* Combined Card with Image */}
                          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col md:flex-row">
                            {material.imageUrl && (
                              <div className="w-full md:w-48 lg:w-64 bg-gray-50 border-r border-gray-100 shrink-0">
                                <img 
                                  src={material.imageUrl} 
                                  alt="SPEC" 
                                  className="w-full h-full object-cover cursor-zoom-in hover:opacity-90 transition-opacity"
                                  onClick={() => setPreviewImage({ url: material.imageUrl!, title: 'Hình ảnh mẫu (SPEC)' })}
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            )}
                            <div className="flex-1 p-6">
                              <div className="flex items-center gap-6 mb-6">
                                <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
                                  <QRCodeSVG 
                                    value={`ID: ${material.id}\nName: ${material.name}`}
                                    size={80}
                                    level="H"
                                    includeMargin={false}
                                  />
                                </div>
                                <div>
                                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Mã định danh</h3>
                                  <p className="text-2xl font-bold text-gray-900">{material.id}</p>
                                </div>
                              </div>
                              
                              <div className="border-t border-gray-100 pt-6">
                                <div className="flex items-start justify-between mb-4">
                                  <div>
                                    <div className="flex items-center gap-3 mb-2">
                                      <h2 className="text-3xl font-bold text-gray-900">{material.code}</h2>
                                      <span className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-semibold tracking-wider uppercase">
                                        {material.type}
                                      </span>
                                    </div>
                                    <p className="text-xl text-gray-700 font-medium leading-snug">{material.name}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  <Layers className="w-4 h-4" />
                                  <span>{material.category}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                                  <MapPin className="w-4 h-4" />
                                  <span>{material.area || 'Chưa xác định vị trí'}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Images Card (Submittal only if SPEC is at top) */}
                          {material.submittalImageUrl && (
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <ImageIcon className="w-4 h-4 text-indigo-500" /> Hình ảnh mẫu đệ trình
                              </h3>
                              <div className="flex flex-wrap gap-4">
                                <div className="space-y-2">
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Hình NT đệ trình</p>
                                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center">
                                    <img 
                                      src={material.submittalImageUrl} 
                                      alt="Submittal" 
                                      className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform"
                                      onClick={() => setPreviewImage({ url: material.submittalImageUrl!, title: 'Hình ảnh Nhà thầu đệ trình' })}
                                      referrerPolicy="no-referrer"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Specs Card */}
                          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                              <Info className="w-4 h-4 text-indigo-500" /> Yêu cầu SPEC
                            </h3>
                            <div className="space-y-4">
                              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                                  {`Thông số kỹ thuật: ${material.technicalSpecs || '-'}\n\nNhà cung cấp: ${material.supplier || '-'}\n\nMã sản phẩm: ${material.productCode || '-'}\n\nGhi chú: ${material.specs || '-'}`}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Constituent Materials Card */}
                          {material.type === 'Furniture' && constituentMaterials.length > 0 && (
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Layers className="w-4 h-4 text-indigo-500" /> Vật tư cấu thành
                              </h3>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {constituentMaterials.map((m) => (
                                  <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50/50">
                                    {(m.imageUrl || m.submittalImageUrl) && (
                                      <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-gray-200">
                                        <img 
                                          src={m.submittalImageUrl || m.imageUrl} 
                                          alt={m.name} 
                                          className="w-full h-full object-cover"
                                          referrerPolicy="no-referrer"
                                        />
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-bold text-indigo-600 truncate">{m.code}</p>
                                      <p className="text-sm font-medium text-gray-900 truncate">{m.name}</p>
                                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">{m.type}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Submission Logs Card */}
                          {material.submissionLogs && material.submissionLogs.length > 0 && (
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-purple-500" /> Nhật ký trình mẫu
                              </h3>
                              <div className="overflow-x-auto rounded-xl border border-gray-200">
                                <table className="min-w-full divide-y divide-gray-200">
                                  <thead className="bg-gray-50">
                                    <tr>
                                      <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider w-32">Ngày trình</th>
                                      <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider w-48">Trạng thái</th>
                                      <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Ghi chú</th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {material.submissionLogs.map((log) => (
                                      <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{log.submissionDate || '-'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                                          <span className={cn(
                                            'px-2.5 py-1 inline-flex text-xs font-bold rounded-lg border',
                                            statusColors[log.status]
                                          )}>
                                            {log.status === 'Approved' && 'Đã duyệt'}
                                            {log.status === 'Approved as Noted' && 'Duyệt kèm ghi chú'}
                                            {log.status === 'Revise & Resubmit' && 'Yêu cầu chỉnh sửa'}
                                            {log.status === 'Rejected' && 'Từ chối'}
                                            {log.status === 'Pending' && 'Chờ duyệt'}
                                            {log.status === 'Omitted' && 'Omitted'}
                                            {log.status === 'No Sample Required' && 'Không cần mẫu'}
                                          </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{log.notes || '-'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                        </div>

                        {/* Right Column - Metadata & Actions */}
                        <div className="w-full lg:w-80 space-y-6 shrink-0">
                          {/* Status & Actions Card */}
                          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Trạng thái</h3>
                            <div className="mb-6">
                              <span
                                className={cn(
                                  'px-3 py-2 inline-flex text-sm font-bold rounded-xl border w-full justify-center',
                                  statusColors[material.status]
                                )}
                              >
                                  {material.status === 'Approved' && 'Đã duyệt'}
                                  {material.status === 'Approved as Noted' && 'Duyệt kèm ghi chú'}
                                  {material.status === 'Revise & Resubmit' && 'Yêu cầu chỉnh sửa'}
                                  {material.status === 'Rejected' && 'Từ chối'}
                                  {material.status === 'Pending' && 'Chờ duyệt'}
                                  {material.status === 'Omitted' && 'Omitted'}
                                  {material.status === 'No Sample Required' && 'Không cần mẫu'}
                                </span>
                              </div>
                              
                              <div className="space-y-3">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cập nhật trạng thái</label>
                                <select
                                  className="block w-full pl-3 pr-10 py-2.5 text-sm border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                                  value={material.status}
                                  onChange={handleStatusChange}
                                >
                                  <option value="Approved">Đã phê duyệt</option>
                                  <option value="Approved as Noted">Phê duyệt kèm ghi chú</option>
                                  <option value="Revise & Resubmit">Yêu cầu chỉnh sửa</option>
                                  <option value="Pending">Đang chờ duyệt</option>
                                  <option value="Rejected">Bị từ chối</option>
                                  <option value="Omitted">Omitted</option>
                                  <option value="No Sample Required">Không cần mẫu</option>
                                </select>
                              </div>
                            </div>

                            {/* Procurement Status Card */}
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Tiến độ cung ứng</h3>
                              <div className="mb-4">
                                <span
                                  className={cn(
                                    'px-3 py-2 inline-flex text-sm font-bold rounded-xl border w-full justify-center',
                                    procurementStatusColors[procurementStatus]
                                  )}
                                >
                                  {procurementStatus === 'Not Ordered' && 'Chưa đặt hàng'}
                                  {procurementStatus === 'Ordered' && 'Đã đặt hàng'}
                                  {procurementStatus === 'In Transit' && 'Đang vận chuyển'}
                                  {procurementStatus === 'Received' && 'Đã nhận tại kho'}
                                </span>
                              </div>

                              <div className="space-y-3 pt-3 border-t border-gray-50">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-gray-500">Đơn vị:</span>
                                  <span className="text-sm font-medium">{material.unit || '-'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-gray-500">Khối lượng BOQ:</span>
                                  <span className="text-sm font-medium">{material.boqQuantity || 0}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-gray-500">Đã đặt hàng:</span>
                                  <span className="text-sm font-medium text-blue-600">{material.orderedQuantity || 0}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-gray-500">Đã nhận:</span>
                                  <span className="text-sm font-medium text-emerald-600">{material.receivedQuantity || 0}</span>
                                </div>
                              </div>
                            </div>


                          {/* Details Card */}
                          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                            <div>
                              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-gray-400" /> Nguồn cung cấp
                              </h3>
                              <div className="space-y-3">
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">Nhà thầu</p>
                                  <p className="text-sm font-medium text-gray-900">{material.contractor || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">Nhà cung cấp</p>
                                  <p className="text-sm font-medium text-gray-900">{material.supplier || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">Người cấp</p>
                                  <span className={cn(
                                    "px-2 py-0.5 rounded text-xs font-medium inline-block",
                                    material.providedBy === 'Client' ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                                  )}>
                                    {material.providedBy === 'Contractor' ? 'Nhà thầu' : material.providedBy === 'Client' ? 'Chủ đầu tư' : '-'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="pt-6 border-t border-gray-100">
                              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Info className="w-4 h-4 text-gray-400" /> Ghi chú
                              </h3>
                              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">{material.notes || '-'}</p>
                              </div>
                            </div>

                            <div className="pt-6 border-t border-gray-100">
                              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-400" /> Tiến độ
                              </h3>
                              <div className="space-y-3">
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">Ngày đệ trình</p>
                                  <p className="text-sm font-medium text-gray-900">{material.submissionDate || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">Ngày phê duyệt thực tế</p>
                                  <p className="text-sm font-medium text-gray-900">{material.approvalDate || '-'}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-3 pt-2">
                                  <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                                    <p className="text-[10px] text-gray-500 font-medium uppercase mb-1">Lead-time</p>
                                    <p className="text-sm font-bold text-gray-900">{material.leadTime || 0} ngày</p>
                                  </div>
                                  <div className="p-2 bg-amber-50 rounded-lg border border-amber-100">
                                    <p className="text-[10px] text-amber-600 font-medium uppercase mb-1">Hạn chót duyệt</p>
                                    <p className="text-sm font-bold text-amber-900">{material.latestApprovalDate || '-'}</p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="p-2 bg-indigo-50 rounded-lg border border-indigo-100">
                                    <p className="text-[10px] text-indigo-600 font-medium uppercase mb-1">Ngày cần hàng</p>
                                    <p className="text-sm font-bold text-indigo-900">{material.requiredDeliveryDate || '-'}</p>
                                  </div>
                                  <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-100">
                                    <p className="text-[10px] text-emerald-600 font-medium uppercase mb-1">Dự kiến về kho</p>
                                    <p className="text-sm font-bold text-emerald-900">{material.expectedArrivalDate || '-'}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Feedback Card */}
                          <div className="bg-white p-6 rounded-2xl border border-amber-100 shadow-sm">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                              <MessageSquare className="w-4 h-4 text-amber-500" /> Phản hồi / Ý kiến CĐT
                            </h3>
                            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100/50">
                              <p className="text-amber-900 whitespace-pre-wrap text-sm leading-relaxed">{material.feedback || 'Chưa có phản hồi'}</p>
                            </div>
                          </div>

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

