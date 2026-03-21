import * as React from 'react';
import { useState, useEffect, useCallback, ReactNode } from 'react';
import { Material, mockMaterials, MaterialStatus } from './data/materials';
import { Milestone, SiteLog } from './data/milestones';
import { Dashboard } from './components/Dashboard';
import { MaterialList } from './components/MaterialList';
import { MaterialDetail } from './components/MaterialDetail';
import { MaterialFormModal } from './components/MaterialFormModal';
import { Report } from './components/Report';
import { Schedule } from './components/Schedule';
import { BackupManager } from './components/BackupManager';
import { LayoutDashboard, Settings, LogOut, Bell, UserCircle, FileBarChart, Menu, ChevronLeft, Paintbrush, Hammer, Building2, Sofa, Palette, Zap, Monitor, LogIn, AlertTriangle, List, CalendarDays, Database } from 'lucide-react';
import { cn } from './lib/utils';
import { db, auth, signInWithGoogle } from './firebase';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, getDocs, query, limit, getDocFromServer, where } from 'firebase/firestore';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { GoogleGenAI, Type } from "@google/genai";

// --- Error Handling ---
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- Error Boundary ---
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "Đã có lỗi xảy ra.";
      try {
        const parsed = JSON.parse(this.state.error.message);
        if (parsed.error) errorMessage = `Lỗi Firestore: ${parsed.error}`;
      } catch (e) {
        errorMessage = this.state.error.message || errorMessage;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Rất tiếc!</h2>
            <p className="text-gray-600 mb-6">{errorMessage}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-indigo-600 text-white px-6 py-2 rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Tải lại trang
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

type Tab = 'Dashboard' | 'Schedule' | 'AllMaterials' | 'BasicFinish' | 'Fitout' | 'Architecture' | 'Furniture' | 'Decor' | 'MEP' | 'Equipment' | 'Report' | 'Settings';

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>('Dashboard');
  const [materials, setMaterials] = useState<Material[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [siteLogs, setSiteLogs] = useState<SiteLog[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [currentEditIds, setCurrentEditIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- Auth & Seeding ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const seedDatabase = useCallback(async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'materials'), limit(1));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        console.log('Seeding database with mock materials...');
        for (const material of mockMaterials) {
          await setDoc(doc(db, 'materials', material.id), material);
        }
      }
    } catch (error) {
      console.error('Error seeding database:', error);
    }
  }, [user]);

  useEffect(() => {
    if (isAuthReady && user) {
      seedDatabase();
    }
  }, [isAuthReady, user, seedDatabase]);

  // --- Temporary Sync for MEP Updates ---
  useEffect(() => {
    if (!isAuthReady || !user) return;
    const syncMEPUpdates = async () => {
      try {
        // Find all MEP materials that are not provided by Client
        const q = query(collection(db, 'materials'), where('type', '==', 'MEP'), where('providedBy', '!=', 'Client'));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          console.log('Syncing MEP providedBy to Client...');
          for (const docSnapshot of snapshot.docs) {
            await updateDoc(doc(db, 'materials', docSnapshot.id), { providedBy: 'Client' });
          }
        }

        // Add new MEP items if missing
        const newItemsQ = query(collection(db, 'materials'), where('code', '==', 'PLUMB-01'));
        const newItemsSnapshot = await getDocs(newItemsQ);
        if (newItemsSnapshot.empty) {
          console.log('Syncing new MEP updates...');
          const mepUpdates = mockMaterials.filter(m => ['PLUMB-01', 'PLUMB-02', 'HVAC-01', 'HVAC-02'].includes(m.code));
          for (const material of mepUpdates) {
            await setDoc(doc(db, 'materials', material.id), { ...material, providedBy: 'Client' });
          }
        }
      } catch (error) {
        console.error('Error syncing MEP updates:', error);
      }
    };
    syncMEPUpdates();
  }, [isAuthReady, user]);

  // --- Real-time Sync ---
  useEffect(() => {
    if (!isAuthReady || !user) {
      setMaterials([]);
      setIsLoading(false);
      return;
    }

    const path = 'materials';
    const unsubscribe = onSnapshot(collection(db, path), (snapshot) => {
      const mats: Material[] = [];
      snapshot.forEach((doc) => {
        mats.push(doc.data() as Material);
      });
      setMaterials(mats);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });

    return () => unsubscribe();
  }, [isAuthReady, user]);

  // --- Milestones Real-time Sync ---
  useEffect(() => {
    if (!isAuthReady || !user) {
      setMilestones([]);
      return;
    }

    const path = 'milestones';
    const unsubscribe = onSnapshot(collection(db, path), (snapshot) => {
      const ms: Milestone[] = [];
      snapshot.forEach((doc) => {
        ms.push(doc.data() as Milestone);
      });
      setMilestones(ms);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });

    return () => unsubscribe();
  }, [isAuthReady, user]);

  // --- Site Logs Real-time Sync ---
  useEffect(() => {
    if (!isAuthReady || !user) {
      setSiteLogs([]);
      return;
    }

    const path = 'siteLogs';
    const unsubscribe = onSnapshot(collection(db, path), (snapshot) => {
      const logs: SiteLog[] = [];
      snapshot.forEach((doc) => {
        logs.push(doc.data() as SiteLog);
      });
      setSiteLogs(logs);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });

    return () => unsubscribe();
  }, [isAuthReady, user]);

  // --- Connection Test ---
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();
  }, []);

  const handleUpdateSiteLog = async (log: SiteLog) => {
    const path = `siteLogs/${log.id}`;
    try {
      await updateDoc(doc(db, 'siteLogs', log.id), {
        date: log.date,
        laborCount: log.laborCount,
        workContent: log.workContent
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleDeleteSiteLog = async (id: string) => {
    const path = `siteLogs/${id}`;
    try {
      await deleteDoc(doc(db, 'siteLogs', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const handleAddSiteLog = async (log: SiteLog) => {
    const path = `siteLogs/${log.id}`;
    try {
      await setDoc(doc(db, 'siteLogs', log.id), log);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const handleGenerateSiteLog = async (prompt: string) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Tạo nhật ký công trường từ nội dung sau: "${prompt}". 
        Trả về JSON với các trường: date (DD/MM/YYYY), laborCount (number), workContent (string).`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.STRING },
              laborCount: { type: Type.NUMBER },
              workContent: { type: Type.STRING },
            },
            required: ["date", "laborCount", "workContent"],
          },
        },
      });
      
      let text = response.text || '{}';
      // Clean up markdown code blocks if the model returns them despite responseMimeType
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      const logData = JSON.parse(text);
      
      const newLog: SiteLog = {
        id: `log-${Date.now()}`,
        date: logData.date || new Date().toLocaleDateString('vi-VN'),
        laborCount: Number(logData.laborCount) || 0,
        workContent: logData.workContent || prompt,
        createdAt: new Date().toISOString(),
      };
      
      await handleAddSiteLog(newLog);
    } catch (error) {
      console.error("Error generating site log:", error);
      throw error;
    }
  };

  const handleSelectMaterial = (material: Material) => {
    setSelectedMaterial(material);
    setIsDetailOpen(true);
  };

  const handleUpdateStatus = async (id: string, newStatus: MaterialStatus, newFeedback: string) => {
    const path = `materials/${id}`;
    try {
      await updateDoc(doc(db, 'materials', id), { 
        status: newStatus, 
        feedback: newFeedback 
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleUpdateCode = async (id: string, newCode: string) => {
    const isDuplicate = materials.some(m => m.id !== id && m.code.trim().toLowerCase() === newCode.trim().toLowerCase());
    if (isDuplicate) {
      return false;
    }
    const path = `materials/${id}`;
    try {
      await updateDoc(doc(db, 'materials', id), { 
        code: newCode 
      });
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
      return false;
    }
  };

  const handleUpdateField = async (id: string, field: keyof Material, newValue: string) => {
    const path = `materials/${id}`;
    try {
      await updateDoc(doc(db, 'materials', id), { 
        [field]: newValue 
      });
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
      return false;
    }
  };

  const handleAddMaterial = () => {
    setEditingMaterial(null);
    setCurrentEditIds([]);
    setIsFormModalOpen(true);
  };

  const handleEditMaterial = (material: Material, list: Material[] = materials) => {
    setEditingMaterial(material);
    setCurrentEditIds(list.map(m => m.id));
    setIsFormModalOpen(true);
  };

  const handleNextEdit = () => {
    if (!editingMaterial) return;
    const idx = currentEditIds.indexOf(editingMaterial.id);
    if (idx >= 0 && idx < currentEditIds.length - 1) {
      const nextId = currentEditIds[idx + 1];
      const nextMaterial = materials.find(m => m.id === nextId);
      if (nextMaterial) setEditingMaterial(nextMaterial);
    }
  };

  const handlePrevEdit = () => {
    if (!editingMaterial) return;
    const idx = currentEditIds.indexOf(editingMaterial.id);
    if (idx > 0) {
      const prevId = currentEditIds[idx - 1];
      const prevMaterial = materials.find(m => m.id === prevId);
      if (prevMaterial) setEditingMaterial(prevMaterial);
    }
  };

  const handleSaveMaterial = async (material: Material) => {
    const path = `materials/${material.id}`;
    try {
      await setDoc(doc(db, 'materials', material.id), material);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    const path = `materials/${id}`;
    try {
      await deleteDoc(doc(db, 'materials', id));
      if (selectedMaterial?.id === id) {
        setIsDetailOpen(false);
        setSelectedMaterial(null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-10 rounded-3xl shadow-xl max-w-md w-full text-center border border-gray-100">
          <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Building2 className="w-10 h-10 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Cao Xà Lá Material</h1>
          <p className="text-gray-500 mb-8">Phần mềm quản lý vật liệu mẫu, vật tư dự án căn hộ mẫu Cao Xà Lá</p>
          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 bg-indigo-600 text-white px-6 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95"
          >
            <LogIn className="w-5 h-5" />
            Đăng nhập bằng Google
          </button>
          <p className="mt-6 text-xs text-gray-400">
            Vui lòng đăng nhập để truy cập dữ liệu dự án.
          </p>
        </div>
      </div>
    );
  }

  const currentMaterials = materials.filter((m) => {
    if (activeTab === 'AllMaterials') return true;
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
            <h1 className="text-xl font-bold text-indigo-600 tracking-tight truncate">Cao Xà Lá Material</h1>
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
            onClick={() => setActiveTab('Schedule')}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
              activeTab === 'Schedule'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              isSidebarCollapsed && 'justify-center px-0'
            )}
            title="Tiến độ dự án"
          >
            <CalendarDays className="w-5 h-5 shrink-0" />
            {!isSidebarCollapsed && <span>Tiến độ dự án</span>}
          </button>
          <button
            onClick={() => setActiveTab('AllMaterials')}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
              activeTab === 'AllMaterials'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              isSidebarCollapsed && 'justify-center px-0'
            )}
            title="Tổng hợp vật tư"
          >
            <List className="w-5 h-5 shrink-0" />
            {!isSidebarCollapsed && <span className="truncate">Tổng hợp vật tư</span>}
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
              <p className="text-xs text-gray-500 font-medium mb-1">Quản lý bởi:</p>
              <p className="text-sm text-gray-800 font-semibold">Tungkst - BIM Coordinator</p>
              <p className="text-[10px] text-gray-400 mt-1 italic">Điều phối thiết kế</p>
            </div>
          )}
          <button 
            onClick={() => setActiveTab('Settings')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              activeTab === 'Settings'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              isSidebarCollapsed && 'justify-center px-0'
            )}
            title="Dữ liệu & Cài đặt"
          >
            <Database className="w-5 h-5 shrink-0" />
            {!isSidebarCollapsed && <span>Dữ liệu & Cài đặt</span>}
          </button>
          <button 
            onClick={handleLogout}
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
            {activeTab === 'Schedule' && 'Tiến độ dự án'}
            {activeTab === 'AllMaterials' && 'Tổng hợp toàn bộ vật tư'}
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
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || ''} className="w-8 h-8 rounded-full" />
              ) : (
                <UserCircle className="w-8 h-8 text-gray-400" />
              )}
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-700">{user.displayName || 'Người dùng'}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-8 print:p-0 print:overflow-visible">
          <div className="max-w-7xl mx-auto h-full print:max-w-none">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <>
                {activeTab === 'Dashboard' && (
                  <Dashboard 
                    materials={materials} 
                    milestones={milestones}
                    onNavigateToSchedule={() => setActiveTab('Schedule')} 
                  />
                )}
                {activeTab === 'Schedule' && <Schedule milestones={milestones} siteLogs={siteLogs} user={user} onGenerateSiteLog={handleGenerateSiteLog} onAddSiteLog={handleAddSiteLog} onUpdateSiteLog={handleUpdateSiteLog} onDeleteSiteLog={handleDeleteSiteLog} />}
                {activeTab === 'Report' && <Report materials={materials} />}
                {activeTab === 'Settings' && <BackupManager materials={materials} />}
                {['AllMaterials', 'BasicFinish', 'Fitout', 'Architecture', 'Furniture', 'Decor', 'MEP', 'Equipment'].includes(activeTab) && (
                  <MaterialList 
                    materials={currentMaterials} 
                    onSelect={handleSelectMaterial} 
                    onAdd={handleAddMaterial}
                    onEdit={handleEditMaterial}
                    onDelete={handleDeleteMaterial}
                    onUpdateCode={handleUpdateCode}
                    onUpdateField={handleUpdateField}
                  />
                )}
              </>
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
        allMaterials={materials}
      />

      {/* Form Modal */}
      <MaterialFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveMaterial}
        initialData={editingMaterial}
        existingMaterials={materials}
        onNext={handleNextEdit}
        onPrev={handlePrevEdit}
        hasNext={editingMaterial ? currentEditIds.indexOf(editingMaterial.id) < currentEditIds.length - 1 : false}
        hasPrev={editingMaterial ? currentEditIds.indexOf(editingMaterial.id) > 0 : false}
      />
    </div>
  );
}
