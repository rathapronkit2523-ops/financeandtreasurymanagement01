import * as XLSX from 'xlsx';
import {
  MunicipalityData,
  BudgetCategory,
  FundProjectItem,
  StatusTaskItem,
  DailyTransaction,
  AccumulatedProof,
  MemorandumData
} from '../types/finance';
import { calcPercent } from '../utils/formatters';

export interface ImportMenuOption {
  key: string;
  label: string;
  description: string;
  sheetKeywords: string[];
}

export const IMPORT_MENU_OPTIONS: ImportMenuOption[] = [
  {
    key: 'all',
    label: 'นำเข้าข้อมูลทั้งหมดอัตโนมัติ (ตรวจจับตามชื่อชีต)',
    description: 'อ่านทุกชีตในไฟล์ Excel แล้วนำเข้าแยกตามเมนูโดยอัตโนมัติ',
    sheetKeywords: []
  },
  {
    key: 'revenue',
    label: '๑. รายงานหมวดรายรับ (Revenue)',
    description: 'นำเข้าหมวดรายรับ (หมวดภาษีอากร, ค่าธรรมเนียม, รายได้จากทรัพย์สิน, ภาษีจัดสรร, อุดหนุนทั่วไป ฯลฯ)',
    sheetKeywords: ['รายรับ', 'หมวดรายรับ', 'revenue']
  },
  {
    key: 'expenditure',
    label: '๒. รายงานหมวดรายจ่าย (Expenditure)',
    description: 'นำเข้าหมวดรายจ่ายหลักและรายการย่อย (งบบุคลากร, งบกลาง 3.1-3.6, งบเงินอุดหนุน 5.1-5.4 ฯลฯ)',
    sheetKeywords: ['รายจ่าย', 'หมวดรายจ่าย', 'expenditure']
  },
  {
    key: 'proof',
    label: '๓. รายงานการพิสูจน์ยอดเงินสะสม (Accumulated Proof)',
    description: 'นำเข้า ๙ รายการคำนวณเงินสะสมตามระเบียบกระทรวงมหาดไทย',
    sheetKeywords: ['พิสูจน์', 'เงินสะสม', 'proof', 'accumulated']
  },
  {
    key: 'funds',
    label: '๔. งบประมาณและโครงการ (5 หมวดโครงการ)',
    description: 'นำเข้าโครงการเงินอุดหนุนเฉพาะกิจ, เงินสะสม, รางวัลบริหารดี, ค้างจ่าย, อุดหนุนหน่วยงานอื่น',
    sheetKeywords: ['โครงการ', 'งบประมาณและโครงการ', 'งบเฉพาะ', 'funds', 'projects']
  },
  {
    key: 'tasks',
    label: '๕. รายงานและติดตามงานการคลัง (Financial Tasks)',
    description: 'นำเข้าภารกิจติดตามงานการคลัง กำหนดเวลา งวดงาน สถานะการดำเนินงาน',
    sheetKeywords: ['ติดตามงาน', 'ภารกิจ', 'สถานะ', 'tasks']
  },
  {
    key: 'memo',
    label: '๖. บันทึกข้อความราชการ (Memorandum Settings)',
    description: 'นำเข้าข้อมูลหัวบันทึกข้อความ เลขที่ วันที่ ส่วนราชการ และผู้ลงนาม',
    sheetKeywords: ['บันทึกข้อความ', 'บันทึกราชการ', 'memo', 'memorandum']
  },
  {
    key: 'daily',
    label: '๗. บันทึกรายรับ-รายจ่ายประจำวัน (Daily Ledger)',
    description: 'นำเข้าบัญชีรายรับ-รายจ่ายประจำวัน เลขที่ฎีกา/ใบเสร็จ',
    sheetKeywords: ['ประจำวัน', 'บันทึกประจำวัน', 'daily', 'ledger']
  }
];

// Helper to calculate usable accumulated fund
export function calculateUsableFund(ap: AccumulatedProof): number {
  return (
    ap.bankBalanceSept30 -
    ap.deductLocalFund -
    ap.deductPersonnel3Months -
    ap.deductFifteenPercentExpense -
    ap.deductStatutoryReserve -
    ap.deductCurrentYearApproved -
    ap.deductCrossYearRefund +
    ap.addApprovedObligationRemaining +
    ap.addCrossYearRevenueReturn
  );
}

// -------------------------------------------------------------
// 1. EXPORT FULL WORKBOOK (All menus/modules included)
// -------------------------------------------------------------
export function exportFullWorkbook(data: MunicipalityData): void {
  const wb = XLSX.utils.book_new();

  // 1. Sheet ภาพรวมและเปรียบเทียบ
  const totalRevEst = data.revenueCategories.reduce((sum, c) => sum + c.estimate, 0);
  const totalRevAct = data.revenueCategories.reduce((sum, c) => sum + c.actual, 0);
  const totalExpEst = data.expenditureCategories.reduce((sum, c) => sum + c.estimate, 0);
  const totalExpAct = data.expenditureCategories.reduce((sum, c) => sum + c.actual, 0);
  const netBalance = totalRevAct - totalExpAct;

  const overviewRows = [
    ['เทศบาลเมืองมหาสารคาม กองคลัง', '', '', '', ''],
    ['รายงานผลการดำเนินงานทางการเงินและงบประมาณ ประจำปีงบประมาณ พ.ศ. 2570', '', '', '', ''],
    ['วันที่ส่งออกข้อมูล:', new Date().toLocaleDateString('th-TH'), '', '', ''],
    ['', '', '', '', ''],
    ['สรุปผลการเปรียบเทียบภาพรวม', 'ประมาณการ (บาท)', 'รับจริง/จ่ายจริง (บาท)', 'คงเหลือ (บาท)', 'ร้อยละความก้าวหน้า (%)'],
    ['รวมหมวดรายรับทั้งหมด', totalRevEst, totalRevAct, totalRevEst - totalRevAct, calcPercent(totalRevAct, totalRevEst)],
    ['รวมหมวดรายจ่ายทั้งหมด', totalExpEst, totalExpAct, totalExpEst - totalExpAct, calcPercent(totalExpAct, totalExpEst)],
    ['ผลต่างสุทธิ (รายรับจริง - จ่ายจริง)', '', netBalance, '', ''],
    ['', '', '', '', ''],
    ['สรุปรายรับแยกตามหมวดหมู่ (รวมหมวดรายได้จากทรัพย์สิน)', 'ประมาณการ (บาท)', 'รับจริง (บาท)', 'คงเหลือ (บาท)', 'ร้อยละ (%)'],
    ...data.revenueCategories.map((c, i) => [
      `${i + 1}. ${c.name}`,
      c.estimate,
      c.actual,
      c.estimate - c.actual,
      calcPercent(c.actual, c.estimate)
    ]),
    ['', '', '', '', ''],
    ['สรุปรายจ่ายแยกตามหมวดหมู่', 'ประมาณการ (บาท)', 'จ่ายจริง (บาท)', 'คงเหลือ (บาท)', 'ร้อยละ (%)'],
    ...data.expenditureCategories.map((c, i) => [
      `${i + 1}. ${c.name}`,
      c.estimate,
      c.actual,
      c.estimate - c.actual,
      calcPercent(c.actual, c.estimate)
    ])
  ];
  const wsOverview = XLSX.utils.aoa_to_sheet(overviewRows);
  XLSX.utils.book_append_sheet(wb, wsOverview, 'ภาพรวมและเปรียบเทียบ');

  // 2. Sheet รายงานหมวดรายรับ
  const revRows: any[] = [
    ['ลำดับ', 'หมวดรายรับ', 'ประมาณการ (บาท)', 'รับจริง (บาท)', 'คงเหลือ (บาท)', 'ร้อยละความก้าวหน้า (%)', 'หมายเหตุ']
  ];
  data.revenueCategories.forEach((c, idx) => {
    revRows.push([
      idx + 1,
      c.name,
      c.estimate,
      c.actual,
      c.estimate - c.actual,
      calcPercent(c.actual, c.estimate),
      c.notes || ''
    ]);
  });
  revRows.push([
    'รวมทั้งสิ้น',
    'รวมหมวดรายรับทั้งหมด',
    totalRevEst,
    totalRevAct,
    totalRevEst - totalRevAct,
    calcPercent(totalRevAct, totalRevEst),
    ''
  ]);
  const wsRev = XLSX.utils.aoa_to_sheet(revRows);
  XLSX.utils.book_append_sheet(wb, wsRev, 'หมวดรายรับ');

  // 3. Sheet รายงานหมวดรายจ่าย (รวมงบกลาง 3.1-3.6 และ งบเงินอุดหนุน 5.1-5.4)
  const expRows: any[] = [
    ['ลำดับ', 'หมวดรายจ่ายหลัก', 'รายการย่อย', 'ประมาณการ (บาท)', 'จ่ายจริง (บาท)', 'คงเหลือ (บาท)', 'ร้อยละความก้าวหน้า (%)', 'หมายเหตุ']
  ];
  let expCounter = 1;
  data.expenditureCategories.forEach((c) => {
    expRows.push([
      expCounter++,
      `[หมวด] ${c.name}`,
      '-',
      c.estimate,
      c.actual,
      c.estimate - c.actual,
      calcPercent(c.actual, c.estimate),
      c.notes || ''
    ]);
    if (c.subItems && c.subItems.length > 0) {
      c.subItems.forEach((sub, sIdx) => {
        expRows.push([
          `  ${expCounter - 1}.${sIdx + 1}`,
          `  - ${c.name}`,
          sub.name,
          sub.estimate,
          sub.actual,
          sub.estimate - sub.actual,
          calcPercent(sub.actual, sub.estimate),
          ''
        ]);
      });
    }
  });
  expRows.push([
    'รวมทั้งสิ้น',
    'รวมหมวดรายจ่ายทั้งหมด',
    '-',
    totalExpEst,
    totalExpAct,
    totalExpEst - totalExpAct,
    calcPercent(totalExpAct, totalExpEst),
    ''
  ]);
  const wsExp = XLSX.utils.aoa_to_sheet(expRows);
  XLSX.utils.book_append_sheet(wb, wsExp, 'หมวดรายจ่าย');

  // 4. Sheet พิสูจน์ยอดเงินสะสม
  const ap = data.accumulatedProof;
  const usableAccFund = calculateUsableFund(ap);
  const proofRows = [
    ['เทศบาลเมืองมหาสารคาม กองคลัง', '', ''],
    ['รายงานการพิสูจน์ยอดเงินสะสม ประจำปีงบประมาณ พ.ศ. 2570', '', ''],
    ['วันที่บันทึก/รายงาน:', ap.recordDate || '', ''],
    ['', '', ''],
    ['ลำดับ', 'รายการตามระเบียบกระทรวงมหาดไทยว่าด้วยการรับเงิน การเบิกจ่ายเงินฯ', 'จำนวนเงิน (บาท)'],
    ['1', 'เงินสะสมบัญชีเงินฝากธนาคาร 30 กันยายน 2569', ap.bankBalanceSept30],
    ['2', 'หัก เงินสมทบกองทุนส่งเสริมกิจการขององค์กรปกครองส่วนท้องถิ่น', ap.deductLocalFund],
    ['3', 'หัก ค่าใช้จ่ายด้านบุคลากรไม่น้อยกว่า 3 เดือน', ap.deductPersonnel3Months],
    ['4', 'หัก ร้อยละ 15 ของงบประมาณรายจ่ายประจำปี', ap.deductFifteenPercentExpense],
    ['5', 'หัก เงินสะสมคงเหลือขั้นต่ำตามระเบียบฯ', ap.deductStatutoryReserve],
    ['6', 'หัก เงินสะสมที่ได้รับอนุมัติแล้ว ในปีปัจจุบัน', ap.deductCurrentYearApproved],
    ['7', 'หัก ถอนคืนเงินได้รับข้ามปีงบประมาณ', ap.deductCrossYearRefund],
    ['8', 'บวก เงินสะสมที่เหลือจากการอนุมัติหลังจากก่อหนี้ผูกพัน', ap.addApprovedObligationRemaining],
    ['9', 'บวก รับคืนเงินรายจ่าย/รับรายได้ข้ามปีงบประมาณ', ap.addCrossYearRevenueReturn],
    ['', 'คงเหลือเงินสะสมที่สามารถนำไปใช้ได้ ณ ปัจจุบัน (คำนวณอัตโนมัติ)', usableAccFund]
  ];
  const wsProof = XLSX.utils.aoa_to_sheet(proofRows);
  XLSX.utils.book_append_sheet(wb, wsProof, 'พิสูจน์ยอดเงินสะสม');

  // 5-9. Project Sheets
  const addFundSheet = (title: string, sheetName: string, items: FundProjectItem[]) => {
    const rows = [
      ['เทศบาลเมืองมหาสารคาม - ' + title, '', '', '', '', '', ''],
      ['ลำดับ', 'รายการ / ชื่อโครงการ', 'งบประมาณ (บาท)', 'เบิกจ่าย (บาท)', 'คงเหลือ (บาท)', 'ปีงบประมาณ', 'สถานะ', 'หน่วยงานรับผิดชอบ'],
      ...items.map((item, idx) => [
        idx + 1,
        item.title,
        item.budget,
        item.disbursed,
        item.budget - item.disbursed,
        item.fiscalYear,
        item.status,
        item.department || ''
      ])
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  };

  addFundSheet('เมนูเงินอุดหนุนเฉพาะกิจ', 'เงินอุดหนุนเฉพาะกิจ', data.specialGrantProjects);
  addFundSheet('เมนูเงินสะสม', 'เงินสะสมโครงการ', data.accumulatedFundProjects);
  addFundSheet('เมนูเงินรางวัลบริหารจัดการที่ดี', 'เงินรางวัลบริหารดี', data.goodGovernanceProjects);
  addFundSheet('เมนูค่าใช้จ่ายค้างจ่าย', 'ค่าใช้จ่ายค้างจ่าย', data.accruedExpenses);
  addFundSheet('เมนูอุดหนุนจากหน่วยงานอื่น', 'อุดหนุนหน่วยงานอื่น', data.externalSubsidies);

  // 10. Status Tasks
  const statusRows = [
    ['รายงานติดตามสถานะและงานบริหารการเงิน กองคลัง เทศบาลเมืองมหาสารคาม', '', '', '', ''],
    ['ลำดับ', 'ชื่อรายงาน / ภารกิจ', 'กำหนดเวลา / วันที่', 'ประจำงวด/เดือน', 'สถานะการดำเนินงาน', 'ผู้รับผิดชอบ', 'หมายเหตุ'],
    ...data.statusTasks.map((t, idx) => [
      idx + 1,
      t.name,
      t.date,
      t.month,
      t.status,
      t.responsible,
      t.note || ''
    ])
  ];
  const wsStatus = XLSX.utils.aoa_to_sheet(statusRows);
  XLSX.utils.book_append_sheet(wb, wsStatus, 'ติดตามงานการคลัง');

  // 11. Official Memorandum (บันทึกข้อความราชการ)
  const memo = data.memorandum;
  const memoRows = [
    ['เทศบาลเมืองมหาสารคาม กองคลัง', ''],
    ['ข้อมูลบันทึกข้อความราชการ ประจำปีงบประมาณ พ.ศ. 2570', ''],
    ['', ''],
    ['รายการฟิลด์', 'ค่าข้อมูล'],
    ['เลขที่หนังสือ', memo?.docNumber || ''],
    ['วันที่บันทึก', memo?.date || ''],
    ['เรื่อง', memo?.subject || ''],
    ['เรียน', memo?.toWhom || ''],
    ['ส่วนราชการ/หน่วยงาน', memo?.fromAgency || ''],
    ['ชื่อผู้รายงาน', memo?.reporterName || ''],
    ['ตำแหน่งผู้รายงาน', memo?.reporterPosition || ''],
    ['บทบาทผู้รายงาน', memo?.reporterRoleLabel || ''],
    ['ชื่อผู้อำนวยการกองคลัง', memo?.directorName || ''],
    ['ตำแหน่งผู้อำนวยการกองคลัง', memo?.directorPosition || ''],
    ['ความเห็นผู้อำนวยการ', memo?.directorComment || ''],
    ['ชื่อผู้มีอำนาจอนุมัติ', memo?.approverName || ''],
    ['ตำแหน่งผู้มีอำนาจอนุมัติ', memo?.approverPosition || ''],
    ['คำสั่งการ/อนุมัติ', memo?.approverComment || '']
  ];
  const wsMemo = XLSX.utils.aoa_to_sheet(memoRows);
  XLSX.utils.book_append_sheet(wb, wsMemo, 'บันทึกข้อความราชการ');

  // 12. Daily Transactions (if any)
  if (data.dailyEntries && data.dailyEntries.length > 0) {
    const dailyRows = [
      ['บัญชีรายรับ-รายจ่ายประจำวัน กองคลัง เทศบาลเมืองมหาสารคาม', '', '', '', '', '', ''],
      ['ลำดับ', 'วันที่', 'ประเภท', 'หมวดหมู่', 'รายการย่อย', 'จำนวนเงิน (บาท)', 'เลขที่เอกสาร', 'คำอธิบายรายการ'],
      ...data.dailyEntries.map((d, idx) => [
        idx + 1,
        d.date,
        d.type === 'revenue' ? 'รายรับ' : 'รายจ่าย',
        d.category,
        d.subCategory || '',
        d.amount,
        d.docNumber,
        d.description
      ])
    ];
    const wsDaily = XLSX.utils.aoa_to_sheet(dailyRows);
    XLSX.utils.book_append_sheet(wb, wsDaily, 'บันทึกประจำวัน');
  }

  // Trigger download
  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `รายงานผลการดำเนินงาน_กองคลัง_เทศบาลเมืองมหาสารคาม_2570_ครบทุกเมนู_${dateStr}.xlsx`);
}

// -------------------------------------------------------------
// 2. EXPORT SINGLE SPECIFIC MENU
// -------------------------------------------------------------
export function exportSingleMenu(menuKey: string, data: MunicipalityData): void {
  const wb = XLSX.utils.book_new();
  const dateStr = new Date().toISOString().split('T')[0];

  switch (menuKey) {
    case 'revenue': {
      const rows = [
        ['เทศบาลเมืองมหาสารคาม กองคลัง - รายงานหมวดรายรับ ประจำปีงบประมาณ พ.ศ. 2570', '', '', '', '', ''],
        ['ลำดับ', 'หมวดรายรับ', 'ประมาณการ (บาท)', 'รับจริง (บาท)', 'คงเหลือ (บาท)', 'ร้อยละความก้าวหน้า (%)', 'หมายเหตุ'],
        ...data.revenueCategories.map((c, i) => [
          i + 1,
          c.name,
          c.estimate,
          c.actual,
          c.estimate - c.actual,
          calcPercent(c.actual, c.estimate),
          c.notes || ''
        ])
      ];
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'หมวดรายรับ');
      XLSX.writeFile(wb, `รายงานหมวดรายรับ_เทศบาลเมืองมหาสารคาม_${dateStr}.xlsx`);
      break;
    }

    case 'expenditure': {
      const rows: any[] = [
        ['เทศบาลเมืองมหาสารคาม กองคลัง - รายงานหมวดรายจ่าย ประจำปีงบประมาณ พ.ศ. 2570', '', '', '', '', ''],
        ['ลำดับ', 'หมวดรายจ่ายหลัก', 'รายการย่อย', 'ประมาณการ (บาท)', 'จ่ายจริง (บาท)', 'คงเหลือ (บาท)', 'ร้อยละ (%)', 'หมายเหตุ']
      ];
      let counter = 1;
      data.expenditureCategories.forEach((c) => {
        rows.push([counter++, c.name, '-', c.estimate, c.actual, c.estimate - c.actual, calcPercent(c.actual, c.estimate), c.notes || '']);
        if (c.subItems && c.subItems.length > 0) {
          c.subItems.forEach((sub, sIdx) => {
            rows.push([
              `  ${counter - 1}.${sIdx + 1}`,
              c.name,
              sub.name,
              sub.estimate,
              sub.actual,
              sub.estimate - sub.actual,
              calcPercent(sub.actual, sub.estimate),
              ''
            ]);
          });
        }
      });
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'หมวดรายจ่าย');
      XLSX.writeFile(wb, `รายงานหมวดรายจ่าย_เทศบาลเมืองมหาสารคาม_${dateStr}.xlsx`);
      break;
    }

    case 'proof': {
      const ap = data.accumulatedProof;
      const usable = calculateUsableFund(ap);
      const rows = [
        ['รายงานการพิสูจน์ยอดเงินสะสม กองคลัง เทศบาลเมืองมหาสารคาม', ''],
        ['วันที่บันทึก:', ap.recordDate || ''],
        ['รายการตามระเบียบกระทรวงมหาดไทย', 'จำนวนเงิน (บาท)'],
        ['1. เงินสะสมบัญชีเงินฝากธนาคาร 30 กันยายน 2569', ap.bankBalanceSept30],
        ['2. หัก เงินสมทบกองทุนส่งเสริมกิจการขององค์กรปกครองส่วนท้องถิ่น', ap.deductLocalFund],
        ['3. หัก ค่าใช้จ่ายด้านบุคลากรไม่น้อยกว่า 3 เดือน', ap.deductPersonnel3Months],
        ['4. หัก ร้อยละ 15 ของงบประมาณรายจ่ายประจำปี', ap.deductFifteenPercentExpense],
        ['5. หัก เงินสะสมคงเหลือขั้นต่ำตามระเบียบฯ', ap.deductStatutoryReserve],
        ['6. หัก เงินสะสมที่ได้รับอนุมัติแล้ว ในปีปัจจุบัน', ap.deductCurrentYearApproved],
        ['7. หัก ถอนคืนเงินได้รับข้ามปีงบประมาณ', ap.deductCrossYearRefund],
        ['8. บวก เงินสะสมที่เหลือจากการอนุมัติหลังจากก่อหนี้ผูกพัน', ap.addApprovedObligationRemaining],
        ['9. บวก รับคืนเงินรายจ่าย/รับรายได้ข้ามปีงบประมาณ', ap.addCrossYearRevenueReturn],
        ['คงเหลือเงินสะสมที่สามารถนำไปใช้ได้ ณ ปัจจุบัน (คำนวณอัตโนมัติ)', usable]
      ];
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'พิสูจน์ยอดเงินสะสม');
      XLSX.writeFile(wb, `รายงานพิสูจน์ยอดเงินสะสม_เทศบาลเมืองมหาสารคาม_${dateStr}.xlsx`);
      break;
    }

    case 'funds': {
      const allProjects = [
        ...data.specialGrantProjects.map((p) => ({ ...p, fundCategory: 'เงินอุดหนุนเฉพาะกิจ' })),
        ...data.accumulatedFundProjects.map((p) => ({ ...p, fundCategory: 'เงินสะสม' })),
        ...data.goodGovernanceProjects.map((p) => ({ ...p, fundCategory: 'เงินรางวัลบริหารจัดการที่ดี' })),
        ...data.accruedExpenses.map((p) => ({ ...p, fundCategory: 'ค่าใช้จ่ายค้างจ่าย' })),
        ...data.externalSubsidies.map((p) => ({ ...p, fundCategory: 'อุดหนุนจากหน่วยงานอื่น' }))
      ];
      const rows = [
        ['งบประมาณและโครงการ กองคลัง เทศบาลเมืองมหาสารคาม', '', '', '', '', '', '', ''],
        ['ลำดับ', 'หมวดเงิน/โครงการ', 'ชื่อรายการ_โครงการ', 'งบประมาณ (บาท)', 'เบิกจ่าย (บาท)', 'คงเหลือ (บาท)', 'ปีงบประมาณ', 'สถานะ', 'หน่วยงานรับผิดชอบ'],
        ...allProjects.map((p, i) => [
          i + 1,
          p.fundCategory,
          p.title,
          p.budget,
          p.disbursed,
          p.budget - p.disbursed,
          p.fiscalYear,
          p.status,
          p.department || ''
        ])
      ];
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'งบประมาณและโครงการ');
      XLSX.writeFile(wb, `งบประมาณและโครงการ_เทศบาลเมืองมหาสารคาม_${dateStr}.xlsx`);
      break;
    }

    case 'tasks': {
      const rows = [
        ['รายงานและติดตามงานการคลัง เทศบาลเมืองมหาสารคาม', '', '', '', ''],
        ['ลำดับ', 'ชื่อรายงาน / ภารกิจ', 'กำหนดเวลา / วันที่', 'ประจำงวด/เดือน', 'สถานะการดำเนินงาน', 'ผู้รับผิดชอบ', 'หมายเหตุ'],
        ...data.statusTasks.map((t, idx) => [
          idx + 1,
          t.name,
          t.date,
          t.month,
          t.status,
          t.responsible,
          t.note || ''
        ])
      ];
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'ติดตามงานการคลัง');
      XLSX.writeFile(wb, `รายงานติดตามงานการคลัง_เทศบาลเมืองมหาสารคาม_${dateStr}.xlsx`);
      break;
    }

    case 'memo': {
      const m = data.memorandum;
      const rows = [
        ['บันทึกข้อความราชการ กองคลัง เทศบาลเมืองมหาสารคาม', ''],
        ['รายการฟิลด์', 'ค่าข้อมูล'],
        ['เลขที่หนังสือ', m.docNumber],
        ['วันที่บันทึก', m.date],
        ['เรื่อง', m.subject],
        ['เรียน', m.toWhom],
        ['ส่วนราชการ', m.fromAgency],
        ['ผู้รายงาน', m.reporterName],
        ['ตำแหน่งผู้รายงาน', m.reporterPosition],
        ['ผู้อำนวยการกองคลัง', m.directorName],
        ['ตำแหน่งผู้อำนวยการ', m.directorPosition],
        ['ความเห็นผู้อำนวยการ', m.directorComment],
        ['ผู้มีอำนาจอนุมัติ', m.approverName],
        ['ตำแหน่งผู้มีอำนาจอนุมัติ', m.approverPosition],
        ['คำสั่งการ', m.approverComment]
      ];
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'บันทึกข้อความราชการ');
      XLSX.writeFile(wb, `บันทึกข้อความราชการ_เทศบาลเมืองมหาสารคาม_${dateStr}.xlsx`);
      break;
    }

    case 'daily': {
      const rows = [
        ['บัญชีรายรับ-รายจ่ายประจำวัน เทศบาลเมืองมหาสารคาม', '', '', '', '', '', ''],
        ['ลำดับ', 'วันที่', 'ประเภท', 'หมวดหมู่', 'รายการย่อย', 'จำนวนเงิน (บาท)', 'เลขที่เอกสาร', 'คำอธิบายรายการ'],
        ...data.dailyEntries.map((d, idx) => [
          idx + 1,
          d.date,
          d.type === 'revenue' ? 'รายรับ' : 'รายจ่าย',
          d.category,
          d.subCategory || '',
          d.amount,
          d.docNumber,
          d.description
        ])
      ];
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'บันทึกประจำวัน');
      XLSX.writeFile(wb, `บันทึกประจำวัน_เทศบาลเมืองมหาสารคาม_${dateStr}.xlsx`);
      break;
    }

    default:
      exportFullWorkbook(data);
  }
}

// -------------------------------------------------------------
// 3. MASTER ALL-MENUS TEMPLATE WORKBOOK
// -------------------------------------------------------------
export function downloadAllMenusTemplate(): void {
  const wb = XLSX.utils.book_new();

  // Sheet 1: หมวดรายรับ
  const revTemplate = [
    ['หมวดรายรับ', 'ประมาณการ (บาท)', 'รับจริง (บาท)', 'หมายเหตุ'],
    ['หมวดภาษีอากร', 68500000, 42150000, ''],
    ['หมวดค่าธรรมเนียม ค่าปรับ และใบอนุญาต', 14200000, 8950000, ''],
    ['หมวดรายได้จากทรัพย์สิน', 16500000, 10250000, ''],
    ['หมวดรายได้จากสาธารณูปโภค และกิจการพาณิชย์', 21500000, 13800000, ''],
    ['หมวดรายได้เบ็ดเตล็ด', 6800000, 3950000, ''],
    ['หมวดรายได้จากทุน', 8500000, 5400000, ''],
    ['หมวดภาษีจัดสรร', 285000000, 178500000, ''],
    ['หมวดอุดหนุนทั่วไป', 198000000, 125600000, ''],
    ['หมวดเงินอุดหนุนระบุวัตถุประสงค์เฉพาะกิจ', 45000000, 28200000, ''],
    ['หมวดอุดหนุนจากหน่วยงานอื่น', 18500000, 11200000, '']
  ];
  const wsRev = XLSX.utils.aoa_to_sheet(revTemplate);
  XLSX.utils.book_append_sheet(wb, wsRev, 'เทมเพลต_หมวดรายรับ');

  // Sheet 2: หมวดรายจ่าย
  const expTemplate = [
    ['หมวดรายจ่ายหลัก', 'รายการย่อย', 'ประมาณการ (บาท)', 'จ่ายจริง (บาท)', 'หมายเหตุ'],
    ['งบบุคลากร', 'เงินเดือน (ฝ่ายการเมือง)', 12500000, 7290000, ''],
    ['งบบุคลากร', 'เงินเดือน (ฝ่ายประจำ)', 172500000, 101110000, ''],
    ['งบดำเนินงาน', 'ค่าตอบแทน', 24000000, 13900000, ''],
    ['งบดำเนินงาน', 'ค่าใช้สอย', 65000000, 37400000, ''],
    ['งบดำเนินงาน', 'ค่าวัสดุ', 38000000, 21500000, ''],
    ['งบดำเนินงาน', 'ค่าสาธารณูปโภค', 18000000, 9800000, ''],
    ['งบกลาง', '3.1 ค่าชำระหนี้เงินกู้/ดอกเบี้ย', 14000000, 8200000, ''],
    ['งบกลาง', '3.2 เงินสมทบกองทุนเงินประกันสังคม/เงินทดแทน', 12000000, 6800000, ''],
    ['งบกลาง', '3.3 เบี้ยยังชีพ', 70000000, 40500000, ''],
    ['งบกลาง', '3.4 เงินสำรองจ่าย', 18000000, 8500000, ''],
    ['งบกลาง', '3.5 รายจ่ายตามข้อผูกพัน', 10000000, 5200000, ''],
    ['งบกลาง', '3.6 เงินช่วยพิเศษ', 4000000, 2000000, ''],
    ['งบลงทุน', 'ค่าครุภัณฑ์', 28000000, 14200000, ''],
    ['งบลงทุน', 'ค่าที่ดินและสิ่งปลูกสร้าง', 68000000, 34700000, ''],
    ['งบเงินอุดหนุน', '5.1 เงินอุดหนุนส่วนราชการ', 26000000, 14500000, ''],
    ['งบเงินอุดหนุน', '5.2 เงินอุดหนุนรัฐวิสาหกิจ', 12000000, 6500000, ''],
    ['งบเงินอุดหนุน', '5.3 เงินอุดหนุนองค์กรประชาชน', 14000000, 7500000, ''],
    ['งบเงินอุดหนุน', '5.4 เงินอุดหนุนขององค์กรศาสนา', 6000000, 3000000, ''],
    ['งบรายจ่ายอื่น', 'รายจ่ายอื่นตามระเบียบกระทรวงมหาดไทย', 14000000, 6200000, '']
  ];
  const wsExp = XLSX.utils.aoa_to_sheet(expTemplate);
  XLSX.utils.book_append_sheet(wb, wsExp, 'เทมเพลต_หมวดรายจ่าย');

  // Sheet 3: พิสูจน์ยอดเงินสะสม
  const proofTemplate = [
    ['รายการตามระเบียบกระทรวงมหาดไทย', 'จำนวนเงิน (บาท)', 'หมายเหตุ'],
    ['1. เงินสะสมบัญชีเงินฝากธนาคาร 30 กันยายน 2569', 185000000, 'ระบุยอดคงเหลือ ณ สิ้นปีงบประมาณที่ล่วงมา'],
    ['2. หัก เงินสมทบกองทุนส่งเสริมกิจการขององค์กรปกครองส่วนท้องถิ่น', 9250000, 'หักตามระเบียบ'],
    ['3. หัก ค่าใช้จ่ายด้านบุคลากรไม่น้อยกว่า 3 เดือน', 45000000, 'สำรอง 3 เดือน'],
    ['4. หัก ร้อยละ 15 ของงบประมาณรายจ่ายประจำปี', 30000000, 'ร้อยละ 15'],
    ['5. หัก เงินสะสมคงเหลือขั้นต่ำตามระเบียบฯ', 20000000, 'ขั้นต่ำตามระเบียบ'],
    ['6. หัก เงินสะสมที่ได้รับอนุมัติแล้ว ในปีปัจจุบัน', 15000000, 'อนุมัติแล้ว'],
    ['7. หัก ถอนคืนเงินได้รับข้ามปีงบประมาณ', 1800000, 'ถอนคืน'],
    ['8. บวก เงินสะสมที่เหลือจากการอนุมัติหลังจากก่อหนี้ผูกพัน', 3500000, 'เงินเหลือจากการก่อหนี้'],
    ['9. บวก รับคืนเงินรายจ่าย/รับรายได้ข้ามปีงบประมาณ', 2100000, 'รับคืนข้ามปี']
  ];
  const wsProof = XLSX.utils.aoa_to_sheet(proofTemplate);
  XLSX.utils.book_append_sheet(wb, wsProof, 'เทมเพลต_พิสูจน์เงินสะสม');

  // Sheet 4: งบประมาณและโครงการ
  const projTemplate = [
    ['หมวดเงิน/โครงการ', 'ชื่อรายการ_โครงการ', 'งบประมาณ (บาท)', 'เบิกจ่าย (บาท)', 'ปีงบประมาณ', 'สถานะ', 'หน่วยงานรับผิดชอบ'],
    ['เงินอุดหนุนเฉพาะกิจ', 'โครงการปรับปรุงท่อระบายน้ำถนนนครสวรรค์', 5000000, 3200000, '2570', 'อยู่ระหว่างดำเนินการ', 'กองช่าง'],
    ['เงินสะสม', 'โครงการปรับภูมิทัศน์สวนสาธารณะเฉลิมพระเกียรติ', 2000000, 1500000, '2570', 'ดำเนินการเสร็จสิ้น', 'ฝ่ายบริหารงานคลัง'],
    ['เงินรางวัลบริหารจัดการที่ดี', 'โครงการดิจิทัลสมาร์ทซิตี้เทศบาลเมืองมหาสารคาม', 1500000, 1200000, '2570', 'ดำเนินการเสร็จสิ้น', 'กองคลัง'],
    ['ค่าใช้จ่ายค้างจ่าย', 'ค่ากระแสไฟฟ้าค้างชำระเดือนกันยายน 2569', 1800000, 1800000, '2570', 'ดำเนินการเสร็จสิ้น', 'ฝ่ายการเงินและบัญชี'],
    ['อุดหนุนจากหน่วยงานอื่น', 'เงินอุดหนุนโครงการส่งเสริมสุขภาพจาก สปสช.', 2500000, 2000000, '2570', 'อยู่ระหว่างดำเนินการ', 'กองสาธารณสุข']
  ];
  const wsProj = XLSX.utils.aoa_to_sheet(projTemplate);
  XLSX.utils.book_append_sheet(wb, wsProj, 'เทมเพลต_งบโครงการ');

  // Sheet 5: ติดตามงานการคลัง
  const taskTemplate = [
    ['ชื่อรายงาน / ภารกิจ', 'กำหนดเวลา / วันที่', 'ประจำงวด/เดือน', 'สถานะการดำเนินงาน', 'ผู้รับผิดชอบ', 'หมายเหตุ'],
    ['ส่งรายงานงบการเงินประจำเดือนให้ผู้บริหาร', 'ทุกวันที่ ๕ ของเดือน', 'ตุลาคม ๒๕๖๙', 'ดำเนินการเสร็จสิ้น', 'ฝ่ายการเงินและบัญชี', ''],
    ['กระทบยอดเงินฝากธนาคาร (Bank Reconcile)', 'ทุกสิ้นเดือน', 'ตุลาคม ๒๕๖๙', 'ดำเนินการเสร็จสิ้น', 'ฝ่ายการเงินและบัญชี', ''],
    ['รายงานสถานะเงินสะสมประจำไตรมาสที่ ๑', '๑๕ มกราคม ๒๕๗๐', 'ไตรมาส ๑', 'อยู่ระหว่างดำเนินการ', 'ฝ่ายบริหารงานคลัง', '']
  ];
  const wsTask = XLSX.utils.aoa_to_sheet(taskTemplate);
  XLSX.utils.book_append_sheet(wb, wsTask, 'เทมเพลต_ติดตามงาน');

  // Sheet 6: บันทึกข้อความราชการ
  const memoTemplate = [
    ['รายการฟิลด์', 'ค่าข้อมูล', 'คำอธิบาย'],
    ['เลขที่หนังสือ', 'มค ๕๒๐๐๒/๑๐๘๔', 'เลขที่ออกหนังสือราชการ'],
    ['วันที่บันทึก', '๒ พฤศจิกายน ๒๕๖๙', 'วันที่ออกบันทึกข้อความ'],
    ['เรื่อง', 'รายงานผลการดำเนินงานทางการเงินและงบประมาณ ประจำปีงบประมาณ พ.ศ. ๒๕๗๐', 'ชื่อเรื่องบันทึก'],
    ['เรียน', 'นายกเทศมนตรีเมืองมหาสารคาม', 'บุคคลที่เรียนเสนอ'],
    ['ส่วนราชการ', 'ฝ่ายการเงินและบัญชี และฝ่ายบริหารงานคลัง กองคลัง โทร. ๐-๔๓๗๑-๑๒๙๕', 'หน่วยงานเจ้าของเรื่อง'],
    ['ชื่อผู้รายงาน', 'นายสมคิด ยอดคลัง', 'ชื่อเจ้าหน้าที่ผู้จัดทำรายงาน'],
    ['ตำแหน่งผู้รายงาน', 'นักวิชาการเงินและบัญชีชำนาญการ', 'ตำแหน่งของผู้รายงาน'],
    ['ชื่อผู้อำนวยการกองคลัง', 'นางกัญญา รัตนวิมล', 'ชื่อผู้อำนวยการกองคลัง'],
    ['ตำแหน่งผู้อำนวยการกองคลัง', 'ผู้อำนวยการกองคลัง', 'ตำแหน่งผู้อำนวยการ'],
    ['ความเห็นผู้อำนวยการ', 'ได้ตรวจสอบความถูกต้องครบถ้วนแล้ว เห็นควรเสนอพิจารณาอนุมัติ', 'ข้อเสนอแนะความเห็น'],
    ['ชื่อผู้มีอำนาจอนุมัติ', 'นายสมเกียรติ สิทธิคุณ', 'ชื่อนายกเทศมนตรี/ผู้มีอำนาจ'],
    ['ตำแหน่งผู้มีอำนาจอนุมัติ', 'นายกเทศมนตรีเมืองมหาสารคาม', 'ตำแหน่งผู้มีอำนาจอนุมัติ'],
    ['คำสั่งการ', 'ทราบและอนุมัติให้ดำเนินการต่อไป', 'คำสั่งการผู้บริหาร']
  ];
  const wsMemo = XLSX.utils.aoa_to_sheet(memoTemplate);
  XLSX.utils.book_append_sheet(wb, wsMemo, 'เทมเพลต_บันทึกราชการ');

  // Sheet 7: บันทึกประจำวัน
  const dailyTemplate = [
    ['วันที่ (YYYY-MM-DD)', 'ประเภท (รายรับ/รายจ่าย)', 'หมวดหมู่', 'รายการย่อย', 'จำนวนเงิน (บาท)', 'เลขที่เอกสาร', 'คำอธิบายรายการ'],
    ['2026-11-01', 'รายรับ', 'หมวดภาษีอากร', 'ภาษีที่ดินและสิ่งปลูกสร้าง', 250000, 'ใบเสร็จ ล.01/105', 'รับชำระภาษีที่ดินประจำวัน'],
    ['2026-11-01', 'รายจ่าย', 'งบบุคลากร', 'เงินเดือน (ฝ่ายประจำ)', 4250000, 'ฎีกา 210/2570', 'เบิกจ่ายเงินเดือนรอบสิ้นเดือน']
  ];
  const wsDaily = XLSX.utils.aoa_to_sheet(dailyTemplate);
  XLSX.utils.book_append_sheet(wb, wsDaily, 'เทมเพลต_บันทึกประจำวัน');

  XLSX.writeFile(wb, 'เทมเพลตนำเข้าข้อมูล_ครบทุกเมนู_กองคลัง_เทศบาลเมืองมหาสารคาม_2570.xlsx');
}

// -------------------------------------------------------------
// 4. INDIVIDUAL MENU TEMPLATE DOWNLOAD
// -------------------------------------------------------------
export function downloadSingleMenuTemplate(menuKey: string): void {
  const wb = XLSX.utils.book_new();

  switch (menuKey) {
    case 'revenue': {
      const rows = [
        ['หมวดรายรับ', 'ประมาณการ (บาท)', 'รับจริง (บาท)', 'หมายเหตุ'],
        ['หมวดภาษีอากร', 68500000, 42150000, ''],
        ['หมวดค่าธรรมเนียม ค่าปรับ และใบอนุญาต', 14200000, 8950000, ''],
        ['หมวดรายได้จากทรัพย์สิน', 16500000, 10250000, ''],
        ['หมวดรายได้จากสาธารณูปโภค และกิจการพาณิชย์', 21500000, 13800000, ''],
        ['หมวดรายได้เบ็ดเตล็ด', 6800000, 3950000, ''],
        ['หมวดรายได้จากทุน', 8500000, 5400000, ''],
        ['หมวดภาษีจัดสรร', 285000000, 178500000, ''],
        ['หมวดอุดหนุนทั่วไป', 198000000, 125600000, ''],
        ['หมวดเงินอุดหนุนระบุวัตถุประสงค์เฉพาะกิจ', 45000000, 28200000, ''],
        ['หมวดอุดหนุนจากหน่วยงานอื่น', 18500000, 11200000, '']
      ];
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'เทมเพลต_หมวดรายรับ');
      XLSX.writeFile(wb, 'เทมเพลตนำเข้า_หมวดรายรับ_2570.xlsx');
      break;
    }

    case 'expenditure': {
      const rows = [
        ['หมวดรายจ่ายหลัก', 'รายการย่อย', 'ประมาณการ (บาท)', 'จ่ายจริง (บาท)', 'หมายเหตุ'],
        ['งบบุคลากร', 'เงินเดือน (ฝ่ายการเมือง)', 12500000, 7290000, ''],
        ['งบบุคลากร', 'เงินเดือน (ฝ่ายประจำ)', 172500000, 101110000, ''],
        ['งบดำเนินงาน', 'ค่าตอบแทน', 24000000, 13900000, ''],
        ['งบดำเนินงาน', 'ค่าใช้สอย', 65000000, 37400000, ''],
        ['งบดำเนินงาน', 'ค่าวัสดุ', 38000000, 21500000, ''],
        ['งบดำเนินงาน', 'ค่าสาธารณูปโภค', 18000000, 9800000, ''],
        ['งบกลาง', '3.1 ค่าชำระหนี้เงินกู้/ดอกเบี้ย', 14000000, 8200000, ''],
        ['งบกลาง', '3.2 เงินสมทบกองทุนเงินประกันสังคม/เงินทดแทน', 12000000, 6800000, ''],
        ['งบกลาง', '3.3 เบี้ยยังชีพ', 70000000, 40500000, ''],
        ['งบกลาง', '3.4 เงินสำรองจ่าย', 18000000, 8500000, ''],
        ['งบกลาง', '3.5 รายจ่ายตามข้อผูกพัน', 10000000, 5200000, ''],
        ['งบกลาง', '3.6 เงินช่วยพิเศษ', 4000000, 2000000, ''],
        ['งบลงทุน', 'ค่าครุภัณฑ์', 28000000, 14200000, ''],
        ['งบลงทุน', 'ค่าที่ดินและสิ่งปลูกสร้าง', 68000000, 34700000, ''],
        ['งบเงินอุดหนุน', '5.1 เงินอุดหนุนส่วนราชการ', 26000000, 14500000, ''],
        ['งบเงินอุดหนุน', '5.2 เงินอุดหนุนรัฐวิสาหกิจ', 12000000, 6500000, ''],
        ['งบเงินอุดหนุน', '5.3 เงินอุดหนุนองค์กรประชาชน', 14000000, 7500000, ''],
        ['งบเงินอุดหนุน', '5.4 เงินอุดหนุนขององค์กรศาสนา', 6000000, 3000000, ''],
        ['งบรายจ่ายอื่น', 'รายจ่ายอื่นตามระเบียบกระทรวงมหาดไทย', 14000000, 6200000, '']
      ];
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'เทมเพลต_หมวดรายจ่าย');
      XLSX.writeFile(wb, 'เทมเพลตนำเข้า_หมวดรายจ่าย_2570.xlsx');
      break;
    }

    case 'proof': {
      const rows = [
        ['รายการตามระเบียบกระทรวงมหาดไทย', 'จำนวนเงิน (บาท)', 'หมายเหตุ'],
        ['1. เงินสะสมบัญชีเงินฝากธนาคาร 30 กันยายน 2569', 185000000, 'ระบุยอดคงเหลือ ณ สิ้นปีงบประมาณที่ล่วงมา'],
        ['2. หัก เงินสมทบกองทุนส่งเสริมกิจการขององค์กรปกครองส่วนท้องถิ่น', 9250000, 'หักตามระเบียบ'],
        ['3. หัก ค่าใช้จ่ายด้านบุคลากรไม่น้อยกว่า 3 เดือน', 45000000, 'สำรอง 3 เดือน'],
        ['4. หัก ร้อยละ 15 ของงบประมาณรายจ่ายประจำปี', 30000000, 'ร้อยละ 15'],
        ['5. หัก เงินสะสมคงเหลือขั้นต่ำตามระเบียบฯ', 20000000, 'ขั้นต่ำตามระเบียบ'],
        ['6. หัก เงินสะสมที่ได้รับอนุมัติแล้ว ในปีปัจจุบัน', 15000000, 'อนุมัติแล้ว'],
        ['7. หัก ถอนคืนเงินได้รับข้ามปีงบประมาณ', 1800000, 'ถอนคืน'],
        ['8. บวก เงินสะสมที่เหลือจากการอนุมัติหลังจากก่อหนี้ผูกพัน', 3500000, 'เงินเหลือจากการก่อหนี้'],
        ['9. บวก รับคืนเงินรายจ่าย/รับรายได้ข้ามปีงบประมาณ', 2100000, 'รับคืนข้ามปี']
      ];
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'เทมเพลต_พิสูจน์เงินสะสม');
      XLSX.writeFile(wb, 'เทมเพลตนำเข้า_พิสูจน์ยอดเงินสะสม_2570.xlsx');
      break;
    }

    case 'funds': {
      const rows = [
        ['หมวดเงิน/โครงการ', 'ชื่อรายการ_โครงการ', 'งบประมาณ (บาท)', 'เบิกจ่าย (บาท)', 'ปีงบประมาณ', 'สถานะ', 'หน่วยงานรับผิดชอบ'],
        ['เงินอุดหนุนเฉพาะกิจ', 'โครงการปรับปรุงท่อระบายน้ำถนนนครสวรรค์', 5000000, 3200000, '2570', 'อยู่ระหว่างดำเนินการ', 'กองช่าง'],
        ['เงินสะสม', 'โครงการปรับภูมิทัศน์สวนสาธารณะเฉลิมพระเกียรติ', 2000000, 1500000, '2570', 'ดำเนินการเสร็จสิ้น', 'ฝ่ายบริหารงานคลัง'],
        ['เงินรางวัลบริหารจัดการที่ดี', 'โครงการดิจิทัลสมาร์ทซิตี้เทศบาลเมืองมหาสารคาม', 1500000, 1200000, '2570', 'ดำเนินการเสร็จสิ้น', 'กองคลัง'],
        ['ค่าใช้จ่ายค้างจ่าย', 'ค่ากระแสไฟฟ้าค้างชำระเดือนกันยายน 2569', 1800000, 1800000, '2570', 'ดำเนินการเสร็จสิ้น', 'ฝ่ายการเงินและบัญชี'],
        ['อุดหนุนจากหน่วยงานอื่น', 'เงินอุดหนุนโครงการส่งเสริมสุขภาพจาก สปสช.', 2500000, 2000000, '2570', 'อยู่ระหว่างดำเนินการ', 'กองสาธารณสุข']
      ];
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'เทมเพลต_งบโครงการ');
      XLSX.writeFile(wb, 'เทมเพลตนำเข้า_งบประมาณและโครงการ_2570.xlsx');
      break;
    }

    case 'tasks': {
      const rows = [
        ['ชื่อรายงาน / ภารกิจ', 'กำหนดเวลา / วันที่', 'ประจำงวด/เดือน', 'สถานะการดำเนินงาน', 'ผู้รับผิดชอบ', 'หมายเหตุ'],
        ['ส่งรายงานงบการเงินประจำเดือนให้ผู้บริหาร', 'ทุกวันที่ ๕ ของเดือน', 'ตุลาคม ๒๕๖๙', 'ดำเนินการเสร็จสิ้น', 'ฝ่ายการเงินและบัญชี', ''],
        ['กระทบยอดเงินฝากธนาคาร (Bank Reconcile)', 'ทุกสิ้นเดือน', 'ตุลาคม ๒๕๖๙', 'ดำเนินการเสร็จสิ้น', 'ฝ่ายการเงินและบัญชี', ''],
        ['รายงานสถานะเงินสะสมประจำไตรมาสที่ ๑', '๑๕ มกราคม ๒๕๗๐', 'ไตรมาส ๑', 'อยู่ระหว่างดำเนินการ', 'ฝ่ายบริหารงานคลัง', '']
      ];
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'เทมเพลต_ติดตามงาน');
      XLSX.writeFile(wb, 'เทมเพลตนำเข้า_รายงานติดตามงานการคลัง_2570.xlsx');
      break;
    }

    case 'memo': {
      const rows = [
        ['รายการฟิลด์', 'ค่าข้อมูล', 'คำอธิบาย'],
        ['เลขที่หนังสือ', 'มค ๕๒๐๐๒/๑๐๘๔', 'เลขที่ออกหนังสือราชการ'],
        ['วันที่บันทึก', '๒ พฤศจิกายน ๒๕๖๙', 'วันที่ออกบันทึกข้อความ'],
        ['เรื่อง', 'รายงานผลการดำเนินงานทางการเงินและงบประมาณ ประจำปีงบประมาณ พ.ศ. ๒๕๗๐', 'ชื่อเรื่องบันทึก'],
        ['เรียน', 'นายกเทศมนตรีเมืองมหาสารคาม', 'บุคคลที่เรียนเสนอ'],
        ['ส่วนราชการ', 'ฝ่ายการเงินและบัญชี และฝ่ายบริหารงานคลัง กองคลัง โทร. ๐-๔๓๗๑-๑๒๙๕', 'หน่วยงานเจ้าของเรื่อง'],
        ['ชื่อผู้รายงาน', 'นายสมคิด ยอดคลัง', 'ชื่อเจ้าหน้าที่ผู้จัดทำรายงาน'],
        ['ตำแหน่งผู้รายงาน', 'นักวิชาการเงินและบัญชีชำนาญการ', 'ตำแหน่งของผู้รายงาน'],
        ['ชื่อผู้อำนวยการกองคลัง', 'นางกัญญา รัตนวิมล', 'ชื่อผู้อำนวยการกองคลัง'],
        ['ตำแหน่งผู้อำนวยการกองคลัง', 'ผู้อำนวยการกองคลัง', 'ตำแหน่งผู้อำนวยการ'],
        ['ความเห็นผู้อำนวยการ', 'ได้ตรวจสอบความถูกต้องครบถ้วนแล้ว เห็นควรเสนอพิจารณาอนุมัติ', 'ข้อเสนอแนะความเห็น'],
        ['ชื่อผู้มีอำนาจอนุมัติ', 'นายสมเกียรติ สิทธิคุณ', 'ชื่อนายกเทศมนตรี/ผู้มีอำนาจ'],
        ['ตำแหน่งผู้มีอำนาจอนุมัติ', 'นายกเทศมนตรีเมืองมหาสารคาม', 'ตำแหน่งผู้มีอำนาจอนุมัติ'],
        ['คำสั่งการ', 'ทราบและอนุมัติให้ดำเนินการต่อไป', 'คำสั่งการผู้บริหาร']
      ];
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'เทมเพลต_บันทึกราชการ');
      XLSX.writeFile(wb, 'เทมเพลตนำเข้า_บันทึกข้อความราชการ_2570.xlsx');
      break;
    }

    case 'daily': {
      const rows = [
        ['วันที่ (YYYY-MM-DD)', 'ประเภท (รายรับ/รายจ่าย)', 'หมวดหมู่', 'รายการย่อย', 'จำนวนเงิน (บาท)', 'เลขที่เอกสาร', 'คำอธิบายรายการ'],
        ['2026-11-01', 'รายรับ', 'หมวดภาษีอากร', 'ภาษีที่ดินและสิ่งปลูกสร้าง', 250000, 'ใบเสร็จ ล.01/105', 'รับชำระภาษีที่ดินประจำวัน'],
        ['2026-11-01', 'รายจ่าย', 'งบบุคลากร', 'เงินเดือน (ฝ่ายประจำ)', 4250000, 'ฎีกา 210/2570', 'เบิกจ่ายเงินเดือนรอบสิ้นเดือน']
      ];
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'เทมเพลต_บันทึกประจำวัน');
      XLSX.writeFile(wb, 'เทมเพลตนำเข้า_บันทึกประจำวัน_2570.xlsx');
      break;
    }

    default:
      downloadAllMenusTemplate();
  }
}

// Backward compatible sample template alias
export function downloadSampleTemplate(): void {
  downloadAllMenusTemplate();
}

// Backward compatible single category export alias
export function exportSingleCategory(name: string, items: any[], filename: string): void {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(items);
  XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// -------------------------------------------------------------
// 5. PARSE EXCEL / CSV FILE
// -------------------------------------------------------------
export async function parseExcelFile(file: File): Promise<{
  sheets: { [sheetName: string]: any[] };
  sheetNames: string[];
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheets: { [sheetName: string]: any[] } = {};

        workbook.SheetNames.forEach((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          sheets[sheetName] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        });

        resolve({
          sheets,
          sheetNames: workbook.SheetNames
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

// Helper to sanitize numeric values from cell
function cleanNumber(val: any): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const cleaned = String(val).replace(/,/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

// -------------------------------------------------------------
// 6. PROCESS IMPORT FOR SPECIFIC OR ALL MENUS
// -------------------------------------------------------------
export function processMenuImport(
  baseData: MunicipalityData,
  targetMenu: string,
  parsedSheets: { [sheetName: string]: any[] },
  sheetNames: string[],
  importMode: 'append' | 'replace'
): { updatedData: MunicipalityData; message: string; rowsProcessed: number } {
  const updatedData: MunicipalityData = JSON.parse(JSON.stringify(baseData));
  let message = '';
  let rowsProcessed = 0;

  // Helper to pick the best matching sheet
  const findSheet = (keywords: string[]): any[] | null => {
    // 1. Try exact or partial keyword match in sheet names
    for (const kw of keywords) {
      const match = sheetNames.find((s) => s.toLowerCase().includes(kw.toLowerCase()));
      if (match && parsedSheets[match] && parsedSheets[match].length > 0) {
        return parsedSheets[match];
      }
    }
    // 2. If targetMenu is explicit and there's only 1 sheet, use it!
    if (sheetNames.length === 1 && parsedSheets[sheetNames[0]]) {
      return parsedSheets[sheetNames[0]];
    }
    return null;
  };

  // Sub-processors for each menu
  const processRevenue = (rows: any[]): number => {
    let count = 0;
    // Map rows. Look for header index or rows starting from index 0/1
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;
      const strRow = row.map((cell: any) => String(cell || '').trim());
      // Skip header
      if (strRow.some((c: string) => c.includes('หมวดรายรับ') || c.includes('ประมาณการ'))) {
        continue;
      }

      // Determine columns: [name, estimate, actual] or [index, name, estimate, actual]
      let catName = '';
      let est = 0;
      let act = 0;
      let notes = '';

      if (isNaN(parseFloat(strRow[0])) && strRow[0].length > 2) {
        catName = strRow[0];
        est = cleanNumber(strRow[1]);
        act = cleanNumber(strRow[2]);
        notes = strRow[3] || '';
      } else if (strRow.length >= 3) {
        catName = strRow[1] || '';
        est = cleanNumber(strRow[2]);
        act = cleanNumber(strRow[3]);
        notes = strRow[4] || '';
      }

      if (catName && (est > 0 || act > 0)) {
        // Clean name
        const cleanName = catName.replace(/^\[หมวดใหญ่\]\s*/, '').replace(/^\d+\.\s*/, '').trim();
        // Match existing category
        const existing = updatedData.revenueCategories.find(
          (c) => c.name.trim() === cleanName || cleanName.includes(c.name.trim()) || c.name.includes(cleanName)
        );

        if (existing) {
          existing.estimate = est;
          existing.actual = act;
          if (notes) existing.notes = notes;
          count++;
        } else if (importMode === 'append') {
          updatedData.revenueCategories.push({
            id: `rev_imp_${Date.now()}_${i}`,
            name: cleanName,
            estimate: est,
            actual: act,
            notes,
            subItems: []
          });
          count++;
        }
      }
    }
    return count;
  };

  const processExpenditure = (rows: any[]): number => {
    let count = 0;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;
      const strRow = row.map((cell: any) => String(cell || '').trim());
      if (strRow.some((c: string) => c.includes('หมวดรายจ่าย') || c.includes('จ่ายจริง'))) {
        continue;
      }

      let mainCat = '';
      let subName = '';
      let est = 0;
      let act = 0;

      // Check structure: [main, sub, est, act] or [idx, main, sub, est, act]
      if (strRow.length >= 4) {
        if (isNaN(parseFloat(strRow[0])) && strRow[0].length > 2) {
          mainCat = strRow[0];
          subName = strRow[1];
          est = cleanNumber(strRow[2]);
          act = cleanNumber(strRow[3]);
        } else {
          mainCat = strRow[1];
          subName = strRow[2];
          est = cleanNumber(strRow[3]);
          act = cleanNumber(strRow[4]);
        }
      }

      if (mainCat && (est > 0 || act > 0)) {
        const cleanMain = mainCat.replace(/^\[หมวด\]\s*/, '').replace(/^\d+\.\s*/, '').replace(/^[-\s]+/, '').trim();
        const existingCat = updatedData.expenditureCategories.find(
          (c) => c.name.trim() === cleanMain || cleanMain.includes(c.name.trim()) || c.name.includes(cleanMain)
        );

        if (existingCat) {
          if (subName && subName !== '-') {
            // Find or update subItem
            const cleanSub = subName.replace(/^[-\s]+/, '').trim();
            existingCat.subItems = existingCat.subItems || [];
            const existingSub = existingCat.subItems.find(
              (s) => s.name.trim() === cleanSub || cleanSub.includes(s.name.trim()) || s.name.includes(cleanSub)
            );
            if (existingSub) {
              existingSub.estimate = est;
              existingSub.actual = act;
            } else {
              existingCat.subItems.push({
                id: `exp_sub_imp_${Date.now()}_${i}`,
                name: cleanSub,
                estimate: est,
                actual: act
              });
            }
            // Recalculate parent category
            existingCat.estimate = existingCat.subItems.reduce((sum, s) => sum + s.estimate, 0);
            existingCat.actual = existingCat.subItems.reduce((sum, s) => sum + s.actual, 0);
          } else {
            existingCat.estimate = est;
            existingCat.actual = act;
          }
          count++;
        }
      }
    }
    return count;
  };

  const processProof = (rows: any[]): number => {
    let count = 0;
    const ap = updatedData.accumulatedProof;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length < 2) continue;
      const label = String(row[0] || row[1] || '');
      const val = cleanNumber(row[1] || row[2] || 0);

      if (label.includes('30 กันยายน 2569') || label.includes('เงินฝากธนาคาร')) {
        ap.bankBalanceSept30 = val;
        count++;
      } else if (label.includes('ส่งเสริมกิจการ')) {
        ap.deductLocalFund = val;
        count++;
      } else if (label.includes('บุคลากร') && label.includes('3 เดือน')) {
        ap.deductPersonnel3Months = val;
        count++;
      } else if (label.includes('ร้อยละ 15') || label.includes('15%')) {
        ap.deductFifteenPercentExpense = val;
        count++;
      } else if (label.includes('ขั้นต่ำตามระเบียบ') || label.includes('คงเหลือขั้นต่ำ')) {
        ap.deductStatutoryReserve = val;
        count++;
      } else if (label.includes('อนุมัติแล้ว') && label.includes('ปีปัจจุบัน')) {
        ap.deductCurrentYearApproved = val;
        count++;
      } else if (label.includes('ถอนคืน') || label.includes('ข้ามปีงบประมาณ')) {
        ap.deductCrossYearRefund = val;
        count++;
      } else if (label.includes('ก่อหนี้ผูกพัน') || label.includes('เหลือจากการอนุมัติ')) {
        ap.addApprovedObligationRemaining = val;
        count++;
      } else if (label.includes('รับคืนเงินรายจ่าย') || label.includes('รับรายได้ข้ามปี')) {
        ap.addCrossYearRevenueReturn = val;
        count++;
      }
    }
    return count;
  };

  const processFunds = (rows: any[]): number => {
    let count = 0;
    const newItems: { category: string; item: FundProjectItem }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length < 3) continue;
      const strRow = row.map((cell: any) => String(cell || '').trim());
      if (strRow.some((c: string) => c.includes('หมวดเงิน') || c.includes('งบประมาณ (บาท)'))) continue;

      let cat = '';
      let title = '';
      let budget = 0;
      let disbursed = 0;
      let fy = '2570';
      let status = 'อยู่ระหว่างดำเนินการ';
      let dept = 'กองคลัง';

      if (isNaN(parseFloat(strRow[0])) && strRow[0].length > 2) {
        cat = strRow[0];
        title = strRow[1];
        budget = cleanNumber(strRow[2]);
        disbursed = cleanNumber(strRow[3]);
        fy = strRow[4] || '2570';
        status = strRow[5] || 'อยู่ระหว่างดำเนินการ';
        dept = strRow[6] || 'กองคลัง';
      } else if (strRow.length >= 4) {
        cat = strRow[1];
        title = strRow[2];
        budget = cleanNumber(strRow[3]);
        disbursed = cleanNumber(strRow[4]);
        fy = strRow[5] || '2570';
        status = strRow[6] || 'อยู่ระหว่างดำเนินการ';
        dept = strRow[7] || 'กองคลัง';
      }

      if (title && budget > 0) {
        newItems.push({
          category: cat,
          item: {
            id: `imp_fund_${Date.now()}_${i}`,
            title,
            budget,
            disbursed,
            fiscalYear: fy,
            status,
            department: dept
          }
        });
        count++;
      }
    }

    if (newItems.length > 0) {
      if (importMode === 'replace') {
        updatedData.specialGrantProjects = [];
        updatedData.accumulatedFundProjects = [];
        updatedData.goodGovernanceProjects = [];
        updatedData.accruedExpenses = [];
        updatedData.externalSubsidies = [];
      }

      newItems.forEach(({ category, item }) => {
        if (category.includes('เฉพาะกิจ')) {
          updatedData.specialGrantProjects.push(item);
        } else if (category.includes('สะสม')) {
          updatedData.accumulatedFundProjects.push(item);
        } else if (category.includes('รางวัล') || category.includes('บริหารดี')) {
          updatedData.goodGovernanceProjects.push(item);
        } else if (category.includes('ค้างจ่าย')) {
          updatedData.accruedExpenses.push(item);
        } else {
          updatedData.externalSubsidies.push(item);
        }
      });
    }

    return count;
  };

  const processTasks = (rows: any[]): number => {
    let count = 0;
    const newTasks: StatusTaskItem[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length < 2) continue;
      const strRow = row.map((cell: any) => String(cell || '').trim());
      if (strRow.some((c: string) => c.includes('ชื่อรายงาน') || c.includes('กำหนดเวลา'))) continue;

      let name = '';
      let date = '';
      let month = '';
      let status: any = 'ดำเนินการเสร็จสิ้น';
      let resp = 'ฝ่ายการเงินและบัญชี';
      let note = '';

      if (isNaN(parseFloat(strRow[0])) && strRow[0].length > 2) {
        name = strRow[0];
        date = strRow[1] || '';
        month = strRow[2] || '';
        status = strRow[3] || 'ดำเนินการเสร็จสิ้น';
        resp = strRow[4] || 'ฝ่ายการเงินและบัญชี';
        note = strRow[5] || '';
      } else if (strRow.length >= 3) {
        name = strRow[1];
        date = strRow[2] || '';
        month = strRow[3] || '';
        status = strRow[4] || 'ดำเนินการเสร็จสิ้น';
        resp = strRow[5] || 'ฝ่ายการเงินและบัญชี';
        note = strRow[6] || '';
      }

      if (name) {
        newTasks.push({
          id: `imp_task_${Date.now()}_${i}`,
          name,
          date,
          month,
          status,
          responsible: resp,
          note
        });
        count++;
      }
    }

    if (newTasks.length > 0) {
      if (importMode === 'replace') {
        updatedData.statusTasks = newTasks;
      } else {
        updatedData.statusTasks = [...updatedData.statusTasks, ...newTasks];
      }
    }

    return count;
  };

  const processMemo = (rows: any[]): number => {
    let count = 0;
    const memo = updatedData.memorandum;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length < 2) continue;
      const key = String(row[0] || '').trim();
      const val = String(row[1] || '').trim();
      if (!val) continue;

      if (key.includes('เลขที่หนังสือ')) {
        memo.docNumber = val;
        count++;
      } else if (key.includes('วันที่')) {
        memo.date = val;
        count++;
      } else if (key.includes('เรื่อง')) {
        memo.subject = val;
        count++;
      } else if (key.includes('เรียน')) {
        memo.toWhom = val;
        count++;
      } else if (key.includes('ส่วนราชการ')) {
        memo.fromAgency = val;
        count++;
      } else if (key.includes('ผู้รายงาน') && key.includes('ชื่อ')) {
        memo.reporterName = val;
        count++;
      } else if (key.includes('ผู้รายงาน') && key.includes('ตำแหน่ง')) {
        memo.reporterPosition = val;
        count++;
      } else if (key.includes('ผู้อำนวยการ') && key.includes('ชื่อ')) {
        memo.directorName = val;
        count++;
      } else if (key.includes('ผู้อำนวยการ') && key.includes('ตำแหน่ง')) {
        memo.directorPosition = val;
        count++;
      } else if (key.includes('ความเห็นผู้อำนวยการ')) {
        memo.directorComment = val;
        count++;
      } else if (key.includes('ผู้มีอำนาจ') && key.includes('ชื่อ')) {
        memo.approverName = val;
        count++;
      } else if (key.includes('ผู้มีอำนาจ') && key.includes('ตำแหน่ง')) {
        memo.approverPosition = val;
        count++;
      } else if (key.includes('คำสั่งการ') || key.includes('อนุมัติ')) {
        memo.approverComment = val;
        count++;
      }
    }
    return count;
  };

  const processDaily = (rows: any[]): number => {
    let count = 0;
    const newDaily: DailyTransaction[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length < 3) continue;
      const strRow = row.map((cell: any) => String(cell || '').trim());
      if (strRow.some((c: string) => c.includes('วันที่') || c.includes('จำนวนเงิน'))) continue;

      let date = '';
      let type: 'revenue' | 'expenditure' = 'revenue';
      let cat = '';
      let subCat = '';
      let amount = 0;
      let doc = '';
      let desc = '';

      if (strRow[0].includes('-') || strRow[0].length === 10) {
        date = strRow[0];
        type = strRow[1].includes('จ่าย') ? 'expenditure' : 'revenue';
        cat = strRow[2] || '';
        subCat = strRow[3] || '';
        amount = cleanNumber(strRow[4]);
        doc = strRow[5] || '';
        desc = strRow[6] || '';
      } else if (strRow.length >= 4) {
        date = strRow[1] || '';
        type = strRow[2].includes('จ่าย') ? 'expenditure' : 'revenue';
        cat = strRow[3] || '';
        subCat = strRow[4] || '';
        amount = cleanNumber(strRow[5]);
        doc = strRow[6] || '';
        desc = strRow[7] || '';
      }

      if (amount > 0) {
        newDaily.push({
          id: `imp_daily_${Date.now()}_${i}`,
          date: date || new Date().toISOString().split('T')[0],
          type,
          category: cat || 'ทั่วไป',
          subCategory: subCat,
          amount,
          docNumber: doc,
          description: desc,
          recordedBy: 'นำเข้าจาก Excel'
        });
        count++;
      }
    }

    if (newDaily.length > 0) {
      if (importMode === 'replace') {
        updatedData.dailyEntries = newDaily;
      } else {
        updatedData.dailyEntries = [...newDaily, ...updatedData.dailyEntries];
      }
    }
    return count;
  };

  // Branch execution according to targetMenu
  if (targetMenu === 'revenue') {
    const rows = findSheet(['รายรับ', 'revenue']) || (sheetNames.length > 0 ? parsedSheets[sheetNames[0]] : null);
    if (!rows) throw new Error('ไม่พบข้อมูลสำหรับหมวดรายรับในไฟล์ที่เลือก');
    rowsProcessed = processRevenue(rows);
    message = `นำเข้าข้อมูลหมวดรายรับสำเร็จ จำนวน ${rowsProcessed} รายการ`;
  } else if (targetMenu === 'expenditure') {
    const rows = findSheet(['รายจ่าย', 'expenditure']) || (sheetNames.length > 0 ? parsedSheets[sheetNames[0]] : null);
    if (!rows) throw new Error('ไม่พบข้อมูลสำหรับหมวดรายจ่ายในไฟล์ที่เลือก');
    rowsProcessed = processExpenditure(rows);
    message = `นำเข้าข้อมูลหมวดรายจ่ายสำเร็จ จำนวน ${rowsProcessed} รายการ`;
  } else if (targetMenu === 'proof') {
    const rows = findSheet(['พิสูจน์', 'เงินสะสม', 'proof']) || (sheetNames.length > 0 ? parsedSheets[sheetNames[0]] : null);
    if (!rows) throw new Error('ไม่พบข้อมูลสำหรับรายงานพิสูจน์ยอดเงินสะสมในไฟล์ที่เลือก');
    rowsProcessed = processProof(rows);
    message = `นำเข้าข้อมูลการพิสูจน์ยอดเงินสะสมสำเร็จ (${rowsProcessed} รายการระเบียบฯ)`;
  } else if (targetMenu === 'funds') {
    const rows = findSheet(['โครงการ', 'งบเฉพาะ', 'funds']) || (sheetNames.length > 0 ? parsedSheets[sheetNames[0]] : null);
    if (!rows) throw new Error('ไม่พบข้อมูลสำหรับงบประมาณและโครงการในไฟล์ที่เลือก');
    rowsProcessed = processFunds(rows);
    message = `นำเข้าข้อมูลงบประมาณและโครงการสำเร็จ จำนวน ${rowsProcessed} โครงการ`;
  } else if (targetMenu === 'tasks') {
    const rows = findSheet(['ติดตามงาน', 'ภารกิจ', 'สถานะ', 'tasks']) || (sheetNames.length > 0 ? parsedSheets[sheetNames[0]] : null);
    if (!rows) throw new Error('ไม่พบข้อมูลสำหรับติดตามงานการคลังในไฟล์ที่เลือก');
    rowsProcessed = processTasks(rows);
    message = `นำเข้าข้อมูลติดตามงานการคลังสำเร็จ จำนวน ${rowsProcessed} ภารกิจ`;
  } else if (targetMenu === 'memo') {
    const rows = findSheet(['บันทึก', 'memo']) || (sheetNames.length > 0 ? parsedSheets[sheetNames[0]] : null);
    if (!rows) throw new Error('ไม่พบข้อมูลสำหรับบันทึกข้อความราชการในไฟล์ที่เลือก');
    rowsProcessed = processMemo(rows);
    message = `นำเข้าข้อมูลบันทึกข้อความราชการสำเร็จ (${rowsProcessed} ฟิลด์ข้อมูล)`;
  } else if (targetMenu === 'daily') {
    const rows = findSheet(['ประจำวัน', 'daily', 'ledger']) || (sheetNames.length > 0 ? parsedSheets[sheetNames[0]] : null);
    if (!rows) throw new Error('ไม่พบข้อมูลบัญชีประจำวันในไฟล์ที่เลือก');
    rowsProcessed = processDaily(rows);
    message = `นำเข้าบัญชีรายรับ-รายจ่ายประจำวันสำเร็จ จำนวน ${rowsProcessed} รายการ`;
  } else {
    // Mode 'all': Automatic multi-sheet detection
    const summaryCounts: string[] = [];

    // Revenue
    const revRows = findSheet(['รายรับ', 'หมวดรายรับ', 'revenue']);
    if (revRows) {
      const c = processRevenue(revRows);
      if (c > 0) summaryCounts.push(`รายรับ ${c} รายการ`);
    }

    // Expenditure
    const expRows = findSheet(['รายจ่าย', 'หมวดรายจ่าย', 'expenditure']);
    if (expRows) {
      const c = processExpenditure(expRows);
      if (c > 0) summaryCounts.push(`รายจ่าย ${c} รายการ`);
    }

    // Proof
    const proofRows = findSheet(['พิสูจน์', 'เงินสะสม', 'proof']);
    if (proofRows) {
      const c = processProof(proofRows);
      if (c > 0) summaryCounts.push(`พิสูจน์เงินสะสม ${c} บรรทัด`);
    }

    // Funds
    const fundRows = findSheet(['โครงการ', 'งบประมาณและโครงการ', 'งบเฉพาะ', 'funds']);
    if (fundRows) {
      const c = processFunds(fundRows);
      if (c > 0) summaryCounts.push(`โครงการ ${c} รายการ`);
    }

    // Tasks
    const taskRows = findSheet(['ติดตามงาน', 'ภารกิจ', 'tasks']);
    if (taskRows) {
      const c = processTasks(taskRows);
      if (c > 0) summaryCounts.push(`ติดตามงาน ${c} ภารกิจ`);
    }

    // Memo
    const memoRows = findSheet(['บันทึก', 'memo']);
    if (memoRows) {
      const c = processMemo(memoRows);
      if (c > 0) summaryCounts.push(`บันทึกราชการ ${c} ฟิลด์`);
    }

    // Daily
    const dailyRows = findSheet(['ประจำวัน', 'daily']);
    if (dailyRows) {
      const c = processDaily(dailyRows);
      if (c > 0) summaryCounts.push(`บัญชีประจำวัน ${c} รายการ`);
    }

    rowsProcessed = summaryCounts.length;
    if (rowsProcessed === 0) {
      // If none of the sheets matched by keyword, try the first sheet with revenue/funds fallback
      const firstRows = parsedSheets[sheetNames[0]];
      if (firstRows && firstRows.length > 0) {
        const cRev = processRevenue(firstRows);
        if (cRev > 0) {
          summaryCounts.push(`รายรับ ${cRev} รายการ`);
        } else {
          const cFund = processFunds(firstRows);
          if (cFund > 0) summaryCounts.push(`โครงการ ${cFund} รายการ`);
        }
      }
    }

    message =
      summaryCounts.length > 0
        ? `นำเข้าข้อมูลอัตโนมัติสำเร็จ: ${summaryCounts.join(', ')}`
        : 'ตรวจพบไฟล์แต่ไม่พบข้อมูลที่ตรงกับโครงสร้างเมนูใด กรุณาตรวจสอบชื่อชีตหรือเลือกเมนูเป้าหมายโดยตรง';
  }

  updatedData.lastUpdated = new Date().toISOString();
  updatedData.lastUpdatedBy = 'นำเข้าผ่านระบบ Excel';

  return { updatedData, message, rowsProcessed };
}
