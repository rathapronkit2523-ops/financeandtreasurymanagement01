import React, { useState, useEffect, useCallback } from 'react';
import { UserSession, MunicipalityData, BudgetCategory, AccumulatedProof, FundProjectItem, StatusTaskItem, MemorandumData } from './types/finance';
import {
  getStoredUser,
  logoutUser,
  fetchMunicipalityData,
  saveMunicipalityData,
  subscribeToMunicipalityData,
  testConnection,
  ensureRevenuePropertyCategory
} from './services/api';
import { LoginView } from './components/LoginView';
import { HeaderNav } from './components/HeaderNav';
import { RevenueSection } from './components/RevenueSection';
import { ExpenditureSection } from './components/ExpenditureSection';
import { ComparisonSection } from './components/ComparisonSection';
import { AccumulatedFundProofSection } from './components/AccumulatedFundProofSection';
import { SpecificFundsSection } from './components/SpecificFundsSection';
import { StatusTasksSection } from './components/StatusTasksSection';
import { MemorandumSection } from './components/MemorandumSection';
import { ExcelManagerSection } from './components/ExcelManagerSection';
import { Sidebar } from './components/Sidebar';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => getStoredUser());
  const [data, setData] = useState<MunicipalityData | null>(null);
  const [activeTab, setActiveTab] = useState<string>('comparison');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Load initial data
  const loadData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const dbData = await fetchMunicipalityData();
      if (dbData) {
        setData(dbData);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    // 1. Test Firestore connection on boot
    testConnection();

    // 2. Initial fetch
    loadData();

    // 3. Real-time Firebase Firestore synchronization across all menus and devices
    const unsubscribe = subscribeToMunicipalityData(
      (remoteData) => {
        if (remoteData && remoteData.fiscalYear) {
          const ensured = ensureRevenuePropertyCategory(remoteData);
          setData((prev) => {
            if (!prev || ensured.lastUpdated !== prev.lastUpdated) {
              return ensured;
            }
            return prev;
          });
          setIsLoadingData(false);
        }
      },
      (err) => {
        console.warn('Realtime subscription fallback to periodic sync:', err);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [loadData]);

  // Persist state updates with optimistic local UI and background server sync
  const updateData = useCallback(async (updater: (prev: MunicipalityData) => MunicipalityData) => {
    setData((prev) => {
      if (!prev) return prev;
      const updated = updater(prev);
      setIsSaving(true);
      saveMunicipalityData(updated).finally(() => {
        setIsSaving(false);
      });
      return updated;
    });
  }, []);

  const isExecutive =
    currentUser?.role === 'executive' ||
    currentUser?.username?.trim().toLowerCase() === 'executive';

  useEffect(() => {
    if (isExecutive && (activeTab === 'memo' || activeTab === 'excel')) {
      setActiveTab('comparison');
    }
  }, [isExecutive, activeTab]);

  const handleLoginSuccess = (user: UserSession) => {
    setCurrentUser(user);
    if (user.role === 'executive' || user.username?.trim().toLowerCase() === 'executive') {
      setActiveTab('comparison');
    }
    loadData();
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setActiveTab('comparison');
  };

  // If user is not authenticated, show Login View
  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  // Loading indicator for first data fetch
  if (!data || isLoadingData) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4">
        <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <h2 className="text-lg font-bold font-['Prompt'] text-amber-200">
          กำลังโหลดข้อมูลระบบการคลัง เทศบาลเมืองมหาสารคาม 2570...
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          เชื่อมต่อฐานข้อมูลส่วนกลางและซิงค์ข้อมูลล่าสุด
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-['Sarabun',sans-serif]">
      {/* Official Government Header Nav */}
      <HeaderNav
        user={currentUser}
        data={data}
        onLogout={handleLogout}
        onRefresh={loadData}
        isSaving={isSaving}
        onToggleMobileMenu={() => setIsMobileSidebarOpen(prev => !prev)}
      />

      {/* 2-Column Responsive Layout: Left Vertical Sidebar + Right Content Area */}
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        {/* Left Vertical Sidebar (Hidden in print) */}
        <div className="print:hidden flex-shrink-0">
          <Sidebar
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            data={data}
            user={currentUser}
            isOpenMobile={isMobileSidebarOpen}
            onCloseMobile={() => setIsMobileSidebarOpen(false)}
          />
        </div>

        {/* Right Main Content Body */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
        {/* Tab 1: Comparison Dashboard */}
        {activeTab === 'comparison' && (
          <ComparisonSection
            revenueCategories={data.revenueCategories}
            expenditureCategories={data.expenditureCategories}
          />
        )}

        {/* Tab 2: Revenue Report */}
        {activeTab === 'revenue' && (
          <RevenueSection
            categories={data.revenueCategories}
            user={currentUser}
            onUpdateCategories={(updated) => {
              updateData((prev) => ({ ...prev, revenueCategories: updated }));
            }}
          />
        )}

        {/* Tab 3: Expenditure Report */}
        {activeTab === 'expenditure' && (
          <ExpenditureSection
            categories={data.expenditureCategories}
            user={currentUser}
            onUpdateCategories={(updated) => {
              updateData((prev) => ({ ...prev, expenditureCategories: updated }));
            }}
          />
        )}

        {/* Tab 4: Proof of Accumulated Funds */}
        {activeTab === 'proof' && (
          <AccumulatedFundProofSection
            proof={data.accumulatedProof}
            user={currentUser}
            onSave={(updated) => {
              updateData((prev) => ({ ...prev, accumulatedProof: updated }));
            }}
          />
        )}

        {/* Tab 5: 5 Specific Funds */}
        {activeTab === 'funds' && (
          <SpecificFundsSection
            data={data}
            user={currentUser}
            onUpdateProjects={(menuKey, items) => {
              updateData((prev) => ({ ...prev, [menuKey]: items }));
            }}
          />
        )}

        {/* Tab 6: Status Tasks */}
        {activeTab === 'tasks' && (
          <StatusTasksSection
            tasks={data.statusTasks}
            user={currentUser}
            onSaveTasks={(updated) => {
              updateData((prev) => ({ ...prev, statusTasks: updated }));
            }}
          />
        )}

        {/* Tab 7: Official Memorandum (hidden for Executive) */}
        {activeTab === 'memo' && !isExecutive && (
          <MemorandumSection
            data={data}
            user={currentUser}
            onUpdateMemorandum={(memo) => {
              updateData((prev) => ({ ...prev, memorandum: memo }));
            }}
          />
        )}

        {/* Tab 9: Excel Download & Import (hidden for Executive) */}
        {activeTab === 'excel' && !isExecutive && (
          <ExcelManagerSection
            data={data}
            user={currentUser}
            onImportData={(updated) => {
              updateData(() => updated);
            }}
          />
        )}
      </main>
      </div>

      {/* Footer (Hidden in print) */}
      <footer className="print:hidden bg-slate-900 text-slate-400 border-t border-slate-800 text-xs py-5 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <span className="font-semibold text-slate-200">
              เทศบาลเมืองมหาสารคาม • ฝ่ายการเงินและบัญชี และฝ่ายบริหารงานคลัง กองคลัง
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              ระบบรายงานผลการดำเนินงานทางการเงินและงบประมาณ ประจำปีงบประมาณ พ.ศ. 2570
            </p>
          </div>
          <div className="text-[11px] text-slate-400">
            ฐานข้อมูลส่วนกลางซิงค์อัตโนมัติ • รองรับเข้าสู่ระบบหลายเครื่องพร้อมกัน
          </div>
        </div>
      </footer>
    </div>
  );
}
