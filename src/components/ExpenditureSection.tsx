import React, { useState } from 'react';
import {
  TrendingDown,
  Plus,
  Edit2,
  Trash2,
  Download,
  ChevronDown,
  ChevronRight,
  Check
} from 'lucide-react';
import { BudgetCategory, UserSession, SubBudget } from '../types/finance';
import { formatCurrency, calcPercent } from '../utils/formatters';
import { exportSingleCategory } from '../services/excelService';

interface ExpenditureSectionProps {
  categories: BudgetCategory[];
  user: UserSession;
  onUpdateCategories: (updated: BudgetCategory[]) => void;
}

export const ExpenditureSection: React.FC<ExpenditureSectionProps> = ({
  categories,
  user,
  onUpdateCategories
}) => {
  const [expandedCats, setExpandedCats] = useState<{ [id: string]: boolean }>({
    exp_personnel: true,
    exp_operating: true,
    exp_central: true,
    exp_invest: true,
    exp_subsidy: true,
    exp_other: true
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editEstimate, setEditEstimate] = useState<number>(0);
  const [editActual, setEditActual] = useState<number>(0);

  // Sub-item editing state
  const [editingSub, setEditingSub] = useState<{ catId: string; subId: string } | null>(null);
  const [subName, setSubName] = useState<string>('');
  const [subEstimate, setSubEstimate] = useState<number>(0);
  const [subActual, setSubActual] = useState<number>(0);

  // Add new sub-item form state
  const [newSubCatId, setNewSubCatId] = useState<string | null>(null);
  const [newSubName, setNewSubName] = useState('');
  const [newSubEst, setNewSubEst] = useState<number>(0);
  const [newSubAct, setNewSubAct] = useState<number>(0);

  const toggleExpand = (id: string) => {
    setExpandedCats(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const totalEstimate = categories.reduce((sum, c) => sum + c.estimate, 0);
  const totalActual = categories.reduce((sum, c) => sum + c.actual, 0);
  const totalRemaining = totalEstimate - totalActual;
  const totalPercentage = calcPercent(totalActual, totalEstimate);

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
          actual: Number(editActual) || 0
        };
      }
      return cat;
    });
    onUpdateCategories(updated);
    setEditingId(null);
  };

  const startEditSubItem = (catId: string, sub: SubBudget) => {
    setEditingSub({ catId, subId: sub.id });
    setSubName(sub.name);
    setSubEstimate(sub.estimate);
    setSubActual(sub.actual);
  };

  const saveEditSubItem = (catId: string, subId: string) => {
    const updated = categories.map(cat => {
      if (cat.id === catId && cat.subItems) {
        const newSubItems = cat.subItems.map(s => {
          if (s.id === subId) {
            return {
              ...s,
              name: subName.trim() || s.name,
              estimate: Number(subEstimate) || 0,
              actual: Number(subActual) || 0
            };
          }
          return s;
        });

        const newCatEst = newSubItems.reduce((acc, curr) => acc + curr.estimate, 0);
        const newCatAct = newSubItems.reduce((acc, curr) => acc + curr.actual, 0);

        return {
          ...cat,
          estimate: newCatEst > 0 ? newCatEst : cat.estimate,
          actual: newCatAct > 0 ? newCatAct : cat.actual,
          subItems: newSubItems
        };
      }
      return cat;
    });
    onUpdateCategories(updated);
    setEditingSub(null);
  };

  const handleDeleteSubItem = (catId: string, subId: string) => {
    if (!window.confirm('ยืนยันลบรายการย่อยนี้หรือไม่?')) return;
    const updated = categories.map(cat => {
      if (cat.id === catId && cat.subItems) {
        const newSubItems = cat.subItems.filter(s => s.id !== subId);
        return {
          ...cat,
          subItems: newSubItems
        };
      }
      return cat;
    });
    onUpdateCategories(updated);
  };

  const handleAddSubItem = (catId: string) => {
    if (!newSubName.trim()) return;
    const updated = categories.map(cat => {
      if (cat.id === catId) {
        const newSub: SubBudget = {
          id: `sub_${Date.now()}`,
          name: newSubName.trim(),
          estimate: Number(newSubEst) || 0,
          actual: Number(newSubAct) || 0
        };
        const currentSubs = cat.subItems || [];
        const newSubs = [...currentSubs, newSub];
        return {
          ...cat,
          estimate: cat.estimate + (Number(newSubEst) || 0),
          actual: cat.actual + (Number(newSubAct) || 0),
          subItems: newSubs
        };
      }
      return cat;
    });
    onUpdateCategories(updated);
    setNewSubCatId(null);
    setNewSubName('');
    setNewSubEst(0);
    setNewSubAct(0);
  };

  const exportExpenditureExcel = () => {
    const rows: any[] = [];
    categories.forEach((cat, idx) => {
      rows.push({
        'ลำดับ': idx + 1,
        'หมวดรายจ่าย': cat.name,
        'ประมาณการ (บาท)': cat.estimate,
        'จ่ายจริง (บาท)': cat.actual,
        'คงเหลือ (บาท)': cat.estimate - cat.actual,
        'ร้อยละ (%)': calcPercent(cat.actual, cat.estimate),
        'หมายเหตุ': cat.notes || ''
      });
      if (cat.subItems) {
        cat.subItems.forEach((sub, sIdx) => {
          rows.push({
            'ลำดับ': `  ${idx + 1}.${sIdx + 1}`,
            'หมวดรายจ่าย': `  - ${sub.name}`,
            'ประมาณการ (บาท)': sub.estimate,
            'จ่ายจริง (บาท)': sub.actual,
            'คงเหลือ (บาท)': sub.estimate - sub.actual,
            'ร้อยละ (%)': calcPercent(sub.actual, sub.estimate),
            'หมายเหตุ': 'รายการย่อย'
          });
        });
      }
    });
    exportSingleCategory('หมวดรายจ่าย_2570', rows, 'รายงานหมวดรายจ่าย_เทศบาลเมืองมหาสารคาม_2570');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Summary Cards */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-6 bg-rose-600 rounded-full"></span>
              <h2 className="text-xl font-bold text-slate-800 font-['Prompt']">
                รายงานหมวดรายจ่าย เทศบาลเมืองมหาสารคาม
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              ปีงบประมาณ พ.ศ. 2570 • งบบุคลากร, งบดำเนินงาน, งบกลาง, งบลงทุน, งบเงินอุดหนุน, งบรายจ่ายอื่น
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={exportExpenditureExcel}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-300 transition"
            >
              <Download className="w-4 h-4 text-rose-600" />
              <span>ส่งออก Excel หมวดรายจ่าย</span>
            </button>
          </div>
        </div>

        {/* Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <span className="text-xs font-medium text-slate-500">ประมาณการงบประมาณรายจ่าย</span>
            <div className="text-xl font-bold text-slate-800 mt-1">
              {formatCurrency(totalEstimate)} <span className="text-xs font-normal text-slate-500">บาท</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">รวม {categories.length} งบหลัก</span>
          </div>

          <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-4">
            <span className="text-xs font-semibold text-rose-700">เบิกจ่ายจริงสะสม</span>
            <div className="text-xl font-bold text-rose-700 mt-1">
              {formatCurrency(totalActual)} <span className="text-xs font-normal text-rose-600">บาท</span>
            </div>
            <div className="w-full bg-rose-200/70 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-rose-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(totalPercentage, 100)}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4">
            <span className="text-xs font-semibold text-emerald-800">งบประมาณคงเหลือเบิกจ่าย</span>
            <div className="text-xl font-bold text-emerald-800 mt-1">
              {formatCurrency(totalRemaining)} <span className="text-xs font-normal text-emerald-700">บาท</span>
            </div>
            <span className="text-[11px] text-emerald-600 mt-0.5 block">ประมาณการ ลบ จ่ายจริง</span>
          </div>

          <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4">
            <span className="text-xs font-semibold text-indigo-800">ร้อยละการเบิกจ่ายงบประมาณ</span>
            <div className="text-2xl font-bold text-indigo-900 mt-1">
              {totalPercentage}%
            </div>
            <span className="text-[11px] text-indigo-600 mt-0.5 block">อัตราการเบิกจ่ายของประมาณการ</span>
          </div>
        </div>
      </div>

      {/* Main Expenditure Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 font-['Prompt']">
            ตารางแสดงรายละเอียดหมวดรายจ่าย 6 งบหลัก (พร้อมรายการย่อย)
          </h3>
          <span className="text-xs text-slate-500">
            {user.permissions.canEditDaily ? 'คลิกแก้ไข หรือคีย์เบิกจ่ายประจำวัน' : 'สิทธิ์ดูรายงาน'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-100 text-slate-700 text-xs font-bold border-b border-slate-200">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4 min-w-[280px]">หมวดรายจ่าย / รายการย่อย</th>
                <th className="py-3 px-4 text-right min-w-[150px]">ประมาณการ (บาท)</th>
                <th className="py-3 px-4 text-right min-w-[150px]">จ่ายจริง (บาท)</th>
                <th className="py-3 px-4 text-right min-w-[150px]">คงเหลือ (บาท)</th>
                <th className="py-3 px-4 text-center min-w-[110px]">ร้อยละ (%)</th>
                {user.permissions.canEditDaily && (
                  <th className="py-3 px-4 text-center w-28">การจัดการ</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80">
              {categories.map((cat, idx) => {
                const remaining = cat.estimate - cat.actual;
                const percent = calcPercent(cat.actual, cat.estimate);
                const isExpanded = !!expandedCats[cat.id];
                const isEditing = editingId === cat.id;

                return (
                  <React.Fragment key={cat.id}>
                    {/* Category Row */}
                    <tr className="bg-slate-50/60 hover:bg-rose-50/30 transition-colors font-medium">
                      <td className="py-3 px-4 text-center text-xs font-bold text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {cat.subItems && cat.subItems.length > 0 ? (
                            <button
                              onClick={() => toggleExpand(cat.id)}
                              className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition"
                              title="เปิด/ปิด รายการย่อย"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-rose-700" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>
                          ) : (
                            <div className="w-4"></div>
                          )}
                          <span className="font-semibold text-slate-800 text-sm">
                            {cat.name}
                          </span>
                        </div>
                      </td>

                      {/* Estimate */}
                      <td className="py-3 px-4 text-right font-mono">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editEstimate}
                            onChange={(e) => setEditEstimate(parseFloat(e.target.value) || 0)}
                            className="w-full text-right px-2 py-1 bg-white border border-rose-400 rounded text-sm focus:outline-none focus:ring-1 focus:ring-rose-600"
                          />
                        ) : (
                          <span className="text-slate-700">{formatCurrency(cat.estimate)}</span>
                        )}
                      </td>

                      {/* Actual Expended */}
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editActual}
                            onChange={(e) => setEditActual(parseFloat(e.target.value) || 0)}
                            className="w-full text-right px-2 py-1 bg-white border border-rose-500 rounded text-sm focus:outline-none focus:ring-1 focus:ring-rose-600 text-rose-700"
                          />
                        ) : (
                          <span className="text-rose-700">{formatCurrency(cat.actual)}</span>
                        )}
                      </td>

                      {/* Remaining */}
                      <td className="py-3 px-4 text-right font-mono font-medium text-emerald-800">
                        {formatCurrency(remaining)}
                      </td>

                      {/* Percent */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            percent > 90
                              ? 'bg-rose-100 text-rose-800'
                              : percent >= 60
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {percent}%
                        </span>
                      </td>

                      {/* Actions */}
                      {user.permissions.canEditDaily && (
                        <td className="py-3 px-4 text-center">
                          {isEditing ? (
                            <button
                              onClick={() => saveEditCategory(cat.id)}
                              className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold flex items-center gap-1 mx-auto"
                            >
                              <Check className="w-3.5 h-3.5" /> บันทึก
                            </button>
                          ) : (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => startEditCategory(cat)}
                                title="แก้ไขประมาณการ/จ่ายจริง"
                                className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setNewSubCatId(cat.id)}
                                title="เพิ่มรายการย่อย"
                                className="p-1 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded transition"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>

                    {/* Sub-items Breakdown (e.g., เงินเดือนฝ่ายการเมือง, ฝ่ายประจำ, ค่าตอบแทน, ค่าใช้สอย ฯลฯ) */}
                    {isExpanded && cat.subItems && cat.subItems.map((sub, sIdx) => {
                      const subRemaining = sub.estimate - sub.actual;
                      const subPercent = calcPercent(sub.actual, sub.estimate);
                      const isSubEditing = editingSub?.catId === cat.id && editingSub?.subId === sub.id;

                      return (
                        <tr key={sub.id} className="bg-white hover:bg-slate-50 text-xs">
                          <td className="py-2.5 px-4 text-center text-slate-400">
                            {idx + 1}.{sIdx + 1}
                          </td>
                          <td className="py-2.5 px-4 pl-10 text-slate-600">
                            {isSubEditing ? (
                              <input
                                type="text"
                                value={subName}
                                onChange={(e) => setSubName(e.target.value)}
                                className="w-full px-2 py-0.5 border border-rose-400 rounded text-xs"
                                placeholder="ชื่อรายการย่อย"
                              />
                            ) : (
                              <span>• {sub.name}</span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono text-slate-500">
                            {isSubEditing ? (
                              <input
                                type="number"
                                value={subEstimate}
                                onChange={(e) => setSubEstimate(parseFloat(e.target.value) || 0)}
                                className="w-full text-right px-2 py-0.5 border border-rose-400 rounded"
                              />
                            ) : (
                              formatCurrency(sub.estimate)
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono text-rose-600 font-medium">
                            {isSubEditing ? (
                              <input
                                type="number"
                                value={subActual}
                                onChange={(e) => setSubActual(parseFloat(e.target.value) || 0)}
                                className="w-full text-right px-2 py-0.5 border border-rose-500 rounded text-rose-700"
                              />
                            ) : (
                              formatCurrency(sub.actual)
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono text-emerald-700">
                            {formatCurrency(subRemaining)}
                          </td>
                          <td className="py-2.5 px-4 text-center text-slate-500 font-mono">
                            {subPercent}%
                          </td>
                          {user.permissions.canEditDaily && (
                            <td className="py-2.5 px-4 text-center">
                              {isSubEditing ? (
                                <button
                                  onClick={() => saveEditSubItem(cat.id, sub.id)}
                                  className="px-2 py-0.5 bg-rose-600 text-white rounded text-[11px]"
                                >
                                  บันทึก
                                </button>
                              ) : (
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => startEditSubItem(cat.id, sub)}
                                    title="แก้ไขรายการย่อย"
                                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSubItem(cat.id, sub.id)}
                                    title="ลบรายการย่อย"
                                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}

                    {/* Quick Add Sub-item Row */}
                    {newSubCatId === cat.id && (
                      <tr className="bg-rose-50/70 text-xs">
                        <td className="py-2 px-4 text-center text-rose-600 font-bold">+</td>
                        <td className="py-2 px-4 pl-10">
                          <input
                            type="text"
                            placeholder="ชื่อรายการย่อยรายจ่ายใหม่..."
                            value={newSubName}
                            onChange={(e) => setNewSubName(e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-rose-300 rounded text-xs"
                          />
                        </td>
                        <td className="py-2 px-4 text-right">
                          <input
                            type="number"
                            placeholder="ประมาณการ"
                            value={newSubEst}
                            onChange={(e) => setNewSubEst(parseFloat(e.target.value) || 0)}
                            className="w-full text-right px-2 py-1 bg-white border border-rose-300 rounded text-xs font-mono"
                          />
                        </td>
                        <td className="py-2 px-4 text-right">
                          <input
                            type="number"
                            placeholder="จ่ายจริง"
                            value={newSubAct}
                            onChange={(e) => setNewSubAct(parseFloat(e.target.value) || 0)}
                            className="w-full text-right px-2 py-1 bg-white border border-rose-400 rounded text-xs font-mono"
                          />
                        </td>
                        <td className="py-2 px-4"></td>
                        <td className="py-2 px-4"></td>
                        <td className="py-2 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleAddSubItem(cat.id)}
                              className="px-2 py-1 bg-rose-600 text-white rounded text-[11px] font-semibold"
                            >
                              เพิ่ม
                            </button>
                            <button
                              onClick={() => setNewSubCatId(null)}
                              className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-[11px]"
                            >
                              ยกเลิก
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
            {/* Grand Total Footer */}
            <tfoot>
              <tr className="bg-slate-800 text-white font-bold text-sm">
                <td colSpan={2} className="py-3.5 px-4 text-right">
                  รวมหมวดรายจ่ายทั้งหมด (Grand Total)
                </td>
                <td className="py-3.5 px-4 text-right font-mono text-slate-100">
                  {formatCurrency(totalEstimate)}
                </td>
                <td className="py-3.5 px-4 text-right font-mono text-rose-400">
                  {formatCurrency(totalActual)}
                </td>
                <td className="py-3.5 px-4 text-right font-mono text-emerald-300">
                  {formatCurrency(totalRemaining)}
                </td>
                <td className="py-3.5 px-4 text-center text-rose-400 font-mono">
                  {totalPercentage}%
                </td>
                {user.permissions.canEditDaily && <td></td>}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
