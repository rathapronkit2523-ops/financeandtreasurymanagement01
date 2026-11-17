import React, { useState } from 'react';
import {
  ClipboardCheck,
  CheckCircle2,
  Clock,
  Calendar,
  Save,
  Download,
  Building2,
  FileText,
  AlertCircle
} from 'lucide-react';
import { StatusTaskItem, UserSession } from '../types/finance';
import { exportSingleCategory } from '../services/excelService';

interface StatusTasksSectionProps {
  tasks: StatusTaskItem[];
  user: UserSession;
  onSaveTasks: (updated: StatusTaskItem[]) => void;
}

export const StatusTasksSection: React.FC<StatusTasksSectionProps> = ({
  tasks,
  user,
  onSaveTasks
}) => {
  const [taskList, setTaskList] = useState<StatusTaskItem[]>(tasks);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const completedCount = taskList.filter(t => t.status === 'ดำเนินการเสร็จสิ้น').length;
  const pendingCount = taskList.length - completedCount;
  const completionPercent = Math.round((completedCount / (taskList.length || 1)) * 100);

  const handleToggleStatus = (id: string) => {
    if (!user.permissions.canEditDaily && !user.permissions.canVerify) return;
    const updated = taskList.map(t => {
      if (t.id === id) {
        return {
          ...t,
          status: t.status === 'ดำเนินการเสร็จสิ้น' ? 'ยังไม่ดำเนินการ' : 'ดำเนินการเสร็จสิ้น'
        };
      }
      return t;
    });
    setTaskList(updated);
    onSaveTasks(updated);
  };

  const handleFieldChange = (id: string, field: keyof StatusTaskItem, value: string) => {
    const updated = taskList.map(t => {
      if (t.id === id) {
        return { ...t, [field]: value };
      }
      return t;
    });
    setTaskList(updated);
  };

  const handleSaveAll = () => {
    onSaveTasks(taskList);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleExportExcel = () => {
    const rows = taskList.map((t, idx) => ({
      'ลำดับ': idx + 1,
      'รายงาน / งานบริหารการคลัง': t.name,
      'สถานะ': t.status,
      'วันที่': t.date,
      'ประจำเดือน/งวด': t.month,
      'ผู้รับผิดชอบ': t.responsible,
      'หมายเหตุ': t.note || ''
    }));
    exportSingleCategory('ติดตามงานการเงิน', rows, 'รายงานติดตามสถานะงานการคลัง_เทศบาลเมืองมหาสารคาม_2570');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Progress */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-6 bg-teal-600 rounded-full"></span>
              <h2 className="text-xl font-bold text-slate-800 font-['Prompt']">
                เมนูรายงานและงานติดตามสถานะการบริหารการคลัง
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              ฝ่ายการเงินและบัญชี และฝ่ายบริหารงานคลัง กองคลัง เทศบาลเมืองมหาสารคาม
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-300 transition"
            >
              <Download className="w-4 h-4 text-teal-600" />
              <span>ส่งออก Excel</span>
            </button>

            {(user.permissions.canEditDaily || user.permissions.canVerify) && (
              <button
                onClick={handleSaveAll}
                className="flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold shadow-sm transition"
              >
                <Save className="w-4 h-4" />
                <span>บันทึกสถานะงาน</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress Overview Bar */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-teal-50/70 border border-teal-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-teal-800">ดำเนินการเสร็จสิ้น</span>
              <div className="text-2xl font-bold text-teal-900 mt-1">{completedCount} งาน</div>
              <span className="text-[11px] text-teal-600">พร้อมหลักฐานและระบบ</span>
            </div>
            <CheckCircle2 className="w-10 h-10 text-teal-600/70" />
          </div>

          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-amber-800">ยังไม่ดำเนินการ / รอจัดทำ</span>
              <div className="text-2xl font-bold text-amber-900 mt-1">{pendingCount} งาน</div>
              <span className="text-[11px] text-amber-600">ตามกำหนดเวลาในรอบปี</span>
            </div>
            <Clock className="w-10 h-10 text-amber-600/70" />
          </div>

          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4">
            <div className="flex justify-between items-center text-xs font-semibold text-blue-900 mb-1">
              <span>ความครบถ้วนของรายงาน</span>
              <span>{completionPercent}%</span>
            </div>
            <div className="w-full bg-blue-200 h-2.5 rounded-full overflow-hidden mt-2">
              <div
                className="bg-teal-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${completionPercent}%` }}
              ></div>
            </div>
            <span className="text-[11px] text-blue-600 mt-2 block">
              สำเร็จ {completedCount} จากทั้งหมด {taskList.length} รายงาน
            </span>
          </div>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-2 text-emerald-800 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>บันทึกสถานะงานบริหารการเงินและรายงานทั้งหมดเรียบร้อยแล้ว</span>
        </div>
      )}

      {/* List of Tasks Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 font-['Prompt']">
            รายงานและภารกิจการเงินตามระเบียบราชการ 7 ภารกิจหลัก
          </h3>
          <span className="text-xs text-slate-500">
            คลิกที่ปุ่มสถานะเพื่อสลับ "ดำเนินการเสร็จสิ้น" / "ยังไม่ดำเนินการ"
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-100 text-slate-700 text-xs font-bold border-b border-slate-200">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4 min-w-[260px]">ชื่อรายงาน / ภารกิจการคลัง</th>
                <th className="py-3 px-4 min-w-[150px]">วันที่เท่าไหร่</th>
                <th className="py-3 px-4 min-w-[150px]">ประจำเดือน/งวด</th>
                <th className="py-3 px-4 min-w-[160px] text-center">สถานะการดำเนินงาน</th>
                <th className="py-3 px-4 min-w-[140px]">ผู้รับผิดชอบ</th>
                <th className="py-3 px-4 min-w-[200px]">หมายเหตุ / ความคืบหน้า</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80">
              {taskList.map((task, idx) => {
                const isCompleted = task.status === 'ดำเนินการเสร็จสิ้น';

                return (
                  <tr key={task.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 text-center text-xs font-bold text-slate-400">
                      {idx + 1}
                    </td>

                    {/* Task Name */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800 text-sm">
                        {task.name}
                      </div>
                      {task.name.includes('GCFA') && (
                        <span className="inline-block px-2 py-0.5 mt-1 rounded text-[10px] bg-indigo-100 text-indigo-800 font-semibold">
                          ระบบ GCFA กรมบัญชีกลาง
                        </span>
                      )}
                      {task.name.includes('สตง') && (
                        <span className="inline-block px-2 py-0.5 mt-1 rounded text-[10px] bg-amber-100 text-amber-800 font-semibold">
                          สำนักงานการตรวจเงินแผ่นดิน
                        </span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4">
                      <input
                        type="date"
                        value={task.date}
                        disabled={!user.permissions.canEditDaily && !user.permissions.canVerify}
                        onChange={(e) => handleFieldChange(task.id, 'date', e.target.value)}
                        className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600 disabled:bg-transparent disabled:border-none"
                      />
                    </td>

                    {/* Month / Period */}
                    <td className="py-3.5 px-4">
                      <input
                        type="text"
                        value={task.month}
                        disabled={!user.permissions.canEditDaily && !user.permissions.canVerify}
                        onChange={(e) => handleFieldChange(task.id, 'month', e.target.value)}
                        placeholder="เช่น ตุลาคม 2569 / มีนาคม 2570"
                        className="w-full px-2.5 py-1 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600 disabled:bg-transparent disabled:border-none"
                      />
                    </td>

                    {/* Status Toggle Button */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(task.id)}
                        disabled={!user.permissions.canEditDaily && !user.permissions.canVerify}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-xs transition ${
                          isCompleted
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                            : 'bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300'
                        }`}
                      >
                        {isCompleted ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>ดำเนินการเสร็จสิ้น</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>ยังไม่ดำเนินการ</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Responsible Party */}
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      <input
                        type="text"
                        value={task.responsible}
                        disabled={!user.permissions.canEditDaily && !user.permissions.canVerify}
                        onChange={(e) => handleFieldChange(task.id, 'responsible', e.target.value)}
                        className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600 disabled:bg-transparent disabled:border-none"
                      />
                    </td>

                    {/* Notes */}
                    <td className="py-3.5 px-4">
                      <input
                        type="text"
                        value={task.note || ''}
                        disabled={!user.permissions.canEditDaily && !user.permissions.canVerify}
                        onChange={(e) => handleFieldChange(task.id, 'note', e.target.value)}
                        placeholder="ระบุหมายเหตุ/เลขที่หนังสือ..."
                        className="w-full px-2.5 py-1 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600 disabled:bg-transparent disabled:border-none"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
