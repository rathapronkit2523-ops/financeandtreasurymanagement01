import React, { useState } from 'react';
import {
  FolderKanban,
  Plus,
  Edit2,
  Trash2,
  Download,
  Check,
  X,
  Coins,
  Award,
  Clock,
  Building
} from 'lucide-react';
import { FundProjectItem, UserSession, MunicipalityData } from '../types/finance';
import { formatCurrency, calcPercent } from '../utils/formatters';
import { exportSingleCategory } from '../services/excelService';

interface SpecificFundsSectionProps {
  data: MunicipalityData;
  user: UserSession;
  onUpdateProjects: (menuKey: keyof MunicipalityData, items: FundProjectItem[]) => void;
}

type MenuKey =
  | 'specialGrantProjects'
  | 'accumulatedFundProjects'
  | 'goodGovernanceProjects'
  | 'accruedExpenses'
  | 'externalSubsidies';

interface MenuConfig {
  key: MenuKey;
  title: string;
  shortTitle: string;
  icon: any;
  color: string;
  description: string;
}

const MENUS: MenuConfig[] = [
  {
    key: 'specialGrantProjects',
    title: 'เมนูเงินอุดหนุนเฉพาะกิจ',
    shortTitle: 'เงินอุดหนุนเฉพาะกิจ',
    icon: FolderKanban,
    color: 'blue',
    description: 'โครงการที่ได้รับจัดสรรงบประมาณเงินอุดหนุนระบุวัตถุประสงค์เฉพาะกิจจากกรมส่งเสริมการปกครองท้องถิ่น'
  },
  {
    key: 'accumulatedFundProjects',
    title: 'เมนูเงินสะสม',
    shortTitle: 'เงินสะสม',
    icon: Coins,
    color: 'amber',
    description: 'โครงการและรายการใช้จ่ายที่ได้รับอนุมัติให้จ่ายขาดจากเงินสะสมของเทศบาลเมืองมหาสารคาม'
  },
  {
    key: 'goodGovernanceProjects',
    title: 'เมนูเงินรางวัลบริหารจัดการที่ดี',
    shortTitle: 'เงินรางวัลบริหารจัดการที่ดี',
    icon: Award,
    color: 'purple',
    description: 'โครงการที่ได้รับการจัดสรรจากเงินรางวัลองค์กรปกครองส่วนท้องถิ่นที่มีการบริหารจัดการที่ดี'
  },
  {
    key: 'accruedExpenses',
    title: 'เมนูค่าใช้จ่ายค้างจ่าย',
    shortTitle: 'ค่าใช้จ่ายค้างจ่าย',
    icon: Clock,
    color: 'rose',
    description: 'รายการหนี้สินผูกพันและค่าใช้จ่ายค้างจ่ายที่ยกยอดมาหรือต้องกันเงินไว้เบิกตัดปี'
  },
  {
    key: 'externalSubsidies',
    title: 'เมนูอุดหนุนจากหน่วยงานอื่น',
    shortTitle: 'อุดหนุนจากหน่วยงานอื่น',
    icon: Building,
    color: 'emerald',
    description: 'งบประมาณเงินอุดหนุนที่ได้รับสนับสนุนจาก อบจ.มหาสารคาม, สสส., สปสช. หรือกองทุนภายนอก'
  }
];

export const SpecificFundsSection: React.FC<SpecificFundsSectionProps> = ({
  data,
  user,
  onUpdateProjects
}) => {
  const [activeMenuKey, setActiveMenuKey] = useState<MenuKey>('specialGrantProjects');

  // Modal / Form state for Add/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FundProjectItem | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formBudget, setFormBudget] = useState<number>(0);
  const [formDisbursed, setFormDisbursed] = useState<number>(0);
  const [formFiscalYear, setFormFiscalYear] = useState('2570');
  const [formStatus, setFormStatus] = useState('อยู่ระหว่างดำเนินการ');
  const [formDepartment, setFormDepartment] = useState('กองคลัง');

  const currentMenu = MENUS.find(m => m.key === activeMenuKey)!;
  const currentItems: FundProjectItem[] = (data[activeMenuKey] as FundProjectItem[]) || [];

  const totalBudget = currentItems.reduce((sum, item) => sum + item.budget, 0);
  const totalDisbursed = currentItems.reduce((sum, item) => sum + item.disbursed, 0);
  const totalRemaining = totalBudget - totalDisbursed; // คำนวณอัตโนมัติ งบประมาณ ลบ เบิกจ่าย
  const percent = calcPercent(totalDisbursed, totalBudget);

  const openAddModal = () => {
    setEditingItem(null);
    setFormTitle('');
    setFormBudget(0);
    setFormDisbursed(0);
    setFormFiscalYear('2570');
    setFormStatus('อยู่ระหว่างดำเนินการ');
    setFormDepartment('กองคลัง');
    setIsModalOpen(true);
  };

  const openEditModal = (item: FundProjectItem) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormBudget(item.budget);
    setFormDisbursed(item.disbursed);
    setFormFiscalYear(item.fiscalYear || '2570');
    setFormStatus(item.status || 'อยู่ระหว่างดำเนินการ');
    setFormDepartment(item.department || 'กองคลัง');
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    if (editingItem) {
      // Edit existing
      const updated = currentItems.map(item => {
        if (item.id === editingItem.id) {
          return {
            ...item,
            title: formTitle.trim(),
            budget: Number(formBudget) || 0,
            disbursed: Number(formDisbursed) || 0,
            fiscalYear: formFiscalYear.trim(),
            status: formStatus.trim(),
            department: formDepartment.trim()
          };
        }
        return item;
      });
      onUpdateProjects(activeMenuKey, updated);
    } else {
      // Add new
      const newItem: FundProjectItem = {
        id: `fund_${Date.now()}`,
        title: formTitle.trim(),
        budget: Number(formBudget) || 0,
        disbursed: Number(formDisbursed) || 0,
        fiscalYear: formFiscalYear.trim(),
        status: formStatus.trim(),
        department: formDepartment.trim()
      };
      onUpdateProjects(activeMenuKey, [...currentItems, newItem]);
    }
    setIsModalOpen(false);
  };

  const handleDeleteItem = (id: string) => {
    if (!window.confirm('คุณต้องการลบรายการนี้ใช่หรือไม่?')) return;
    const updated = currentItems.filter(item => item.id !== id);
    onUpdateProjects(activeMenuKey, updated);
  };

  const handleExportExcel = () => {
    const rows = currentItems.map((item, idx) => ({
      'ลำดับ': idx + 1,
      'รายการ': item.title,
      'งบประมาณ (บาท)': item.budget,
      'เบิกจ่าย (บาท)': item.disbursed,
      'คงเหลือ (คำนวณอัตโนมัติ)': item.budget - item.disbursed,
      'ปีงบประมาณ': item.fiscalYear,
      'สถานะ': item.status,
      'หน่วยงาน': item.department || ''
    }));
    exportSingleCategory(currentMenu.shortTitle, rows, `รายงาน_${currentMenu.shortTitle}_เทศบาลเมืองมหาสารคาม_2570`);
  };

  return (
    <div className="space-y-6">
      {/* 5 Menu Selector Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {MENUS.map(menu => {
            const Icon = menu.icon;
            const isActive = activeMenuKey === menu.key;
            return (
              <button
                key={menu.key}
                onClick={() => setActiveMenuKey(menu.key)}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-900 text-white shadow-md'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/70'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-300' : 'text-slate-500'}`} />
                <span>{menu.title}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    isActive ? 'bg-blue-800 text-amber-200' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {((data[menu.key] as FundProjectItem[]) || []).length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Menu Detail Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-6 bg-blue-600 rounded-full"></span>
              <h2 className="text-xl font-bold text-slate-800 font-['Prompt']">
                {currentMenu.title}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">{currentMenu.description}</p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {user.permissions.canEditDaily && (
              <button
                onClick={openAddModal}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-semibold shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                <span>+ เพิ่มรายการ{currentMenu.shortTitle}</span>
              </button>
            )}

            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-300 transition"
            >
              <Download className="w-4 h-4 text-blue-700" />
              <span>ส่งออก Excel</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <span className="text-xs font-medium text-slate-500">งบประมาณรวม</span>
            <div className="text-xl font-bold text-slate-800 mt-1 font-mono">
              {formatCurrency(totalBudget)} <span className="text-xs font-normal text-slate-500">บาท</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">{currentItems.length} รายการ</span>
          </div>

          <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-4">
            <span className="text-xs font-semibold text-rose-700">เบิกจ่ายแล้ว</span>
            <div className="text-xl font-bold text-rose-700 mt-1 font-mono">
              {formatCurrency(totalDisbursed)} <span className="text-xs font-normal text-rose-600">บาท</span>
            </div>
            <div className="w-full bg-rose-200/70 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-rose-600 h-full rounded-full transition-all"
                style={{ width: `${Math.min(percent, 100)}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4">
            <span className="text-xs font-semibold text-emerald-800">
              คงเหลือ (งบประมาณ ลบ เบิกจ่าย)
            </span>
            <div className="text-xl font-bold text-emerald-800 mt-1 font-mono">
              {formatCurrency(totalRemaining)} <span className="text-xs font-normal text-emerald-700">บาท</span>
            </div>
            <span className="text-[11px] text-emerald-600 mt-0.5 block">คำนวณอัตโนมัติ</span>
          </div>

          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4">
            <span className="text-xs font-semibold text-blue-800">ร้อยละการเบิกจ่าย</span>
            <div className="text-2xl font-bold text-blue-900 mt-1 font-mono">
              {percent}%
            </div>
            <span className="text-[11px] text-blue-600 mt-0.5 block">อัตราผลสัมฤทธิ์</span>
          </div>
        </div>
      </div>

      {/* Table of items */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 font-['Prompt']">
            ตารางรายการ{currentMenu.title}
          </h3>
          <span className="text-xs text-slate-500">
            {currentItems.length === 0 ? 'ยังไม่มีข้อมูล' : `แสดง ${currentItems.length} รายการ`}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-100 text-slate-700 text-xs font-bold border-b border-slate-200">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4 min-w-[280px]">รายการ (บอกชื่อ)</th>
                <th className="py-3 px-4 text-right min-w-[140px]">งบประมาณ (จำนวน)</th>
                <th className="py-3 px-4 text-right min-w-[140px]">เบิกจ่าย (จำนวน)</th>
                <th className="py-3 px-4 text-right min-w-[150px] text-emerald-900">
                  คงเหลือ (อัตโนมัติ)
                </th>
                <th className="py-3 px-4 text-center min-w-[100px]">ปีงบประมาณ</th>
                <th className="py-3 px-4 text-center min-w-[130px]">สถานะ</th>
                {user.permissions.canEditDaily && (
                  <th className="py-3 px-4 text-center w-24">การจัดการ</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80">
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                    ยังไม่มีรายการใน{currentMenu.title} คลิก "+ เพิ่มรายการ" เพื่อเริ่มบันทึกข้อมูล
                  </td>
                </tr>
              ) : (
                currentItems.map((item, idx) => {
                  const remaining = item.budget - item.disbursed; // คำนวณอัตโนมัติ งบประมาณ ลบ เบิกจ่าย
                  const itemPercent = calcPercent(item.disbursed, item.budget);

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-center text-xs font-bold text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        <div>{item.title}</div>
                        {item.department && (
                          <span className="text-[11px] text-slate-400">หน่วยงาน: {item.department}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-700">
                        {formatCurrency(item.budget)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-rose-600 font-medium">
                        {formatCurrency(item.disbursed)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-700 font-bold">
                        {formatCurrency(remaining)}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-600">
                        {item.fiscalYear}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                            item.status.includes('เสร็จสิ้น')
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.status.includes('ระหว่าง')
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      {user.permissions.canEditDaily && (
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => openEditModal(item)}
                              title="แก้ไขรายการ"
                              className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              title="ลบรายการ"
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* Grand Total Row */}
            {currentItems.length > 0 && (
              <tfoot>
                <tr className="bg-slate-800 text-white font-bold text-sm">
                  <td colSpan={2} className="py-3.5 px-4 text-right">
                    รวม {currentMenu.title} ทั้งหมด
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-100">
                    {formatCurrency(totalBudget)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-rose-400">
                    {formatCurrency(totalDisbursed)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-emerald-400">
                    {formatCurrency(totalRemaining)}
                  </td>
                  <td className="py-3.5 px-4 text-center text-slate-300">2570</td>
                  <td className="py-3.5 px-4 text-center text-emerald-400 font-mono">
                    {percent}%
                  </td>
                  {user.permissions.canEditDaily && <td></td>}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-blue-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-base font-['Prompt']">
                {editingItem ? 'แก้ไขรายการ' : 'เพิ่มรายการใหม่'} : {currentMenu.title}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-blue-200 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  รายการ (บอกชื่อ) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น โครงการก่อสร้าง... / ค่าใช้จ่าย..."
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    งบประมาณ (จำนวนเงิน) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formBudget}
                    onChange={(e) => setFormBudget(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-right"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    เบิกจ่าย (จำนวนเงิน) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formDisbursed}
                    onChange={(e) => setFormDisbursed(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 text-right text-rose-600 font-bold"
                  />
                </div>
              </div>

              {/* Real-time Remaining preview */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                <span className="font-semibold text-emerald-800">
                  คงเหลือ (คำนวณอัตโนมัติ งบประมาณ ลบ เบิกจ่าย):
                </span>
                <span className="font-bold font-mono text-emerald-800 text-sm">
                  {formatCurrency((formBudget || 0) - (formDisbursed || 0))} บาท
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ปีงบประมาณ (ใส่หมายเลข) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formFiscalYear}
                    onChange={(e) => setFormFiscalYear(e.target.value)}
                    placeholder="เช่น 2570"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    สถานะ (ให้กรอกข้อมูล) *
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="ดำเนินการเสร็จสิ้น">ดำเนินการเสร็จสิ้น</option>
                    <option value="อยู่ระหว่างดำเนินการ">อยู่ระหว่างดำเนินการ</option>
                    <option value="ยังไม่ดำเนินการ">ยังไม่ดำเนินการ</option>
                    <option value="รอจัดซื้อจัดจ้าง">รอจัดซื้อจัดจ้าง</option>
                    <option value="ส่งมอบงานแล้ว">ส่งมอบงานแล้ว</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  หน่วยงานผู้รับผิดชอบ
                </label>
                <input
                  type="text"
                  value={formDepartment}
                  onChange={(e) => setFormDepartment(e.target.value)}
                  placeholder="เช่น ฝ่ายบริหารงานคลัง, ฝ่ายการเงินและบัญชี"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-semibold shadow transition"
                >
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
