import React from 'react';
import { Building2, LogOut, RefreshCw, User, Shield, Calendar, Landmark, CheckCircle, Menu } from 'lucide-react';
import { UserSession, MunicipalityData } from '../types/finance';
import { formatCurrency, formatThaiDate } from '../utils/formatters';
import firebaseConfig from '../../firebase-applet-config.json';

interface HeaderNavProps {
  user: UserSession;
  data: MunicipalityData;
  onLogout: () => void;
  onRefresh: () => void;
  isSaving?: boolean;
  onToggleMobileMenu?: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  user,
  data,
  onLogout,
  onRefresh,
  isSaving,
  onToggleMobileMenu
}) => {
  const totalRevAct = data.revenueCategories.reduce((sum, c) => sum + c.actual, 0);
  const totalExpAct = data.expenditureCategories.reduce((sum, c) => sum + c.actual, 0);
  const netBalance = totalRevAct - totalExpAct;

  const ap = data.accumulatedProof;
  const usableAccFund =
    ap.bankBalanceSept30 -
    ap.deductLocalFund -
    ap.deductPersonnel3Months -
    ap.deductFifteenPercentExpense -
    ap.deductStatutoryReserve -
    ap.deductCurrentYearApproved -
    ap.deductCrossYearRefund +
    ap.addApprovedObligationRemaining +
    ap.addCrossYearRevenueReturn;

  const getRoleBadge = () => {
    switch (user.role) {
      case 'director':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-200 border border-amber-400/40 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-amber-300" />
            ผู้อำนวยการกองคลัง (Director)
          </span>
        );
      case 'executive':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/40 flex items-center gap-1.5">
            <Landmark className="w-3.5 h-3.5 text-emerald-300" />
            ผู้บริหารเทศบาล (Executive)
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <header className="bg-gradient-to-r from-blue-950 via-slate-900 to-blue-900 text-white shadow-xl border-b border-blue-800/60 sticky top-0 z-40">
      {/* Top Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo & Municipality Titles */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            {onToggleMobileMenu && (
              <button
                onClick={onToggleMobileMenu}
                className="lg:hidden p-2 rounded-xl bg-blue-900/70 hover:bg-blue-800 text-white border border-blue-700/60 transition"
                title="เปิด/ปิด เมนูด้านซ้าย"
                aria-label="เปิด/ปิด เมนูด้านซ้าย"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 p-0.5 shadow-md flex-shrink-0">
              <div className="w-full h-full bg-blue-950 rounded-[10px] flex items-center justify-center">
                <Building2 className="w-7 h-7 text-amber-300" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-white font-['Prompt'] tracking-tight">
                  เทศบาลเมืองมหาสารคาม
                </h1>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-400 text-blue-950">
                  ปีงบประมาณ 2570
                </span>
              </div>
              <p className="text-xs text-blue-200 font-medium">
                ฝ่ายการเงินและบัญชี และฝ่ายบริหารงานคลัง กองคลัง
              </p>
            </div>
          </div>

          {/* User profile, sync status & actions */}
          <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 w-full md:w-auto">
            {/* Live Firebase Firestore Database Sync Indicator */}
            <div className="flex items-center gap-1.5 text-xs text-emerald-300 bg-emerald-950/70 border border-emerald-500/40 px-2.5 py-1 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="hidden sm:inline font-medium">Firebase: {firebaseConfig.projectId}</span>
              <span className="text-emerald-400 font-mono text-[10px]">{isSaving ? 'กำลังบันทึก...' : 'ออนไลน์'}</span>
            </div>

            {/* Date Badge */}
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
              <Calendar className="w-3.5 h-3.5 text-amber-300" />
              <span>{formatThaiDate(new Date())}</span>
            </div>

            {/* Role Badge */}
            {getRoleBadge() && <div>{getRoleBadge()}</div>}

            {/* Refresh Data button */}
            <button
              onClick={onRefresh}
              title="รีเฟรชข้อมูลจากฐานข้อมูล"
              className="p-1.5 rounded-lg bg-blue-900/60 hover:bg-blue-800 text-blue-200 hover:text-white border border-blue-700 transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-semibold shadow hover:shadow-md transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>ออกจากระบบ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Financial Health Mini Bar */}
      <div className="bg-slate-900/90 border-t border-blue-900/50 px-4 sm:px-6 lg:px-8 py-2 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-y-1.5 text-slate-300">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-slate-400">สถานะการเงินรวม ปี 2570:</span>
            <div>
              <span className="text-slate-400">รับจริงสะสม: </span>
              <span className="font-bold text-emerald-400">{formatCurrency(totalRevAct)} บาท</span>
            </div>
            <span className="text-slate-600">|</span>
            <div>
              <span className="text-slate-400">จ่ายจริงสะสม: </span>
              <span className="font-bold text-rose-400">{formatCurrency(totalExpAct)} บาท</span>
            </div>
            <span className="text-slate-600">|</span>
            <div>
              <span className="text-slate-400">ผลต่างสุทธิ: </span>
              <span className={`font-bold ${netBalance >= 0 ? 'text-amber-300' : 'text-rose-400'}`}>
                {netBalance >= 0 ? '+' : ''}{formatCurrency(netBalance)} บาท
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">เงินสะสมใช้ได้ปัจจุบัน:</span>
            <span className="font-bold text-amber-300 bg-amber-950/70 border border-amber-600/40 px-2 py-0.5 rounded">
              {formatCurrency(usableAccFund)} บาท
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
