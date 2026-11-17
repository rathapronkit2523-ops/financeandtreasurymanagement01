import React, { useState } from 'react';
import {
  Calculator,
  Save,
  Download,
  Calendar,
  CheckCircle,
  HelpCircle,
  MinusCircle,
  PlusCircle,
  Coins
} from 'lucide-react';
import { AccumulatedProof, UserSession } from '../types/finance';
import { formatCurrency, formatThaiDate, bahtText } from '../utils/formatters';
import { exportSingleCategory } from '../services/excelService';

interface AccumulatedFundProofProps {
  proof: AccumulatedProof;
  user: UserSession;
  onSave: (updated: AccumulatedProof) => void;
}

export const AccumulatedFundProofSection: React.FC<AccumulatedFundProofProps> = ({
  proof,
  user,
  onSave
}) => {
  const [formData, setFormData] = useState<AccumulatedProof>({ ...proof });
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleChange = (field: keyof AccumulatedProof, value: string) => {
    if (field === 'recordDate' || field === 'notes') {
      setFormData(prev => ({ ...prev, [field]: value }));
    } else {
      const num = parseFloat(value) || 0;
      setFormData(prev => ({ ...prev, [field]: num }));
    }
  };

  // Formula exact match to user requirement:
  // เงินสะสมบัญชีเงินฝากธนาคาร 30 กันยายน 2569
  // ลบ เงินสมทบกองทุนส่งเสริมกิจการขององค์กรปกครองส่วนท้องถิ่น
  // ลบ ค่าใช้จ่ายด้านบุคลากรไม่น้อยกว่า 3 เดือน
  // ลบ ร้อยละ 15 ของงบประมาณรายจ่ายประจำปี
  // ลบ เงินสะสมคงเหลือขั้นต่ำตามระเบียบฯ
  // ลบ เงินสะสมที่ได้รับอนุมัติแล้ว ในปีปัจจุบัน
  // ลบ ถอนคืนเงินได้รับข้ามปีงบประมาณ
  // บวก เงินสะสมที่เหลือจากการอนุมัติหลังจากก่อหนี้ผูกพัน
  // บวก รับคืนเงินรายจ่าย/รับรายได้ข้ามปีงบประมาณ
  const usableBalance =
    (formData.bankBalanceSept30 || 0) -
    (formData.deductLocalFund || 0) -
    (formData.deductPersonnel3Months || 0) -
    (formData.deductFifteenPercentExpense || 0) -
    (formData.deductStatutoryReserve || 0) -
    (formData.deductCurrentYearApproved || 0) -
    (formData.deductCrossYearRefund || 0) +
    (formData.addApprovedObligationRemaining || 0) +
    (formData.addCrossYearRevenueReturn || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleExportExcel = () => {
    const rows = [
      { 'ลำดับ': '1', 'รายการพิสูจน์ยอด': 'เงินสะสมบัญชีเงินฝากธนาคาร 30 กันยายน 2569', 'การคำนวณ': 'ยอดตั้งต้น', 'จำนวนเงิน (บาท)': formData.bankBalanceSept30 },
      { 'ลำดับ': '2', 'รายการพิสูจน์ยอด': 'เงินสมทบกองทุนส่งเสริมกิจการขององค์กรปกครองส่วนท้องถิ่น', 'การคำนวณ': '[-] หัก', 'จำนวนเงิน (บาท)': formData.deductLocalFund },
      { 'ลำดับ': '3', 'รายการพิสูจน์ยอด': 'ค่าใช้จ่ายด้านบุคลากรไม่น้อยกว่า 3 เดือน', 'การคำนวณ': '[-] หัก', 'จำนวนเงิน (บาท)': formData.deductPersonnel3Months },
      { 'ลำดับ': '4', 'รายการพิสูจน์ยอด': 'ร้อยละ 15 ของงบประมาณรายจ่ายประจำปี', 'การคำนวณ': '[-] หัก', 'จำนวนเงิน (บาท)': formData.deductFifteenPercentExpense },
      { 'ลำดับ': '5', 'รายการพิสูจน์ยอด': 'เงินสะสมคงเหลือขั้นต่ำตามระเบียบฯ', 'การคำนวณ': '[-] หัก', 'จำนวนเงิน (บาท)': formData.deductStatutoryReserve },
      { 'ลำดับ': '6', 'รายการพิสูจน์ยอด': 'เงินสะสมที่ได้รับอนุมัติแล้ว ในปีปัจจุบัน', 'การคำนวณ': '[-] หัก', 'จำนวนเงิน (บาท)': formData.deductCurrentYearApproved },
      { 'ลำดับ': '7', 'รายการพิสูจน์ยอด': 'ถอนคืนเงินได้รับข้ามปีงบประมาณ', 'การคำนวณ': '[-] หัก', 'จำนวนเงิน (บาท)': formData.deductCrossYearRefund },
      { 'ลำดับ': '8', 'รายการพิสูจน์ยอด': 'เงินสะสมที่เหลือจากการอนุมัติหลังจากก่อหนี้ผูกพัน', 'การคำนวณ': '[+] บวก', 'จำนวนเงิน (บาท)': formData.addApprovedObligationRemaining },
      { 'ลำดับ': '9', 'รายการพิสูจน์ยอด': 'รับคืนเงินรายจ่าย/รับรายได้ข้ามปีงบประมาณ', 'การคำนวณ': '[+] บวก', 'จำนวนเงิน (บาท)': formData.addCrossYearRevenueReturn },
      { 'ลำดับ': '10', 'รายการพิสูจน์ยอด': 'คงเหลือเงินสะสมที่สามารถนำไปใช้ได้ ณ ปัจจุบัน (คำนวณอัตโนมัติ)', 'การคำนวณ': '[=] สุทธิ', 'จำนวนเงิน (บาท)': usableBalance },
    ];
    exportSingleCategory('พิสูจน์ยอดเงินสะสม_2570', rows, 'รายงานพิสูจน์ยอดเงินสะสม_เทศบาลเมืองมหาสารคาม_2570');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-6 bg-amber-500 rounded-full"></span>
              <h2 className="text-xl font-bold text-slate-800 font-['Prompt']">
                รายงานการพิสูจน์ยอดเงินสะสม
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              กองคลัง เทศบาลเมืองมหาสารคาม • ประจำปีงบประมาณ พ.ศ. 2570
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Show Current Date (โชว์วันที่ปัจจุบัน) */}
            <div className="flex items-center gap-2 px-3.5 py-2 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl text-xs font-semibold shadow-xs">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span>วันที่ปัจจุบัน: {formatThaiDate(new Date())}</span>
            </div>

            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-300 transition"
            >
              <Download className="w-4 h-4 text-amber-600" />
              <span>ส่งออก Excel</span>
            </button>
          </div>
        </div>

        {/* Highlight Result Card */}
        <div className="mt-6 bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute right-4 -bottom-6 opacity-15 pointer-events-none">
            <Coins className="w-48 h-48" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-amber-100 bg-amber-700/40 px-2.5 py-1 rounded-md">
                ผลการคำนวณอัตโนมัติ (Auto-Calculated)
              </span>
              <h3 className="text-lg md:text-xl font-bold font-['Prompt'] mt-2 text-white">
                คงเหลือเงินสะสมที่สามารถนำไปใช้ได้ ณ ปัจจุบัน
              </h3>
              <p className="text-xs text-amber-100 mt-1">
                ({bahtText(usableBalance)})
              </p>
            </div>

            <div className="text-right">
              <div className="text-3xl md:text-4xl font-extrabold font-mono tracking-tight text-white drop-shadow-sm">
                {formatCurrency(usableBalance)}
              </div>
              <span className="text-xs font-semibold text-amber-100 mt-1 block">
                หน่วย: บาท (THB)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Proof Calculation Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-800 font-['Prompt']">
              ตารางกรอกข้อมูลและคำนวณสูตรพิสูจน์ยอดเงินสะสม
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            อ้างอิงระเบียบกระทรวงมหาดไทยว่าด้วยการรับเงิน การเบิกจ่ายเงินฯ
          </span>
        </div>

        <div className="p-6 space-y-4">
          {saveSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-2 text-emerald-800 text-sm">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <span>บันทึกข้อมูลพิสูจน์ยอดเงินสะสมลงฐานข้อมูลเรียบร้อยแล้ว</span>
            </div>
          )}

          {/* Table of items */}
          <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-200">
            {/* 1. Base amount: เงินสะสมบัญชีเงินฝากธนาคาร 30 กันยายน 2569 */}
            <div className="p-4 bg-blue-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <label className="text-sm font-bold text-slate-800">
                    เงินสะสมบัญชีเงินฝากธนาคาร 30 กันยายน 2569
                  </label>
                  <p className="text-xs text-slate-500">ยอดเงินสะสมยกมาต้นปีงบประมาณตามบัญชีเงินฝาก</p>
                </div>
              </div>
              <div className="w-full md:w-64">
                <input
                  type="number"
                  step="0.01"
                  value={formData.bankBalanceSept30}
                  disabled={!user.permissions.canEditDaily}
                  onChange={(e) => handleChange('bankBalanceSept30', e.target.value)}
                  className="w-full text-right font-mono font-bold px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:bg-slate-100"
                />
              </div>
            </div>

            {/* 2. ลบ เงินสมทบกองทุนส่งเสริมกิจการขององค์กรปกครองส่วนท้องถิ่น */}
            <div className="p-4 hover:bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  -
                </span>
                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    โดยลบ: เงินสมทบกองทุนส่งเสริมกิจการขององค์กรปกครองส่วนท้องถิ่น
                  </label>
                  <p className="text-xs text-slate-400">เงินสมทบ ก.ส.ท. ตามระเบียบ</p>
                </div>
              </div>
              <div className="w-full md:w-64">
                <input
                  type="number"
                  step="0.01"
                  value={formData.deductLocalFund}
                  disabled={!user.permissions.canEditDaily}
                  onChange={(e) => handleChange('deductLocalFund', e.target.value)}
                  className="w-full text-right font-mono px-3 py-2 bg-white border border-slate-300 rounded-lg text-rose-700 text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none disabled:bg-slate-100"
                />
              </div>
            </div>

            {/* 3. ลบ ค่าใช้จ่ายด้านบุคลากรไม่น้อยกว่า 3 เดือน */}
            <div className="p-4 hover:bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  -
                </span>
                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    โดยลบ: ค่าใช้จ่ายด้านบุคลากรไม่น้อยกว่า 3 เดือน
                  </label>
                  <p className="text-xs text-slate-400">สำรองเงินเดือน ค่าจ้าง และประโยชน์ตอบแทนอื่นไม่น้อยกว่า 3 เดือน</p>
                </div>
              </div>
              <div className="w-full md:w-64">
                <input
                  type="number"
                  step="0.01"
                  value={formData.deductPersonnel3Months}
                  disabled={!user.permissions.canEditDaily}
                  onChange={(e) => handleChange('deductPersonnel3Months', e.target.value)}
                  className="w-full text-right font-mono px-3 py-2 bg-white border border-slate-300 rounded-lg text-rose-700 text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none disabled:bg-slate-100"
                />
              </div>
            </div>

            {/* 4. ลบ ร้อยละ 15 ของงบประมาณรายจ่ายประจำปี */}
            <div className="p-4 hover:bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  -
                </span>
                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    โดยลบ: ร้อยละ 15 ของงบประมาณรายจ่ายประจำปี
                  </label>
                  <p className="text-xs text-slate-400">สำรองสำหรับกรณีฉุกเฉินและสาธารณภัย</p>
                </div>
              </div>
              <div className="w-full md:w-64">
                <input
                  type="number"
                  step="0.01"
                  value={formData.deductFifteenPercentExpense}
                  disabled={!user.permissions.canEditDaily}
                  onChange={(e) => handleChange('deductFifteenPercentExpense', e.target.value)}
                  className="w-full text-right font-mono px-3 py-2 bg-white border border-slate-300 rounded-lg text-rose-700 text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none disabled:bg-slate-100"
                />
              </div>
            </div>

            {/* 5. ลบ เงินสะสมคงเหลือขั้นต่ำตามระเบียบฯ */}
            <div className="p-4 hover:bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  -
                </span>
                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    โดยลบ: เงินสะสมคงเหลือขั้นต่ำตามระเบียบฯ
                  </label>
                  <p className="text-xs text-slate-400">กันไว้เป็นเงินสะสมคงเหลือขั้นต่ำตามระเบียบกระทรวงมหาดไทย</p>
                </div>
              </div>
              <div className="w-full md:w-64">
                <input
                  type="number"
                  step="0.01"
                  value={formData.deductStatutoryReserve}
                  disabled={!user.permissions.canEditDaily}
                  onChange={(e) => handleChange('deductStatutoryReserve', e.target.value)}
                  className="w-full text-right font-mono px-3 py-2 bg-white border border-slate-300 rounded-lg text-rose-700 text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none disabled:bg-slate-100"
                />
              </div>
            </div>

            {/* 6. ลบ เงินสะสมที่ได้รับอนุมัติแล้ว ในปีปัจจุบัน */}
            <div className="p-4 hover:bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  -
                </span>
                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    โดยลบ: เงินสะสมที่ได้รับอนุมัติแล้ว ในปีปัจจุบัน
                  </label>
                  <p className="text-xs text-slate-400">สภาเทศบาลหรือผู้ว่าราชการจังหวัดอนุมัติแล้วในปี 2570</p>
                </div>
              </div>
              <div className="w-full md:w-64">
                <input
                  type="number"
                  step="0.01"
                  value={formData.deductCurrentYearApproved}
                  disabled={!user.permissions.canEditDaily}
                  onChange={(e) => handleChange('deductCurrentYearApproved', e.target.value)}
                  className="w-full text-right font-mono px-3 py-2 bg-white border border-slate-300 rounded-lg text-rose-700 text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none disabled:bg-slate-100"
                />
              </div>
            </div>

            {/* 7. ลบ ถอนคืนเงินได้รับข้ามปีงบประมาณ */}
            <div className="p-4 hover:bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  -
                </span>
                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    โดยลบ: ถอนคืนเงินได้รับข้ามปีงบประมาณ
                  </label>
                  <p className="text-xs text-slate-400">รายการถอนคืนเงินรายรับของปีก่อนที่ต้องจ่ายคืน</p>
                </div>
              </div>
              <div className="w-full md:w-64">
                <input
                  type="number"
                  step="0.01"
                  value={formData.deductCrossYearRefund}
                  disabled={!user.permissions.canEditDaily}
                  onChange={(e) => handleChange('deductCrossYearRefund', e.target.value)}
                  className="w-full text-right font-mono px-3 py-2 bg-white border border-slate-300 rounded-lg text-rose-700 text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none disabled:bg-slate-100"
                />
              </div>
            </div>

            {/* 8. บวก เงินสะสมที่เหลือจากการอนุมัติหลังจากก่อหนี้ผูกพัน */}
            <div className="p-4 hover:bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  +
                </span>
                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    โดยบวก: เงินสะสมที่เหลือจากการอนุมัติหลังจากก่อหนี้ผูกพัน
                  </label>
                  <p className="text-xs text-slate-400">เงินที่ประมูล/ทำสัญญาแล้วมีเงินเหลือส่งคืนเงินสะสม</p>
                </div>
              </div>
              <div className="w-full md:w-64">
                <input
                  type="number"
                  step="0.01"
                  value={formData.addApprovedObligationRemaining}
                  disabled={!user.permissions.canEditDaily}
                  onChange={(e) => handleChange('addApprovedObligationRemaining', e.target.value)}
                  className="w-full text-right font-mono px-3 py-2 bg-white border border-slate-300 rounded-lg text-emerald-700 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:bg-slate-100"
                />
              </div>
            </div>

            {/* 9. บวก รับคืนเงินรายจ่าย/รับรายได้ข้ามปีงบประมาณ */}
            <div className="p-4 hover:bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  +
                </span>
                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    โดยบวก: รับคืนเงินรายจ่าย/รับรายได้ข้ามปีงบประมาณ
                  </label>
                  <p className="text-xs text-slate-400">เงินที่จ่ายไปแล้วได้รับคืนหรือรายได้ข้ามปีที่จัดเก็บได้</p>
                </div>
              </div>
              <div className="w-full md:w-64">
                <input
                  type="number"
                  step="0.01"
                  value={formData.addCrossYearRevenueReturn}
                  disabled={!user.permissions.canEditDaily}
                  onChange={(e) => handleChange('addCrossYearRevenueReturn', e.target.value)}
                  className="w-full text-right font-mono px-3 py-2 bg-white border border-slate-300 rounded-lg text-emerald-700 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:bg-slate-100"
                />
              </div>
            </div>

            {/* 10. Grand Result Row */}
            <div className="p-5 bg-amber-50/90 flex flex-col md:flex-row md:items-center justify-between gap-4 border-t-2 border-amber-400">
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-amber-600 text-white font-bold text-sm flex items-center justify-center flex-shrink-0">
                  =
                </span>
                <div>
                  <div className="text-base font-bold text-amber-950 font-['Prompt']">
                    คงเหลือเงินสะสมที่สามารถนำไปใช้ได้ ณ ปัจจุบัน (คำนวณอัตโนมัติ)
                  </div>
                  <div className="text-xs text-amber-800 font-medium mt-0.5">
                    {bahtText(usableBalance)}
                  </div>
                </div>
              </div>
              <div className="w-full md:w-64 text-right">
                <div className="text-2xl font-bold font-mono text-amber-900">
                  {formatCurrency(usableBalance)} <span className="text-sm font-normal text-amber-800">บาท</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          {user.permissions.canEditDaily && (
            <div className="flex justify-end pt-3">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-semibold shadow transition"
              >
                <Save className="w-4 h-4" />
                <span>บันทึกการพิสูจน์ยอดเงินสะสม</span>
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};
