import React from 'react';
import {
  Scale,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Percent,
  Coins,
  Receipt
} from 'lucide-react';
import { BudgetCategory } from '../types/finance';
import { formatCurrency, calcPercent, bahtText } from '../utils/formatters';

interface ComparisonSectionProps {
  revenueCategories: BudgetCategory[];
  expenditureCategories: BudgetCategory[];
}

export const ComparisonSection: React.FC<ComparisonSectionProps> = ({
  revenueCategories,
  expenditureCategories
}) => {
  const totalRevEst = revenueCategories.reduce((sum, c) => sum + c.estimate, 0);
  const totalRevAct = revenueCategories.reduce((sum, c) => sum + c.actual, 0);
  const totalRevRem = totalRevEst - totalRevAct;
  const revPercent = calcPercent(totalRevAct, totalRevEst);

  const totalExpEst = expenditureCategories.reduce((sum, c) => sum + c.estimate, 0);
  const totalExpAct = expenditureCategories.reduce((sum, c) => sum + c.actual, 0);
  const totalExpRem = totalExpEst - totalExpAct;
  const expPercent = calcPercent(totalExpAct, totalExpEst);

  const estDiff = totalRevEst - totalExpEst;
  const netActualBalance = totalRevAct - totalExpAct;
  const remDiff = totalRevRem - totalExpRem;
  const pctDiff = Number((revPercent - expPercent).toFixed(2));

  const getDiffStatus = (diff: number) => {
    if (diff > 0) {
      return {
        label: 'เกินดุล',
        badgeClass: 'bg-emerald-100 text-emerald-800',
        textClass: 'text-emerald-700',
        prefix: '+'
      };
    }
    if (diff === 0) {
      return {
        label: 'สมดุล',
        badgeClass: 'bg-blue-100 text-blue-800',
        textClass: 'text-slate-800',
        prefix: ''
      };
    }
    return {
      label: 'ขาดดุล',
      badgeClass: 'bg-rose-100 text-rose-800',
      textClass: 'text-rose-700',
      prefix: ''
    };
  };

  const estStatus = getDiffStatus(estDiff);
  const actStatus = getDiffStatus(netActualBalance);
  const remStatus = getDiffStatus(remDiff);
  const pctStatus = getDiffStatus(pctDiff);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
        <div className="pb-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-6 bg-indigo-600 rounded-full"></span>
            <h2 className="text-xl font-bold text-slate-800 font-['Prompt']">
              เปรียบเทียบ รายงานหมวดรายรับ กับ รายงานหมวดรายจ่าย
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            เทศบาลเมืองมหาสารคาม ประจำปีงบประมาณ พ.ศ. 2570
          </p>
        </div>

        {/* Big Comparison Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Left: Revenue Summary Card */}
          <div className="bg-gradient-to-br from-emerald-50/50 to-teal-50/30 border border-emerald-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-200/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-emerald-950 font-['Prompt'] text-base">
                    หมวดรายรับ (Revenues)
                  </h3>
                  <span className="text-[11px] text-emerald-700">จัดเก็บแล้ว {revPercent}% ของประมาณการ</span>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg text-xs">
                เป้าหมาย: {formatCurrency(totalRevEst)}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="bg-white/80 rounded-xl p-3 border border-emerald-100">
                <span className="text-xs text-slate-500">รับจริงสะสม</span>
                <div className="text-lg font-bold text-emerald-700 font-mono mt-0.5">
                  {formatCurrency(totalRevAct)}
                </div>
              </div>
              <div className="bg-white/80 rounded-xl p-3 border border-emerald-100">
                <span className="text-xs text-slate-500">คงเหลือต้องจัดเก็บ</span>
                <div className="text-lg font-bold text-amber-700 font-mono mt-0.5">
                  {formatCurrency(totalRevRem)}
                </div>
              </div>
            </div>

            {/* Progress Meter */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-emerald-900 font-medium mb-1">
                <span>ความก้าวหน้าการจัดเก็บรายได้</span>
                <span className="font-bold">{revPercent}%</span>
              </div>
              <div className="w-full bg-emerald-200/80 h-3 rounded-full overflow-hidden p-0.5">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(revPercent, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Top 3 Revenue Sources */}
            <div className="mt-5 pt-4 border-t border-emerald-200/60 space-y-2">
              <span className="text-xs font-semibold text-emerald-900 block">
                หมวดรายรับหลัก 3 อันดับแรก:
              </span>
              {[...revenueCategories]
                .sort((a, b) => b.actual - a.actual)
                .slice(0, 3)
                .map((cat, idx) => (
                  <div key={cat.id} className="flex items-center justify-between text-xs bg-white/60 p-2 rounded-lg">
                    <span className="text-slate-700 truncate max-w-[200px]">
                      {idx + 1}. {cat.name}
                    </span>
                    <span className="font-bold text-emerald-800 font-mono">
                      {formatCurrency(cat.actual)} บาท ({calcPercent(cat.actual, cat.estimate)}%)
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* Right: Expenditure Summary Card */}
          <div className="bg-gradient-to-br from-rose-50/50 to-orange-50/30 border border-rose-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-rose-200/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                  <TrendingDown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-rose-950 font-['Prompt'] text-base">
                    หมวดรายจ่าย (Expenditures)
                  </h3>
                  <span className="text-[11px] text-rose-700">เบิกจ่ายแล้ว {expPercent}% ของงบประมาณ</span>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-rose-100 text-rose-800 font-bold rounded-lg text-xs">
                งบประมาณ: {formatCurrency(totalExpEst)}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="bg-white/80 rounded-xl p-3 border border-rose-100">
                <span className="text-xs text-slate-500">จ่ายจริงสะสม</span>
                <div className="text-lg font-bold text-rose-700 font-mono mt-0.5">
                  {formatCurrency(totalExpAct)}
                </div>
              </div>
              <div className="bg-white/80 rounded-xl p-3 border border-rose-100">
                <span className="text-xs text-slate-500">คงเหลืองบประมาณ</span>
                <div className="text-lg font-bold text-emerald-700 font-mono mt-0.5">
                  {formatCurrency(totalExpRem)}
                </div>
              </div>
            </div>

            {/* Progress Meter */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-rose-900 font-medium mb-1">
                <span>อัตราการเบิกจ่ายงบประมาณ</span>
                <span className="font-bold">{expPercent}%</span>
              </div>
              <div className="w-full bg-rose-200/80 h-3 rounded-full overflow-hidden p-0.5">
                <div
                  className="bg-rose-600 h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(expPercent, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Top 3 Expenditure Categories */}
            <div className="mt-5 pt-4 border-t border-rose-200/60 space-y-2">
              <span className="text-xs font-semibold text-rose-900 block">
                งบรายจ่ายสูงสุด 3 อันดับแรก:
              </span>
              {[...expenditureCategories]
                .sort((a, b) => b.actual - a.actual)
                .slice(0, 3)
                .map((cat, idx) => (
                  <div key={cat.id} className="flex items-center justify-between text-xs bg-white/60 p-2 rounded-lg">
                    <span className="text-slate-700 truncate max-w-[200px]">
                      {idx + 1}. {cat.name}
                    </span>
                    <span className="font-bold text-rose-800 font-mono">
                      {formatCurrency(cat.actual)} บาท ({calcPercent(cat.actual, cat.estimate)}%)
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison Matrix */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-base font-bold text-slate-800 font-['Prompt'] mb-4 flex items-center gap-2">
          <Scale className="w-5 h-5 text-indigo-600" />
          <span>ตารางเปรียบเทียบรายรับและรายจ่าย สรุปตามประเภท</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 text-xs font-bold border-b border-slate-200">
                <th className="py-3 px-4">มิติการเปรียบเทียบ</th>
                <th className="py-3 px-4 text-right text-emerald-800">หมวดรายรับ (บาท)</th>
                <th className="py-3 px-4 text-right text-rose-800">หมวดรายจ่าย (บาท)</th>
                <th className="py-3 px-4 text-right text-blue-900">ผลต่างสุทธิ (รายรับ - รายจ่าย)</th>
                <th className="py-3 px-4 text-center">การประเมินสถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-800">
                  ๑. ยอดประมาณการงบประมาณทั้งปี (Estimate)
                </td>
                <td className="py-3 px-4 text-right font-mono text-emerald-700 font-medium">
                  {formatCurrency(totalRevEst)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-rose-700 font-medium">
                  {formatCurrency(totalExpEst)}
                </td>
                <td className={`py-3 px-4 text-right font-mono font-bold ${estStatus.textClass}`}>
                  {estStatus.prefix}{formatCurrency(estDiff)}
                </td>
                <td className="py-3 px-4 text-center">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${estStatus.badgeClass}`}>
                    {estStatus.label}
                  </span>
                </td>
              </tr>

              <tr className="bg-slate-50/70 font-semibold">
                <td className="py-3 px-4 text-slate-900">
                  ๒. ยอดจัดเก็บจริง / เบิกจ่ายจริง (Actual)
                </td>
                <td className="py-3 px-4 text-right font-mono text-emerald-700 font-bold">
                  {formatCurrency(totalRevAct)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-rose-700 font-bold">
                  {formatCurrency(totalExpAct)}
                </td>
                <td className={`py-3 px-4 text-right font-mono font-bold text-base ${actStatus.textClass}`}>
                  {actStatus.prefix}{formatCurrency(netActualBalance)}
                </td>
                <td className="py-3 px-4 text-center">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${actStatus.badgeClass}`}>
                    {actStatus.label}
                  </span>
                </td>
              </tr>

              <tr>
                <td className="py-3 px-4 font-semibold text-slate-800">
                  ๓. ยอดคงเหลือตามประมาณการ (Remaining)
                </td>
                <td className="py-3 px-4 text-right font-mono text-amber-700">
                  {formatCurrency(totalRevRem)} (ต้องจัดเก็บเพิ่ม)
                </td>
                <td className="py-3 px-4 text-right font-mono text-emerald-700">
                  {formatCurrency(totalExpRem)} (งบเหลือเบิกจ่าย)
                </td>
                <td className={`py-3 px-4 text-right font-mono font-bold ${remStatus.textClass}`}>
                  {remStatus.prefix}{formatCurrency(remDiff)}
                </td>
                <td className="py-3 px-4 text-center">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${remStatus.badgeClass}`}>
                    {remStatus.label}
                  </span>
                </td>
              </tr>

              <tr className="bg-slate-100 font-bold text-slate-900">
                <td className="py-3 px-4">
                  ๔. อัตราความก้าวหน้าเทียบประมาณการ (%)
                </td>
                <td className="py-3 px-4 text-right font-mono text-emerald-700 text-base">
                  {revPercent}%
                </td>
                <td className="py-3 px-4 text-right font-mono text-rose-700 text-base">
                  {expPercent}%
                </td>
                <td className={`py-3 px-4 text-right font-mono text-base ${pctStatus.textClass}`}>
                  {pctStatus.prefix}{pctDiff.toFixed(2)}%
                </td>
                <td className="py-3 px-4 text-center">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${pctStatus.badgeClass}`}>
                    {pctStatus.label}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
