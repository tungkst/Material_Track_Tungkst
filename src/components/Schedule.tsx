import React, { useState, useMemo } from 'react';
import { CalendarDays, Clock, CheckCircle2, AlertCircle, List, BarChart2, Plus, Edit2, Trash2, Flag, Bell, AlertTriangle, Users } from 'lucide-react';
import { Milestone, SiteLog } from '../data/milestones';
import { MilestoneModal } from './MilestoneModal';
import { ConfirmModal } from './ConfirmModal';
import { db } from '../firebase';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { cn } from '../lib/utils';
import { User } from 'firebase/auth';

interface Task {
  id: number;
  name: string;
  duration: string;
  start: string;
  finish: string;
  actualFinish?: string;
  note?: string;
  isHeader?: boolean;
}

interface TaskActual {
  id: string; // task id as string
  actualFinish: string;
}

interface ScheduleProps {
  milestones?: Milestone[];
  siteLogs?: SiteLog[];
  user: User | null;
  onGenerateSiteLog?: (prompt: string) => Promise<void>;
  onAddSiteLog?: (log: SiteLog) => Promise<void>;
  onUpdateSiteLog?: (log: SiteLog) => Promise<void>;
  onDeleteSiteLog?: (id: string) => Promise<void>;
}

const scheduleData: Task[] = [
  { id: 0, name: 'CĂN MẪU MASTERISE HOME - DỰ ÁN CAO XÀ LÁ', duration: '82 days', start: '05/03/26', finish: '25/05/26', isHeader: true },
  { id: 1, name: 'CÔNG TÁC CHUẨN BỊ - PHÁP LÝ', duration: '14 days', start: '05/03/26', finish: '18/03/26', isHeader: true },
  { id: 2, name: 'Trình duyệt vật liệu cơ điện âm tường', duration: '12 days', start: '05/03/26', finish: '16/03/26' },
  { id: 3, name: 'Trình duyệt vật liệu cơ điện âm trần', duration: '12 days', start: '05/03/26', finish: '16/03/26' },
  { id: 4, name: 'Trình duyệt vật tư cơ điện final fix', duration: '14 days', start: '05/03/26', finish: '18/03/26' },
  { id: 5, name: 'Trình duyệt vật liệu ốp lát gạch, ốp lát đá', duration: '14 days', start: '05/03/26', finish: '18/03/26' },
  { id: 6, name: 'Trình duyệt vật liệu sơn nước hoàn thiện', duration: '14 days', start: '05/03/26', finish: '18/03/26' },
  { id: 7, name: 'GIAI ĐOẠN XÂY DỰNG', duration: '76 days', start: '05/03/26', finish: '19/05/26', isHeader: true },
  { id: 8, name: 'Hoàn thiện thô (Xây, trát, ốp lát, cán nền)', duration: '37 days', start: '05/03/26', finish: '10/04/26', isHeader: true },
  { id: 9, name: 'Công tác xây, LTBT, giằng tường', duration: '16 days', start: '05/03/26', finish: '20/03/26' },
  { id: 10, name: 'Đặt hàng vật tư cơ điện âm tường, âm vách về công trường', duration: '7 days', start: '17/03/26', finish: '23/03/26' },
  { id: 11, name: 'Thi công cơ điện âm tường, âm vách thạch cao', duration: '7 days', start: '24/03/26', finish: '30/03/26' },
  { id: 12, name: 'Bả skimcoat, vách thạch cao (và gia cố KCT)', duration: '10 days', start: '27/03/26', finish: '05/04/26' },
  { id: 13, name: 'Công tác cán nền', duration: '5 days', start: '06/04/26', finish: '10/04/26' },
  { id: 14, name: 'Công tác ốp lát gạch, đá', duration: '35 days', start: '19/03/26', finish: '22/04/26', isHeader: true },
  { id: 15, name: 'Đặt hàng vật tư về công trường', duration: '21 days', start: '19/03/26', finish: '08/04/26', note: 'Vật tư có sẵn trong nước' },
  { id: 16, name: 'Ốp lát gạch, ốp lát đá', duration: '14 days', start: '09/04/26', finish: '22/04/26' },
  { id: 17, name: 'Thi công cơ điện', duration: '35 days', start: '17/03/26', finish: '20/04/26', isHeader: true },
  { id: 18, name: 'Thi công kết cấu thép âm trần', duration: '6 days', start: '18/03/26', finish: '23/03/26' },
  { id: 19, name: 'Đặt hàng vật tư về công trường', duration: '21 days', start: '17/03/26', finish: '06/04/26' },
  { id: 20, name: 'Thi công hệ thống MEP âm trần', duration: '14 days', start: '07/04/26', finish: '20/04/26' },
  { id: 21, name: 'Hoàn thiện tinh (Trần thạch cao, sơn bả)', duration: '55 days', start: '19/03/26', finish: '12/05/26', isHeader: true },
  { id: 22, name: 'Trần thạch cao căn hộ, hành lang,...', duration: '14 days', start: '21/04/26', finish: '04/05/26' },
  { id: 23, name: 'Đặt hàng vật tư về công trường', duration: '21 days', start: '19/03/26', finish: '08/04/26' },
  { id: 24, name: 'Công tác sơn bả căn hộ, hành lang,...', duration: '14 days', start: '29/04/26', finish: '12/05/26' },
  { id: 25, name: 'Trần thạch cao WC', duration: '7 days', start: '23/04/26', finish: '29/04/26' },
  { id: 26, name: 'Công tác sơn bả WC', duration: '7 days', start: '30/04/26', finish: '06/05/26' },
  { id: 27, name: 'Thiết bị MEP final fix', duration: '62 days', start: '19/03/26', finish: '19/05/26', isHeader: true },
  { id: 28, name: 'Đặt hàng, vận chuyển về công trường', duration: '45 days', start: '19/03/26', finish: '02/05/26' },
  { id: 29, name: 'Lắp đặt thiết bị final fix', duration: '7 days', start: '13/05/26', finish: '19/05/26' },
  { id: 30, name: 'GIAI ĐOẠN HOÀN THIỆN VÀ BÀN GIAO VẬN HÀNH', duration: '6 days', start: '20/05/26', finish: '25/05/26', isHeader: true },
  { id: 31, name: 'Công tác sửa chữa, defect', duration: '3 days', start: '20/05/26', finish: '22/05/26' },
  { id: 32, name: 'Vệ sinh và nghiệm thu bàn giao', duration: '3 days', start: '23/05/26', finish: '25/05/26' },
];

export function Schedule({ milestones = [], siteLogs = [], user, onGenerateSiteLog, onAddSiteLog, onUpdateSiteLog, onDeleteSiteLog }: ScheduleProps) {
  const [activeTab, setActiveTab] = useState<'schedule' | 'siteLog'>('schedule');
  const [viewMode, setViewMode] = useState<'table' | 'gantt'>('gantt');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSiteLogModalOpen, setIsSiteLogModalOpen] = useState(false);
  const [siteLogPrompt, setSiteLogPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [taskActuals, setTaskActuals] = useState<Record<string, string>>({});
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingActualDate, setEditingActualDate] = useState('');
  const [editingTaskStatus, setEditingTaskStatus] = useState<'Completed' | 'Delayed' | 'Upcoming'>('Upcoming');
  const [editingTaskNote, setEditingTaskNote] = useState('');

  // Fetch Task Actuals
  React.useEffect(() => {
    if (!user) return;
    const path = 'taskActuals';
    const unsubscribe = onSnapshot(collection(db, path), (snapshot) => {
      const actuals: Record<string, string> = {};
      snapshot.forEach((doc) => {
        const data = doc.data() as TaskActual;
        actuals[data.id] = data.actualFinish;
      });
      setTaskActuals(actuals);
    }, (error) => {
      console.error('Error fetching task actuals:', error);
    });
    return () => unsubscribe();
  }, [user]);

  const handleSaveTaskActual = async () => {
    if (!editingTask) return;
    const id = String(editingTask.id);
    try {
      await setDoc(doc(db, 'taskActuals', id), {
        id,
        actualFinish: editingActualDate,
        updatedAt: new Date().toISOString()
      });
      setIsTaskModalOpen(false);
      setEditingTask(null);
    } catch (error) {
      console.error('Error saving task actual:', error);
      alert('Có lỗi xảy ra khi lưu ngày hoàn thành thực tế.');
    }
  };
  const [editingSiteLog, setEditingSiteLog] = useState<SiteLog | null>(null);
  const [addingSiteLog, setAddingSiteLog] = useState<Partial<SiteLog> | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteSiteLogConfirmId, setDeleteSiteLogConfirmId] = useState<string | null>(null);

  const handleGenerateSiteLog = async () => {
    if (!onGenerateSiteLog || !siteLogPrompt) return;
    setIsGenerating(true);
    try {
      await onGenerateSiteLog(siteLogPrompt);
      setIsSiteLogModalOpen(false);
      setSiteLogPrompt('');
    } catch (error) {
      console.error('Error generating site log:', error);
      alert('Có lỗi xảy ra khi tạo nhật ký công trường.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddSiteLog = async () => {
    if (!onAddSiteLog || !addingSiteLog) return;
    try {
      const newLog: SiteLog = {
        id: `log-${Date.now()}`,
        date: addingSiteLog.date || new Date().toLocaleDateString('vi-VN'),
        laborCount: addingSiteLog.laborCount || 0,
        workContent: addingSiteLog.workContent || '',
        createdAt: new Date().toISOString(),
      };
      await onAddSiteLog(newLog);
      setAddingSiteLog(null);
    } catch (error) {
      console.error('Error adding site log:', error);
      alert('Có lỗi xảy ra khi thêm nhật ký công trường.');
    }
  };

  const handleUpdateSiteLog = async () => {
    if (!onUpdateSiteLog || !editingSiteLog) return;
    try {
      await onUpdateSiteLog(editingSiteLog);
      setEditingSiteLog(null);
    } catch (error) {
      console.error('Error updating site log:', error);
      alert('Có lỗi xảy ra khi cập nhật nhật ký công trường.');
    }
  };

  const confirmDeleteSiteLog = async () => {
    if (!onDeleteSiteLog || !deleteSiteLogConfirmId) return;
    try {
      await onDeleteSiteLog(deleteSiteLogConfirmId);
      setDeleteSiteLogConfirmId(null);
    } catch (error) {
      console.error('Error deleting site log:', error);
      alert('Có lỗi xảy ra khi xóa nhật ký công trường.');
    }
  };

  const parseDate = (dateStr: string) => {
    if (!dateStr || typeof dateStr !== 'string') return new Date();
    const parts = dateStr.split('/');
    if (parts.length !== 3) return new Date();
    const [day, month, year] = parts;
    return new Date(2000 + parseInt(year), parseInt(month) - 1, parseInt(day));
  };

  const projectStart = parseDate('01/03/26');
  const projectEnd = parseDate('31/05/26');
  const totalDays = Math.ceil((projectEnd.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24));

  const today = useMemo(() => new Date(), []);
  
  const approachingMilestones = useMemo(() => {
    return milestones.filter(ms => {
      if (ms.status === 'Completed') return false;
      const msDate = parseDate(ms.date);
      const diffTime = msDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7;
    });
  }, [milestones, today]);

  const markers = [];
  for (let d = new Date(projectStart); d <= projectEnd; d.setDate(d.getDate() + 7)) {
    markers.push(new Date(d));
  }

  const handleSaveMilestone = async (milestone: Omit<Milestone, 'id'> & { id?: string }) => {
    const id = milestone.id || `ms-${Date.now()}`;
    const path = `milestones/${id}`;
    try {
      await setDoc(doc(db, 'milestones', id), { ...milestone, id });
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving milestone:', error);
      alert('Có lỗi xảy ra khi lưu mốc thời gian.');
    }
  };

  const handleDeleteMilestone = async (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDeleteMilestone = async () => {
    if (!deleteConfirmId) return;
    const id = deleteConfirmId;
    try {
      await deleteDoc(doc(db, 'milestones', id));
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Error deleting milestone:', error);
      alert('Có lỗi xảy ra khi xóa mốc thời gian.');
    }
  };


  return (
    <div className="h-full flex flex-col p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tiến độ dự án</h1>
          <p className="text-gray-500 mt-1">Căn mẫu Masterise Home - Dự án Cao Xà Lá</p>
        </div>
        <div className="flex items-center gap-4">
          {approachingMilestones.length > 0 && (
            <div className="relative group">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg text-red-700 animate-pulse cursor-help">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-xs font-bold">Cảnh báo: {approachingMilestones.length} mốc sắp đến hạn!</span>
              </div>
              
              {/* Alert Dropdown */}
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100] p-4">
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-red-500" />
                  Mốc thời gian sắp tới
                </h3>
                <div className="space-y-3">
                  {approachingMilestones.map(ms => (
                    <div key={ms.id} className="text-xs border-l-2 border-red-500 pl-3 py-1">
                      <div className="font-bold text-gray-900">{ms.name}</div>
                      <div className="text-gray-500 flex items-center justify-between mt-1">
                        <span>{ms.date}</span>
                        <span className={cn(
                          "px-1.5 py-0.5 rounded-[4px] font-bold uppercase text-[8px]",
                          ms.status === 'Delayed' ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                        )}>
                          {ms.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {activeTab === 'siteLog' ? (
            <div className="flex gap-3">
              <button
                onClick={() => setAddingSiteLog({ date: new Date().toLocaleDateString('vi-VN'), laborCount: 0, workContent: '' })}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors shadow-sm"
              >
                <Edit2 className="w-5 h-5" />
                Thêm thủ công
              </button>
              <button
                onClick={() => setIsSiteLogModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
              >
                <Plus className="w-5 h-5" />
                Tạo bằng AI
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => {
                  setEditingMilestone(null);
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <Plus className="w-5 h-5" />
                Thêm mốc thời gian
              </button>
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setViewMode('table')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'table' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <List className="w-4 h-4" />
                  Danh sách
                </button>
                <button
                  onClick={() => setViewMode('gantt')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'gantt' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <BarChart2 className="w-4 h-4" />
                  Gantt
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex border-b border-gray-200 mb-6 shrink-0">
        <button
          onClick={() => setActiveTab('schedule')}
          className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'schedule'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Tiến độ
        </button>
        <button
          onClick={() => setActiveTab('siteLog')}
          className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'siteLog'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Nhật ký công trường
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col bg-white rounded-xl shadow-sm border border-gray-200">
        {activeTab === 'schedule' ? (
          <>
            {viewMode === 'table' ? (
          <div className="overflow-x-auto flex-1">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                    ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tên công việc / Mốc thời gian
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Thời gian
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Bắt đầu / Ngày
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Kết thúc
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Hoàn thành thực tế
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                    Ghi chú
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* Milestones Section */}
                {milestones.length > 0 && (
                  <>
                    <tr className="bg-indigo-50/30">
                      <td colSpan={7} className="px-6 py-2 text-xs font-bold text-indigo-700 uppercase tracking-wider">
                        Mốc thời gian quan trọng (Milestones)
                      </td>
                    </tr>
                    {milestones.map((ms) => (
                      <tr key={ms.id} className="hover:bg-indigo-50/10 transition-colors group cursor-pointer" onClick={() => {
                        setEditingMilestone(ms);
                        setIsModalOpen(true);
                      }}>
                        <td className="px-6 py-3 whitespace-nowrap text-sm text-indigo-500 font-medium">
                          <Flag className="w-4 h-4" />
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-bold text-gray-900">{ms.name}</div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingMilestone(ms);
                                  setIsModalOpen(true);
                                }}
                                className="p-1 text-gray-400 hover:text-indigo-600"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteMilestone(ms.id);
                                }}
                                className="p-1 text-gray-400 hover:text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                          -
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm font-bold text-indigo-600">
                          {ms.date}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                          -
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm font-bold text-emerald-600">
                          {ms.actualDate || '-'}
                        </td>
                        <td className="px-6 py-3 text-sm">
                          <span className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                            ms.status === 'Completed' ? "bg-emerald-100 text-emerald-700" : 
                            ms.status === 'Delayed' ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                          )}>
                            {ms.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </>
                )}

                {/* Static Schedule Data */}
                <tr className="bg-gray-50/30">
                  <td colSpan={7} className="px-6 py-2 text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Tiến độ chi tiết (Detailed Schedule)
                  </td>
                </tr>
                {scheduleData.map((task) => {
                  const actualFinish = taskActuals[String(task.id)];
                  return (
                    <tr 
                      key={task.id} 
                      className={cn(
                        task.isHeader ? "bg-gray-50/50" : "hover:bg-gray-50 transition-colors cursor-pointer",
                        !task.isHeader && "group"
                      )}
                      onClick={() => {
                        if (!task.isHeader) {
                          setEditingTask(task);
                          setEditingActualDate(actualFinish || '');
                          setIsTaskModalOpen(true);
                        }
                      }}
                    >
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                        {task.id}
                      </td>
                      <td className="px-6 py-3">
                        <div className={`text-sm ${task.isHeader ? 'font-bold text-gray-900 uppercase' : 'text-gray-700 pl-4'}`}>
                          {task.name}
                        </div>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                        {task.duration}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                        {task.start}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                        {task.finish}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm font-bold text-emerald-600">
                        {actualFinish || '-'}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-500">
                        {task.note && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                            {task.note}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex-1 overflow-auto bg-white">
            <div className="flex min-w-max">
              {/* Left Panel: Task List */}
              <div className="w-[350px] shrink-0 border-r border-gray-200 bg-white sticky left-0 z-20">
                <div className="h-12 border-b border-gray-200 bg-gray-50 flex items-center px-4 font-medium text-xs text-gray-500 uppercase tracking-wider sticky top-0 z-30">
                  <div className="w-10">ID</div>
                  <div className="flex-1">Tên công việc</div>
                  <div className="w-16 text-right">T.Gian</div>
                </div>
                <div>
                  {/* Milestones in Gantt Left Panel */}
                  {milestones.map(ms => (
                    <div key={ms.id} className="h-10 border-b border-indigo-50 flex items-center px-4 text-sm bg-indigo-50/20 hover:bg-indigo-50/40 transition-colors group">
                      <div className="w-10 text-indigo-500"><Flag className="w-3.5 h-3.5" /></div>
                      <div className="flex-1 truncate font-bold text-gray-900" title={ms.name}>{ms.name}</div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mr-2">
                        <button 
                          onClick={() => {
                            setEditingMilestone(ms);
                            setIsModalOpen(true);
                          }}
                          className="p-1 text-gray-400 hover:text-indigo-600"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteMilestone(ms.id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="w-16 text-right text-indigo-600 font-bold text-[10px]">M.STONE</div>
                    </div>
                  ))}
                  
                  {/* Tasks in Gantt Left Panel */}
                  {scheduleData.map(task => (
                    <div key={task.id} className={`h-10 border-b border-gray-100 flex items-center px-4 text-sm ${task.isHeader ? 'font-bold bg-gray-50/50' : 'hover:bg-gray-50'}`}>
                      <div className="w-10 text-gray-500 text-xs">{task.id}</div>
                      <div className={`flex-1 truncate ${!task.isHeader ? 'pl-4 text-gray-700' : 'text-gray-900'}`} title={task.name}>{task.name}</div>
                      <div className="w-16 text-right text-gray-500 text-xs">{task.duration.split(' ')[0]}d</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Panel: Timeline */}
              <div className="flex-1 relative bg-white" style={{ minWidth: '800px' }}>
                {/* Timeline Header */}
                <div className="h-12 border-b border-gray-200 bg-gray-50 relative sticky top-0 z-10">
                   {markers.map((marker, i) => {
                     const left = ((marker.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24)) / totalDays * 100;
                     return (
                       <div key={i} className="absolute top-0 bottom-0 border-l border-gray-200 px-2 py-1 text-xs text-gray-500" style={{ left: `${left}%` }}>
                         <div className="font-medium">{marker.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}</div>
                       </div>
                     );
                   })}
                </div>
                
                {/* Timeline Grid Lines */}
                <div className="absolute top-12 bottom-0 left-0 right-0 pointer-events-none z-10">
                   {markers.map((marker, i) => {
                     const left = ((marker.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24)) / totalDays * 100;
                     return (
                       <div key={i} className="absolute top-0 bottom-0 border-l border-gray-100" style={{ left: `${left}%` }} />
                     );
                   })}
                   
                   {/* Today Line */}
                   {(() => {
                     const left = ((today.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24)) / totalDays * 100;
                     if (left >= 0 && left <= 100) {
                       return (
                         <div className="absolute top-0 bottom-0 border-l-2 border-blue-500 z-20" style={{ left: `${left}%` }}>
                           <div className="absolute top-0 -translate-x-1/2 bg-blue-500 text-white text-[8px] px-1.5 py-0.5 rounded-b font-bold shadow-sm">HÔM NAY</div>
                         </div>
                       );
                     }
                     return null;
                   })()}

                   {/* Milestone Vertical Red Lines */}
                   {milestones.map((ms) => {
                     const date = parseDate(ms.date);
                     const left = ((date.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24)) / totalDays * 100;
                     
                     const isApproaching = (() => {
                       if (ms.status === 'Completed') return false;
                       const diffTime = date.getTime() - today.getTime();
                       const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                       return diffDays >= 0 && diffDays <= 7;
                     })();

                     if (left >= 0 && left <= 100) {
                       return (
                         <div 
                           key={`line-${ms.id}`} 
                           className={cn(
                             "absolute top-0 bottom-0 border-l z-10 group/ms-line transition-all",
                             ms.status === 'Completed' ? "border-red-300 border-dashed opacity-40" : 
                             ms.status === 'Delayed' ? "border-red-700 border-l-2" : "border-red-500 border-l-[1px]"
                           )}
                           style={{ left: `${left}%` }}
                         >
                           {/* Warning Icon for approaching milestones */}
                           {isApproaching && (
                             <div className="absolute top-12 -translate-x-1/2 bg-white rounded-full p-0.5 shadow-md border border-red-200 animate-bounce z-30">
                               <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                             </div>
                           )}

                           <div className="absolute top-1/4 left-0 -translate-x-1/2 opacity-0 group-hover/ms-line:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] px-2.5 py-2 rounded-lg shadow-2xl whitespace-nowrap z-50 pointer-events-auto border border-gray-700">
                             <div className="flex items-center gap-2 mb-1.5">
                               <Flag className={cn("w-3.5 h-3.5", ms.status === 'Completed' ? "text-gray-400" : "text-red-400")} />
                               <span className="font-bold text-[11px]">{ms.name}</span>
                             </div>
                             <div className="flex items-center justify-between gap-6 text-gray-300">
                               <span>Ngày: {ms.date}</span>
                               <span className={cn(
                                 "px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider",
                                 ms.status === 'Completed' ? "bg-gray-500/20 text-gray-400" :
                                 ms.status === 'Delayed' ? "bg-red-500/20 text-red-400" : "bg-blue-500/20 text-blue-400"
                               )}>
                                 {ms.status}
                               </span>
                             </div>
                           </div>
                         </div>
                       );
                     }
                     return null;
                   })}
                </div>

                {/* Milestones Markers in Gantt */}
                <div className="relative">
                  {milestones.map((ms) => {
                    const date = parseDate(ms.date);
                    const left = ((date.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24)) / totalDays * 100;
                    
                    return (
                      <div key={ms.id} className="h-10 border-b border-indigo-50 relative flex items-center bg-indigo-50/10">
                        <div 
                          className="absolute w-4 h-4 bg-red-600 rotate-45 -ml-2 shadow-sm flex items-center justify-center cursor-help z-30"
                          style={{ left: `${left}%` }}
                          title={`${ms.name}\nNgày: ${ms.date}\nLoại: ${ms.type}`}
                        >
                          <Flag className="w-2.5 h-2.5 text-white -rotate-45" />
                        </div>
                      </div>
                    );
                  })}

                  {/* Task Bars */}
                  {scheduleData.map((task) => {
                    const start = parseDate(task.start);
                    const finish = parseDate(task.finish);
                    const left = ((start.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24)) / totalDays * 100;
                    const width = Math.max(((finish.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) / totalDays * 100, 0.5);

                    let barColor = 'bg-blue-500';
                    if (task.isHeader) {
                      barColor = task.id === 0 ? 'bg-red-500' : 'bg-gray-800';
                    } else if (task.id >= 31) {
                      barColor = 'bg-red-500';
                    } else if (task.id === 23 || task.id === 24 || task.id === 29) {
                      barColor = 'bg-red-400';
                    }

                    return (
                      <div key={task.id} className="h-10 border-b border-gray-100 relative flex items-center group hover:bg-gray-50/50 cursor-pointer" onClick={() => {
                        if (!task.isHeader) {
                          setEditingTask(task);
                          const actualFinish = taskActuals[String(task.id)];
                          setEditingActualDate(actualFinish || '');
                          setIsTaskModalOpen(true);
                        }
                      }}>
                        {/* Planned Bar */}
                        <div 
                          className={cn(
                            "absolute rounded-sm flex items-center justify-center text-[10px] text-white whitespace-nowrap px-2 shadow-sm transition-all",
                            task.isHeader ? `${barColor} h-1.5 top-[17px]` : `${barColor} h-4 top-[6px]`
                          )}
                          style={{ left: `${left}%`, width: `${width}%` }}
                          title={`Kế hoạch: ${task.name}\n${task.start} - ${task.finish}`}
                        >
                          {!task.isHeader && width > 5 && <span className="truncate opacity-0 group-hover:opacity-100 transition-opacity">{task.duration}</span>}
                        </div>

                        {/* Actual Bar */}
                        {(() => {
                          const actualFinishStr = taskActuals[String(task.id)];
                          if (!actualFinishStr || task.isHeader) return null;
                          
                          const actualFinish = parseDate(actualFinishStr);
                          const plannedFinish = parseDate(task.finish);
                          const actualWidth = Math.max(((actualFinish.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) / totalDays * 100, 0.5);
                          
                          const isLate = actualFinish > plannedFinish;
                          const actualBarColor = isLate ? 'bg-red-600' : 'bg-emerald-500';

                          return (
                            <div 
                              className={cn(
                                "absolute rounded-sm h-2 bottom-[6px] shadow-sm transition-all z-10",
                                actualBarColor
                              )}
                              style={{ left: `${left}%`, width: `${actualWidth}%` }}
                              title={`Thực tế: ${task.name}\nHoàn thành: ${actualFinishStr}\n${isLate ? 'Trễ tiến độ' : 'Đạt tiến độ'}`}
                            />
                          );
                        })()}

                        {/* Start/End dates labels outside the bar */}
                        <div className="absolute text-[10px] text-gray-500 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity" style={{ left: `calc(${left}% - 35px)` }}>
                          {task.start.substring(0, 5)}
                        </div>
                        <div className="absolute text-[10px] text-gray-500 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity" style={{ left: `calc(${left + width}% + 5px)` }}>
                          {task.finish.substring(0, 5)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 shrink-0">
          <h3 className="text-xs font-semibold text-gray-900 mb-1.5 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-indigo-600" />
            Tiến độ lập trên cơ sở CĐT phê duyệt:
          </h3>
          <ul className="space-y-1 text-xs text-gray-600 list-disc list-inside grid grid-cols-1 md:grid-cols-2 gap-x-4">
            <li>Vật tư cơ điện âm tường, âm trần trước ngày 16/3/2026</li>
            <li>Vật tư cơ điện final fix trước ngày 18/3/2026</li>
            <li>Vật tư gạch ốp lát, đá ốp lát trước ngày 18/3/2026 (Gạch ốp lát nhập khẩu có sẵn hàng ở trong nước)</li>
            <li>Sơn nước trước ngày 18/3/2026</li>
            <li>BOQ trong vòng 14 ngày kể từ khi Nhà thầu đệ trình BOQ</li>
            <li>Đơn vị nội thất của Chủ đầu tư bàn giao cho Coteccons trước ngày 12/5/2026 để phối hợp lắp đặt thiết bị và thi công</li>
          </ul>
        </div>
          </>
        ) : (
          <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">Nhật ký công trường</h2>
            </div>
            {siteLogs.length === 0 ? (
              <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
                Chưa có nhật ký công trường nào. Hãy thêm nhật ký mới!
              </div>
            ) : (
              <div className="space-y-4">
                {siteLogs.map(log => (
                  <div key={log.id} className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-indigo-50 text-indigo-700 font-bold px-3 py-1.5 rounded-lg flex items-center gap-2">
                          <CalendarDays className="w-4 h-4" />
                          {log.date}
                        </div>
                        <div className="bg-emerald-50 text-emerald-700 font-medium px-3 py-1.5 rounded-lg flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Nhân công: {log.laborCount}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSiteLog(log);
                          }} 
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" 
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteSiteLogConfirmId(log.id);
                          }} 
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 whitespace-pre-wrap border border-gray-100 leading-relaxed">
                      {log.workContent}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <MilestoneModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveMilestone}
        milestone={editingMilestone}
      />

      {/* Site Log Modal */}
      {isSiteLogModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]">
          <div className="bg-white p-6 rounded-xl shadow-xl w-[500px]">
            <h2 className="text-lg font-bold mb-2">Thêm nhật ký công trường</h2>
            <p className="text-sm text-gray-500 mb-4">Mô tả công việc hôm nay, AI sẽ tự động tạo báo cáo chi tiết.</p>
            <textarea
              className="w-full h-32 p-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              placeholder="VD: Hôm nay 15/03/2026, 15 công nhân thi công bả skimcoat vách thạch cao..."
              value={siteLogPrompt}
              onChange={(e) => setSiteLogPrompt(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsSiteLogModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">Hủy</button>
              <button 
                onClick={handleGenerateSiteLog} 
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2" 
                disabled={isGenerating || !siteLogPrompt.trim()}
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang tạo...
                  </>
                ) : 'Tạo báo cáo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Site Log Modal */}
      {addingSiteLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]">
          <div className="bg-white p-6 rounded-xl shadow-xl w-[500px]">
            <h2 className="text-lg font-bold mb-4">Thêm nhật ký thủ công</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày (DD/MM/YYYY)</label>
                <input type="text" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none" value={addingSiteLog.date} onChange={e => setAddingSiteLog({...addingSiteLog, date: e.target.value})} placeholder="VD: 15/03/2026" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng nhân công</label>
                <input type="number" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none" value={addingSiteLog.laborCount} onChange={e => setAddingSiteLog({...addingSiteLog, laborCount: parseInt(e.target.value) || 0})} placeholder="VD: 15" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung công việc</label>
                <textarea className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none" value={addingSiteLog.workContent} onChange={e => setAddingSiteLog({...addingSiteLog, workContent: e.target.value})} placeholder="Mô tả chi tiết công việc đã thực hiện..." />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setAddingSiteLog(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">Hủy</button>
              <button onClick={handleAddSiteLog} className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors">Thêm nhật ký</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Site Log Modal */}
      {editingSiteLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]">
          <div className="bg-white p-6 rounded-xl shadow-xl w-[500px]">
            <h2 className="text-lg font-bold mb-4">Chỉnh sửa nhật ký</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày (DD/MM/YYYY)</label>
                <input type="text" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" value={editingSiteLog.date} onChange={e => setEditingSiteLog({...editingSiteLog, date: e.target.value})} placeholder="VD: 15/03/2026" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng nhân công</label>
                <input type="number" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" value={editingSiteLog.laborCount} onChange={e => setEditingSiteLog({...editingSiteLog, laborCount: parseInt(e.target.value) || 0})} placeholder="VD: 15" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung công việc</label>
                <textarea className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" value={editingSiteLog.workContent} onChange={e => setEditingSiteLog({...editingSiteLog, workContent: e.target.value})} placeholder="Mô tả chi tiết công việc đã thực hiện..." />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setEditingSiteLog(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">Hủy</button>
              <button onClick={handleUpdateSiteLog} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">Lưu thay đổi</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteSiteLogConfirmId}
        onClose={() => setDeleteSiteLogConfirmId(null)}
        onConfirm={confirmDeleteSiteLog}
        title="Xác nhận xóa nhật ký"
        message="Bạn có chắc chắn muốn xóa nhật ký công trường này? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        cancelText="Hủy"
        type="danger"
      />

      <ConfirmModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={confirmDeleteMilestone}
        title="Xác nhận xóa mốc thời gian"
        message={`Bạn có chắc chắn muốn xóa mốc thời gian "${milestones.find(m => m.id === deleteConfirmId)?.name || ''}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
        type="danger"
      />

      <MilestoneModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveMilestone}
        milestone={editingMilestone}
      />

      {/* Task Actual Date Modal */}
      {isTaskModalOpen && editingTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]">
          <div className="bg-white p-6 rounded-xl shadow-xl w-[400px]">
            <h2 className="text-lg font-bold mb-4">Cập nhật tiến độ thực tế</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Công việc:</p>
                <p className="text-sm font-bold text-gray-900">{editingTask.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Bắt đầu kế hoạch:</p>
                  <p className="text-sm font-medium">{editingTask.start}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Kết thúc kế hoạch:</p>
                  <p className="text-sm font-medium">{editingTask.finish}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Ngày hoàn thành thực tế (DD/MM/YYYY)</label>
                <input 
                  type="text" 
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                  value={editingActualDate} 
                  onChange={e => setEditingActualDate(e.target.value)} 
                  placeholder="VD: 15/03/2026" 
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setIsTaskModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">Hủy</button>
              <button onClick={handleSaveTaskActual} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">Lưu cập nhật</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
