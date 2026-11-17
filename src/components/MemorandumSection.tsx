import React, { useState, useId } from 'react';
import {
  Printer,
  FileDown,
  Edit3,
  CheckCircle,
  Save,
  Calendar,
  Clock
} from 'lucide-react';
import { MunicipalityData, UserSession, MemorandumData, FundProjectItem } from '../types/finance';
import { formatCurrency, formatThaiDate, bahtText, calcPercent, toThaiNumerals } from '../utils/formatters';
import { exportOfficialMemorandumWord } from '../services/docExportService';

interface MemorandumSectionProps {
  data: MunicipalityData;
  user: UserSession;
  onUpdateMemorandum: (memo: MemorandumData) => void;
}

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

function sanitizeDisplay(text?: string): string {
  if (!text) return '';
  const trimmed = text.trim();
  if (
    trimmed.includes('สุภาภรณ์') ||
    trimmed.includes('พงษ์ศักดิ์') ||
    trimmed.includes('นักวิชาการเงิน') ||
    trimmed.includes('นายกเทศมนตรีเมืองมหาสารคาม')
  ) {
    return '';
  }
  return trimmed;
}

function sanitizeComment(text?: string): string {
  if (!text) return '';
  const trimmed = text.trim();
  if (
    trimmed.includes('ได้ตรวจสอบความถูกต้อง') ||
    trimmed.includes('ทราบและอนุมัติ') ||
    trimmed.includes('เห็นควรเสนอพิจารณาอนุมัติ')
  ) {
    return '';
  }
  return trimmed;
}

export const MemorandumSection: React.FC<MemorandumSectionProps> = ({
  data,
  user,
  onUpdateMemorandum
}) => {
  const [memo, setMemo] = useState<MemorandumData>(() => {
    const raw = data.memorandum;
    return {
      ...raw,
      reporterName: sanitizeDisplay(raw?.reporterName),
      reporterPosition: sanitizeDisplay(raw?.reporterPosition),
      directorName: sanitizeDisplay(raw?.directorName),
      directorComment: sanitizeComment(raw?.directorComment),
      approverName: sanitizeDisplay(raw?.approverName),
      approverComment: sanitizeComment(raw?.approverComment),
      approverRoleLabel: raw?.approverRoleLabel?.replace(/\(นายกเทศมนตรีเมืองมหาสารคาม\)/g, '').trim() || 'ผู้มีอำนาจพิจารณาอนุมัติ'
    };
  });

  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [useThaiNumerals, setUseThaiNumerals] = useState(true);
  const dateInputId = useId();

  // Helper date parsing/selection
  const now = new Date();
  const [selectedDay, setSelectedDay] = useState<number>(now.getDate());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth());
  const [selectedYearBE, setSelectedYearBE] = useState<number>(now.getFullYear() + 543);

  const ap = data.accumulatedProof;
  const totalRevEst = data.revenueCategories.reduce((sum, c) => sum + c.estimate, 0);
  const totalRevAct = data.revenueCategories.reduce((sum, c) => sum + c.actual, 0);
  const totalExpEst = data.expenditureCategories.reduce((sum, c) => sum + c.estimate, 0);
  const totalExpAct = data.expenditureCategories.reduce((sum, c) => sum + c.actual, 0);
  const netBalance = totalRevAct - totalExpAct;

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

  const sumBudget = (items: FundProjectItem[] = []) => items.reduce((s, x) => s + (x.budget || 0), 0);
  const sumDisbursed = (items: FundProjectItem[] = []) => items.reduce((s, x) => s + (x.disbursed || 0), 0);

  const totalFundBudget =
    sumBudget(data.specialGrantProjects) +
    sumBudget(data.accumulatedFundProjects) +
    sumBudget(data.goodGovernanceProjects) +
    sumBudget(data.accruedExpenses) +
    sumBudget(data.externalSubsidies);

  const totalFundDisbursed =
    sumDisbursed(data.specialGrantProjects) +
    sumDisbursed(data.accumulatedFundProjects) +
    sumDisbursed(data.goodGovernanceProjects) +
    sumDisbursed(data.accruedExpenses) +
    sumDisbursed(data.externalSubsidies);

  const completedTasks = data.statusTasks.filter((t) => t.status === 'ดำเนินการเสร็จสิ้น').length;

  const applySelectedDate = (day: number, monthIdx: number, yearBE: number, isThaiDigits: boolean) => {
    setSelectedDay(day);
    setSelectedMonth(monthIdx);
    setSelectedYearBE(yearBE);
    const monthName = THAI_MONTHS[monthIdx];
    const rawStr = `${day} ${monthName} ${yearBE}`;
    const formatted = isThaiDigits ? toThaiNumerals(rawStr) : rawStr;
    setMemo((prev) => ({ ...prev, date: formatted }));
  };

  const handleIsoDateChange = (iso: string) => {
    if (!iso) return;
    const [y, m, d] = iso.split('-').map(Number);
    const beYear = y + 543;
    const mIdx = m - 1;
    applySelectedDate(d, mIdx, beYear, useThaiNumerals);
  };

  const handleSetToday = () => {
    const today = new Date();
    applySelectedDate(today.getDate(), today.getMonth(), today.getFullYear() + 543, useThaiNumerals);
  };

  const handleToggleNumeral = () => {
    const nextState = !useThaiNumerals;
    setUseThaiNumerals(nextState);
    applySelectedDate(selectedDay, selectedMonth, selectedYearBE, nextState);
  };

  const handleSave = () => {
    onUpdateMemorandum(memo);
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportWord = () => {
    exportOfficialMemorandumWord({ ...data, memorandum: memo });
  };

  const currentDateDisplay = memo.date || formatThaiDate(new Date());

  return (
    <div className="space-y-6">
      {/* Action Header Card (Hidden on Print) */}
      <div className="print:hidden bg-white rounded-2xl shadow-xs border border-slate-200/80 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-6 bg-blue-900 rounded-full"></span>
              <h2 className="text-xl font-bold text-slate-800 font-['Prompt']">
                บันทึกข้อความราชการ
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              แบบพิมพ์บันทึกข้อความราชการ เทศบาลเมืองมหาสารคาม รายงานสรุปผลการดำเนินงานครบทุกเมนูในระบบ
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Print button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-xs transition"
            >
              <Printer className="w-4 h-4 text-amber-300" />
              <span>สั่งพิมพ์ออกกระดาษ (A4)</span>
            </button>

            {/* Export Word button */}
            <button
              onClick={handleExportWord}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-semibold shadow-xs transition"
            >
              <FileDown className="w-4 h-4" />
              <span>บันทึกเป็น Word (.doc) ทันที</span>
            </button>

            {/* Edit / Save toggle - REMOVED text 'แก้ไขรายละเอียดบันทึก' as requested */}
            {(user.permissions.canEditDaily || user.permissions.canVerify) && (
              <button
                onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
                title={isEditing ? 'บันทึกข้อมูล' : 'แก้ไข'}
                aria-label={isEditing ? 'บันทึกข้อมูล' : 'แก้ไข'}
                className={`flex items-center justify-center p-2 rounded-xl text-xs font-semibold border transition ${
                  isEditing
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 px-3 gap-1.5'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                }`}
              >
                {isEditing ? (
                  <>
                    <Save className="w-4 h-4" />
                    <span>บันทึก</span>
                  </>
                ) : (
                  <Edit3 className="w-4 h-4 text-slate-700" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Date Selector Bar - REMOVED text 'เลือกวันเดือนปีของบันทึกข้อความ:' as requested */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-blue-900">
              <Calendar className="w-4 h-4 text-blue-700" />
            </div>

            {/* Day Selector */}
            <div className="flex items-center gap-1">
              <label htmlFor="select-day" className="text-xs text-slate-500">วัน:</label>
              <select
                id="select-day"
                value={selectedDay}
                onChange={(e) => applySelectedDate(Number(e.target.value), selectedMonth, selectedYearBE, useThaiNumerals)}
                className="text-xs border border-slate-300 rounded-lg px-2 py-1.5 bg-white font-medium text-slate-800 shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Month Selector */}
            <div className="flex items-center gap-1">
              <label htmlFor="select-month" className="text-xs text-slate-500">เดือน:</label>
              <select
                id="select-month"
                value={selectedMonth}
                onChange={(e) => applySelectedDate(selectedDay, Number(e.target.value), selectedYearBE, useThaiNumerals)}
                className="text-xs border border-slate-300 rounded-lg px-2 py-1.5 bg-white font-medium text-slate-800 shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                {THAI_MONTHS.map((m, idx) => (
                  <option key={m} value={idx}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Selector */}
            <div className="flex items-center gap-1">
              <label htmlFor="select-year" className="text-xs text-slate-500">พ.ศ.:</label>
              <select
                id="select-year"
                value={selectedYearBE}
                onChange={(e) => applySelectedDate(selectedDay, selectedMonth, Number(e.target.value), useThaiNumerals)}
                className="text-xs border border-slate-300 rounded-lg px-2 py-1.5 bg-white font-medium text-slate-800 shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                {[2565, 2566, 2567, 2568, 2569, 2570, 2571, 2572, 2573, 2574, 2575].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Native Calendar Picker Input */}
            <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
              <label htmlFor={dateInputId} className="text-xs text-slate-500">ปฏิทิน:</label>
              <input
                id={dateInputId}
                type="date"
                onChange={(e) => handleIsoDateChange(e.target.value)}
                className="text-xs border border-slate-300 rounded-lg px-2 py-1 bg-white text-slate-700 shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
              />
            </div>

            {/* Reset to Today button */}
            <button
              onClick={handleSetToday}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-slate-700 transition"
              title="ตั้งค่าเป็นวันปัจจุบัน"
            >
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>วันนี้</span>
            </button>
          </div>

          {/* Thai numeral toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">รูปแบบตัวเลขวันที่:</span>
            <button
              onClick={handleToggleNumeral}
              className="text-xs px-2.5 py-1 bg-white border border-slate-300 hover:border-blue-500 rounded-lg text-blue-900 font-semibold transition"
            >
              {useThaiNumerals ? 'เลขไทย (เช่น ๒ พฤศจิกายน ๒๕๖๙)' : 'เลขอารบิก (เช่น 2 พฤศจิกายน 2569)'}
            </button>
          </div>
        </div>

        {saveSuccess && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-2 text-emerald-800 text-xs">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>บันทึกข้อความราชการเรียบร้อยแล้ว</span>
          </div>
        )}
      </div>

      {/* Official Government Memorandum Document Layout (Formatted for A4 View & Print) */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-300 p-8 sm:p-12 max-w-4xl mx-auto font-['Sarabun'] print:p-0 print:shadow-none print:border-none print:max-w-none text-black">
        {/* Memo Header - NO Garuda / ไม่มีตราครุฑ */}
        <div className="border-b-2 border-black pb-4 mb-6 text-center">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-black tracking-wide font-['Prompt']">
            บันทึกข้อความ
          </h1>
        </div>

        {/* Agency Header Line */}
        <div className="space-y-2.5 text-sm sm:text-base border-b border-black pb-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center">
            <span className="font-bold min-w-[90px]">ส่วนราชการ:</span>
            {isEditing ? (
              <input
                type="text"
                value={memo.fromAgency}
                onChange={(e) => setMemo({ ...memo, fromAgency: e.target.value })}
                className="flex-1 px-2 py-1 border border-blue-400 rounded text-sm"
              />
            ) : (
              <span className="text-slate-900">{memo.fromAgency}</span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center flex-1">
              <span className="font-bold min-w-[40px]">ที่:</span>
              {isEditing ? (
                <input
                  type="text"
                  value={memo.docNumber}
                  onChange={(e) => setMemo({ ...memo, docNumber: e.target.value })}
                  className="flex-1 px-2 py-1 border border-blue-400 rounded text-sm"
                />
              ) : (
                <span className="text-slate-900">{memo.docNumber}</span>
              )}
            </div>

            {/* วันเดือนปีเลือกได้ */}
            <div className="flex items-center gap-2">
              <span className="font-bold min-w-[50px]">วันที่:</span>
              {isEditing ? (
                <input
                  type="text"
                  value={memo.date}
                  onChange={(e) => setMemo({ ...memo, date: e.target.value })}
                  className="px-2 py-1 border border-blue-400 rounded text-sm"
                />
              ) : (
                <span className="text-slate-900 font-semibold bg-amber-50/60 px-2 py-0.5 rounded border border-amber-200/50 print:border-none print:bg-transparent">
                  {currentDateDisplay}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center">
            <span className="font-bold min-w-[50px]">เรื่อง:</span>
            {isEditing ? (
              <input
                type="text"
                value={memo.subject}
                onChange={(e) => setMemo({ ...memo, subject: e.target.value })}
                className="flex-1 px-2 py-1 border border-blue-400 rounded text-sm font-semibold"
              />
            ) : (
              <span className="font-bold text-slate-900">{memo.subject}</span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center">
            <span className="font-bold min-w-[50px]">เรียน:</span>
            {isEditing ? (
              <input
                type="text"
                value={memo.toWhom}
                onChange={(e) => setMemo({ ...memo, toWhom: e.target.value })}
                className="flex-1 px-2 py-1 border border-blue-400 rounded text-sm"
              />
            ) : (
              <span className="text-slate-900">{memo.toWhom}</span>
            )}
          </div>
        </div>

        {/* Document Body - REPORTS ALL MENUS IN THE SYSTEM */}
        <div className="text-sm sm:text-base leading-relaxed space-y-4 text-justify">
          <p className="indent-12">
            ตามที่ฝ่ายการเงินและบัญชี และฝ่ายบริหารงานคลัง กองคลัง เทศบาลเมืองมหาสารคาม ได้ปฏิบัติหน้าที่เกี่ยวกับการจัดเก็บรายรับ การเบิกจ่ายงบประมาณ การบริหารเงินสะสม และการติดตามวินัยการเงินการคลัง ประจำปีงบประมาณ พ.ศ. ๒๕๗๐ นั้น ขอรายงานผลการดำเนินงานทางการเงินและงบประมาณครบทุกหมวดหมู่ ข้อมูล ณ วันที่ <strong>{currentDateDisplay}</strong> สรุปสาระสำคัญได้ดังนี้
          </p>

          {/* เมนู ๑. ภาพรวมเปรียบเทียบ รายงานหมวดรายรับ กับ รายงานหมวดรายจ่าย */}
          <div className="indent-6">
            <p>
              <strong>๑. สรุปภาพรวมเปรียบเทียบรายรับและรายจ่าย:</strong> ยอดประมาณการรายรับรวมตั้งไว้ <strong>{formatCurrency(totalRevEst)}</strong> บาท สามารถจัดเก็บได้จริงสะสม <strong>{formatCurrency(totalRevAct)}</strong> บาท ({bahtText(totalRevAct)}) คิดเป็นร้อยละ <strong>{calcPercent(totalRevAct, totalRevEst)}%</strong> ของประมาณการ สำหรับงบประมาณรายจ่ายตั้งไว้ <strong>{formatCurrency(totalExpEst)}</strong> บาท เบิกจ่ายจริงสะสม <strong>{formatCurrency(totalExpAct)}</strong> บาท ({bahtText(totalExpAct)}) คิดเป็นร้อยละ <strong>{calcPercent(totalExpAct, totalExpEst)}%</strong> ของงบประมาณรายจ่าย ส่งผลให้ดุลการเงินสะสม (รับจริง - จ่ายจริง){' '}
              <span className="font-bold underline">
                {netBalance >= 0 ? 'มีสถานะเกินดุล' : 'มีสถานะขาดดุล'} เป็นจำนวนเงิน {formatCurrency(Math.abs(netBalance))} บาท
              </span>{' '}
              ({bahtText(netBalance)})
            </p>
          </div>

          {/* ตารางเปรียบเทียบภาพรวม */}
          <div className="my-3 overflow-x-auto">
            <table className="w-full text-xs sm:text-sm border-collapse border border-black">
              <thead>
                <tr className="bg-slate-100 font-bold border-b border-black">
                  <th className="border border-black p-2 text-center">รายการ</th>
                  <th className="border border-black p-2 text-right">ประมาณการ (บาท)</th>
                  <th className="border border-black p-2 text-right">รับจริง / จ่ายจริง (บาท)</th>
                  <th className="border border-black p-2 text-right">คงเหลือ (บาท)</th>
                  <th className="border border-black p-2 text-center">ร้อยละ (%)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black p-2 font-bold">รวมหมวดรายรับทั้งหมด</td>
                  <td className="border border-black p-2 text-right font-mono">{formatCurrency(totalRevEst)}</td>
                  <td className="border border-black p-2 text-right font-mono font-bold">{formatCurrency(totalRevAct)}</td>
                  <td className="border border-black p-2 text-right font-mono">{formatCurrency(totalRevEst - totalRevAct)}</td>
                  <td className="border border-black p-2 text-center font-mono">{calcPercent(totalRevAct, totalRevEst)}%</td>
                </tr>
                <tr>
                  <td className="border border-black p-2 font-bold">รวมหมวดรายจ่ายทั้งหมด</td>
                  <td className="border border-black p-2 text-right font-mono">{formatCurrency(totalExpEst)}</td>
                  <td className="border border-black p-2 text-right font-mono font-bold">{formatCurrency(totalExpAct)}</td>
                  <td className="border border-black p-2 text-right font-mono">{formatCurrency(totalExpEst - totalExpAct)}</td>
                  <td className="border border-black p-2 text-center font-mono">{calcPercent(totalExpAct, totalExpEst)}%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* เมนู ๒. รายงานหมวดรายรับ (รวมหมวดรายได้จากทรัพย์สิน) */}
          <div className="indent-6">
            <p>
              <strong>๒. รายงานหมวดรายรับ:</strong> ผลการจัดเก็บรายรับจำแนกตามโครงสร้างหมวดรายรับเทศบาลเมืองมหาสารคาม (รวมหมวดรายได้จากทรัพย์สิน) มีรายละเอียดดังนี้
            </p>
          </div>
          <div className="my-3 overflow-x-auto">
            <table className="w-full text-xs sm:text-sm border-collapse border border-black">
              <thead>
                <tr className="bg-slate-100 font-bold border-b border-black">
                  <th className="border border-black p-2 text-center w-12">ลำดับ</th>
                  <th className="border border-black p-2 text-left">หมวดรายรับ</th>
                  <th className="border border-black p-2 text-right">ประมาณการ (บาท)</th>
                  <th className="border border-black p-2 text-right">รับจริง (บาท)</th>
                  <th className="border border-black p-2 text-right">คงเหลือ (บาท)</th>
                  <th className="border border-black p-2 text-center">ร้อยละ (%)</th>
                </tr>
              </thead>
              <tbody>
                {data.revenueCategories.map((c, idx) => (
                  <tr key={c.id}>
                    <td className="border border-black p-1.5 text-center font-mono">{idx + 1}</td>
                    <td className="border border-black p-1.5">{c.name}</td>
                    <td className="border border-black p-1.5 text-right font-mono">{formatCurrency(c.estimate)}</td>
                    <td className="border border-black p-1.5 text-right font-mono font-bold">{formatCurrency(c.actual)}</td>
                    <td className="border border-black p-1.5 text-right font-mono">{formatCurrency(c.estimate - c.actual)}</td>
                    <td className="border border-black p-1.5 text-center font-mono">{calcPercent(c.actual, c.estimate)}%</td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-bold">
                  <td className="border border-black p-2 text-center" colSpan={2}>รวมหมวดรายรับทั้งหมด</td>
                  <td className="border border-black p-2 text-right font-mono">{formatCurrency(totalRevEst)}</td>
                  <td className="border border-black p-2 text-right font-mono">{formatCurrency(totalRevAct)}</td>
                  <td className="border border-black p-2 text-right font-mono">{formatCurrency(totalRevEst - totalRevAct)}</td>
                  <td className="border border-black p-2 text-center font-mono">{calcPercent(totalRevAct, totalRevEst)}%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* เมนู ๓. รายงานหมวดรายจ่าย */}
          <div className="indent-6">
            <p>
              <strong>๓. รายงานหมวดรายจ่าย:</strong> การเบิกจ่ายงบประมาณจำแนกตามกลุ่มงบรายจ่ายหลัก รวมถึง <strong>งบกลาง (ข้อ 3.1–3.6)</strong> และ <strong>งบเงินอุดหนุน (ข้อ 5.1–5.4)</strong> มีรายละเอียดดังนี้
            </p>
          </div>
          <div className="my-3 overflow-x-auto">
            <table className="w-full text-xs sm:text-sm border-collapse border border-black">
              <thead>
                <tr className="bg-slate-100 font-bold border-b border-black">
                  <th className="border border-black p-2 text-center w-12">ลำดับ</th>
                  <th className="border border-black p-2 text-left">หมวดรายจ่าย</th>
                  <th className="border border-black p-2 text-right">งบประมาณตั้งไว้ (บาท)</th>
                  <th className="border border-black p-2 text-right">เบิกจ่ายจริง (บาท)</th>
                  <th className="border border-black p-2 text-right">คงเหลือ (บาท)</th>
                  <th className="border border-black p-2 text-center">ร้อยละ (%)</th>
                </tr>
              </thead>
              <tbody>
                {data.expenditureCategories.map((c, idx) => (
                  <tr key={c.id}>
                    <td className="border border-black p-1.5 text-center font-mono">{idx + 1}</td>
                    <td className="border border-black p-1.5">
                      <span className="font-semibold">{c.name}</span>
                      {c.name.includes('งบกลาง') && (
                        <span className="block text-[11px] text-slate-600 mt-0.5">
                          (ครอบคลุม: 3.1 หนี้เงินกู้ 3.2 กองทุนประกันสังคม 3.3 เบี้ยยังชีพ 3.4 เงินสำรองจ่าย 3.5 ข้อผูกพัน 3.6 เงินช่วยพิเศษ)
                        </span>
                      )}
                      {c.name.includes('งบเงินอุดหนุน') && (
                        <span className="block text-[11px] text-slate-600 mt-0.5">
                          (ครอบคลุม: 5.1 ส่วนราชการ 5.2 รัฐวิสาหกิจ 5.3 องค์กรประชาชน 5.4 องค์กรศาสนา)
                        </span>
                      )}
                    </td>
                    <td className="border border-black p-1.5 text-right font-mono">{formatCurrency(c.estimate)}</td>
                    <td className="border border-black p-1.5 text-right font-mono font-bold">{formatCurrency(c.actual)}</td>
                    <td className="border border-black p-1.5 text-right font-mono">{formatCurrency(c.estimate - c.actual)}</td>
                    <td className="border border-black p-1.5 text-center font-mono">{calcPercent(c.actual, c.estimate)}%</td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-bold">
                  <td className="border border-black p-2 text-center" colSpan={2}>รวมหมวดรายจ่ายทั้งหมด</td>
                  <td className="border border-black p-2 text-right font-mono">{formatCurrency(totalExpEst)}</td>
                  <td className="border border-black p-2 text-right font-mono">{formatCurrency(totalExpAct)}</td>
                  <td className="border border-black p-2 text-right font-mono">{formatCurrency(totalExpEst - totalExpAct)}</td>
                  <td className="border border-black p-2 text-center font-mono">{calcPercent(totalExpAct, totalExpEst)}%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* เมนู ๔. รายงานการพิสูจน์ยอดเงินสะสม */}
          <div className="indent-6">
            <p>
              <strong>๔. รายงานการพิสูจน์ยอดเงินสะสม:</strong> คำนวณตามระเบียบกระทรวงมหาดไทยว่าด้วยการรับเงิน การเบิกจ่ายเงิน การฝากเงิน การเก็บรักษาเงิน และการตรวจเงินขององค์กรปกครองส่วนท้องถิ่น ยอดเงินสะสมในบัญชีเงินฝากธนาคาร ณ วันที่ ๓๐ กันยายน ๒๕๖๙ มีจำนวน <strong>{formatCurrency(ap.bankBalanceSept30)}</strong> บาท และเมื่อหักเงินสำรองและภาระผูกพันตามกฎหมายแล้ว สรุปสถานะได้ดังนี้
            </p>
          </div>
          <div className="my-3 overflow-x-auto">
            <table className="w-full text-xs sm:text-sm border-collapse border border-black">
              <thead>
                <tr className="bg-slate-100 font-bold border-b border-black">
                  <th className="border border-black p-2 text-center w-12">ลำดับ</th>
                  <th className="border border-black p-2 text-left">รายการตามระเบียบกระทรวงมหาดไทย</th>
                  <th className="border border-black p-2 text-right">จำนวนเงิน (บาท)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black p-1.5 text-center font-mono">1</td>
                  <td className="border border-black p-1.5">เงินสะสมบัญชีเงินฝากธนาคาร 30 กันยายน 2569</td>
                  <td className="border border-black p-1.5 text-right font-mono">{formatCurrency(ap.bankBalanceSept30)}</td>
                </tr>
                <tr>
                  <td className="border border-black p-1.5 text-center font-mono">2</td>
                  <td className="border border-black p-1.5">หัก เงินสมทบกองทุนส่งเสริมกิจการขององค์กรปกครองส่วนท้องถิ่น (ก.ส.ท.)</td>
                  <td className="border border-black p-1.5 text-right font-mono text-rose-700">-{formatCurrency(ap.deductLocalFund)}</td>
                </tr>
                <tr>
                  <td className="border border-black p-1.5 text-center font-mono">3</td>
                  <td className="border border-black p-1.5">หัก ค่าใช้จ่ายด้านบุคลากรไม่น้อยกว่า 3 เดือน</td>
                  <td className="border border-black p-1.5 text-right font-mono text-rose-700">-{formatCurrency(ap.deductPersonnel3Months)}</td>
                </tr>
                <tr>
                  <td className="border border-black p-1.5 text-center font-mono">4</td>
                  <td className="border border-black p-1.5">หัก ร้อยละ 15 ของงบประมาณรายจ่ายประจำปี</td>
                  <td className="border border-black p-1.5 text-right font-mono text-rose-700">-{formatCurrency(ap.deductFifteenPercentExpense)}</td>
                </tr>
                <tr>
                  <td className="border border-black p-1.5 text-center font-mono">5</td>
                  <td className="border border-black p-1.5">หัก เงินสะสมคงเหลือขั้นต่ำตามระเบียบฯ</td>
                  <td className="border border-black p-1.5 text-right font-mono text-rose-700">-{formatCurrency(ap.deductStatutoryReserve)}</td>
                </tr>
                <tr>
                  <td className="border border-black p-1.5 text-center font-mono">6</td>
                  <td className="border border-black p-1.5">หัก เงินสะสมที่ได้รับอนุมัติแล้ว ในปีปัจจุบัน</td>
                  <td className="border border-black p-1.5 text-right font-mono text-rose-700">-{formatCurrency(ap.deductCurrentYearApproved)}</td>
                </tr>
                <tr>
                  <td className="border border-black p-1.5 text-center font-mono">7</td>
                  <td className="border border-black p-1.5">หัก ถอนคืนเงินได้รับข้ามปีงบประมาณ</td>
                  <td className="border border-black p-1.5 text-right font-mono text-rose-700">-{formatCurrency(ap.deductCrossYearRefund)}</td>
                </tr>
                <tr>
                  <td className="border border-black p-1.5 text-center font-mono">8</td>
                  <td className="border border-black p-1.5">บวก เงินสะสมที่เหลือจากการอนุมัติหลังจากก่อหนี้ผูกพัน</td>
                  <td className="border border-black p-1.5 text-right font-mono text-emerald-700">+{formatCurrency(ap.addApprovedObligationRemaining)}</td>
                </tr>
                <tr>
                  <td className="border border-black p-1.5 text-center font-mono">9</td>
                  <td className="border border-black p-1.5">บวก รับคืนเงินรายจ่าย/รับรายได้ข้ามปีงบประมาณ</td>
                  <td className="border border-black p-1.5 text-right font-mono text-emerald-700">+{formatCurrency(ap.addCrossYearRevenueReturn)}</td>
                </tr>
                <tr className="bg-amber-50/70 font-bold">
                  <td className="border border-black p-2 text-center" colSpan={2}>
                    คงเหลือเงินสะสมที่สามารถนำไปใช้ได้ ณ ปัจจุบัน (คำนวณอัตโนมัติตามระเบียบฯ)
                  </td>
                  <td className="border border-black p-2 text-right font-mono text-blue-950 font-extrabold text-sm sm:text-base">
                    {formatCurrency(usableAccFund)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* เมนู ๕. งบประมาณและโครงการ (๕ หมวดโครงการ) */}
          <div className="indent-6">
            <p>
              <strong>๕. งบประมาณและโครงการ (๕ หมวดโครงการ):</strong> สรุปผลการดำเนินงานและการเบิกจ่ายเงินงบประมาณโครงการพิเศษและเงินนอกงบประมาณ ดังนี้
            </p>
          </div>
          <div className="my-3 overflow-x-auto">
            <table className="w-full text-xs sm:text-sm border-collapse border border-black">
              <thead>
                <tr className="bg-slate-100 font-bold border-b border-black">
                  <th className="border border-black p-2 text-center w-12">ลำดับ</th>
                  <th className="border border-black p-2 text-left">กลุ่มโครงการ/หมวดงบ</th>
                  <th className="border border-black p-2 text-center">จำนวนโครงการ</th>
                  <th className="border border-black p-2 text-right">งบประมาณ (บาท)</th>
                  <th className="border border-black p-2 text-right">เบิกจ่ายสะสม (บาท)</th>
                  <th className="border border-black p-2 text-right">คงเหลือ (บาท)</th>
                  <th className="border border-black p-2 text-center">ร้อยละ (%)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'เงินอุดหนุนระบุวัตถุประสงค์เฉพาะกิจ', items: data.specialGrantProjects },
                  { name: 'เงินสะสมโครงการ', items: data.accumulatedFundProjects },
                  { name: 'เงินรางวัลการบริหารจัดการที่ดี', items: data.goodGovernanceProjects },
                  { name: 'ค่าใช้จ่ายค้างจ่าย', items: data.accruedExpenses },
                  { name: 'เงินอุดหนุนจากหน่วยงานอื่น', items: data.externalSubsidies }
                ].map((cat, idx) => {
                  const b = sumBudget(cat.items);
                  const d = sumDisbursed(cat.items);
                  return (
                    <tr key={idx}>
                      <td className="border border-black p-1.5 text-center font-mono">{idx + 1}</td>
                      <td className="border border-black p-1.5">{cat.name}</td>
                      <td className="border border-black p-1.5 text-center font-mono">{cat.items.length} รายการ</td>
                      <td className="border border-black p-1.5 text-right font-mono">{formatCurrency(b)}</td>
                      <td className="border border-black p-1.5 text-right font-mono font-bold">{formatCurrency(d)}</td>
                      <td className="border border-black p-1.5 text-right font-mono">{formatCurrency(b - d)}</td>
                      <td className="border border-black p-1.5 text-center font-mono">{calcPercent(d, b)}%</td>
                    </tr>
                  );
                })}
                <tr className="bg-slate-50 font-bold">
                  <td className="border border-black p-2 text-center" colSpan={2}>รวมงบประมาณโครงการทุกหมวด</td>
                  <td className="border border-black p-2 text-center font-mono">
                    {data.specialGrantProjects.length +
                      data.accumulatedFundProjects.length +
                      data.goodGovernanceProjects.length +
                      data.accruedExpenses.length +
                      data.externalSubsidies.length}{' '}
                    รายการ
                  </td>
                  <td className="border border-black p-2 text-right font-mono">{formatCurrency(totalFundBudget)}</td>
                  <td className="border border-black p-2 text-right font-mono">{formatCurrency(totalFundDisbursed)}</td>
                  <td className="border border-black p-2 text-right font-mono">{formatCurrency(totalFundBudget - totalFundDisbursed)}</td>
                  <td className="border border-black p-2 text-center font-mono">{calcPercent(totalFundDisbursed, totalFundBudget)}%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* เมนู ๖. รายงานและติดตามงานการคลัง */}
          <div className="indent-6">
            <p>
              <strong>๖. รายงานและติดตามงานการคลัง:</strong> การปฏิบัติภารกิจและการจัดทำรายงานตามรอบระยะเวลา มีภารกิจทั้งสิ้น <strong>{data.statusTasks.length}</strong> ภารกิจ ดำเนินการเสร็จสิ้นแล้ว <strong>{completedTasks}</strong> ภารกิจ อยู่ระหว่างดำเนินการ <strong>{data.statusTasks.length - completedTasks}</strong> ภารกิจ โดยได้ส่งรายงานงบการเงินและรายงานสถานะทางการเงินให้ผู้บริหารและหน่วยงานกำกับดูแลตามระยะเวลาที่กำหนด
            </p>
          </div>

          <p className="indent-12 mt-6">
            จึงเรียนมาเพื่อโปรดทราบและพิจารณาอนุมัติ
          </p>
        </div>

        {/* Signature Blocks 3 Positions (Official Clean Standard Template) */}
        <div className="mt-12 pt-6 border-t-2 border-black grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm">
          {/* 1. ผู้รายงาน */}
          <div className="border border-slate-400 p-4 rounded-lg bg-slate-50/50 flex flex-col justify-between text-center min-h-[220px]">
            <div>
              <div className="font-bold text-slate-900 mb-1">
                ๑. {memo.reporterRoleLabel?.replace(/\s*\(?เจ้าหน้าที่ฝ่ายการเงินและบัญชี\)?/g, '').trim() || 'ผู้รายงาน'}
              </div>
              <p className="text-[11px] text-slate-500 mb-6">ผู้จัดทำและรวบรวมรายงาน</p>
            </div>

            <div className="space-y-1">
              <div className="text-slate-400">ลงชื่อ...................................................</div>
              <div className="font-semibold text-slate-800">
                {isEditing ? (
                  <input
                    type="text"
                    value={sanitizeDisplay(memo.reporterName)}
                    placeholder="(ลงชื่อผู้รายงาน)"
                    onChange={(e) => setMemo({ ...memo, reporterName: e.target.value })}
                    className="w-full text-center px-1 border rounded text-xs"
                  />
                ) : (
                  `(${sanitizeDisplay(memo.reporterName) || '...................................................'})`
                )}
              </div>
              <div className="text-xs text-slate-600">
                {isEditing ? (
                  <input
                    type="text"
                    value={sanitizeDisplay(memo.reporterPosition)}
                    placeholder="ตำแหน่ง"
                    onChange={(e) => setMemo({ ...memo, reporterPosition: e.target.value })}
                    className="w-full text-center px-1 border rounded text-xs"
                  />
                ) : (
                  sanitizeDisplay(memo.reporterPosition)
                    ? `ตำแหน่ง ${sanitizeDisplay(memo.reporterPosition)}`
                    : 'ตำแหน่ง...................................................'
                )}
              </div>
              <div className="text-[11px] text-slate-500">
                วันที่ ......./......./.......
              </div>
            </div>
          </div>

          {/* 2. ผู้ตรวจสอบ */}
          <div className="border border-slate-400 p-4 rounded-lg bg-slate-50/50 flex flex-col justify-between text-center min-h-[220px]">
            <div>
              <div className="font-bold text-slate-900 mb-1">
                ๒. {memo.directorRoleLabel || 'ผู้ตรวจสอบ (ผู้อำนวยการกองคลัง)'}
              </div>
              <div className="text-left text-[11px] bg-white p-2.5 rounded border border-slate-300 mb-3 text-slate-700 min-h-[64px]">
                <span className="font-bold">ความเห็น: </span>
                {isEditing ? (
                  <textarea
                    rows={2}
                    value={sanitizeComment(memo.directorComment)}
                    placeholder="ระบุความเห็นของผู้อำนวยการกองคลัง..."
                    onChange={(e) => setMemo({ ...memo, directorComment: e.target.value })}
                    className="w-full p-1 border rounded text-xs resize-none"
                  />
                ) : (
                  sanitizeComment(memo.directorComment) || (
                    <div className="text-slate-400 mt-1 space-y-1">
                      <div>....................................................................................</div>
                      <div>....................................................................................</div>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-slate-400">ลงชื่อ...................................................</div>
              <div className="font-semibold text-slate-800">
                {isEditing ? (
                  <input
                    type="text"
                    value={sanitizeDisplay(memo.directorName)}
                    placeholder="(ลงชื่อผู้ตรวจสอบ)"
                    onChange={(e) => setMemo({ ...memo, directorName: e.target.value })}
                    className="w-full text-center px-1 border rounded text-xs"
                  />
                ) : (
                  `(${sanitizeDisplay(memo.directorName) || '...................................................'})`
                )}
              </div>
              <div className="text-xs text-slate-600">
                {isEditing ? (
                  <input
                    type="text"
                    value={sanitizeDisplay(memo.directorPosition) || 'ผู้อำนวยการกองคลัง'}
                    onChange={(e) => setMemo({ ...memo, directorPosition: e.target.value })}
                    className="w-full text-center px-1 border rounded text-xs"
                  />
                ) : (
                  sanitizeDisplay(memo.directorPosition)
                    ? `ตำแหน่ง ${sanitizeDisplay(memo.directorPosition)}`
                    : 'ตำแหน่ง ผู้อำนวยการกองคลัง'
                )}
              </div>
              <div className="text-[11px] text-slate-500">
                วันที่ ......./......./.......
              </div>
            </div>
          </div>

          {/* 3. ผู้มีอำนาจพิจารณาอนุมัติ */}
          <div className="border border-slate-400 p-4 rounded-lg bg-slate-50/50 flex flex-col justify-between text-center min-h-[220px]">
            <div>
              <div className="font-bold text-slate-900 mb-1">
                ๓. ผู้มีอำนาจพิจารณาอนุมัติ
              </div>
              <div className="text-left text-[11px] bg-white p-2.5 rounded border border-slate-300 mb-3 text-slate-700 min-h-[64px]">
                <div className="text-slate-700 font-medium flex items-center gap-2.5 mb-1 flex-wrap">
                  <span>คำสั่ง:</span>
                  <label className="inline-flex items-center gap-1 cursor-pointer">
                    <input type="checkbox" className="rounded text-blue-600 w-3.5 h-3.5" />
                    <span>ทราบ</span>
                  </label>
                  <label className="inline-flex items-center gap-1 cursor-pointer">
                    <input type="checkbox" className="rounded text-blue-600 w-3.5 h-3.5" />
                    <span>อนุมัติ</span>
                  </label>
                  <label className="inline-flex items-center gap-1 cursor-pointer">
                    <input type="checkbox" className="rounded text-blue-600 w-3.5 h-3.5" />
                    <span>อื่นๆ</span>
                  </label>
                </div>
                {isEditing ? (
                  <textarea
                    rows={2}
                    value={sanitizeComment(memo.approverComment)}
                    placeholder="ข้อสั่งการหรือความเห็นเพิ่มเติม..."
                    onChange={(e) => setMemo({ ...memo, approverComment: e.target.value })}
                    className="w-full p-1 border rounded text-xs resize-none"
                  />
                ) : (
                  sanitizeComment(memo.approverComment) ? (
                    <div>{sanitizeComment(memo.approverComment)}</div>
                  ) : (
                    <div className="text-slate-400 space-y-1">
                      <div>....................................................................................</div>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-slate-400">ลงชื่อ...................................................</div>
              <div className="font-semibold text-slate-800">
                {isEditing ? (
                  <input
                    type="text"
                    value={sanitizeDisplay(memo.approverName)}
                    placeholder="(ลงชื่อผู้มีอำนาจอนุมัติ)"
                    onChange={(e) => setMemo({ ...memo, approverName: e.target.value })}
                    className="w-full text-center px-1 border rounded text-xs"
                  />
                ) : (
                  `(${sanitizeDisplay(memo.approverName) || '...................................................'})`
                )}
              </div>
              <div className="text-xs text-slate-600">
                {isEditing ? (
                  <input
                    type="text"
                    value={sanitizeDisplay(memo.approverPosition)}
                    placeholder="ตำแหน่ง"
                    onChange={(e) => setMemo({ ...memo, approverPosition: e.target.value })}
                    className="w-full text-center px-1 border rounded text-xs"
                  />
                ) : (
                  sanitizeDisplay(memo.approverPosition)
                    ? `ตำแหน่ง ${sanitizeDisplay(memo.approverPosition)}`
                    : 'ตำแหน่ง...................................................'
                )}
              </div>
              <div className="text-[11px] text-slate-500">
                วันที่ ......./......./.......
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
