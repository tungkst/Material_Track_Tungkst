import { useMemo, useRef, useState } from 'react';
import { Material } from '../data/materials';
import { FileText, CheckCircle2, XCircle, Clock, Download, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface ReportProps {
  materials: Material[];
}

export function Report({ materials }: ReportProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const stats = useMemo(() => {
    const total = materials.length;
    const approved = materials.filter((m) => m.status === 'Approved').length;
    const pending = materials.filter((m) => m.status === 'Pending').length;
    const rejected = materials.filter((m) => m.status === 'Rejected').length;
    const omitted = materials.filter((m) => m.status === 'Omitted').length;
    const noSample = materials.filter((m) => m.status === 'No Sample Required').length;

    // "Đã chốt" includes Approved, Omitted, No Sample Required
    const resolved = approved + omitted + noSample;
    // "Chưa chốt" includes Pending, Rejected
    const unresolved = pending + rejected;

    return { total, approved, pending, rejected, omitted, noSample, resolved, unresolved };
  }, [materials]);

  const handleExport = async () => {
    if (!reportRef.current) return;
    
    try {
      setIsExporting(true);
      
      const canvas = await html2canvas(reportRef.current, {
        scale: 2, // Higher resolution
        useCORS: true,
        logging: false,
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      // A4 dimensions in mm
      const pdfWidth = 210;
      const pdfHeight = 297;
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      let heightLeft = imgHeight;
      let position = 0;
      
      // First page
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;
      
      // Add new pages if content is longer than one page
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
      
      pdf.save('Bao-cao-vat-tu.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Có lỗi xảy ra khi xuất PDF. Vui lòng thử lại.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">Báo cáo tình trạng vật liệu</h2>
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {isExporting ? 'Đang xuất...' : 'Xuất báo cáo PDF'}
        </button>
      </div>

      <div ref={reportRef} className="space-y-6 bg-gray-50 p-4 rounded-xl">
        <div className="text-center mb-6 hidden print:block">
          <h1 className="text-2xl font-bold text-gray-900">BÁO CÁO TÌNH TRẠNG VẬT TƯ</h1>
          <p className="text-gray-500">Ngày xuất: {new Date().toLocaleDateString('vi-VN')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Summary Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-500" />
              Tổng hợp chung
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Tổng số vật tư đệ trình:</span>
                <span className="text-xl font-semibold text-gray-900">{stats.total}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg">
                <span className="text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Đã chốt (Approved/Omitted/No Sample)
                </span>
                <span className="text-xl font-semibold text-emerald-700">{stats.resolved}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg">
                <span className="text-amber-700 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Chưa chốt (Pending/Rejected)
                </span>
                <span className="text-xl font-semibold text-amber-700">{stats.unresolved}</span>
              </div>
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Chi tiết theo trạng thái</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-gray-600">Đã phê duyệt (Approved)</span>
                <span className="font-medium text-gray-900">{stats.approved}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-gray-600">Đang chờ duyệt (Pending)</span>
                <span className="font-medium text-gray-900">{stats.pending}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-gray-600">Bị từ chối (Rejected)</span>
                <span className="font-medium text-gray-900">{stats.rejected}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-gray-600">Bỏ qua (Omitted)</span>
                <span className="font-medium text-gray-900">{stats.omitted}</span>
              </div>
              <div className="flex justify-between items-center pb-2">
                <span className="text-gray-600">Không cần mẫu (No Sample Required)</span>
                <span className="font-medium text-gray-900">{stats.noSample}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Unresolved List Preview */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-500" />
            Danh sách vật tư chưa chốt cần lưu ý
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã / Tên</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hạng mục</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phản hồi gần nhất</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {materials
                  .filter((m) => m.status === 'Pending' || m.status === 'Rejected')
                  .map((m) => (
                    <tr key={m.id}>
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium text-gray-900">{m.code}</div>
                        <div className="text-gray-500">{m.name}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{m.type}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${m.status === 'Rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 truncate max-w-xs">{m.feedback}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
