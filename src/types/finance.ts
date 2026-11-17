export type RoleType = 'staff' | 'director' | 'executive';

export interface UserSession {
  username: string;
  role: RoleType;
  roleTitle: string;
  name: string;
  permissions: {
    canEditDaily: boolean;
    canImportExport: boolean;
    canVerify: boolean;
    canExecutiveOverview: boolean;
  };
}

export interface SubBudget {
  id: string;
  name: string;
  estimate: number;
  actual: number;
}

export interface BudgetCategory {
  id: string;
  name: string;
  estimate: number;
  actual: number;
  notes?: string;
  subItems?: SubBudget[];
}

export interface AccumulatedProof {
  recordDate: string; // YYYY-MM-DD
  bankBalanceSept30: number; // เงินสะสมบัญชีเงินฝากธนาคาร 30 กันยายน 2569
  deductLocalFund: number; // ลบ เงินสมทบกองทุนส่งเสริมกิจการขององค์กรปกครองส่วนท้องถิ่น
  deductPersonnel3Months: number; // ลบ ค่าใช้จ่ายด้านบุคลากรไม่น้อยกว่า 3 เดือน
  deductFifteenPercentExpense: number; // ลบ ร้อยละ 15 ของงบประมาณรายจ่ายประจำปี
  deductStatutoryReserve: number; // ลบ เงินสะสมคงเหลือขั้นต่ำตามระเบียบฯ
  deductCurrentYearApproved: number; // ลบ เงินสะสมที่ได้รับอนุมัติแล้ว ในปีปัจจุบัน
  deductCrossYearRefund: number; // ลบ ถอนคืนเงินได้รับข้ามปีงบประมาณ
  addApprovedObligationRemaining: number; // บวก เงินสะสมที่เหลือจากการอนุมัติหลังจากก่อหนี้ผูกพัน
  addCrossYearRevenueReturn: number; // บวก รับคืนเงินรายจ่าย/รับรายได้ข้ามปีงบประมาณ
  notes?: string;
}

export interface FundProjectItem {
  id: string;
  title: string;
  budget: number;
  disbursed: number;
  fiscalYear: string;
  status: string; // 'ดำเนินการเสร็จสิ้น' | 'อยู่ระหว่างดำเนินการ' | 'ยังไม่ดำเนินการ' | string
  department?: string;
  notes?: string;
}

export interface StatusTaskItem {
  id: string;
  name: string;
  date: string;
  month: string;
  status: 'ดำเนินการเสร็จสิ้น' | 'ยังไม่ดำเนินการ' | string;
  responsible: string;
  note?: string;
}

export interface DailyTransaction {
  id: string;
  date: string; // YYYY-MM-DD
  type: 'revenue' | 'expenditure';
  category: string;
  subCategory?: string;
  amount: number;
  docNumber: string; // เลขที่ใบเสร็จ หรือ เลขที่ฎีกา
  description: string;
  recordedBy: string;
}

export interface MemorandumData {
  docNumber: string;
  date: string;
  subject: string;
  toWhom: string;
  fromAgency: string;
  reporterName: string;
  reporterPosition: string;
  reporterRoleLabel: string;
  directorName: string;
  directorPosition: string;
  directorRoleLabel: string;
  directorComment: string;
  approverName: string;
  approverPosition: string;
  approverRoleLabel: string;
  approverComment: string;
}

export interface MunicipalityData {
  lastUpdated: string;
  lastUpdatedBy: string;
  fiscalYear: string;
  municipalityName: string;
  departmentName: string;
  revenueCategories: BudgetCategory[];
  expenditureCategories: BudgetCategory[];
  accumulatedProof: AccumulatedProof;
  specialGrantProjects: FundProjectItem[];
  accumulatedFundProjects: FundProjectItem[];
  goodGovernanceProjects: FundProjectItem[];
  accruedExpenses: FundProjectItem[];
  externalSubsidies: FundProjectItem[];
  statusTasks: StatusTaskItem[];
  dailyEntries: DailyTransaction[];
  memorandum: MemorandumData;
}
