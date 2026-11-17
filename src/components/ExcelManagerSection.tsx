import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Download,
  Upload,
  AlertCircle,
  CheckCircle2,
  Layers,
  ArrowRight,
  Info,
  Check,
  ChevronDown,
  Sparkles,
  FileCheck,
  RefreshCw,
  FolderKanban,
  FileText,
  TableProperties
} from 'lucide-react';
import { MunicipalityData, UserSession } from '../types/finance';
import {
  exportFullWorkbook,
  exportSingleMenu,
  downloadAllMenusTemplate,
  downloadSingleMenuTemplate,
  parseExcelFile,
  processMenuImport,
  IMPORT_MENU_OPTIONS
} from '../services/excelService';

interface ExcelManagerSectionProps {
  data: MunicipalityData;
  user: UserSession;
  onImportData: (updated: MunicipalityData) => void;
}

export const ExcelManagerSection: React.FC<ExcelManagerSectionProps> = ({
  data,
  user,
  onImportData
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedTargetMenu, setSelectedTargetMenu] = useState<string>('all');
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedExportMenu, setSelectedExportMenu] = useState<string>('all');
  const [selectedSingleTemplate, setSelectedSingleTemplate] = useState<string>('revenue');

  const [previewInfo, setPreviewInfo] = useState<{
    fileName: string;
    sheetNames: string[];
    parsedSheets: { [name: string]: any[] };
  } | null>(null);

  const [importStatus, setImportStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Handle Full or Specific Export
  const handleExport = () => {
    if (selectedExportMenu === 'all') {
      exportFullWorkbook(data);
    } else {
      exportSingleMenu(selectedExportMenu, data);
    }
  };

  // Handle Template Downloads
  const handleDownloadAllTemplates = () => {
    downloadAllMenusTemplate();
  };

  const handleDownloadSingleTemplate = () => {
    downloadSingleMenuTemplate(selectedSingleTemplate);
  };

  // Handle File Upload and Preview
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setImportStatus(null);

    try {
      const { sheets, sheetNames } = await parseExcelFile(file);
      setPreviewInfo({
        fileName: file.name,
        sheetNames,
        parsedSheets: sheets
      });
    } catch (err: any) {
      setImportStatus({
        success: false,
        message: 'ไม่สามารถอ่านไฟล์ Excel/CSV ได้ กรุณาตรวจสอบรูปแบบไฟล์: ' + err.message
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Confirm Import
  const confirmImport = () => {
    if (!previewInfo) return;

    setIsProcessing(true);
    setImportStatus(null);

    try {
      const result = processMenuImport(
        data,
        selectedTargetMenu,
        previewInfo.parsedSheets,
        previewInfo.sheetNames,
        importMode
      );

      onImportData(result.updatedData);

      setImportStatus({
        success: true,
        message: `${result.message} (${importMode === 'append' ? 'โหมดผนวกต่อท้าย' : 'โหมดแทนที่ข้อมูลเดิม'})`
      });

      setPreviewInfo(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setImportStatus({
        success: false,
        message: 'เกิดข้อผิดพลาดในการประมวลผลข้อมูล: ' + err.message
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const currentMenuInfo = IMPORT_MENU_OPTIONS.find((opt) => opt.key === selectedTargetMenu);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-start gap-3">
            <span className="w-2.5 h-8 bg-emerald-600 rounded-full mt-0.5"></span>
            <div>
              <h2 className="text-xl font-bold text-slate-800 font-['Prompt'] flex items-center gap-2">
                <span>ระบบดาวน์โหลดและนำเข้าข้อมูลเป็น Excel (.xlsx)</span>
                <span className="text-xs px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-medium">
                  อัพเดทครบทุกเมนู
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                เทศบาลเมืองมหาสารคาม • ส่งออกข้อมูลครบทุกเมนู ดาวน์โหลดเทมเพลตมาตรฐาน และเลือกเมนูเป้าหมายสำหรับนำเข้าข้อมูลได้ตามต้องการ
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <Info className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>รองรับไฟล์ .xlsx, .xls และ .csv</span>
          </div>
        </div>

        {/* 2 Main Action Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Card 1: Download Section */}
          <div className="bg-gradient-to-br from-emerald-50/70 via-teal-50/30 to-white border border-emerald-200 rounded-2xl p-6 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-emerald-950 font-['Prompt'] text-base">
                    ๑. ดาวน์โหลดข้อมูลและเทมเพลต Excel
                  </h3>
                  <p className="text-xs text-emerald-800">
                    ส่งออกข้อมูลระบบจริง หรือดาวน์โหลดไฟล์เทมเพลตเปล่าสำหรับกรอกข้อมูล
                  </p>
                </div>
              </div>

              {/* Sheet checklist in full workbook */}
              <div className="mt-4 bg-white/95 rounded-xl p-3.5 border border-emerald-200/80 text-xs text-slate-700 space-y-2">
                <span className="font-bold text-emerald-900 flex items-center gap-1.5 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>ชีตทั้งหมดที่อัพเดทในเล่มรายงาน (.xlsx):</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-slate-600">
                  <span className="flex items-center gap-1">✓ 1. ภาพรวมและเปรียบเทียบ</span>
                  <span className="flex items-center gap-1">✓ 2. หมวดรายรับ (๙ หมวด)</span>
                  <span className="flex items-center gap-1">✓ 3. หมวดรายจ่าย (รวม 3.1-3.6 / 5.1-5.4)</span>
                  <span className="flex items-center gap-1">✓ 4. พิสูจน์ยอดเงินสะสม (๙ รายการ)</span>
                  <span className="flex items-center gap-1">✓ 5. เงินอุดหนุนเฉพาะกิจ</span>
                  <span className="flex items-center gap-1">✓ 6. เงินสะสมโครงการ</span>
                  <span className="flex items-center gap-1">✓ 7. เงินรางวัลบริหารดี</span>
                  <span className="flex items-center gap-1">✓ 8. ค่าใช้จ่ายค้างจ่าย</span>
                  <span className="flex items-center gap-1">✓ 9. อุดหนุนหน่วยงานอื่น</span>
                  <span className="flex items-center gap-1">✓ 10. ติดตามงานการคลัง</span>
                  <span className="flex items-center gap-1">✓ 11. บันทึกข้อความราชการ</span>
                  <span className="flex items-center gap-1">✓ 12. บันทึกประจำวัน (รายวัน)</span>
                </div>
              </div>

              {/* Export Selector */}
              <div className="mt-4 bg-white/90 rounded-xl p-3 border border-emerald-100">
                <label className="block text-xs font-bold text-emerald-950 mb-1.5">
                  เลือกข้อมูลที่ต้องการส่งออก (Export):
                </label>
                <div className="flex gap-2">
                  <select
                    value={selectedExportMenu}
                    onChange={(e) => setSelectedExportMenu(e.target.value)}
                    className="flex-1 bg-white border border-emerald-300 rounded-lg px-3 py-2 text-xs text-slate-800 font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="all">★ ส่งออกทั้งเล่มครบทุกเมนู (12 ชีต)</option>
                    <option value="revenue">หมวดรายรับ (๙ หมวด)</option>
                    <option value="expenditure">หมวดรายจ่าย (รวมงบกลาง 3.1-3.6 / เงินอุดหนุน 5.1-5.4)</option>
                    <option value="proof">รายงานการพิสูจน์ยอดเงินสะสม</option>
                    <option value="funds">งบประมาณและโครงการ (5 หมวดโครงการ)</option>
                    <option value="tasks">รายงานและติดตามงานการคลัง</option>
                    <option value="memo">บันทึกข้อความราชการ</option>
                    <option value="daily">บันทึกรายรับ-รายจ่ายประจำวัน</option>
                  </select>
                  <button
                    onClick={handleExport}
                    className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs shadow-xs flex items-center gap-1.5 shrink-0 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>ส่งออก</span>
                  </button>
                </div>
              </div>

              {/* Template Download Options */}
              <div className="mt-3 bg-white/90 rounded-xl p-3 border border-emerald-100 space-y-2">
                <span className="block text-xs font-bold text-emerald-950">
                  ดาวน์โหลดไฟล์เทมเพลตมาตรฐาน (Templates):
                </span>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={handleDownloadAllTemplates}
                    className="flex-1 py-2 px-3 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-400 font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 transition shadow-2xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>เทมเพลตครบทุกเมนู (Master All-in-One)</span>
                  </button>

                  <div className="flex-1 flex gap-1.5">
                    <select
                      value={selectedSingleTemplate}
                      onChange={(e) => setSelectedSingleTemplate(e.target.value)}
                      className="flex-1 bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-hidden"
                    >
                      <option value="revenue">เทมเพลต: หมวดรายรับ</option>
                      <option value="expenditure">เทมเพลต: หมวดรายจ่าย</option>
                      <option value="proof">เทมเพลต: พิสูจน์เงินสะสม</option>
                      <option value="funds">เทมเพลต: โครงการ 5 หมวด</option>
                      <option value="tasks">เทมเพลต: ติดตามงาน</option>
                      <option value="memo">เทมเพลต: บันทึกราชการ</option>
                      <option value="daily">เทมเพลต: บันทึกประจำวัน</option>
                    </select>
                    <button
                      onClick={handleDownloadSingleTemplate}
                      className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 transition"
                      title="ดาวน์โหลดเทมเพลตเฉพาะเมนูที่เลือก"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>โหลด</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-emerald-200/60">
              <button
                onClick={handleDownloadAllTemplates}
                className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl text-xs shadow-xs flex items-center justify-center gap-2 transition"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>ดาวน์โหลดเทมเพลตเปล่าที่มีเมนูทั้งหมด (.xlsx)</span>
              </button>
            </div>
          </div>

          {/* Card 2: Import Section with Menu Selection */}
          <div className="bg-gradient-to-br from-blue-50/70 via-indigo-50/30 to-white border border-blue-200 rounded-2xl p-6 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-blue-900 text-white flex items-center justify-center shadow-xs">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-blue-950 font-['Prompt'] text-base">
                    ๒. นำเข้าข้อมูล Excel / CSV
                  </h3>
                  <p className="text-xs text-blue-800">
                    เลือกเมนูที่ต้องการนำเข้าข้อมูล แล้วอัพโหลดไฟล์ .xlsx, .xls หรือ .csv
                  </p>
                </div>
              </div>

              {/* Requirement: นำเข้าข้อมูล Excel / CSV ให้เลือกว่าจะทำเข้าเมนูไหน */}
              <div className="mt-4 bg-white/95 rounded-xl p-3.5 border border-blue-200 space-y-2.5">
                <label className="block text-xs font-bold text-blue-950">
                  ★ เลือกเมนูที่ต้องการนำเข้าข้อมูล:
                </label>
                <select
                  value={selectedTargetMenu}
                  onChange={(e) => setSelectedTargetMenu(e.target.value)}
                  className="w-full bg-blue-50/50 border border-blue-300 rounded-lg px-3 py-2 text-xs font-semibold text-blue-950 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  {IMPORT_MENU_OPTIONS.map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                {currentMenuInfo && (
                  <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200 flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                    <span>{currentMenuInfo.description}</span>
                  </div>
                )}
              </div>

              {/* Import Mode: Append vs Replace */}
              <div className="mt-3 bg-white/95 rounded-xl p-3.5 border border-blue-200 text-xs">
                <span className="font-bold text-blue-950 block mb-2">
                  รูปแบบการบันทึกข้อมูล:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label
                    className={`p-2.5 rounded-lg border cursor-pointer flex items-start gap-2 transition ${
                      importMode === 'append'
                        ? 'bg-blue-50 border-blue-400 text-blue-950 ring-1 ring-blue-300'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      value="append"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="mt-0.5"
                    />
                    <div>
                      <span className="font-bold block text-xs">เพิ่มต่อท้าย (ผนวก)</span>
                      <span className="text-[10px] text-slate-500">
                        อัพเดทรายการเดิม และเพิ่มรายการใหม่ต่อท้าย
                      </span>
                    </div>
                  </label>

                  <label
                    className={`p-2.5 rounded-lg border cursor-pointer flex items-start gap-2 transition ${
                      importMode === 'replace'
                        ? 'bg-amber-50 border-amber-400 text-amber-950 ring-1 ring-amber-300'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="mt-0.5"
                    />
                    <div>
                      <span className="font-bold block text-xs">แทนที่ข้อมูลเดิม (แทนที่)</span>
                      <span className="text-[10px] text-slate-500">
                        ล้างข้อมูลเดิมในเมนูนี้และแทนที่ด้วยไฟล์นี้
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-blue-200/60">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="hidden"
                id="excel-file-input"
              />
              <label
                htmlFor="excel-file-input"
                className="w-full py-3 px-4 bg-blue-900 hover:bg-blue-800 text-white font-semibold rounded-xl text-xs shadow-xs flex items-center justify-center gap-2 cursor-pointer transition text-center"
              >
                <Upload className="w-4 h-4" />
                <span>
                  เลือกไฟล์ Excel / CSV เพื่อนำเข้าสู่{' '}
                  <span className="underline font-bold">
                    {currentMenuInfo?.label.split('(')[0].trim() || 'ระบบ'}
                  </span>
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {importStatus && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-sm transition-all ${
            importStatus.success
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-rose-50 border-rose-300 text-rose-800'
          }`}
        >
          {importStatus.success ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="font-medium">{importStatus.message}</span>
        </div>
      )}

      {/* Import Preview Modal / Box */}
      {previewInfo && (
        <div className="bg-white rounded-2xl shadow-lg border border-blue-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[11px] font-bold rounded-md">
                  กำลังเตรียมนำเข้าสู่: {currentMenuInfo?.label}
                </span>
              </div>
              <h3 className="font-bold text-base text-slate-800 font-['Prompt'] mt-1">
                ตรวจสอบตัวอย่างข้อมูล: {previewInfo.fileName}
              </h3>
              <p className="text-xs text-slate-500">
                พบชีตทั้งหมด: {previewInfo.sheetNames.join(', ')} • โหมด:{' '}
                {importMode === 'append' ? 'เพิ่มต่อท้าย (ผนวก)' : 'แทนที่ข้อมูลเดิม'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPreviewInfo(null)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium"
              >
                ยกเลิก
              </button>
              <button
                onClick={confirmImport}
                disabled={isProcessing}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                {isProcessing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>ยืนยันการนำเข้าสู่ {currentMenuInfo?.key === 'all' ? 'ทุกเมนู' : 'เมนูนี้'}</span>
              </button>
            </div>
          </div>

          <div className="mt-4 space-y-4 max-h-96 overflow-y-auto">
            {previewInfo.sheetNames.map((sName) => {
              const rows = previewInfo.parsedSheets[sName] || [];
              if (rows.length === 0) return null;
              return (
                <div key={sName} className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 flex justify-between items-center">
                    <span className="flex items-center gap-1.5">
                      <TableProperties className="w-3.5 h-3.5 text-slate-500" />
                      <span>ชีต: {sName}</span>
                    </span>
                    <span className="text-[11px] text-slate-500">{rows.length} แถว</span>
                  </div>
                  <div className="overflow-x-auto p-2">
                    <table className="w-full text-left text-xs">
                      <tbody>
                        {rows.slice(0, 6).map((r, rIdx) => (
                          <tr
                            key={rIdx}
                            className={`border-b border-slate-100 ${
                              rIdx === 0 ? 'bg-slate-50 font-bold text-slate-800' : ''
                            }`}
                          >
                            {Array.isArray(r) &&
                              r.slice(0, 7).map((cell, cIdx) => (
                                <td
                                  key={cIdx}
                                  className="p-1.5 text-slate-600 font-mono text-[11px] truncate max-w-[180px]"
                                >
                                  {String(cell !== undefined && cell !== null ? cell : '')}
                                </td>
                              ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
