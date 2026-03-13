import { useState } from 'react';
import { Material, mockMaterials, MaterialStatus } from './data/materials';
import { Dashboard } from './components/Dashboard';
import { MaterialList } from './components/MaterialList';
import { MaterialDetail } from './components/MaterialDetail';
import { MaterialFormModal } from './components/MaterialFormModal';
import { Report } from './components/Report';
import { LayoutDashboard, Settings, LogOut, Bell, UserCircle, FileBarChart, Menu, ChevronLeft, Paintbrush, Hammer, Building2, Sofa, Palette, Zap, Monitor } from 'lucide-react';
import { cn } from './lib/utils';

type Tab = 'Dashboard' | 'BasicFinish' | 'Fitout' | 'Architecture' | 'Furniture' | 'Decor' | 'MEP' | 'Equipment' | 'Report';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('Dashboard');
  const [materials, setMaterials] = useState<Material[]>(mockMaterials);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

  const handleSelectMaterial = (material: Material) => {
    setSelectedMaterial(material);
    setIsDetailOpen(true);
  };

  const handleUpdateStatus = (id: string, newStatus: MaterialStatus, newFeedback: string) => {
    setMaterials((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: newStatus, feedback: newFeedback } : m))
    );
    // Update the selected material as well so the drawer reflects the change immediately
    setSelectedMaterial((prev) => (prev && prev.id === id ? { ...prev, status: newStatus, feedback: newFeedback } : prev));
  };

  const handleAddMaterial = () => {
    setEditingMaterial(null);
    setIsFormModalOpen(true);
  };

  const handleEditMaterial = (material: Material) => {
    setEditingMaterial(material);
    setIsFormModalOpen(true);
  };

  const handleSaveMaterial = (material: Material) => {
    if (editingMaterial) {
      setMaterials((prev) => prev.map((m) => (m.id === material.id ? material : m)));
      if (selectedMaterial?.id === material.id) {
        setSelectedMaterial(material);
      }
    } else {
      setMaterials((prev) => [material, ...prev]);
    }
  };

  const handleDeleteMaterial = (id: string) => {
    setMaterials((prev) => prev.filter((m) => m.id !== id));
    if (selectedMaterial?.id === id) {
      setIsDetailOpen(false);
      setSelectedMaterial(null);
    }
  };

  const currentMaterials = materials.filter((m) => {
    if (activeTab === 'BasicFinish') return m.type === 'BasicFinish';
    if (activeTab === 'Fitout') return m.type === 'Fitout';
    if (activeTab === 'Architecture') return m.type === 'Architecture';
    if (activeTab === 'Furniture') return m.type === 'Furniture';
    if (activeTab === 'Decor') return m.type === 'Decor';
    if (activeTab === 'MEP') return m.type === 'MEP';
    if (activeTab === 'Equipment') return m.type === 'Equipment';
    return true; // Dashboard and Report use all
  });

  return (
    <div className="flex h-screen bg-gray-50 font-sans print:h-auto print:bg-white">
      {/* Sidebar */}
      <aside className={cn(
        "bg-white border-r border-gray-200 flex flex-col transition-all duration-300 print:hidden",
        isSidebarCollapsed ? "w-20" : "w-64"
      )}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          {!isSidebarCollapsed && (
            <h1 className="text-xl font-bold text-indigo-600 tracking-tight truncate">MaterialTrack - CORE CXL</h1>
          )}
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 mx-auto"
          >
            {isSidebarCollapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <button
            onClick={() => setActiveTab('Dashboard')}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
              activeTab === 'Dashboard'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              isSidebarCollapsed && 'justify-center px-0'
            )}
            title="Tổng quan"
          >
            <LayoutDashboard className="w-5 h-5 shrink-0" />
            {!isSidebarCollapsed && <span>Tổng quan</span>}
          </button>
          <button
            onClick={() => setActiveTab('BasicFinish')}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
              activeTab === 'BasicFinish'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              isSidebarCollapsed && 'justify-center px-0'
            )}
            title="Hoàn thiện cơ bản"
          >
            <Paintbrush className="w-5 h-5 shrink-0" />
            {!isSidebarCollapsed && <span className="truncate">Hoàn thiện cơ bản</span>}
          </button>
          <button
            onClick={() => setActiveTab('Fitout')}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
              activeTab === 'Fitout'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              isSidebarCollapsed && 'justify-center px-0'
            )}
            title="Nội thất Fitout"
          >
            <Hammer className="w-5 h-5 shrink-0" />
            {!isSidebarCollapsed && <span className="truncate">Nội thất Fitout</span>}
          </button>
          <button
            onClick={() => setActiveTab('Architecture')}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
              activeTab === 'Architecture'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              isSidebarCollapsed && 'justify-center px-0'
            )}
            title="Kiến trúc mặt ngoài"
          >
            <Building2 className="w-5 h-5 shrink-0" />
            {!isSidebarCollapsed && <span className="truncate">Kiến trúc mặt ngoài</span>}
          </button>
          <button
            onClick={() => setActiveTab('Furniture')}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
              activeTab === 'Furniture'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              isSidebarCollapsed && 'justify-center px-0'
            )}
            title="Nội thất rời"
          >
            <Sofa className="w-5 h-5 shrink-0" />
            {!isSidebarCollapsed && <span className="truncate">Nội thất rời</span>}
          </button>
          <button
            onClick={() => setActiveTab('Decor')}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
              activeTab === 'Decor'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              isSidebarCollapsed && 'justify-center px-0'
            )}
            title="Đồ Decor"
          >
            <Palette className="w-5 h-5 shrink-0" />
            {!isSidebarCollapsed && <span className="truncate">Đồ Decor</span>}
          </button>
          <button
            onClick={() => setActiveTab('MEP')}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
              activeTab === 'MEP'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              isSidebarCollapsed && 'justify-center px-0'
            )}
            title="Cơ điện (MEP)"
          >
            <Zap className="w-5 h-5 shrink-0" />
            {!isSidebarCollapsed && <span className="truncate">Cơ điện (MEP)</span>}
          </button>
          <button
            onClick={() => setActiveTab('Equipment')}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
              activeTab === 'Equipment'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              isSidebarCollapsed && 'justify-center px-0'
            )}
            title="Thiết bị"
          >
            <Monitor className="w-5 h-5 shrink-0" />
            {!isSidebarCollapsed && <span className="truncate">Thiết bị</span>}
          </button>
          <button
            onClick={() => setActiveTab('Report')}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors mt-4',
              activeTab === 'Report'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              isSidebarCollapsed && 'justify-center px-0'
            )}
            title="Lập báo cáo"
          >
            <FileBarChart className="w-5 h-5 shrink-0" />
            {!isSidebarCollapsed && <span className="truncate">Lập báo cáo</span>}
          </button>
        </nav>
        <div className="p-4 border-t border-gray-200 space-y-2">
          {!isSidebarCollapsed && (
            <div className="mb-4 px-4 py-2 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-xs text-gray-500 font-medium mb-1">Người lập:</p>
              <p className="text-sm text-gray-800 font-semibold">Nguyễn Thanh Tùng - ĐPTK</p>
            </div>
          )}
          <button 
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors",
              isSidebarCollapsed && 'justify-center px-0'
            )}
            title="Cài đặt"
          >
            <Settings className="w-5 h-5 shrink-0" />
            {!isSidebarCollapsed && <span>Cài đặt</span>}
          </button>
          <button 
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors",
              isSidebarCollapsed && 'justify-center px-0'
            )}
            title="Đăng xuất"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!isSidebarCollapsed && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden print:overflow-visible">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0 print:hidden">
          <h2 className="text-xl font-semibold text-gray-800">
            {activeTab === 'Dashboard' && 'Bảng điều khiển'}
            {activeTab === 'BasicFinish' && 'Vật liệu Hoàn thiện cơ bản'}
            {activeTab === 'Fitout' && 'Vật liệu Nội thất Fitout'}
            {activeTab === 'Architecture' && 'Vật liệu Kiến trúc mặt ngoài'}
            {activeTab === 'Furniture' && 'Vật liệu Nội thất rời'}
            {activeTab === 'Decor' && 'Vật liệu Đồ Decor'}
            {activeTab === 'MEP' && 'Vật liệu Cơ điện (MEP)'}
            {activeTab === 'Equipment' && 'Vật liệu Thiết bị'}
            {activeTab === 'Report' && 'Lập báo cáo Chủ đầu tư'}
          </h2>
          <div className="flex items-center gap-6">
            <button className="text-gray-400 hover:text-gray-500 relative">
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white" />
              <Bell className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3 border-l border-gray-200 pl-6">
              <UserCircle className="w-8 h-8 text-gray-400" />
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-700">Chủ Đầu Tư</p>
                <p className="text-xs text-gray-500">Masterise Homes</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-8 print:p-0 print:overflow-visible">
          <div className="max-w-7xl mx-auto h-full print:max-w-none">
            {activeTab === 'Dashboard' && <Dashboard materials={materials} />}
            {activeTab === 'Report' && <Report materials={materials} />}
            {['BasicFinish', 'Fitout', 'Architecture', 'Furniture', 'Decor', 'MEP', 'Equipment'].includes(activeTab) && (
              <MaterialList 
                materials={currentMaterials} 
                onSelect={handleSelectMaterial} 
                onAdd={handleAddMaterial}
                onEdit={handleEditMaterial}
                onDelete={handleDeleteMaterial}
              />
            )}
          </div>
        </div>
      </main>

      {/* Detail Drawer */}
      <MaterialDetail
        material={selectedMaterial}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onUpdateStatus={handleUpdateStatus}
      />

      {/* Form Modal */}
      <MaterialFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveMaterial}
        initialData={editingMaterial}
        existingMaterials={materials}
      />
    </div>
  );
}
