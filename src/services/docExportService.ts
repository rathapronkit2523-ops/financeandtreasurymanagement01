import { MunicipalityData, FundProjectItem } from '../types/finance';
import { formatCurrency, formatThaiDate, bahtText, calcPercent } from '../utils/formatters';

function sanitizeText(val?: string): string {
  if (!val) return '';
  const trimmed = val.trim();
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

function sanitizeComment(val?: string): string {
  if (!val) return '';
  const trimmed = val.trim();
  if (
    trimmed.includes('ได้ตรวจสอบความถูกต้อง') ||
    trimmed.includes('ทราบและอนุมัติให้ดำเนินการ') ||
    trimmed.includes('เห็นควรเสนอพิจารณาอนุมัติ')
  ) {
    return '';
  }
  return trimmed;
}

function sanitizeApproverLabel(val?: string): string {
  if (!val) return 'ผู้มีอำนาจพิจารณาอนุมัติ';
  return val.replace(/\(นายกเทศมนตรีเมืองมหาสารคาม\)/g, '').trim();
}

export function exportOfficialMemorandumWord(data: MunicipalityData): void {
  const m = data.memorandum;
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

  const htmlContent = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8">
  <title>บันทึกข้อความ - เทศบาลเมืองมหาสารคาม</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page {
      size: A4 portrait;
      margin: 2.5cm 2.0cm 2.0cm 2.5cm;
      mso-header-margin: 1.5cm;
      mso-footer-margin: 1.5cm;
    }
    body {
      font-family: 'TH Sarabun PSK', 'TH Sarabun New', 'Sarabun', Cordia New, sans-serif;
      font-size: 16pt;
      line-height: 1.25;
      color: #000;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8px;
    }
    .memo-title {
      font-size: 29pt;
      font-weight: bold;
      text-align: center;
      margin-bottom: 5px;
    }
    .meta-line {
      margin-bottom: 6px;
      font-size: 16pt;
    }
    .bold {
      font-weight: bold;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
      font-size: 13.5pt;
    }
    table.data-table th, table.data-table td {
      border: 1px solid #000;
      padding: 4px 6px;
      vertical-align: middle;
    }
    table.data-table th {
      background-color: #f2f2f2;
      font-weight: bold;
      text-align: center;
    }
    .sig-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 25px;
      page-break-inside: avoid;
    }
    .sig-table td {
      padding: 8px;
      vertical-align: top;
      border: 1px solid #999;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }
  </style>
</head>
<body>
  <table class="header-table">
    <tr>
      <td width="100%" valign="bottom" align="center">
        <div class="memo-title">บันทึกข้อความ</div>
      </td>
    </tr>
  </table>

  <div class="meta-line">
    <span class="bold">ส่วนราชการ:</span> ${m.fromAgency}
  </div>
  <table width="100%" class="header-table">
    <tr>
      <td width="50%" class="meta-line"><span class="bold">ที่:</span> ${m.docNumber}</td>
      <td width="50%" class="meta-line" align="right"><span class="bold">วันที่:</span> ${m.date || formatThaiDate(new Date())}</td>
    </tr>
  </table>
  <div class="meta-line" style="margin-bottom: 12px;">
    <span class="bold">เรื่อง:</span> ${m.subject}
  </div>
  <div class="meta-line" style="margin-bottom: 12px;">
    <span class="bold">เรียน:</span> ${m.toWhom}
  </div>

  <p style="text-indent: 2.5cm; text-align: justify; margin-bottom: 10px;">
    ตามที่ฝ่ายการเงินและบัญชี และฝ่ายบริหารงานคลัง กองคลัง เทศบาลเมืองมหาสารคาม ได้ปฏิบัติหน้าที่เกี่ยวกับการจัดเก็บรายรับ การเบิกจ่ายงบประมาณ การบริหารเงินสะสม และการควบคุมวินัยการเงินการคลัง ประจำปีงบประมาณ พ.ศ. ๒๕๗๐ นั้น ขอรายงานผลการดำเนินงานทางการเงินและงบประมาณครบทุกหมวดหมู่ ข้อมูล ณ วันที่ ${m.date || formatThaiDate(new Date())} สรุปสาระสำคัญได้ดังนี้
  </p>

  <!-- เมนู ๑. ภาพรวมเปรียบเทียบ รายงานหมวดรายรับ กับ รายงานหมวดรายจ่าย -->
  <p style="text-indent: 1.5cm; margin-bottom: 6px;">
    <span class="bold">๑. สรุปภาพรวมเปรียบเทียบรายรับและรายจ่าย:</span> ประมาณการรายรับรวมตั้งไว้ ${formatCurrency(totalRevEst)} บาท จัดเก็บได้จริง ${formatCurrency(totalRevAct)} บาท คิดเป็นร้อยละ ${calcPercent(totalRevAct, totalRevEst)}% งบประมาณรายจ่ายตั้งไว้ ${formatCurrency(totalExpEst)} บาท เบิกจ่ายจริงสะสม ${formatCurrency(totalExpAct)} บาท คิดเป็นร้อยละ ${calcPercent(totalExpAct, totalExpEst)}% ส่งผลให้ดุลการเงินสะสม (รับจริง - จ่ายจริง) <span class="bold">${netBalance >= 0 ? 'เกินดุล' : 'ขาดดุล'} เป็นจำนวนเงิน ${formatCurrency(Math.abs(netBalance))} บาท</span> (${bahtText(netBalance)})
  </p>

  <table class="data-table">
    <thead>
      <tr>
        <th>รายการ</th>
        <th>ประมาณการ (บาท)</th>
        <th>รับจริง / จ่ายจริง (บาท)</th>
        <th>คงเหลือ (บาท)</th>
        <th>ร้อยละ (%)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="bold">รวมหมวดรายรับทั้งหมด</td>
        <td class="text-right">${formatCurrency(totalRevEst)}</td>
        <td class="text-right bold">${formatCurrency(totalRevAct)}</td>
        <td class="text-right">${formatCurrency(totalRevEst - totalRevAct)}</td>
        <td class="text-center">${calcPercent(totalRevAct, totalRevEst)}%</td>
      </tr>
      <tr>
        <td class="bold">รวมหมวดรายจ่ายทั้งหมด</td>
        <td class="text-right">${formatCurrency(totalExpEst)}</td>
        <td class="text-right bold">${formatCurrency(totalExpAct)}</td>
        <td class="text-right">${formatCurrency(totalExpEst - totalExpAct)}</td>
        <td class="text-center">${calcPercent(totalExpAct, totalExpEst)}%</td>
      </tr>
    </tbody>
  </table>

  <!-- เมนู ๒. รายงานหมวดรายรับ -->
  <p style="text-indent: 1.5cm; margin-top: 10px; margin-bottom: 6px;">
    <span class="bold">๒. รายงานหมวดรายรับ (รวมหมวดรายได้จากทรัพย์สิน):</span> ผลการจัดเก็บรายรับจำแนกตามโครงสร้างหมวดรายรับเทศบาลเมืองมหาสารคาม
  </p>

  <table class="data-table">
    <thead>
      <tr>
        <th width="8%">ลำดับ</th>
        <th>หมวดรายรับ</th>
        <th width="20%">ประมาณการ (บาท)</th>
        <th width="20%">รับจริง (บาท)</th>
        <th width="20%">คงเหลือ (บาท)</th>
        <th width="12%">ร้อยละ (%)</th>
      </tr>
    </thead>
    <tbody>
      ${data.revenueCategories
        .map(
          (c, idx) => `
        <tr>
          <td class="text-center">${idx + 1}</td>
          <td>${c.name}</td>
          <td class="text-right">${formatCurrency(c.estimate)}</td>
          <td class="text-right bold">${formatCurrency(c.actual)}</td>
          <td class="text-right">${formatCurrency(c.estimate - c.actual)}</td>
          <td class="text-center">${calcPercent(c.actual, c.estimate)}%</td>
        </tr>
      `
        )
        .join('')}
      <tr style="background-color: #f2f2f2; font-weight: bold;">
        <td colspan="2" class="text-center">รวมหมวดรายรับทั้งหมด</td>
        <td class="text-right">${formatCurrency(totalRevEst)}</td>
        <td class="text-right">${formatCurrency(totalRevAct)}</td>
        <td class="text-right">${formatCurrency(totalRevEst - totalRevAct)}</td>
        <td class="text-center">${calcPercent(totalRevAct, totalRevEst)}%</td>
      </tr>
    </tbody>
  </table>

  <!-- เมนู ๓. รายงานหมวดรายจ่าย -->
  <p style="text-indent: 1.5cm; margin-top: 10px; margin-bottom: 6px;">
    <span class="bold">๓. รายงานหมวดรายจ่าย:</span> จำแนกตามกลุ่มงบรายจ่ายหลัก รวมถึงงบกลาง (ข้อ 3.1–3.6) และงบเงินอุดหนุน (ข้อ 5.1–5.4)
  </p>

  <table class="data-table">
    <thead>
      <tr>
        <th width="8%">ลำดับ</th>
        <th>หมวดรายจ่าย</th>
        <th width="20%">งบประมาณตั้งไว้ (บาท)</th>
        <th width="20%">เบิกจ่ายจริง (บาท)</th>
        <th width="20%">คงเหลือ (บาท)</th>
        <th width="12%">ร้อยละ (%)</th>
      </tr>
    </thead>
    <tbody>
      ${data.expenditureCategories
        .map(
          (c, idx) => `
        <tr>
          <td class="text-center">${idx + 1}</td>
          <td>
            <span class="bold">${c.name}</span>
            ${c.name.includes('งบกลาง') ? '<br/><span style="font-size: 11pt; color: #555;">(3.1 หนี้เงินกู้ 3.2 ประกันสังคม 3.3 เบี้ยยังชีพ 3.4 เงินสำรอง 3.5 ข้อผูกพัน 3.6 เงินช่วยพิเศษ)</span>' : ''}
            ${c.name.includes('งบเงินอุดหนุน') ? '<br/><span style="font-size: 11pt; color: #555;">(5.1 ส่วนราชการ 5.2 รัฐวิสาหกิจ 5.3 องค์กรประชาชน 5.4 องค์กรศาสนา)</span>' : ''}
          </td>
          <td class="text-right">${formatCurrency(c.estimate)}</td>
          <td class="text-right bold">${formatCurrency(c.actual)}</td>
          <td class="text-right">${formatCurrency(c.estimate - c.actual)}</td>
          <td class="text-center">${calcPercent(c.actual, c.estimate)}%</td>
        </tr>
      `
        )
        .join('')}
      <tr style="background-color: #f2f2f2; font-weight: bold;">
        <td colspan="2" class="text-center">รวมหมวดรายจ่ายทั้งหมด</td>
        <td class="text-right">${formatCurrency(totalExpEst)}</td>
        <td class="text-right">${formatCurrency(totalExpAct)}</td>
        <td class="text-right">${formatCurrency(totalExpEst - totalExpAct)}</td>
        <td class="text-center">${calcPercent(totalExpAct, totalExpEst)}%</td>
      </tr>
    </tbody>
  </table>

  <!-- เมนู ๔. รายงานการพิสูจน์ยอดเงินสะสม -->
  <p style="text-indent: 1.5cm; margin-top: 10px; margin-bottom: 6px;">
    <span class="bold">๔. รายงานการพิสูจน์ยอดเงินสะสม:</span> คำนวณตามระเบียบกระทรวงมหาดไทยว่าด้วยการรับเงิน การเบิกจ่ายเงินฯ ยอดเงินสะสมในบัญชีเงินฝากธนาคาร ณ วันที่ ๓๐ กันยายน ๒๕๖๙ มีจำนวน ${formatCurrency(ap.bankBalanceSept30)} บาท เมื่อหักเงินสำรองและภาระผูกพันตามกฎหมายแล้ว สรุปสถานะได้ดังนี้
  </p>

  <table class="data-table">
    <thead>
      <tr>
        <th width="8%">ลำดับ</th>
        <th>รายการตามระเบียบกระทรวงมหาดไทย</th>
        <th width="30%">จำนวนเงิน (บาท)</th>
      </tr>
    </thead>
    <tbody>
      <tr><td class="text-center">1</td><td>เงินสะสมบัญชีเงินฝากธนาคาร 30 กันยายน 2569</td><td class="text-right">${formatCurrency(ap.bankBalanceSept30)}</td></tr>
      <tr><td class="text-center">2</td><td>หัก เงินสมทบกองทุนส่งเสริมกิจการขององค์กรปกครองส่วนท้องถิ่น (ก.ส.ท.)</td><td class="text-right">-${formatCurrency(ap.deductLocalFund)}</td></tr>
      <tr><td class="text-center">3</td><td>หัก ค่าใช้จ่ายด้านบุคลากรไม่น้อยกว่า 3 เดือน</td><td class="text-right">-${formatCurrency(ap.deductPersonnel3Months)}</td></tr>
      <tr><td class="text-center">4</td><td>หัก ร้อยละ 15 ของงบประมาณรายจ่ายประจำปี</td><td class="text-right">-${formatCurrency(ap.deductFifteenPercentExpense)}</td></tr>
      <tr><td class="text-center">5</td><td>หัก เงินสะสมคงเหลือขั้นต่ำตามระเบียบฯ</td><td class="text-right">-${formatCurrency(ap.deductStatutoryReserve)}</td></tr>
      <tr><td class="text-center">6</td><td>หัก เงินสะสมที่ได้รับอนุมัติแล้ว ในปีปัจจุบัน</td><td class="text-right">-${formatCurrency(ap.deductCurrentYearApproved)}</td></tr>
      <tr><td class="text-center">7</td><td>หัก ถอนคืนเงินได้รับข้ามปีงบประมาณ</td><td class="text-right">-${formatCurrency(ap.deductCrossYearRefund)}</td></tr>
      <tr><td class="text-center">8</td><td>บวก เงินสะสมที่เหลือจากการอนุมัติหลังจากก่อหนี้ผูกพัน</td><td class="text-right">+${formatCurrency(ap.addApprovedObligationRemaining)}</td></tr>
      <tr><td class="text-center">9</td><td>บวก รับคืนเงินรายจ่าย/รับรายได้ข้ามปีงบประมาณ</td><td class="text-right">+${formatCurrency(ap.addCrossYearRevenueReturn)}</td></tr>
      <tr style="background-color: #f2f2f2; font-weight: bold;">
        <td colspan="2" class="text-center">คงเหลือเงินสะสมที่สามารถนำไปใช้ได้ ณ ปัจจุบัน (คำนวณอัตโนมัติ)</td>
        <td class="text-right" style="font-size: 15pt; color: #002244;">${formatCurrency(usableAccFund)}</td>
      </tr>
    </tbody>
  </table>

  <!-- เมนู ๕. งบประมาณและโครงการ -->
  <p style="text-indent: 1.5cm; margin-top: 10px; margin-bottom: 6px;">
    <span class="bold">๕. งบประมาณและโครงการ (๕ หมวดโครงการ):</span> สรุปผลการเบิกจ่ายโครงการพิเศษและเงินนอกงบประมาณ
  </p>

  <table class="data-table">
    <thead>
      <tr>
        <th width="8%">ลำดับ</th>
        <th>กลุ่มโครงการ/หมวดงบ</th>
        <th width="15%">จำนวนโครงการ</th>
        <th width="20%">งบประมาณ (บาท)</th>
        <th width="20%">เบิกจ่ายสะสม (บาท)</th>
        <th width="20%">คงเหลือ (บาท)</th>
        <th width="12%">ร้อยละ (%)</th>
      </tr>
    </thead>
    <tbody>
      ${[
        { name: 'เงินอุดหนุนระบุวัตถุประสงค์เฉพาะกิจ', items: data.specialGrantProjects },
        { name: 'เงินสะสมโครงการ', items: data.accumulatedFundProjects },
        { name: 'เงินรางวัลการบริหารจัดการที่ดี', items: data.goodGovernanceProjects },
        { name: 'ค่าใช้จ่ายค้างจ่าย', items: data.accruedExpenses },
        { name: 'เงินอุดหนุนจากหน่วยงานอื่น', items: data.externalSubsidies }
      ]
        .map((cat, idx) => {
          const b = sumBudget(cat.items);
          const d = sumDisbursed(cat.items);
          return `
          <tr>
            <td class="text-center">${idx + 1}</td>
            <td>${cat.name}</td>
            <td class="text-center">${cat.items.length} รายการ</td>
            <td class="text-right">${formatCurrency(b)}</td>
            <td class="text-right bold">${formatCurrency(d)}</td>
            <td class="text-right">${formatCurrency(b - d)}</td>
            <td class="text-center">${calcPercent(d, b)}%</td>
          </tr>
        `;
        })
        .join('')}
      <tr style="background-color: #f2f2f2; font-weight: bold;">
        <td colspan="2" class="text-center">รวมโครงการทุกหมวด</td>
        <td class="text-center">${data.specialGrantProjects.length + data.accumulatedFundProjects.length + data.goodGovernanceProjects.length + data.accruedExpenses.length + data.externalSubsidies.length} รายการ</td>
        <td class="text-right">${formatCurrency(totalFundBudget)}</td>
        <td class="text-right">${formatCurrency(totalFundDisbursed)}</td>
        <td class="text-right">${formatCurrency(totalFundBudget - totalFundDisbursed)}</td>
        <td class="text-center">${calcPercent(totalFundDisbursed, totalFundBudget)}%</td>
      </tr>
    </tbody>
  </table>

  <!-- เมนู ๖. ติดตามงานการคลัง -->
  <p style="text-indent: 1.5cm; margin-top: 10px; margin-bottom: 6px;">
    <span class="bold">๖. รายงานและติดตามงานการคลัง:</span> มีภารกิจและรายงานตามรอบกำหนดเวลาทั้งสิ้น <span class="bold">${data.statusTasks.length}</span> รายการ ดำเนินการเสร็จสิ้นแล้ว <span class="bold">${completedTasks}</span> รายการ อยู่ระหว่างดำเนินการ <span class="bold">${data.statusTasks.length - completedTasks}</span> รายการ
  </p>

  <p style="text-indent: 2.5cm; margin-top: 15px; margin-bottom: 25px;">
    จึงเรียนมาเพื่อโปรดทราบ และพิจารณาอนุมัติผลการดำเนินงานทางการเงินและงบประมาณดังกล่าว
  </p>

  <!-- Signature Blocks 3 Positions -->
  <table class="sig-table">
    <tr>
      <!-- Position 1: ผู้รายงาน -->
      <td width="33%" class="text-center">
        <div class="bold" style="margin-bottom: 25px;">๑. ${m.reporterRoleLabel || 'ผู้รายงาน'}</div>
        <div style="height: 35px;"></div>
        <div>(ลงชื่อ)....................................................</div>
        <div style="margin-top: 5px;">(${sanitizeText(m.reporterName) || '...................................................'})</div>
        <div>ตำแหน่ง ${sanitizeText(m.reporterPosition) || '...................................................'}</div>
        <div style="margin-top: 5px;">วันที่ ......./......./.......</div>
      </td>

      <!-- Position 2: ผู้ตรวจสอบ -->
      <td width="34%" class="text-center">
        <div class="bold" style="margin-bottom: 10px;">๒. ${m.directorRoleLabel || 'ผู้ตรวจสอบ (ผู้อำนวยการกองคลัง)'}</div>
        <div style="font-size: 12.5pt; text-align: left; background: #fafafa; padding: 4px; border: 1px dashed #ccc; margin-bottom: 10px;">
          ความเห็น: ${sanitizeComment(m.directorComment) || '................................................................................'}
        </div>
        <div>(ลงชื่อ)....................................................</div>
        <div style="margin-top: 5px;">(${sanitizeText(m.directorName) || '...................................................'})</div>
        <div>ตำแหน่ง ${sanitizeText(m.directorPosition) || 'ผู้อำนวยการกองคลัง'}</div>
        <div style="margin-top: 5px;">วันที่ ......./......./.......</div>
      </td>

      <!-- Position 3: ผู้มีอำนาจพิจารณาอนุมัติ -->
      <td width="33%" class="text-center">
        <div class="bold" style="margin-bottom: 10px;">๓. ${sanitizeApproverLabel(m.approverRoleLabel)}</div>
        <div style="font-size: 12.5pt; text-align: left; background: #fafafa; padding: 4px; border: 1px dashed #ccc; margin-bottom: 10px;">
          คำสั่ง: [ &nbsp; ] ทราบ &nbsp;&nbsp;&nbsp; [ &nbsp; ] อนุมัติ &nbsp;&nbsp;&nbsp; [ &nbsp; ] อื่นๆ<br/>
          ${sanitizeComment(m.approverComment) || '................................................................................'}
        </div>
        <div>(ลงชื่อ)....................................................</div>
        <div style="margin-top: 5px;">(${sanitizeText(m.approverName) || '...................................................'})</div>
        <div>ตำแหน่ง ${sanitizeText(m.approverPosition) || '...................................................'}</div>
        <div style="margin-top: 5px;">วันที่ ......./......./.......</div>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const blob = new Blob(['\ufeff', htmlContent], {
    type: 'application/msword'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `บันทึกข้อความ_รายงานการเงินครบทุกเมนู_เทศบาลเมืองมหาสารคาม_2570.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
