/**
 * Utility functions for formatting currency, Thai dates, numbers, and Baht text
 */

export function formatCurrency(amount: number | undefined | null, decimals: number = 2): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '0.00';
  }
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

export function formatNumber(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '0';
  }
  return new Intl.NumberFormat('th-TH').format(amount);
}

export function calcPercent(actual: number, estimate: number): number {
  if (!estimate || estimate === 0) return 0;
  return Number(((actual / estimate) * 100).toFixed(2));
}

const THAI_MONTHS_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

export function formatThaiDate(dateStr: string | Date, isShort: boolean = false): string {
  try {
    const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    if (isNaN(d.getTime())) return String(dateStr);
    const day = d.getDate();
    const month = isShort ? THAI_MONTHS_SHORT[d.getMonth()] : THAI_MONTHS_FULL[d.getMonth()];
    const year = d.getFullYear() + 543;
    return `${day} ${month} ${year}`;
  } catch {
    return String(dateStr);
  }
}

export function getTodayThaiDate(): string {
  return formatThaiDate(new Date(), false);
}

export function toThaiNumerals(numStr: string | number): string {
  const thaiNums = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
  return String(numStr).replace(/[0-9]/g, (match) => thaiNums[parseInt(match, 10)]);
}

/**
 * Convert number into Thai Baht text (คำอ่านภาษาไทย)
 */
export function bahtText(num: number): string {
  if (num === 0) return 'ศูนย์บาทถ้วน';
  if (isNaN(num)) return '';

  const numbers = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  const units = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];

  function readSection(n: number): string {
    let s = '';
    const digits = String(n).split('').map(Number);
    const len = digits.length;

    for (let i = 0; i < len; i++) {
      const d = digits[i];
      const pos = len - i - 1;
      if (d === 0) continue;

      if (pos === 0 && d === 1 && len > 1 && digits[len - 2] !== 0) {
        s += 'เอ็ด';
      } else if (pos === 1 && d === 2) {
        s += 'ยี่สิบ';
      } else if (pos === 1 && d === 1) {
        s += 'สิบ';
      } else {
        s += numbers[d] + units[pos];
      }
    }
    return s;
  }

  const isNegative = num < 0;
  const absNum = Math.abs(num);
  const parts = absNum.toFixed(2).split('.');
  const integerPart = parseInt(parts[0], 10);
  const satangPart = parseInt(parts[1], 10);

  let result = isNegative ? 'ลบ' : '';

  if (integerPart === 0) {
    result += 'ศูนย์บาท';
  } else if (integerPart > 1000000) {
    const millions = Math.floor(integerPart / 1000000);
    const rest = integerPart % 1000000;
    result += readSection(millions) + 'ล้าน' + (rest > 0 ? readSection(rest) : '') + 'บาท';
  } else {
    result += readSection(integerPart) + 'บาท';
  }

  if (satangPart === 0) {
    result += 'ถ้วน';
  } else {
    result += readSection(satangPart) + 'สตางค์';
  }

  return result;
}
