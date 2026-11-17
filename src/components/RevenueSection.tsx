import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Edit2,
  Download,
  Check,
  Save,
  RotateCcw,
  Info,
  Layers,
  Printer,
  X,
  Calculator
} from 'lucide-react';
import { BudgetCategory, UserSession } from '../types/finance';
import { formatCurrency, calcPercent } from '../utils/formatters';
import { exportSingleCategory } from '../services/excelService';

interface RevenueSectionProps {
  categories: BudgetCategory[];
  user: UserSession;
  onUpdateCategories: (updated: BudgetCategory[]) => void;
}

// Standard Revenue Categories (8 Main Categories + 2 Subsidy Categories)
export const STANDARD_REVENUE_CONFIG = [
  { id: 'rev_tax', name: 'หมวดภาษีอากร', isSubsidy: false },
  { id: 'rev_fee', name: 'หมวดค่าธรรมเนียม ค่าปรับ และใบอนุญาต', isSubsidy: false },
  { id: 'rev_property', name: 'หมวดรายได้จากทรัพย์สิน', isSubsidy: false },
  { id: 'rev_util', name: 'หมวดรายได้จากสาธารณูปโภค และกิจการพาณิชย์', isSubsidy: false },
  { id: 'rev_misc', name: 'หมวดรายได้เบ็ดเตล็ด', isSubsidy: false },
  { id: 'rev_capital', name: 'หมวดรายได้จากทุน', isSubsidy: false },
  { id: 'rev_allocated_tax', name: 'หมวดภาษีจัดสรร', isSubsidy: false },
  { id: 'rev_general_subsidy', name: 'หมวดอุดหนุนทั่วไป', isSubsidy: false },
  { id: 'rev_special_subsidy', name: 'หมวดเงินอุดหนุนระบุวัตถุประสงค์เฉพาะกิจ', isSubsidy: true },
  { id: 'rev_other_subsidy', name: 'หมวดอุดหนุนจากหน่วยงานอื่น', isSubsidy: true }
];

export const RevenueSection: React.FC<RevenueSectionProps> = ({
  categories,
  user,
  onUpdateCategories
}) => {
  // Modal for "แก้ไขข้อมูล"
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [modalDrafts, setModalDrafts] = useState<BudgetCategory[]>([]);

  // Direct table edit mode
  const [isDirectEditMode, setIsDirectEditMode] = useState<boolean>(false);
  const [tableDraftCategories, setTableDraftCategories] = useState<BudgetCategory[]>(categories);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Single row inline edit tracking
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editEstimate, setEditEstimate] = useState<number>(0);
  const [editActual, setEditActual] = useState<number>(0);

  // Keep draft in sync if external categories change while not editing
  useEffect(() => {
    if (!isDirectEditMode) {
      setTableDraftCategories(categories);
    }
  }, [categories, isDirectEditMode]);

  // Ensure categories are mapped nicely
  const currentList = isDirectEditMode ? tableDraftCategories : categories;

  const mainCategoryIds = [
    'rev_tax',
    'rev_fee',
    'rev_property',
    'rev_util',
    'rev_misc',
    'rev_capital',
    'rev_allocated_tax',
    'rev_general_subsidy'
  ];
  const main8CategoryIds = mainCategoryIds;

  const subsidyCategoryIds = [
    'rev_special_subsidy',
    'rev_other_subsidy'
  ];

  // Active list incorporates single-row live inputs so all calculations update in real-time
  const activeList = currentList.map(c => {
    if (editingId === c.id) {
      return {
        ...c,
        estimate: Number(editEstimate) || 0,
        actual: Number(editActual) || 0
      };
    }
    return c;
  });

  // Calculations for current display list
  const totalEstimate = activeList.reduce((sum, c) => sum + (Number(c.estimate) || 0), 0);
  const totalActual = activeList.reduce((sum, c) => sum + (Number(c.actual) || 0), 0);
  const totalRemaining = totalEstimate - totalActual;
  const totalPercentage = calcPercent(totalActual, totalEstimate);

  // Subtotals for 8 Main Categories
  const main8List = activeList.filter(c => main8CategoryIds.includes(c.id));
  const main8Estimate = main8List.reduce((sum, c) => sum + (Number(c.estimate) || 0), 0);
  const main8Actual = main8List.reduce((sum, c) => sum + (Number(c.actual) || 0), 0);
  const main8Remaining = main8Estimate - main8Actual;
  const main8Percent = calcPercent(main8Actual, main8Estimate);

  // Subtotals for Subsidy Categories
  const subsidyList = activeList.filter(c => subsidyCategoryIds.includes(c.id) || !main8CategoryIds.includes(c.id));
  const subsidyEstimate = subsidyList.reduce((sum, c) => sum + (Number(c.estimate) || 0), 0);
  const subsidyActual = subsidyList.reduce((sum, c) => sum + (Number(c.actual) || 0), 0);
  const subsidyRemaining = subsidyEstimate - subsidyActual;
  const subsidyPercent = calcPercent(subsidyActual, subsidyEstimate);

  // Manual recalculation & sync handler
  const handleRecalculate = () => {
    const reCalculated = categories.map(c => ({
      ...c,
      estimate: Number(c.estimate) || 0,
      actual: Number(c.actual) || 0,
      notes: '',
      subItems: []
    }));
    onUpdateCategories(reCalculated);
    setTableDraftCategories(reCalculated);
    setSaveSuccessMsg('อัปเดตและคำนวณยอดประมาณการ รับจริง คงเหลือ และเปอร์เซ็นต์ทั้งหมดเรียบร้อยแล้ว');
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  // Open "แก้ไขข้อมูล" Modal with guaranteed 8 main + 2 subsidy categories
  const openEditModal = () => {
    const list: BudgetCategory[] = STANDARD_REVENUE_CONFIG.map(cfg => {
      const existing = categories.find(c => c.id === cfg.id || c.name === cfg.name);
      if (existing) {
        return {
          ...existing,
          id: cfg.id,
          name: cfg.name,
          notes: '',
          subItems: []
        };
      }
      return {
        id: cfg.id,
        name: cfg.name,
        estimate: 0,
        actual: 0,
        notes: '',
        subItems: []
      };
    });
    setModalDrafts(list);
    setIsEditModalOpen(true);
  };

  const handleModalDraftChange = (id: string, field: 'estimate' | 'actual', value: number) => {
    setModalDrafts(prev =>
      prev.map(cat => (cat.id === id ? { ...cat, [field]: Math.max(0, value) } : cat))
    );
  };

  const handleSaveModal = () => {
    const updated = modalDrafts.map(draft => ({
      ...draft,
      notes: '',
      subItems: []
    }));
    onUpdateCategories(updated);
    setIsEditModalOpen(false);
    setSaveSuccessMsg('บันทึกการแก้ไขข้อมูลหมวดรายรับเรียบร้อยแล้ว');
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  // Calculations inside Modal Draft
  const modalMain8List = modalDrafts.filter(c => main8CategoryIds.includes(c.id));
  const modalMain8Est = modalMain8List.reduce((sum, c) => sum + (Number(c.estimate) || 0), 0);
  const modalMain8Act = modalMain8List.reduce((sum, c) => sum + (Number(c.actual) || 0), 0);
  const modalMain8Rem = modalMain8Est - modalMain8Act;
  const modalMain8Pct = calcPercent(modalMain8Act, modalMain8Est);

  const modalSubsidyList = modalDrafts.filter(c => subsidyCategoryIds.includes(c.id) || !main8CategoryIds.includes(c.id));
  const modalSubsidyEst = modalSubsidyList.reduce((sum, c) => sum + (Number(c.estimate) || 0), 0);
  const modalSubsidyAct = modalSubsidyList.reduce((sum, c) => sum + (Number(c.actual) || 0), 0);
  const modalSubsidyRem = modalSubsidyEst - modalSubsidyAct;
  const modalSubsidyPct = calcPercent(modalSubsidyAct, modalSubsidyEst);

  const modalTotalEst = modalDrafts.reduce((sum, c) => sum + (Number(c.estimate) || 0), 0);
  const modalTotalAct = modalDrafts.reduce((sum, c) => sum + (Number(c.actual) || 0), 0);
  const modalTotalRem = modalTotalEst - modalTotalAct;
  const modalTotalPct = calcPercent(modalTotalAct, modalTotalEst);

  // In-table Direct Edit handlers
  const handleTableDraftChange = (catId: string, field: 'estimate' | 'actual', value: number) => {
    setTableDraftCategories(prev =>
      prev.map(cat => (cat.id === catId ? { ...cat, [field]: Math.max(0, value) } : cat))
    );
  };

  const handleSaveTableEdits = () => {
    const sanitized = tableDraftCategories.map(cat => ({
      ...cat,
      notes: '',
      subItems: []
    }));
    onUpdateCategories(sanitized);
    setIsDirectEditMode(false);
    setSaveSuccessMsg('บันทึกข้อมูลหมวดรายรับเรียบร้อยแล้ว');
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  const handleCancelTableEdits = () => {
    setTableDraftCategories(categories);
    setIsDirectEditMode(false);
  };

  // Single Category Quick Edit
  const startEditCategory = (cat: BudgetCategory) => {
    setEditingId(cat.id);
    setEditEstimate(cat.estimate);
    setEditActual(cat.actual);
  };

  const saveEditCategory = (catId: string) => {
    const updated = categories.map(cat => {
      if (cat.id === catId) {
        return {
          ...cat,
          estimate: Number(editEstimate) || 0,
          actual: Number(editActual) || 0,
          notes: '',
          subItems: []
        };
      }
      return cat;
    });
    onUpdateCategories(updated);
    setEditingId(null);
    setSaveSuccessMsg('บันทึกยอดหมวดรายรับเรียบร้อยแล้ว');
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const exportRevenueExcel = () => {
    const rows: any[] = [];
    categories.forEach((cat, idx) => {
      const isSubsidy = subsidyCategoryIds.includes(cat.id);
      rows.push({
        'ลำดับ': idx + 1,
        'ประเภท': isSubsidy ? 'หมวดเงินอุดหนุน' : '๘ หมวดรายรับหลัก (รวมหมวดรายได้จากทรัพย์สิน)',
        'หมวดรายรับ': cat.name,
        'ประมาณการ (บาท)': cat.estimate,
        'รับจริง (บาท)': cat.actual,
        'คงเหลือ (บาท)': cat.estimate - cat.actual,
        'ร้อยละ (%)': calcPercent(cat.actual, cat.estimate),
        'หมายเหตุ': ''
      });
    });

    // Grand total row
    rows.push({
      'ลำดับ': 'รวมทั้งหมด',
      'ประเภท': 'ยอดรวมทั้งสิ้น (Grand Total)',
      'หมวดรายรับ': 'รวมข้อมูลหมวดรายรับทุกหมวด เทศบาลเมืองมหาสารคาม 2570',
      'ประมาณการ (บาท)': totalEstimate,
      'รับจริง (บาท)': totalActual,
      'คงเหลือ (บาท)': totalRemaining,
      'ร้อยละ (%)': totalPercentage,
      'หมายเหตุ': 'คำนวณเปอร์เซ็นต์ของข้อมูลรับจริงของประมาณการทั้งหมด'
    });

    exportSingleCategory('หมวดรายรับ_2570', rows, 'รายงานหมวดรายรับ_เทศบาลเมืองมหาสารคาม_2570');
  };

  return (
    <div className="space-y-6">
      {/* Success Notification Banner */}
      {saveSuccessMsg && (
        <div className="bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-md flex items-center justify-between text-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-emerald-200" />
            <span className="font-semibold">{saveSuccessMsg}</span>
          </div>
          <span className="text-xs text-emerald-100">ข้อมูลถูกบันทึกและซิงค์เรียบร้อยแล้ว</span>
        </div>
      )}

      {/* Top Banner & Action Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-6 bg-emerald-600 rounded-full"></span>
              <h2 className="text-xl font-bold text-slate-800 font-['Prompt']">
                รายงานหมวดรายรับ เทศบาลเมืองมหาสารคาม
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              ประจำปีงบประมาณ พ.ศ. 2570 • ฝ่ายการเงินและบัญชี และฝ่ายบริหารงานคลัง กองคลัง
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Primary "แก้ไขข้อมูล" Button */}
            {user.permissions.canEditDaily && (
              <button
                onClick={openEditModal}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition transform active:scale-95"
              >
                <Edit2 className="w-4 h-4" />
                <span>แก้ไขข้อมูล</span>
              </button>
            )}

            {/* In-table Quick Edit Button */}
            {user.permissions.canEditDaily && (
              <>
                {isDirectEditMode ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveTableEdits}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                    >
                      <Save className="w-4 h-4" />
                      <span>บันทึกตัวเลขในตาราง</span>
                    </button>
                    <button
                      onClick={handleCancelTableEdits}
                      className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-300 transition"
                    >
                      <RotateCcw className="w-4 h-4 text-slate-500" />
                      <span>ยกเลิก</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setTableDraftCategories(categories);
                      setIsDirectEditMode(true);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold transition"
                    title="พิมพ์ตัวเลขลงในช่องตารางโดยตรง"
                  >
                    <Calculator className="w-4 h-4" />
                    <span>แก้ไขในตารางโดยตรง</span>
                  </button>
                )}
              </>
            )}

            {/* Recalculate & Sync Button */}
            <button
              onClick={handleRecalculate}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition shadow-sm"
              title="คำนวณยอดรวม คงเหลือ และเปอร์เซ็นต์ทั้งหมดใหม่ และซิงค์ข้อมูล"
            >
              <RotateCcw className="w-4 h-4 text-emerald-600" />
              <span>อัปเดตการคำนวณ</span>
            </button>

            <button
              onClick={exportRevenueExcel}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-300 transition"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>ส่งออก Excel</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-300 transition"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>พิมพ์รายงาน</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <span className="text-xs font-medium text-slate-500">ประมาณการรายรับรวม</span>
            <div className="text-2xl font-bold text-slate-800 mt-1 font-mono">
              {formatCurrency(totalEstimate)} <span className="text-xs font-normal text-slate-500">บาท</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              หมวดรายรับหลัก: {formatCurrency(main8Estimate)} บาท
            </span>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4">
            <span className="text-xs font-semibold text-emerald-700">รับจริงสะสม</span>
            <div className="text-2xl font-bold text-emerald-700 mt-1 font-mono">
              {formatCurrency(totalActual)} <span className="text-xs font-normal text-emerald-600">บาท</span>
            </div>
            <div className="w-full bg-emerald-200/70 h-2 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(totalPercentage, 100)}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4">
            <span className="text-xs font-semibold text-amber-800">คำนวณคงเหลือที่ต้องจัดเก็บ</span>
            <div className="text-2xl font-bold text-amber-800 mt-1 font-mono">
              {formatCurrency(totalRemaining)} <span className="text-xs font-normal text-amber-700">บาท</span>
            </div>
            <span className="text-[11px] text-amber-600 mt-1 block">
              คำนวณจาก ประมาณการ ลบ รับจริง
            </span>
          </div>

          <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900">
                คำนวณเปอร์เซ็น ของข้อมูลรับจริงของประมาณการทั้งหมด
              </span>
              <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full">
                2570
              </span>
            </div>
            <div className="text-3xl font-extrabold text-blue-900 mt-1.5 font-mono">
              {totalPercentage}%
            </div>
            <span className="text-[11px] text-blue-700 mt-1 block font-medium">
              (รับจริงรวม ÷ ประมาณการรวม) × 100
            </span>
          </div>
        </div>

        {/* Group Sub-breakdown Summary */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-50/80 border border-slate-200 p-3 rounded-xl">
          <div className="flex items-center justify-between border-b md:border-b-0 md:border-r border-slate-200 pb-2 md:pb-0 md:pr-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              <span className="font-semibold text-slate-700">๘ หมวดรายรับหลัก (รวมหมวดรายได้จากทรัพย์สิน):</span>
            </div>
            <div className="text-right">
              <span className="font-bold text-slate-800 font-mono">{formatCurrency(main8Actual)}</span>
              <span className="text-slate-400"> / {formatCurrency(main8Estimate)} บาท</span>
              <span className="ml-2 font-bold text-blue-700">({main8Percent}%)</span>
            </div>
          </div>

          <div className="flex items-center justify-between md:pl-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
              <span className="font-semibold text-slate-700">หมวดเงินอุดหนุนระบุวัตถุประสงค์เฉพาะกิจ / อุดหนุนอื่น:</span>
            </div>
            <div className="text-right">
              <span className="font-bold text-slate-800 font-mono">{formatCurrency(subsidyActual)}</span>
              <span className="text-slate-400"> / {formatCurrency(subsidyEstimate)} บาท</span>
              <span className="ml-2 font-bold text-emerald-700">({subsidyPercent}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Categories Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-800 font-['Prompt'] flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>ตารางแสดงข้อมูลหมวดรายรับ เทศบาลเมืองมหาสารคาม ประจำปีงบประมาณ 2570</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              ๘ หมวดรายรับหลัก (รวมหมวดรายได้จากทรัพย์สิน) และหมวดเงินอุดหนุนระบุวัตถุประสงค์เฉพาะกิจ / หมวดอุดหนุนจากหน่วยงานอื่น
            </p>
          </div>

          {isDirectEditMode && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-300 rounded-lg text-amber-800 text-xs font-semibold animate-pulse">
              <Edit2 className="w-3.5 h-3.5" />
              <span>กำลังอยู่ในโหมดกรอกข้อมูลตัวเลขโดยตรง — กรอกค่าแล้วกดบันทึก</span>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-100 text-slate-700 text-xs font-bold border-b border-slate-200">
                <th className="py-3.5 px-4 w-12 text-center">ลำดับ</th>
                <th className="py-3.5 px-4 min-w-[280px]">หมวดรายรับ</th>
                <th className="py-3.5 px-4 text-right min-w-[170px]">
                  กรอกข้อมูลประมาณการ (บาท)
                </th>
                <th className="py-3.5 px-4 text-right min-w-[170px]">
                  กรอกข้อมูลรับจริง (บาท)
                </th>
                <th className="py-3.5 px-4 text-right min-w-[160px]">
                  คำนวณคงเหลือ (บาท)
                </th>
                <th className="py-3.5 px-4 text-center min-w-[120px]">
                  ร้อยละ (%)
                </th>
                {user.permissions.canEditDaily && !isDirectEditMode && (
                  <th className="py-3.5 px-4 text-center w-28 print:hidden">การจัดการ</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80">
              {currentList.map((cat, idx) => {
                const isSubsidy = subsidyCategoryIds.includes(cat.id);
                const isFirstSubsidy = idx > 0 && !subsidyCategoryIds.includes(currentList[idx - 1]?.id) && isSubsidy;
                const isSingleEditing = editingId === cat.id;

                const curEst = isSingleEditing ? (Number(editEstimate) || 0) : (Number(cat.estimate) || 0);
                const curAct = isSingleEditing ? (Number(editActual) || 0) : (Number(cat.actual) || 0);
                const remaining = curEst - curAct;
                const percentOfCategory = calcPercent(curAct, curEst);
                const percentOfTotal = calcPercent(curAct, totalEstimate);

                return (
                  <React.Fragment key={cat.id}>
                    {/* Visual Section Divider before Subsidy Categories */}
                    {isFirstSubsidy && (
                      <tr className="bg-emerald-50 text-emerald-900 font-semibold text-xs border-y border-emerald-200">
                        <td colSpan={user.permissions.canEditDaily && !isDirectEditMode ? 7 : 6} className="py-2.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                            <span className="font-['Prompt'] font-bold text-emerald-950">
                              หมวดเงินอุดหนุนระบุวัตถุประสงค์เฉพาะกิจ / หมวดอุดหนุนจากหน่วยงานอื่น
                            </span>
                            <span className="text-[11px] text-emerald-700 font-normal">
                              (งบประมาณสนับสนุนเพิ่มเติม นอกเหนือจาก ๘ หมวดรายรับหลัก)
                            </span>
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* Category Row */}
                    <tr
                      className={`${
                        isSubsidy ? 'bg-emerald-50/20 hover:bg-emerald-50/50' : 'bg-slate-50/50 hover:bg-blue-50/30'
                      } transition-colors font-medium`}
                    >
                      {/* Sequence */}
                      <td className="py-3.5 px-4 text-center text-xs font-bold text-slate-500">
                        {idx + 1}
                      </td>

                      {/* Category Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 text-sm">
                            {cat.name}
                          </span>
                          {isSubsidy && (
                            <span className="ml-2 px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-semibold rounded">
                              เงินอุดหนุน
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Estimate Input / Display */}
                      <td className="py-3.5 px-4 text-right font-mono">
                        {isDirectEditMode ? (
                          <div className="relative">
                            <input
                              type="number"
                              value={cat.estimate}
                              onChange={(e) =>
                                handleTableDraftChange(cat.id, 'estimate', parseFloat(e.target.value) || 0)
                              }
                              className="w-full text-right px-2.5 py-1.5 bg-white border border-blue-400 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="กรอกประมาณการ"
                            />
                          </div>
                        ) : isSingleEditing ? (
                          <input
                            type="number"
                            value={editEstimate}
                            onChange={(e) => setEditEstimate(parseFloat(e.target.value) || 0)}
                            className="w-full text-right px-2.5 py-1.5 bg-white border border-blue-500 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
                          />
                        ) : (
                          <span className="text-slate-700 font-semibold">
                            {formatCurrency(cat.estimate)}
                          </span>
                        )}
                      </td>

                      {/* Actual Input / Display */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold">
                        {isDirectEditMode ? (
                          <div className="relative">
                            <input
                              type="number"
                              value={cat.actual}
                              onChange={(e) =>
                                handleTableDraftChange(cat.id, 'actual', parseFloat(e.target.value) || 0)
                              }
                              className="w-full text-right px-2.5 py-1.5 bg-white border border-emerald-500 rounded-lg text-sm font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              placeholder="กรอกรับจริง"
                            />
                          </div>
                        ) : isSingleEditing ? (
                          <input
                            type="number"
                            value={editActual}
                            onChange={(e) => setEditActual(parseFloat(e.target.value) || 0)}
                            className="w-full text-right px-2.5 py-1.5 bg-white border border-emerald-500 rounded-lg text-sm font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                          />
                        ) : (
                          <span className="text-emerald-700">
                            {formatCurrency(cat.actual)}
                          </span>
                        )}
                      </td>

                      {/* Remaining (คำนวณคงเหลือ อัตโนมัติ) */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold">
                        <span
                          className={
                            remaining < 0
                              ? 'text-rose-600'
                              : remaining === 0
                              ? 'text-slate-500'
                              : 'text-amber-800'
                          }
                        >
                          {formatCurrency(remaining)}
                        </span>
                      </td>

                      {/* Percent (คำนวณร้อยละ อัตโนมัติ: ทั้งเทียบหมวด และเทียบประมาณการทั้งหมด) */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex flex-col items-center">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-bold font-mono ${
                              percentOfCategory >= 80
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : percentOfCategory >= 50
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {percentOfCategory}%
                          </span>
                          <span
                            className="text-[10px] text-slate-500 font-mono mt-1 font-medium"
                            title="สัดส่วนของข้อมูลรับจริงหมวดนี้เทียบกับประมาณการรวมทั้งหมด"
                          >
                            {percentOfTotal}% ของประมาณการทั้งหมด
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      {user.permissions.canEditDaily && !isDirectEditMode && (
                        <td className="py-3.5 px-4 text-center print:hidden">
                          {isSingleEditing ? (
                            <button
                              onClick={() => saveEditCategory(cat.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 mx-auto shadow-sm"
                            >
                              <Check className="w-3.5 h-3.5" /> บันทึก
                            </button>
                          ) : (
                            <div className="flex items-center justify-center">
                              <button
                                onClick={() => startEditCategory(cat)}
                                title="แก้ไขประมาณการ / รับจริง แถวนี้"
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>

            {/* Table Footer with Subtotals & Grand Total */}
            <tfoot>
              {/* Main 8 Categories Subtotal */}
              <tr className="bg-slate-200/90 text-slate-800 font-bold text-xs border-t-2 border-slate-300">
                <td colSpan={2} className="py-3 px-4 text-right">
                  รวมเฉพาะ ๘ หมวดรายรับหลัก (รวมหมวดรายได้จากทรัพย์สิน):
                </td>
                <td className="py-3 px-4 text-right font-mono">
                  {formatCurrency(main8Estimate)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-emerald-700">
                  {formatCurrency(main8Actual)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-amber-800">
                  {formatCurrency(main8Remaining)}
                </td>
                <td className="py-3 px-4 text-center font-mono text-blue-700">
                  <div className="flex flex-col items-center">
                    <span>{main8Percent}%</span>
                    <span className="text-[10px] text-slate-600 font-normal">
                      {calcPercent(main8Actual, totalEstimate)}% ของประมาณการทั้งหมด
                    </span>
                  </div>
                </td>
                {user.permissions.canEditDaily && !isDirectEditMode && <td className="print:hidden"></td>}
              </tr>

              {/* Subsidy Categories Subtotal */}
              <tr className="bg-emerald-100/70 text-slate-800 font-bold text-xs border-t border-emerald-200">
                <td colSpan={2} className="py-3 px-4 text-right">
                  รวมหมวดเงินอุดหนุนระบุวัตถุประสงค์เฉพาะกิจ / หมวดอุดหนุนจากหน่วยงานอื่น:
                </td>
                <td className="py-3 px-4 text-right font-mono">
                  {formatCurrency(subsidyEstimate)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-emerald-800">
                  {formatCurrency(subsidyActual)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-amber-800">
                  {formatCurrency(subsidyRemaining)}
                </td>
                <td className="py-3 px-4 text-center font-mono text-emerald-800">
                  <div className="flex flex-col items-center">
                    <span>{subsidyPercent}%</span>
                    <span className="text-[10px] text-emerald-700 font-normal">
                      {calcPercent(subsidyActual, totalEstimate)}% ของประมาณการทั้งหมด
                    </span>
                  </div>
                </td>
                {user.permissions.canEditDaily && !isDirectEditMode && <td className="print:hidden"></td>}
              </tr>

              {/* GRAND TOTAL: ALL CATEGORIES WITH % OF TOTAL ESTIMATE */}
              <tr className="bg-slate-900 text-white font-bold text-sm">
                <td colSpan={2} className="py-4 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                    <span className="font-['Prompt'] text-amber-200">
                      รวมหมวดรายรับทั้งหมด (Grand Total ครบทุกหมวด)
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-normal">
                    คำนวณเปอร์เซ็น ของข้อมูลรับจริงของประมาณการทั้งหมด = (รับจริงรวม {formatCurrency(totalActual)} ÷ ประมาณการรวม {formatCurrency(totalEstimate)}) × 100
                  </div>
                </td>
                <td className="py-4 px-4 text-right font-mono text-slate-100 text-base">
                  {formatCurrency(totalEstimate)}
                </td>
                <td className="py-4 px-4 text-right font-mono text-emerald-400 text-base">
                  {formatCurrency(totalActual)}
                </td>
                <td className="py-4 px-4 text-right font-mono text-amber-300 text-base">
                  {formatCurrency(totalRemaining)}
                </td>
                <td className="py-4 px-4 text-center font-mono text-emerald-400 text-lg">
                  {totalPercentage}%
                </td>
                {user.permissions.canEditDaily && !isDirectEditMode && <td className="print:hidden"></td>}
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Direct edit bottom action bar */}
        {isDirectEditMode && (
          <div className="p-4 bg-amber-50/80 border-t border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-amber-900">
              <Info className="w-4 h-4 text-amber-700" />
              <span>
                ยอดคงเหลือและร้อยละทุกหมวดถูกคำนวณใหม่อัตโนมัติขณะกรอกข้อมูล ตรวจสอบยอดแล้วกดปุ่มบันทึก
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveTableEdits}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow transition"
              >
                <Save className="w-4 h-4" />
                <span>บันทึกข้อมูลหมวดรายรับทั้งหมด</span>
              </button>
              <button
                onClick={handleCancelTableEdits}
                className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold border border-slate-300 transition"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DEDICATED MODAL: แก้ไขข้อมูลหมวดรายรับ */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-5xl w-full my-6 overflow-hidden flex flex-col max-h-[90vh] animate-scale-up">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white font-['Prompt']">
                    แก้ไขข้อมูลหมวดรายรับ เทศบาลเมืองมหาสารคาม
                  </h3>
                  <p className="text-xs text-slate-400">
                    ประจำปีงบประมาณ พ.ศ. 2570 • กรอกข้อมูลประมาณการ กรอกข้อมูลรับจริง และคำนวณคงเหลืออัตโนมัติ
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Instruction Banner */}
            <div className="bg-blue-50 px-6 py-2.5 border-b border-blue-200 flex items-center justify-between text-xs text-blue-900">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span>
                  กรอกยอดประมาณการและยอดรับจริงในแต่ละหมวด ระบบจะคำนวณคงเหลือและคำนวณเปอร์เซ็นต์ของรับจริงของประมาณการทั้งหมดให้อัตโนมัติทันที
                </span>
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Part 1: ๘ หมวดรายรับหลัก */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                    <span className="font-bold text-slate-800 text-xs font-['Prompt']">
                      หมวดรายรับ ๘ หมวดหลัก (รวมหมวดรายได้จากทรัพย์สิน) (กรอกข้อมูลประมาณการ กรอกข้อมูลรับจริง คำนวณคงเหลือ)
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">๘ หมวดมาตรฐาน</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                        <th className="py-2.5 px-3 w-10 text-center">ที่</th>
                        <th className="py-2.5 px-3 min-w-[220px]">หมวดรายรับ</th>
                        <th className="py-2.5 px-3 text-right min-w-[150px]">กรอกข้อมูลประมาณการ (บาท)</th>
                        <th className="py-2.5 px-3 text-right min-w-[150px]">กรอกข้อมูลรับจริง (บาท)</th>
                        <th className="py-2.5 px-3 text-right min-w-[130px]">คำนวณคงเหลือ (บาท)</th>
                        <th className="py-2.5 px-3 text-center min-w-[90px]">ร้อยละ (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {modalDrafts
                        .filter(c => main8CategoryIds.includes(c.id))
                        .map((cat, idx) => {
                          const rem = (Number(cat.estimate) || 0) - (Number(cat.actual) || 0);
                          const pct = calcPercent(Number(cat.actual) || 0, Number(cat.estimate) || 0);

                          return (
                            <tr key={cat.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-2.5 px-3 text-center font-bold text-slate-400">
                                {idx + 1}
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="font-bold text-slate-800">{cat.name}</div>
                              </td>
                              <td className="py-2 px-3 text-right">
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={cat.estimate}
                                  onChange={(e) =>
                                    handleModalDraftChange(cat.id, 'estimate', parseFloat(e.target.value) || 0)
                                  }
                                  className="w-full text-right px-2.5 py-1.5 bg-white border border-blue-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                                  placeholder="0.00"
                                />
                              </td>
                              <td className="py-2 px-3 text-right">
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={cat.actual}
                                  onChange={(e) =>
                                    handleModalDraftChange(cat.id, 'actual', parseFloat(e.target.value) || 0)
                                  }
                                  className="w-full text-right px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                                  placeholder="0.00"
                                />
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold">
                                <span className={rem < 0 ? 'text-rose-600' : 'text-amber-700'}>
                                  {formatCurrency(rem)}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono font-bold text-blue-700">
                                {pct}%
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                    <tfoot className="bg-slate-100 font-bold border-t border-slate-300">
                      <tr>
                        <td colSpan={2} className="py-2.5 px-3 text-right text-slate-800">
                          รวม ๘ หมวดรายรับหลัก (รวมหมวดรายได้จากทรัพย์สิน):
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-900">
                          {formatCurrency(modalMain8Est)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-emerald-700">
                          {formatCurrency(modalMain8Act)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-amber-700">
                          {formatCurrency(modalMain8Rem)}
                        </td>
                        <td className="py-2 px-3 text-center font-mono text-blue-700">
                          {modalMain8Pct}%
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Part 2: หมวดเงินอุดหนุนระบุวัตถุประสงค์เฉพาะกิจ / หมวดอุดหนุนจากหน่วยงานอื่น */}
              <div className="border border-emerald-200 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-emerald-50 px-4 py-2.5 border-b border-emerald-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                    <span className="font-bold text-emerald-950 text-xs font-['Prompt']">
                      หมวดเงินอุดหนุนระบุวัตถุประสงค์เฉพาะกิจ / หมวดอุดหนุนจากหน่วยงานอื่น
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-700 font-medium">เงินอุดหนุนเพิ่มเติม</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-emerald-50/50 text-emerald-900 font-bold border-b border-emerald-100">
                        <th className="py-2.5 px-3 w-10 text-center">ที่</th>
                        <th className="py-2.5 px-3 min-w-[220px]">หมวดเงินอุดหนุน</th>
                        <th className="py-2.5 px-3 text-right min-w-[150px]">กรอกข้อมูลประมาณการ (บาท)</th>
                        <th className="py-2.5 px-3 text-right min-w-[150px]">กรอกข้อมูลรับจริง (บาท)</th>
                        <th className="py-2.5 px-3 text-right min-w-[130px]">คำนวณคงเหลือ (บาท)</th>
                        <th className="py-2.5 px-3 text-center min-w-[90px]">ร้อยละ (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-100/80">
                      {modalDrafts
                        .filter(c => subsidyCategoryIds.includes(c.id) || !main8CategoryIds.includes(c.id))
                        .map((cat, idx) => {
                          const rem = (Number(cat.estimate) || 0) - (Number(cat.actual) || 0);
                          const pct = calcPercent(Number(cat.actual) || 0, Number(cat.estimate) || 0);

                          return (
                            <tr key={cat.id} className="hover:bg-emerald-50/40 transition-colors">
                              <td className="py-2.5 px-3 text-center font-bold text-emerald-700">
                                {idx + 9}
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="font-bold text-slate-800">{cat.name}</div>
                              </td>
                              <td className="py-2 px-3 text-right">
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={cat.estimate}
                                  onChange={(e) =>
                                    handleModalDraftChange(cat.id, 'estimate', parseFloat(e.target.value) || 0)
                                  }
                                  className="w-full text-right px-2.5 py-1.5 bg-white border border-blue-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                                  placeholder="0.00"
                                />
                              </td>
                              <td className="py-2 px-3 text-right">
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={cat.actual}
                                  onChange={(e) =>
                                    handleModalDraftChange(cat.id, 'actual', parseFloat(e.target.value) || 0)
                                  }
                                  className="w-full text-right px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                                  placeholder="0.00"
                                />
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold">
                                <span className={rem < 0 ? 'text-rose-600' : 'text-amber-700'}>
                                  {formatCurrency(rem)}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-700">
                                {pct}%
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                    <tfoot className="bg-emerald-100/60 font-bold border-t border-emerald-200">
                      <tr>
                        <td colSpan={2} className="py-2.5 px-3 text-right text-emerald-950">
                          รวมหมวดเงินอุดหนุน:
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-emerald-900">
                          {formatCurrency(modalSubsidyEst)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-emerald-700">
                          {formatCurrency(modalSubsidyAct)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-amber-700">
                          {formatCurrency(modalSubsidyRem)}
                        </td>
                        <td className="py-2 px-3 text-center font-mono text-emerald-800">
                          {modalSubsidyPct}%
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Live Calculation Grand Total Card in Modal */}
              <div className="bg-slate-900 text-white rounded-xl p-4 shadow-md">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                      <span className="font-['Prompt'] font-bold text-amber-200 text-sm">
                        รวมข้อมูลหมวดรายรับทั้งหมด (Grand Total ครบทุกหมวด รวมหมวดรายได้จากทรัพย์สิน)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      คำนวณเปอร์เซ็น ของข้อมูลรับจริงของประมาณการทั้งหมด = (รับจริงรวม {formatCurrency(modalTotalAct)} ÷ ประมาณการรวม {formatCurrency(modalTotalEst)}) × 100
                    </p>
                  </div>

                  <div className="flex items-center gap-6 text-right">
                    <div>
                      <span className="text-[10px] text-slate-400 block">ประมาณการรวม</span>
                      <span className="text-sm font-bold font-mono text-slate-200">
                        {formatCurrency(modalTotalEst)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">รับจริงรวม</span>
                      <span className="text-sm font-bold font-mono text-emerald-400">
                        {formatCurrency(modalTotalAct)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">คำนวณคงเหลือ</span>
                      <span className="text-sm font-bold font-mono text-amber-300">
                        {formatCurrency(modalTotalRem)}
                      </span>
                    </div>
                    <div className="pl-4 border-l border-slate-700">
                      <span className="text-[10px] text-amber-300 block font-semibold">เปอร์เซ็นต์รับจริงทั้งหมด</span>
                      <span className="text-2xl font-extrabold font-mono text-emerald-400">
                        {modalTotalPct}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-100 px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-5 py-2.5 bg-white hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-300 transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveModal}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition transform active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>บันทึกการแก้ไขข้อมูล</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
