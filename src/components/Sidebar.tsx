import React from 'react';
import {
  Scale,
  TrendingUp,
  TrendingDown,
  Calculator,
  FolderKanban,
  ClipboardList,
  FileText,
  FileSpreadsheet,
  X,
  User,
  Shield,
  Landmark,
  Building2,
  Calendar
} from 'lucide-react';
import { UserSession, MunicipalityData } from '../types/finance';
import { formatThaiDate } from '../utils/formatters';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  data: MunicipalityData;
  user: UserSession;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  data,
  user,
  isOpenMobile,
  onCloseMobile
}) => {
  const menuSections = [
    {
      groupTitle: 'รายงานการเงินและการวิเคราะห์',
      items: [
        {
          id: 'comparison',
          label: 'เปรียบเทียบ รายงานหมวดรายรับ กับ รายงานหมวดรายจ่าย',
          icon: Scale,
          badge: 'สรุปภาพรวม',
          badgeColor: 'bg-emerald-100 text-emerald-800'
        },
        {
          id: 'revenue',
          label: 'รายงานหมวดรายรับ',
          icon: TrendingUp,
          badge: `${data.revenueCategories.length} หมวด`,
          badgeColor: 'bg-blue-100 text-blue-800'
        },
        {
          id: 'expenditure',
          label: 'รายงานหมวดรายจ่าย',
          icon: TrendingDown,
          badge: `${data.expenditureCategories.length} หมวด`,
          badgeColor: 'bg-rose-100 text-rose-800'
        },
        {
          id: 'proof',
          label: 'รายงานพิสูจน์ยอดเงินสะสม',
          icon: Calculator,
          badge: 'สูตรระเบียบฯ',
          badgeColor: 'bg-amber-100 text-amber-800'
        }
      ]
    },
    {
      groupTitle: 'โครงการและการติดตามงาน',
      items: [
        {
          id: 'funds',
          label: 'งบประมาณและโครงการ',
          icon: FolderKanban,
          badge: 'โครงการ',
          badgeColor: 'bg-indigo-100 text-indigo-800'
        },
        {
          id: 'tasks',
          label: 'รายงานและติดตามงานการคลัง',
          icon: ClipboardList,
          badge: `${data.statusTasks.filter(t => t.status === 'ดำเนินการเสร็จสิ้น').length}/${data.statusTasks.length}`,
          badgeColor: 'bg-teal-100 text-teal-800'
        }
      ]
    },
    {
      groupTitle: 'เอกสารราชการและการจัดการข้อมูล',
      items: [
        {
          id: 'memo',
          label: 'บันทึกข้อความราชการ',
          icon: FileText,
          badge: 'Word / A4',
          badgeColor: 'bg-slate-100 text-slate-700'
        },
        {
          id: 'excel',
          label: 'ดาวน์โหลด & นำเข้า Excel',
          icon: FileSpreadsheet,
          badge: '.xlsx / CSV',
          badgeColor: 'bg-emerald-100 text-emerald-800'
        }
      ]
    }
  ];

  const isExecutive =
    user.role === 'executive' || user.username?.trim().toLowerCase() === 'executive';

  const visibleMenuSections = isExecutive
    ? menuSections.filter((sec) => sec.groupTitle !== 'เอกสารราชการและการจัดการข้อมูล')
    : menuSections;

  const handleItemClick = (id: string) => {
    onSelectTab(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Vertical Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 lg:top-[128px] md:lg:top-[112px] bottom-0 left-0 z-50 lg:z-10 w-72 bg-white border-r border-slate-200/90 shadow-lg lg:shadow-none flex flex-col h-full lg:h-[calc(100vh-112px)] transition-transform duration-300 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Mobile Header in Drawer */}
        <div className="lg:hidden p-4 bg-blue-950 text-white flex items-center justify-between border-b border-blue-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400 text-blue-950 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold font-['Prompt'] text-amber-200">เมนูระบบการคลัง</div>
              <div className="text-[10px] text-blue-200">เทศบาลเมืองมหาสารคาม 2570</div>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-blue-900/60"
            title="ปิดเมนู"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Title Header (Desktop) */}
        <div className="hidden lg:block px-5 py-3.5 bg-slate-50 border-b border-slate-200">
          <div className="text-xs font-bold font-['Prompt'] text-slate-800 flex items-center gap-2">
            <span className="w-2 h-4 bg-amber-500 rounded-sm"></span>
            <span>เมนูระบบรายงานผลการดำเนินงาน</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            ประจำปีงบประมาณ พ.ศ. 2570
          </p>
        </div>

        {/* Scrollable Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-none">
          {visibleMenuSections.map((sec, sIdx) => (
            <div key={sIdx} className="space-y-1.5">
              <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-600 font-['Prompt']">
                {sec.groupTitle}
              </div>

              <div className="space-y-1">
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 text-left group ${
                        isActive
                          ? 'bg-blue-900 text-white shadow-sm border-l-4 border-amber-400'
                          : 'text-slate-700 hover:text-blue-900 hover:bg-blue-50/70 border-l-4 border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate mr-2">
                        <Icon
                          className={`w-4 h-4 flex-shrink-0 transition-colors ${
                            isActive
                              ? 'text-amber-300'
                              : 'text-slate-400 group-hover:text-blue-700'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.badge && (
                        <span
                          className={`flex-shrink-0 px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            isActive
                              ? 'bg-blue-800 text-amber-200'
                              : item.badgeColor
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Footer / User Profile summary - hide for User / เจ้าหน้าที่ฝ่ายการเงินและบัญชี */}
        {user.role !== 'staff' && user.username !== 'User' && user.roleTitle !== 'เจ้าหน้าที่ฝ่ายการเงินและบัญชี' && (
          <div className="p-3.5 bg-slate-50 border-t border-slate-200 mt-auto">
            <div className="flex items-center gap-2.5 bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-900 flex items-center justify-center font-bold flex-shrink-0">
                {user.role === 'director' ? (
                  <Shield className="w-4 h-4 text-amber-700" />
                ) : (
                  <Landmark className="w-4 h-4 text-emerald-700" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-800 truncate">
                  {user.username}
                </div>
                <div className="text-[11px] text-slate-500 truncate">
                  {user.roleTitle}
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
