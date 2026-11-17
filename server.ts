import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Data storage file
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'municipality_data_2570.json');

// Initial default database structure for Maha Sarakham Municipality FY2570
const getInitialData = () => ({
  lastUpdated: new Date().toISOString(),
  lastUpdatedBy: 'ระบบเริ่มต้น',
  fiscalYear: '2570',
  municipalityName: 'เทศบาลเมืองมหาสารคาม',
  departmentName: 'กองคลัง (ฝ่ายการเงินและบัญชี และฝ่ายบริหารงานคลัง)',

  // 1. หมวดรายรับ
  revenueCategories: [
    {
      id: 'rev_tax',
      name: 'หมวดภาษีอากร',
      estimate: 68500000,
      actual: 42150000,
      notes: '',
      subItems: []
    },
    {
      id: 'rev_fee',
      name: 'หมวดค่าธรรมเนียม ค่าปรับ และใบอนุญาต',
      estimate: 14200000,
      actual: 8950000,
      notes: '',
      subItems: []
    },
    {
      id: 'rev_property',
      name: 'หมวดรายได้จากทรัพย์สิน',
      estimate: 16500000,
      actual: 10250000,
      notes: '',
      subItems: []
    },
    {
      id: 'rev_util',
      name: 'หมวดรายได้จากสาธารณูปโภค และกิจการพาณิชย์',
      estimate: 21500000,
      actual: 13800000,
      notes: '',
      subItems: []
    },
    {
      id: 'rev_misc',
      name: 'หมวดรายได้เบ็ดเตล็ด',
      estimate: 6800000,
      actual: 3950000,
      notes: '',
      subItems: []
    },
    {
      id: 'rev_capital',
      name: 'หมวดรายได้จากทุน',
      estimate: 8500000,
      actual: 5400000,
      notes: '',
      subItems: []
    },
    {
      id: 'rev_allocated_tax',
      name: 'หมวดภาษีจัดสรร',
      estimate: 285000000,
      actual: 178500000,
      notes: '',
      subItems: []
    },
    {
      id: 'rev_general_subsidy',
      name: 'หมวดอุดหนุนทั่วไป',
      estimate: 198000000,
      actual: 125600000,
      notes: '',
      subItems: []
    },
    {
      id: 'rev_special_subsidy',
      name: 'หมวดเงินอุดหนุนระบุวัตถุประสงค์เฉพาะกิจ',
      estimate: 45000000,
      actual: 28200000,
      notes: '',
      subItems: []
    },
    {
      id: 'rev_other_subsidy',
      name: 'หมวดอุดหนุนจากหน่วยงานอื่น',
      estimate: 18500000,
      actual: 11200000,
      notes: '',
      subItems: []
    }
  ],

  // 2. หมวดรายจ่าย
  expenditureCategories: [
    {
      id: 'exp_personnel',
      name: 'งบบุคลากร',
      estimate: 185000000,
      actual: 108400000,
      subItems: [
        { id: 'exp_pol', name: 'เงินเดือน (ฝ่ายการเมือง)', estimate: 12500000, actual: 7290000 },
        { id: 'exp_reg', name: 'เงินเดือน (ฝ่ายประจำ)', estimate: 172500000, actual: 101110000 }
      ]
    },
    {
      id: 'exp_operating',
      name: 'งบดำเนินงาน',
      estimate: 145000000,
      actual: 82600000,
      subItems: [
        { id: 'exp_comp', name: 'ค่าตอบแทน', estimate: 24000000, actual: 13900000 },
        { id: 'exp_use', name: 'ค่าใช้สอย', estimate: 65000000, actual: 37400000 },
        { id: 'exp_mat', name: 'ค่าวัสดุ', estimate: 38000000, actual: 21500000 },
        { id: 'exp_util_cost', name: 'ค่าสาธารณูปโภค', estimate: 18000000, actual: 9800000 }
      ]
    },
    {
      id: 'exp_central',
      name: 'งบกลาง',
      estimate: 128000000,
      actual: 71200000,
      subItems: [
        { id: 'exp_cen_1', name: 'ค่าชำระหนี้เงินกู้/ดอกเบี้ย', estimate: 14000000, actual: 8200000 },
        { id: 'exp_cen_2', name: 'เงินสมทบกองทุนเงินประกันสังคม/เงินทดแทน', estimate: 12000000, actual: 6800000 },
        { id: 'exp_cen_3', name: 'เบี้ยยังชีพ', estimate: 70000000, actual: 40500000 },
        { id: 'exp_cen_4', name: 'เงินสำรองจ่าย', estimate: 18000000, actual: 8500000 },
        { id: 'exp_cen_5', name: 'รายจ่ายตามข้อผูกพัน', estimate: 10000000, actual: 5200000 },
        { id: 'exp_cen_6', name: 'เงินช่วยพิเศษ', estimate: 4000000, actual: 2000000 }
      ]
    },
    {
      id: 'exp_invest',
      name: 'งบลงทุน',
      estimate: 96000000,
      actual: 48900000,
      subItems: [
        { id: 'exp_inv_equip', name: 'ค่าครุภัณฑ์', estimate: 28000000, actual: 14200000 },
        { id: 'exp_inv_land', name: 'ค่าที่ดินและสิ่งปลูกสร้าง', estimate: 68000000, actual: 34700000 }
      ]
    },
    {
      id: 'exp_subsidy',
      name: 'งบเงินอุดหนุน',
      estimate: 58000000,
      actual: 31500000,
      subItems: [
        { id: 'exp_sub_1', name: 'เงินอุดหนุนส่วนราชการ', estimate: 26000000, actual: 14500000 },
        { id: 'exp_sub_2', name: 'เงินอุดหนุนรัฐวิสาหกิจ', estimate: 12000000, actual: 6500000 },
        { id: 'exp_sub_3', name: 'เงินอุดหนุนองค์กรประชาชน', estimate: 14000000, actual: 7500000 },
        { id: 'exp_sub_4', name: 'เงินอุดหนุนขององค์กรศาสนา', estimate: 6000000, actual: 3000000 }
      ]
    },
    {
      id: 'exp_other',
      name: 'งบรายจ่ายอื่น',
      estimate: 14000000,
      actual: 6200000,
      subItems: [
        { id: 'exp_oth_1', name: 'รายจ่ายอื่นตามระเบียบกระทรวงมหาดไทย', estimate: 14000000, actual: 6200000 }
      ]
    }
  ],

  // 3. รายงานพิสูจน์ยอดเงินสะสม
  accumulatedProof: {
    recordDate: '2026-11-02',
    bankBalanceSept30: 245800000,
    deductLocalFund: 12290000,
    deductPersonnel3Months: 46250000,
    deductFifteenPercentExpense: 93900000,
    deductStatutoryReserve: 25000000,
    deductCurrentYearApproved: 18500000,
    deductCrossYearRefund: 1800000,
    addApprovedObligationRemaining: 3400000,
    addCrossYearRevenueReturn: 2150000,
    notes: 'ตรวจสอบและจัดทำตามระเบียบกระทรวงมหาดไทยว่าด้วยการรับเงิน การเบิกจ่ายเงิน การฝากเงิน การเก็บรักษาเงิน และการตรวจเงินขององค์กรปกครองส่วนท้องถิ่น พ.ศ. 2566'
  },

  // 4. 5 เมนูเฉพาะ
  specialGrantProjects: [
    {
      id: 'sg_1',
      title: 'โครงการปรับปรุงระบบระบายน้ำและป้องกันน้ำท่วม ชุมชนตลาดสดเทศบาล',
      budget: 15000000,
      disbursed: 10500000,
      fiscalYear: '2570',
      status: 'อยู่ระหว่างดำเนินการ',
      department: 'ฝ่ายบริหารงานคลัง'
    },
    {
      id: 'sg_2',
      title: 'โครงการก่อสร้างอาคารศูนย์พัฒนาเด็กเล็กเทศบาลเมืองมหาสารคาม 2',
      budget: 8500000,
      disbursed: 5100000,
      fiscalYear: '2570',
      status: 'อยู่ระหว่างดำเนินการ',
      department: 'ฝ่ายการเงินและบัญชี'
    },
    {
      id: 'sg_3',
      title: 'โครงการติดตั้งระบบกล้องวงจรปิด CCTV อัจฉริยะเพื่อความปลอดภัยรอบเมือง',
      budget: 12000000,
      disbursed: 12000000,
      fiscalYear: '2570',
      status: 'ดำเนินการเสร็จสิ้น',
      department: 'ฝ่ายบริหารงานคลัง'
    }
  ],

  accumulatedFundProjects: [
    {
      id: 'af_1',
      title: 'โครงการขยายผิวจราจรและทางเท้าถนนผดุงวิถี',
      budget: 9800000,
      disbursed: 6400000,
      fiscalYear: '2570',
      status: 'อยู่ระหว่างดำเนินการ',
      department: 'กองคลัง/สำนักช่าง'
    },
    {
      id: 'af_2',
      title: 'โครงการจัดซื้อรถบรรทุกขยะมูลฝอยแบบอัดท้ายขนาด 6 ลิตร จำนวน 2 คัน',
      budget: 5200000,
      disbursed: 5200000,
      fiscalYear: '2570',
      status: 'ดำเนินการเสร็จสิ้น',
      department: 'ฝ่ายการเงินและบัญชี'
    },
    {
      id: 'af_3',
      title: 'โครงการบูรณะซ่อมแซมสวนสาธารณะเฉลิมพระเกียรติ',
      budget: 3500000,
      disbursed: 1200000,
      fiscalYear: '2570',
      status: 'อยู่ระหว่างดำเนินการ',
      department: 'ฝ่ายบริหารงานคลัง'
    }
  ],

  goodGovernanceProjects: [
    {
      id: 'gg_1',
      title: 'โครงการพัฒนาระบบบริการชำระภาษีและค่าธรรมเนียมออนไลน์ (Smart Municipal Tax)',
      budget: 2500000,
      disbursed: 2100000,
      fiscalYear: '2570',
      status: 'ดำเนินการเสร็จสิ้น',
      department: 'ฝ่ายพัฒนารายได้ กองคลัง'
    },
    {
      id: 'gg_2',
      title: 'โครงการอบรมส่งเสริมวินัยการคลังและคุณธรรมความโปร่งใสบุคลากรเทศบาล',
      budget: 800000,
      disbursed: 450000,
      fiscalYear: '2570',
      status: 'อยู่ระหว่างดำเนินการ',
      department: 'ฝ่ายการเงินและบัญชี'
    }
  ],

  accruedExpenses: [
    {
      id: 'ae_1',
      title: 'ค่าใช้จ่ายสาธารณูปโภค (ค่ากระแสไฟฟ้าแสงสว่างสาธารณะ) เดือนกันยายน',
      budget: 2850000,
      disbursed: 2850000,
      fiscalYear: '2570',
      status: 'ดำเนินการเสร็จสิ้น',
      department: 'ฝ่ายการเงินและบัญชี'
    },
    {
      id: 'ae_2',
      title: 'ค่าจ้างเหมาเอกชนกำจัดขยะมูลฝอยประจำงวดไตรมาสที่ 4',
      budget: 3600000,
      disbursed: 1800000,
      fiscalYear: '2570',
      status: 'อยู่ระหว่างดำเนินการ',
      department: 'ฝ่ายบริหารงานคลัง'
    },
    {
      id: 'ae_3',
      title: 'เงินสมทบกองทุนประกันสังคมค้างจ่ายส่วนของนายจ้าง',
      budget: 950000,
      disbursed: 950000,
      fiscalYear: '2570',
      status: 'ดำเนินการเสร็จสิ้น',
      department: 'ฝ่ายการเงินและบัญชี'
    }
  ],

  externalSubsidies: [
    {
      id: 'es_1',
      title: 'เงินอุดหนุนจาก อบจ.มหาสารคาม โครงการแข่งขันกีฬาเทศบาลเมืองสัมพันธ์',
      budget: 2000000,
      disbursed: 1500000,
      fiscalYear: '2570',
      status: 'อยู่ระหว่างดำเนินการ',
      department: 'ฝ่ายบริหารงานคลัง'
    },
    {
      id: 'es_2',
      title: 'เงินสนับสนุนกองทุนหลักประกันสุขภาพระดับท้องถิ่น (สปสช.)',
      budget: 4500000,
      disbursed: 3800000,
      fiscalYear: '2570',
      status: 'ดำเนินการเสร็จสิ้น',
      department: 'ฝ่ายการเงินและบัญชี'
    }
  ],

  // 5. เมนูรายงานและงานติดตามสถานะการคลัง
  statusTasks: [
    {
      id: 'st_trial_balance',
      name: 'รายงานรายรับ รายจ่าย และงบทดลอง',
      date: '2026-10-31',
      month: 'ตุลาคม 2569',
      status: 'ดำเนินการเสร็จสิ้น',
      responsible: 'ฝ่ายการเงินและบัญชี',
      note: 'จัดทำและปิดงบทดลองประจำเดือนเรียบร้อย'
    },
    {
      id: 'st_annual_rec_pay',
      name: 'รายงานการรับ จ่ายรับ ประจำปีงบประมาณ',
      date: '2026-10-15',
      month: 'ประจำปีงบประมาณ 2569',
      status: 'ดำเนินการเสร็จสิ้น',
      responsible: 'ฝ่ายการเงินและบัญชี',
      note: 'รายงานผ่านระบบ e-LAAS เรียบร้อย'
    },
    {
      id: 'st_acc_march',
      name: 'รายงานเงินสะสม สิ้นเดือน มีนาคม 2570',
      date: '2027-03-31',
      month: 'มีนาคม 2570',
      status: 'ยังไม่ดำเนินการ',
      responsible: 'ฝ่ายบริหารงานคลัง',
      note: 'รอสรุปยอดสิ้นไตรมาส 2'
    },
    {
      id: 'st_acc_sept',
      name: 'รายงานเงินสะสม สิ้นเดือน กันยายน 2570',
      date: '2027-09-30',
      month: 'กันยายน 2570',
      status: 'ยังไม่ดำเนินการ',
      responsible: 'ฝ่ายบริหารงานคลัง',
      note: 'รอสรุปยอดสิ้นปีงบประมาณ'
    },
    {
      id: 'st_fin_2569',
      name: 'รายงานการเงินประจำปี 2569',
      date: '2026-11-20',
      month: 'ประจำปี 2569',
      status: 'ดำเนินการเสร็จสิ้น',
      responsible: 'ฝ่ายการเงินและบัญชี',
      note: 'ส่งสภาเทศบาลและผู้กำกับดูแลเรียบร้อย'
    },
    {
      id: 'st_audit_2569',
      name: 'รายงานการเงินประจำปี 2569 ที่สำนักงานการตรวจเงินแผ่นดิน (สตง.) ตรวจสอบเสร็จ',
      date: '2027-01-15',
      month: 'ประจำปี 2569 (สตง.)',
      status: 'ยังไม่ดำเนินการ',
      responsible: 'กองคลัง',
      note: 'อยู่ระหว่าง สตง. ภูมิภาคที่ 7 ดำเนินการตรวจสอบ'
    },
    {
      id: 'st_gcfa_70',
      name: 'รายงานการเงินมาตรา 70 ผ่านระบบ GCFA',
      date: '2026-10-25',
      month: 'ตุลาคม 2569',
      status: 'ดำเนินการเสร็จสิ้น',
      responsible: 'ฝ่ายการเงินและบัญชี',
      note: 'นำเข้าข้อมูลเข้าสู่ระบบ GCFA สำเร็จ'
    },
    {
      id: 'st_gcfa_72',
      name: 'รายงานการเงินมาตรา 72 ผ่านระบบ GCFA',
      date: '2026-10-28',
      month: 'ตุลาคม 2569',
      status: 'ดำเนินการเสร็จสิ้น',
      responsible: 'ฝ่ายบริหารงานคลัง',
      note: 'รายงานเปิดเผยต่อสาธารณชนและระบบ GCFA เรียบร้อย'
    }
  ],

  // 6. รายการบันทึกประจำวัน (Daily entries)
  dailyEntries: [
    {
      id: 'd_1',
      date: '2026-11-02',
      type: 'revenue',
      category: 'หมวดภาษีอากร',
      subCategory: 'ภาษีที่ดินและสิ่งปลูกสร้าง',
      amount: 45000,
      docNumber: 'มค.ร.52002/104',
      description: 'รับชำระภาษีที่ดินและสิ่งปลูกสร้าง ประจำวัน',
      recordedBy: 'เจ้าหน้าที่การเงิน (User)'
    },
    {
      id: 'd_2',
      date: '2026-11-02',
      type: 'revenue',
      category: 'หมวดค่าธรรมเนียม ค่าปรับ และใบอนุญาต',
      subCategory: 'ค่าธรรมเนียมเก็บขนขยะมูลฝอยและสิ่งปฏิกูล',
      amount: 18500,
      docNumber: 'มค.ร.52002/105',
      description: 'รับค่าธรรมเนียมขยะมูลฝอยเขต 1-3',
      recordedBy: 'เจ้าหน้าที่การเงิน (User)'
    },
    {
      id: 'd_3',
      date: '2026-11-02',
      type: 'expenditure',
      category: 'งบดำเนินงาน',
      subCategory: 'ค่าวัสดุ',
      amount: 32000,
      docNumber: 'ฎีกา 248/2570',
      description: 'เบิกจ่ายค่าวัสดุสำนักงานและกระดาษพิมพ์แบบฟอร์มภาษี',
      recordedBy: 'เจ้าหน้าที่การเงิน (User)'
    },
    {
      id: 'd_4',
      date: '2026-11-01',
      type: 'revenue',
      category: 'หมวดภาษีจัดสรร',
      subCategory: 'ภาษีมูลค่าเพิ่ม 1 ใน 9',
      amount: 1450000,
      docNumber: 'กค.0409/4821',
      description: 'เงินจัดสรรภาษีมูลค่าเพิ่มจากกรมส่งเสริมการปกครองท้องถิ่น',
      recordedBy: 'เจ้าหน้าที่การเงิน (User)'
    },
    {
      id: 'd_5',
      date: '2026-11-01',
      type: 'expenditure',
      category: 'งบบุคลากร',
      subCategory: 'เงินเดือน (ฝ่ายประจำ)',
      amount: 4250000,
      docNumber: 'ฎีกา 210/2570',
      description: 'เบิกจ่ายเงินเดือนข้าราชการและลูกจ้างประจำรอบสิ้นเดือน',
      recordedBy: 'เจ้าหน้าที่การเงิน (User)'
    }
  ],

  // 7. บันทึกข้อความราชการ (Memorandum Settings & History)
  memorandum: {
    docNumber: 'มค ๕๒๐๐๒/๑๐๘๔',
    date: '๒ พฤศจิกายน ๒๕๖๙',
    subject: 'รายงานผลการดำเนินงานทางการเงินและงบประมาณ ประจำปีงบประมาณ พ.ศ. ๒๕๗๐',
    toWhom: 'นายกเทศมนตรีเมืองมหาสารคาม',
    fromAgency: 'ฝ่ายการเงินและบัญชี และฝ่ายบริหารงานคลัง กองคลัง โทร. ๐-๔๓๗๑-๑๒๙๕',
    reporterName: '',
    reporterPosition: '',
    reporterRoleLabel: 'ผู้รายงาน',
    directorName: '',
    directorPosition: 'ผู้อำนวยการกองคลัง',
    directorRoleLabel: 'ผู้ตรวจสอบ (ผู้อำนวยการกองคลัง)',
    directorComment: '',
    approverName: '',
    approverPosition: '',
    approverRoleLabel: 'ผู้มีอำนาจพิจารณาอนุมัติ',
    approverComment: ''
  }
});

// Helper to ensure data directory exists and read/write file
function getDb() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    const initial = getInitialData();
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
  try {
    const content = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Error reading db file, regenerating defaults:', err);
    const initial = getInitialData();
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
}

function saveDb(data: any) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// ----------------- API ROUTES -----------------

// Authentication API
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อผู้ใช้งานและรหัสผ่าน' });
  }

  const cleanUser = String(username).trim();
  const cleanPass = String(password).trim();

  if (cleanUser === 'User' && cleanPass === '1234') {
    return res.json({
      success: true,
      user: {
        username: 'User',
        role: 'staff',
        roleTitle: 'เจ้าหน้าที่ฝ่ายการเงินและบัญชี',
        name: 'เจ้าหน้าที่การเงินและบัญชี (User)',
        permissions: {
          canEditDaily: true,
          canImportExport: true,
          canVerify: false,
          canExecutiveOverview: true
        }
      }
    });
  } else if (cleanUser === 'Director' && cleanPass === '1234') {
    return res.json({
      success: true,
      user: {
        username: 'Director',
        role: 'director',
        roleTitle: 'ผู้อำนวยการกองคลัง',
        name: 'ผู้อำนวยการกองคลัง (Director)',
        permissions: {
          canEditDaily: true,
          canImportExport: true,
          canVerify: true,
          canExecutiveOverview: true
        }
      }
    });
  } else if (cleanUser === 'Executive' && cleanPass === '1234') {
    return res.json({
      success: true,
      user: {
        username: 'Executive',
        role: 'executive',
        roleTitle: 'ผู้บริหารเทศบาลเมืองมหาสารคาม',
        name: 'นายกเทศมนตรี / ผู้บริหาร (Executive)',
        permissions: {
          canEditDaily: false,
          canImportExport: true,
          canVerify: true,
          canExecutiveOverview: true
        }
      }
    });
  }

  return res.status(401).json({
    success: false,
    message: 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง'
  });
});

// Fetch full municipality database
app.get('/api/data', (req: Request, res: Response) => {
  try {
    const data = getDb();
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update database
app.post('/api/data', (req: Request, res: Response) => {
  try {
    const incomingData = req.body;
    if (!incomingData || typeof incomingData !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid payload' });
    }
    const currentData = getDb();
    const updated = {
      ...currentData,
      ...incomingData,
      lastUpdated: new Date().toISOString()
    };
    saveDb(updated);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Reset to sample FY2570 data
app.post('/api/data/reset', (req: Request, res: Response) => {
  try {
    const initial = getInitialData();
    saveDb(initial);
    res.json({ success: true, data: initial, message: 'คืนค่าข้อมูลเริ่มต้นเรียบร้อย' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Setup Vite or Static File Serving
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Maha Sarakham Municipality Finance App running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
