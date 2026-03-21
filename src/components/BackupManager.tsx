import { useState, useRef } from 'react';
import { Material } from '../data/materials';
import { db } from '../firebase';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { Download, Upload, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface BackupManagerProps {
  materials: Material[];
}

export function BackupManager({ materials }: BackupManagerProps) {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBackup = () => {
    setIsBackingUp(true);
    try {
      const dataStr = JSON.stringify(materials, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `backup_vat_lieu_${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      setStatus({ type: 'success', message: 'Sao lưu dữ liệu thành công!' });
    } catch (error) {
      console.error('Backup error:', error);
      setStatus({ type: 'error', message: 'Lỗi khi sao lưu dữ liệu.' });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRecovery = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setPendingFile(file);
    setIsConfirmOpen(true);
  };

  const confirmRecovery = async () => {
    if (!pendingFile) return;
    const file = pendingFile;

    setIsRecovering(true);
    setStatus({ type: 'info', message: 'Đang khôi phục dữ liệu...' });

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const recoveredMaterials = JSON.parse(content) as Material[];

          if (!Array.isArray(recoveredMaterials)) {
            throw new Error('Định dạng tệp không hợp lệ.');
          }

          // Batch write to Firestore
          const batch = writeBatch(db);
          
          // First, we might want to clear existing or just overwrite
          // For simplicity and safety, we overwrite/add
          recoveredMaterials.forEach((material) => {
            const docRef = doc(db, 'materials', material.id);
            batch.set(docRef, material);
          });

          await batch.commit();
          setStatus({ type: 'success', message: `Khôi phục thành công ${recoveredMaterials.length} vật tư!` });
        } catch (err) {
          console.error('Recovery parse error:', err);
          setStatus({ type: 'error', message: 'Lỗi khi đọc tệp sao lưu. Vui lòng kiểm tra lại định dạng.' });
        } finally {
          setIsRecovering(false);
          setPendingFile(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };
      reader.readAsText(file);
    } catch (error) {
      console.error('Recovery error:', error);
      setStatus({ type: 'error', message: 'Lỗi khi khôi phục dữ liệu.' });
      setIsRecovering(false);
      setPendingFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <RefreshCw className="w-6 h-6 text-indigo-600" />
          Quản lý Dữ liệu (Backup & Recovery)
        </h2>
        <p className="text-gray-500 text-sm">
          Sao lưu dữ liệu hiện tại của bạn về máy tính hoặc khôi phục từ một bản sao lưu trước đó.
        </p>
      </div>

      {status && (
        <div className={cn(
          "p-4 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2",
          status.type === 'success' ? "bg-emerald-50 text-emerald-800 border border-emerald-100" :
          status.type === 'error' ? "bg-red-50 text-red-800 border border-red-100" :
          "bg-blue-50 text-blue-800 border border-blue-100"
        )}>
          {status.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <p className="text-sm font-medium">{status.message}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backup Section */}
        <div className="border border-gray-100 rounded-2xl p-6 hover:border-indigo-100 transition-colors group">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Download className="w-6 h-6 text-indigo-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Sao lưu Dữ liệu</h3>
          <p className="text-gray-500 text-sm mb-6">
            Tải xuống toàn bộ danh sách vật tư hiện tại dưới dạng tệp JSON.
          </p>
          <button
            onClick={handleBackup}
            disabled={isBackingUp}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 font-medium"
          >
            {isBackingUp ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Tải bản sao lưu (.json)
          </button>
        </div>

        {/* Recovery Section */}
        <div className="border border-gray-100 rounded-2xl p-6 hover:border-amber-100 transition-colors group">
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Upload className="w-6 h-6 text-amber-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Khôi phục Dữ liệu</h3>
          <p className="text-gray-500 text-sm mb-6 text-red-500 font-medium">
            Lưu ý: Hành động này sẽ ghi đè dữ liệu hiện tại. Hãy cẩn thận!
          </p>
          <label className="w-full flex items-center justify-center gap-2 bg-white border-2 border-dashed border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl hover:border-amber-400 hover:text-amber-700 transition-all cursor-pointer font-medium">
            {isRecovering ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Chọn tệp khôi phục
            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              onChange={handleRecovery}
              disabled={isRecovering}
              className="hidden"
            />
          </label>
        </div>
      </div>

      <div className="bg-gray-50 rounded-2xl p-6">
        <h4 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Hướng dẫn sử dụng</h4>
        <ul className="space-y-2 text-sm text-gray-600 list-disc pl-4">
          <li>Sử dụng tính năng <strong>Sao lưu</strong> thường xuyên để tránh mất mát dữ liệu quan trọng.</li>
          <li>Tệp sao lưu có định dạng <code>.json</code> và có thể mở bằng các trình soạn thảo văn bản.</li>
          <li>Khi <strong>Khôi phục</strong>, hãy đảm bảo tệp bạn chọn là bản sao lưu được tải từ hệ thống này.</li>
          <li>Nếu có lỗi xảy ra trong quá trình khôi phục, hãy liên hệ quản trị viên hệ thống.</li>
        </ul>
      </div>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false);
          setPendingFile(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }}
        onConfirm={confirmRecovery}
        title="Xác nhận khôi phục dữ liệu"
        message="CẢNH BÁO: Hành động này sẽ ghi đè toàn bộ dữ liệu hiện tại bằng dữ liệu từ tệp sao lưu. Bạn có chắc chắn muốn tiếp tục?"
        confirmText="Khôi phục"
        cancelText="Hủy"
        type="warning"
      />
    </div>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}
