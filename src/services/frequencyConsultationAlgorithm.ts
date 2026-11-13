/**
 * THUẬT TOÁN TƯ VẤN MÔN THI TỐT NGHIỆP VÀ TỔ HỢP MÔN HỌC THPT
 * PHƯƠNG PHÁP: THỐNG KÊ TẦN SUẤT MÔN HỌC, ƯU TIÊN NGUYỆN VỌNG 1
 */

import {
  ToHopXetTuyenItem,
  ToHopTHPTItem,
  UniversityWish,
} from './universityApiService';
import { RiasecKey } from './hollandApiService';

// =========================================================================
// CẤU HÌNH TRỌNG SỐ ƯU TIÊN NGUYỆN VỌNG (ĐỊNH NGHĨA TẬP TRUNG ĐỂ DỄ ĐIỀU CHỈNH)
// Điểm ưu tiên = 3 × TanSuatNV1 + 2 × TanSuatNV2 + 1 × TanSuatNV3
// =========================================================================
export const WISH_PRIORITY_WEIGHTS: Record<number, number> = {
  1: 3, // Nguyện vọng 1 (Ưu tiên cao nhất)
  2: 2, // Nguyện vọng 2
  3: 1, // Nguyện vọng 3
};

// 4 môn học văn hóa bắt buộc theo Chương trình GDPT 2018 (học liên tục đến lớp 12)
export const COMPULSORY_THPT_CORE = ['Toán', 'Ngữ văn', 'Tiếng Anh', 'Lịch sử'] as const;

// 2 môn thi tốt nghiệp bắt buộc theo quy chế hiện hành (từ 2025)
export const MANDATORY_GRADUATION_EXAMS = ['Toán', 'Ngữ văn'] as const;

// Các môn thi tốt nghiệp tự chọn hợp lệ theo Quy chế thi tốt nghiệp THPT hiện hành
export const VALID_GRADUATION_ELECTIVES = new Set<string>([
  'Tiếng Anh',
  'Tiếng Nhật',
  'Tiếng Trung',
  'Tiếng Hàn',
  'Tiếng Pháp',
  'Tiếng Đức',
  'Tiếng Nga',
  'Lịch sử',
  'Vật lí',
  'Hóa học',
  'Sinh học',
  'Địa lí',
  'Giáo dục kinh tế và pháp luật',
  'Tin học',
  'Công nghệ',
]);

// Ánh xạ môn học phù hợp với từng nhóm tính cách Holland RIASEC (dùng ở tiêu chí xếp hạng 5)
const HOLLAND_MATCH_MAP: Record<RiasecKey, string[]> = {
  R: ['Vật lí', 'Tin học', 'Công nghệ', 'Hóa học'],
  I: ['Hóa học', 'Sinh học', 'Vật lí', 'Tin học'],
  A: ['Âm nhạc', 'Mỹ thuật', 'Ngữ văn', 'Địa lí'],
  S: ['Giáo dục kinh tế và pháp luật', 'Địa lí', 'Lịch sử', 'Sinh học'],
  E: ['Giáo dục kinh tế và pháp luật', 'Địa lí', 'Tin học'],
  C: ['Tin học', 'Giáo dục kinh tế và pháp luật', 'Địa lí'],
};

/**
 * Chuẩn hóa tên môn học để đối chiếu chính xác giữa các sheet Google Sheets và Quy chế GDPT 2018
 * Ví dụ: Lý, Lí, Vật lý -> Vật lí; Hóa, Hoá -> Hóa học; Anh, Tiếng Anh -> Tiếng Anh;
 *        Văn -> Ngữ văn; Sử -> Lịch sử; Địa -> Địa lí
 */
export function normalizeSubjectName(sub?: string): string {
  if (!sub) return '';
  const raw = sub.trim();
  if (!raw) return '';
  const s = raw.toLowerCase();

  if (s === 'toán' || s === 'toan' || s.startsWith('toán ')) return 'Toán';
  if (s.includes('ngữ văn') || s === 'văn' || s === 'van') return 'Ngữ văn';

  // Ngoại ngữ khác Tiếng Anh (kiểm tra trước để tránh nhầm với ngoại ngữ chung)
  if (s.includes('tiếng nhật') || s === 'nhật' || s === 'nhat') return 'Tiếng Nhật';
  if (s.includes('tiếng trung') || s === 'trung') return 'Tiếng Trung';
  if (s.includes('tiếng hàn') || s === 'hàn' || s === 'han') return 'Tiếng Hàn';
  if (s.includes('tiếng pháp') || s === 'pháp' || s === 'phap') return 'Tiếng Pháp';
  if (s.includes('tiếng đức') || s === 'đức' || s === 'duc') return 'Tiếng Đức';
  if (s.includes('tiếng nga') || s === 'nga') return 'Tiếng Nga';

  if (
    s.includes('tiếng anh') ||
    s.includes('anh văn') ||
    s.includes('ngoại ngữ') ||
    s === 'anh'
  ) {
    return 'Tiếng Anh';
  }

  if (s.includes('lịch sử') || s === 'sử' || s === 'su') return 'Lịch sử';
  if (s.includes('vật lý') || s.includes('vật lí') || s === 'lý' || s === 'lí' || s === 'ly' || s === 'li') {
    return 'Vật lí';
  }
  if (s.includes('hóa') || s.includes('hoá') || s === 'hoa') return 'Hóa học';
  if (s.includes('sinh học') || s === 'sinh') return 'Sinh học';
  if (s.includes('địa lí') || s.includes('địa lý') || s === 'địa' || s === 'dia') return 'Địa lí';
  if (s.includes('tin học') || s === 'tin') return 'Tin học';
  if (s.includes('công nghệ')) return 'Công nghệ';
  if (
    s.includes('công dân') ||
    s.includes('gdcd') ||
    s.includes('kinh tế') ||
    s.includes('pháp luật') ||
    s.includes('gdkt')
  ) {
    return 'Giáo dục kinh tế và pháp luật';
  }
  if (s.includes('âm nhạc')) return 'Âm nhạc';
  if (s.includes('mỹ thuật') || s.includes('mĩ thuật') || s.includes('hội họa')) return 'Mỹ thuật';

  return raw;
}

export interface AdmissionComboDetail {
  combo: ToHopXetTuyenItem;
  code: string;
  name: string;
  rawSubjects: string[];
  subjects: string[]; // Đã chuẩn hóa
  notes: string;
  method: string;
}

export interface WishAnalysisResult {
  wish: UniversityWish;
  wishOrder: number;
  verifiedCombos: ToHopXetTuyenItem[];
  comboDetails: AdmissionComboDetail[];
  allExamGroupCodes: string[];
  requiredSubjects: string[];
  electiveSubjectsNeeded: string[];
  compulsorySubjectsNeeded: string[];
  isVerified: boolean;
  notes: string;
  prospectusUrl: string;
}

export interface SubjectFrequencyRow {
  subject: string;
  tanSuatNV1: number;
  tanSuatNV2: number;
  tanSuatNV3: number;
  tongTanSuat: number;
  diemUuTien: number;
  isValidGraduationExam: boolean;
  wishesAppearing: number[];
  combosAppearing: string[];
}

export interface WishComparisonBreakdown {
  wish: UniversityWish;
  order: number;
  schoolName: string;
  majorName: string;
  isSatisfied: boolean;
  allCombos: AdmissionComboDetail[];
  satisfiedCombos: {
    code: string;
    subjects: string[];
    rawSubjects: string[];
    notes: string;
  }[];
  partialCombos: {
    code: string;
    subjects: string[];
    rawSubjects: string[];
    missing: string[];
    matched: string[];
    notes: string;
  }[];
  matchLevel: 'FULL' | 'PARTIAL' | 'NONE';
  matchLabel: string;
}

export interface ExamPairEvaluation {
  sub1: string;
  sub2: string;
  fourSubjects: string[];
  satisfiedWishesCount: number;
  supportsNV1: boolean;
  supportsNV2: boolean;
  supportsNV3: boolean;
  allWishesSatisfied: boolean;
  totalSatisfiedCombos: number;
  frequencyPrioritySum: number;
  breakdown: WishComparisonBreakdown[];
  coverageScore: number; // Dùng để tìm phương án thay thế tối ưu theo độ phủ nguyện vọng
}

export interface EvaluatedTHPTCombination {
  comb: ToHopXetTuyenItem | any;
  electives: string[]; // Đúng 4 môn lựa chọn thực tế từ sheet TO_HOP_THPT
  topics: string[]; // 3 chuyên đề học tập
  normElectives: string[];
  actualSubjectsToGrade12: string[]; // Các môn thực tế học đến lớp 12 (gồm Toán, Văn, Anh, Sử + 4 môn lựa chọn)
  containsBothProjectedExams: boolean;
  containsProjectedSub1: boolean;
  containsProjectedSub2: boolean;
  additionalElectives: string[]; // 2 môn lựa chọn bổ sung có điểm ưu tiên cao nhất trong các môn còn lại của tổ hợp
  additionalElectiveDetails: { subject: string; diemUuTien: number; tongTanSuat: number }[];
  top2AdditionalPriorityScore: number;
  allAdditionalPriorityScore: number;
  bestExamPairInCombo: ExamPairEvaluation;
  supportsNV1: boolean;
  supportsNV2: boolean;
  supportsNV3: boolean;
  supportedWishesCount: number;
  supportedWishesOrders: number[];
  totalSatisfiedCombos: number;
  reachableCombosCount: number; // Số tổ hợp xét tuyển nằm gọn trong tập môn học đến lớp 12 của tổ hợp THPT này
  hollandScore: number;
  favoriteScore: number;
  score: number;
  strengths: string[];
  limitations: string[];
}

export interface FrequencyConsultationResult {
  wishesAnalysis: WishAnalysisResult[];
  frequencyTable: SubjectFrequencyRow[];
  excludedNonExamSubjects: SubjectFrequencyRow[];
  projectedPair: [string, string]; // 2 môn thi tốt nghiệp dự kiến theo tần suất
  projectedFourSubjects: string[];
  projectedEvaluation: ExamPairEvaluation;
  meetsAllWishesByFrequency: boolean;
  statusTag: 'FULL_MATCH' | 'PARTIAL_MATCH';
  statusBadgeText: string;
  selectionReasonText: string;
  tiedTopPairs: ExamPairEvaluation[]; // Các phương án đồng hạng theo tần suất
  higherCoverageAlternatives: ExamPairEvaluation[]; // Các phương án thay thế có độ phủ nguyện vọng cao hơn (nếu phương án tần suất chưa đáp ứng hết)
  alternativePairs: ExamPairEvaluation[]; // Tổng hợp phương án thay thế cho giao diện
  evaluatedTHPTCombinations: EvaluatedTHPTCombination[];
  top3THPTCombinations: EvaluatedTHPTCombination[];
  anyTHPTContainsBothProjected: boolean;
  thptFallbackNotice: string | null;
  activeSupplementaryElectives: string[]; // 2 môn lựa chọn bổ sung (từ tổ hợp THPT tốt nhất hoặc tần suất tiếp theo)
  nextPriorityCandidates: SubjectFrequencyRow[]; // Danh sách môn có điểm ưu tiên cao tiếp theo (đã loại 2 môn dự kiến)
}

/**
 * BƯỚC 1: Truy xuất toàn bộ tổ hợp xét tuyển cho từng nguyện vọng (NV1, NV2, NV3)
 * - Khóa: MaTruongTuyenSinh + MaNganh (+ MaCTDT nếu có)
 * - Đọc chính xác MonThi1, MonThi2, MonThi3 (Mon1, Mon2, Mon3, Mon4)
 * - Không lấy dữ liệu ngành của trường khác
 * - Loại bỏ dòng tổ hợp trùng hoàn toàn trong cùng trường, ngành và chương trình
 */
export function extractWishesAdmissionCombos(
  activeWishes: UniversityWish[],
  toHopList: ToHopXetTuyenItem[]
): WishAnalysisResult[] {
  return activeWishes.map((w, wishIdx) => {
    const targetSchool = (w.maTruongDH || '').trim().toUpperCase();
    const targetMajor = (w.maNganh || '').trim().toUpperCase();
    const targetProg = (w.maChuongTrinh || '').trim().toUpperCase();
    const targetMajorName = (w.tenNganh || '').trim().toLowerCase();

    const normSchoolName = (s: string) =>
      s
        .toLowerCase()
        .replace(/^trường\s+/i, '')
        .replace(/đại học/g, 'đh')
        .replace(/[–—-]/g, '-')
        .replace(/\s+/g, ' ')
        .trim();

    const targetSchoolCleanName = w.tenTruongDH ? normSchoolName(w.tenTruongDH) : '';

    // Tuyệt đối chỉ lọc trong đúng trường đại học đã chọn (không gộp trường khác)
    const directSchoolMatches = targetSchool
      ? toHopList.filter((item) => (item.maTruongDH || '').trim().toUpperCase() === targetSchool)
      : toHopList;

    const sameSchoolItems =
      directSchoolMatches.length > 0 || !targetSchoolCleanName
        ? directSchoolMatches
        : toHopList.filter((item) => {
            const itemSchoolName = item.rawItem?.TenTruong ? normSchoolName(String(item.rawItem.TenTruong)) : '';
            return Boolean(itemSchoolName && itemSchoolName === targetSchoolCleanName);
          });

    // Truy vấn theo MaNganh / MaChuongTrinh
    let rawMatches = sameSchoolItems.filter((item) => {
      const itemMajor = (item.maNganh || '').trim().toUpperCase();
      const itemProg = (item.maChuongTrinh || '').trim().toUpperCase();
      if (targetMajor && itemMajor && itemMajor === targetMajor) return true;
      if (targetProg && itemProg && itemProg === targetProg) return true;
      return false;
    });

    // Fallback theo tên ngành chính xác trong cùng trường nếu thiếu mã ngành
    if (rawMatches.length === 0 && targetMajorName) {
      rawMatches = sameSchoolItems.filter((item) => {
        const itemMajorName = (item.tenNganh || '').trim().toLowerCase();
        return itemMajorName && itemMajorName === targetMajorName;
      });
    }

    // Loại bỏ các dòng tổ hợp xét tuyển trùng hoàn toàn trong cùng trường, ngành và chương trình trước khi thống kê
    const seenComboKeys = new Set<string>();
    const matchingCombos: ToHopXetTuyenItem[] = [];

    rawMatches.forEach((item) => {
      const comboCode = (item.maToHop || '').trim().toUpperCase();
      const raw1 = item.mon1 || item.rawItem?.MonThi1 || item.rawItem?.Mon1 || '';
      const raw2 = item.mon2 || item.rawItem?.MonThi2 || item.rawItem?.Mon2 || '';
      const raw3 = item.mon3 || item.rawItem?.MonThi3 || item.rawItem?.Mon3 || '';
      const raw4 = item.mon4 || item.rawItem?.Mon4NeuCo || item.rawItem?.Mon4 || '';

      const s1 = normalizeSubjectName(raw1);
      const s2 = normalizeSubjectName(raw2);
      const s3 = normalizeSubjectName(raw3);
      const s4 = normalizeSubjectName(raw4);

      const sortedSubjectsKey = [s1, s2, s3, s4].filter(Boolean).sort().join('_');
      const comboKey = `${comboCode}__${sortedSubjectsKey}`;

      if ((comboCode || sortedSubjectsKey) && !seenComboKeys.has(comboKey)) {
        seenComboKeys.add(comboKey);
        matchingCombos.push({
          ...item,
          mon1: raw1 || item.mon1,
          mon2: raw2 || item.mon2,
          mon3: raw3 || item.mon3,
          mon4: raw4 || item.mon4,
        });
      }
    });

    const isVerified = matchingCombos.length > 0;
    const allExamGroupCodes = Array.from(
      new Set(matchingCombos.map((c) => (c.maToHop || '').trim().toUpperCase()).filter(Boolean))
    );

    const comboDetails: AdmissionComboDetail[] = matchingCombos.map((c) => {
      const rawSubs = [c.mon1, c.mon2, c.mon3, c.mon4].filter((s): s is string =>
        Boolean(s && s.trim())
      );
      const normSubs = Array.from(new Set(rawSubs.map(normalizeSubjectName).filter(Boolean)));
      return {
        combo: c,
        code: (c.maToHop || '').trim().toUpperCase(),
        name: c.tenToHop || '',
        rawSubjects: rawSubs,
        subjects: normSubs,
        notes: c.dieuKienGhiChu || '',
        method: c.phuongThucXetTuyen || '',
      };
    });

    const allSubjects = new Set<string>();
    comboDetails.forEach((cd) => {
      cd.subjects.forEach((s) => allSubjects.add(s));
    });

    const subjectsArr = Array.from(allSubjects);
    const compulsoryNeeded = subjectsArr.filter((s) =>
      (COMPULSORY_THPT_CORE as readonly string[]).includes(s)
    );
    const electivesNeeded = subjectsArr.filter(
      (s) => !(COMPULSORY_THPT_CORE as readonly string[]).includes(s)
    );
    const notes = matchingCombos.find((c) => c.dieuKienGhiChu)?.dieuKienGhiChu || '';
    const prospectusUrl =
      matchingCombos.find((c) => c.urlDeAnTuyenSinh)?.urlDeAnTuyenSinh || '';

    return {
      wish: w,
      wishOrder: w.order || wishIdx + 1,
      verifiedCombos: matchingCombos,
      comboDetails,
      allExamGroupCodes,
      requiredSubjects: subjectsArr,
      electiveSubjectsNeeded: electivesNeeded,
      compulsorySubjectsNeeded: compulsoryNeeded,
      isVerified,
      notes,
      prospectusUrl,
    };
  });
}

/**
 * BƯỚC 2 & BƯỚC 3: Thống kê tần suất môn thi và tính điểm ưu tiên 3–2–1
 * - Loại Toán và Ngữ văn khỏi danh sách ứng viên 2 môn thi tự chọn
 * - Chỉ xét các môn thi hợp lệ theo quy chế hiện hành (phân tách riêng nếu có môn năng khiếu)
 * - DiemUuTien = 3 * TanSuatNV1 + 2 * TanSuatNV2 + 1 * TanSuatNV3
 */
export function computeSubjectFrequencyStats(
  wishesAnalysis: WishAnalysisResult[],
  favoriteSubjects: string[] = []
): {
  frequencyTable: SubjectFrequencyRow[];
  excludedNonExamSubjects: SubjectFrequencyRow[];
} {
  const statsMap = new Map<
    string,
    {
      tanSuatNV1: number;
      tanSuatNV2: number;
      tanSuatNV3: number;
      wishesSet: Set<number>;
      combosSet: Set<string>;
    }
  >();

  wishesAnalysis.forEach((wa, idx) => {
    const order = wa.wishOrder || idx + 1;
    if (order < 1 || order > 3) return;

    // Duyệt qua TỪNG tổ hợp xét tuyển duy nhất của nguyện vọng này
    wa.comboDetails.forEach((cd) => {
      const uniqueSubjectsInCombo = new Set(cd.subjects);
      uniqueSubjectsInCombo.forEach((sub) => {
        if (!sub || sub === 'Toán' || sub === 'Ngữ văn') return;

        if (!statsMap.has(sub)) {
          statsMap.set(sub, {
            tanSuatNV1: 0,
            tanSuatNV2: 0,
            tanSuatNV3: 0,
            wishesSet: new Set<number>(),
            combosSet: new Set<string>(),
          });
        }
        const entry = statsMap.get(sub)!;
        if (order === 1) entry.tanSuatNV1 += 1;
        else if (order === 2) entry.tanSuatNV2 += 1;
        else if (order === 3) entry.tanSuatNV3 += 1;

        entry.wishesSet.add(order);
        if (cd.code) entry.combosSet.add(`${cd.code} (NV${order})`);
      });
    });
  });

  const normFavorites = favoriteSubjects.map(normalizeSubjectName);

  const allRows: SubjectFrequencyRow[] = Array.from(statsMap.entries()).map(([subject, data]) => {
    const tongTanSuat = data.tanSuatNV1 + data.tanSuatNV2 + data.tanSuatNV3;
    const diemUuTien =
      (WISH_PRIORITY_WEIGHTS[1] ?? 3) * data.tanSuatNV1 +
      (WISH_PRIORITY_WEIGHTS[2] ?? 2) * data.tanSuatNV2 +
      (WISH_PRIORITY_WEIGHTS[3] ?? 1) * data.tanSuatNV3;

    return {
      subject,
      tanSuatNV1: data.tanSuatNV1,
      tanSuatNV2: data.tanSuatNV2,
      tanSuatNV3: data.tanSuatNV3,
      tongTanSuat,
      diemUuTien,
      isValidGraduationExam: VALID_GRADUATION_ELECTIVES.has(subject),
      wishesAppearing: Array.from(data.wishesSet).sort((a, b) => a - b),
      combosAppearing: Array.from(data.combosSet),
    };
  });

  const sortRows = (a: SubjectFrequencyRow, b: SubjectFrequencyRow) => {
    // 1. Điểm ưu tiên giảm dần
    if (b.diemUuTien !== a.diemUuTien) return b.diemUuTien - a.diemUuTien;
    // 2. TanSuatNV1 cao hơn
    if (b.tanSuatNV1 !== a.tanSuatNV1) return b.tanSuatNV1 - a.tanSuatNV1;
    // 3. TongTanSuat cao hơn
    if (b.tongTanSuat !== a.tongTanSuat) return b.tongTanSuat - a.tongTanSuat;
    // 4. Ưu tiên nhẹ môn học sinh thích ở THCS nếu hoàn toàn đồng hạng
    const aFav = normFavorites.includes(a.subject) ? 1 : 0;
    const bFav = normFavorites.includes(b.subject) ? 1 : 0;
    if (bFav !== aFav) return bFav - aFav;
    return a.subject.localeCompare(b.subject, 'vi');
  };

  const frequencyTable = allRows.filter((r) => r.isValidGraduationExam).sort(sortRows);
  const excludedNonExamSubjects = allRows.filter((r) => !r.isValidGraduationExam).sort(sortRows);

  return { frequencyTable, excludedNonExamSubjects };
}

/**
 * Đối chiếu một cặp 02 môn thi tự chọn (+ Toán, Ngữ văn) với TỪNG tổ hợp của TỪNG nguyện vọng
 */
export function evaluateExamPairAgainstWishes(
  sub1: string,
  sub2: string,
  wishesAnalysis: WishAnalysisResult[],
  freqMap: Map<string, SubjectFrequencyRow>
): ExamPairEvaluation {
  const s1Norm = normalizeSubjectName(sub1);
  const s2Norm = normalizeSubjectName(sub2);
  const fourSubjects = ['Toán', 'Ngữ văn', s1Norm, s2Norm];
  const examSet = new Set(fourSubjects);

  let satisfiedWishesCount = 0;
  let supportsNV1 = false;
  let supportsNV2 = false;
  let supportsNV3 = false;
  let totalSatisfiedCombos = 0;

  const breakdown: WishComparisonBreakdown[] = wishesAnalysis.map((wa, wIdx) => {
    const order = wa.wishOrder || wIdx + 1;
    const satisfiedCombos: WishComparisonBreakdown['satisfiedCombos'] = [];
    const partialCombos: WishComparisonBreakdown['partialCombos'] = [];

    wa.comboDetails.forEach((cd) => {
      const missing = cd.subjects.filter((sub) => !examSet.has(sub));
      const matched = cd.subjects.filter((sub) => examSet.has(sub));

      if (missing.length === 0) {
        satisfiedCombos.push({
          code: cd.code,
          subjects: cd.subjects,
          rawSubjects: cd.rawSubjects,
          notes: cd.notes,
        });
      } else {
        partialCombos.push({
          code: cd.code,
          subjects: cd.subjects,
          rawSubjects: cd.rawSubjects,
          missing,
          matched,
          notes: cd.notes,
        });
      }
    });

    const isSatisfied = satisfiedCombos.length > 0;
    if (isSatisfied) {
      satisfiedWishesCount++;
      if (order === 1) supportsNV1 = true;
      if (order === 2) supportsNV2 = true;
      if (order === 3) supportsNV3 = true;
      totalSatisfiedCombos += satisfiedCombos.length;
    }

    let matchLevel: 'FULL' | 'PARTIAL' | 'NONE' = 'NONE';
    let matchLabel = 'Chưa đáp ứng đủ môn xét tuyển';
    if (isSatisfied) {
      matchLevel = 'FULL';
      const codes = satisfiedCombos.map((c) => c.code).join(', ');
      matchLabel = `Đáp ứng đầy đủ (${satisfiedCombos.length} tổ hợp: ${codes})`;
    } else if (partialCombos.some((pc) => pc.missing.length === 1)) {
      matchLevel = 'PARTIAL';
      const bestPartial = partialCombos.find((pc) => pc.missing.length === 1);
      matchLabel = `Đáp ứng 1 phần (${bestPartial?.code} thiếu ${bestPartial?.missing.join(', ')})`;
    }

    return {
      wish: wa.wish,
      order,
      schoolName: wa.wish.tenVietTat || wa.wish.tenTruongDH || '',
      majorName: wa.wish.tenNganh || '',
      isSatisfied,
      allCombos: wa.comboDetails,
      satisfiedCombos,
      partialCombos,
      matchLevel,
      matchLabel,
    };
  });

  const allWishesSatisfied =
    wishesAnalysis.length > 0 && satisfiedWishesCount === wishesAnalysis.length;

  const p1 = freqMap.get(s1Norm)?.diemUuTien || 0;
  const p2 = freqMap.get(s2Norm)?.diemUuTien || 0;
  const frequencyPrioritySum = p1 + p2;

  let coverageScore = satisfiedWishesCount * 1000;
  if (supportsNV1) coverageScore += 500;
  if (supportsNV2) coverageScore += 200;
  if (supportsNV3) coverageScore += 100;
  coverageScore += totalSatisfiedCombos * 10 + frequencyPrioritySum;

  return {
    sub1: s1Norm,
    sub2: s2Norm,
    fourSubjects,
    satisfiedWishesCount,
    supportsNV1,
    supportsNV2,
    supportsNV3,
    allWishesSatisfied,
    totalSatisfiedCombos,
    frequencyPrioritySum,
    breakdown,
    coverageScore,
  };
}

/**
 * Thuật toán tổng hợp đầy đủ từ Bước 1 đến Bước 8
 */
export function runFrequencyConsultationAlgorithm(params: {
  activeWishes: UniversityWish[];
  toHopList: ToHopXetTuyenItem[];
  validTHPTCombinations: ToHopTHPTItem[];
  favoriteSubjects: string[];
  dominantHollandCode: RiasecKey;
}): FrequencyConsultationResult {
  const {
    activeWishes,
    toHopList,
    validTHPTCombinations,
    favoriteSubjects,
    dominantHollandCode,
  } = params;

  // BƯỚC 1: Truy xuất tổ hợp xét tuyển của từng nguyện vọng
  const wishesAnalysis = extractWishesAdmissionCombos(activeWishes, toHopList);

  // BƯỚC 2 & 3: Thống kê tần suất môn thi & tính điểm ưu tiên 3-2-1
  const { frequencyTable, excludedNonExamSubjects } = computeSubjectFrequencyStats(
    wishesAnalysis,
    favoriteSubjects
  );

  const freqMap = new Map<string, SubjectFrequencyRow>();
  frequencyTable.forEach((row) => freqMap.set(row.subject, row));

  // BƯỚC 4: Chọn 2 môn thi tốt nghiệp dự kiến theo thứ tự xếp hạng Điểm ưu tiên -> NV1 -> Tổng tần suất
  const normFavs = favoriteSubjects.map(normalizeSubjectName);
  const candidatePool: string[] = frequencyTable.map((r) => r.subject);

  // Nếu dữ liệu tổ hợp xét tuyển chỉ có < 2 môn tự chọn hợp lệ (ví dụ ngành chỉ xét duy nhất D01 - chỉ có Tiếng Anh),
  // bổ sung môn từ sở thích THCS hoặc các môn quy chế hợp lệ để hoàn thành cặp 02 môn thi tự chọn.
  if (candidatePool.length < 2) {
    const fallbackOrder = [
      ...normFavs.filter(
        (s) => s !== 'Toán' && s !== 'Ngữ văn' && VALID_GRADUATION_ELECTIVES.has(s)
      ),
      'Tiếng Anh',
      'Lịch sử',
      'Vật lí',
      'Hóa học',
      'Địa lí',
    ];
    for (const fb of fallbackOrder) {
      if (!candidatePool.includes(fb) && candidatePool.length < 2) {
        candidatePool.push(fb);
      }
    }
  }

  const sub1 = candidatePool[0] || 'Tiếng Anh';
  const sub2 = candidatePool[1] || 'Vật lí';
  const projectedPair: [string, string] = [sub1, sub2];
  const projectedEvaluation = evaluateExamPairAgainstWishes(sub1, sub2, wishesAnalysis, freqMap);
  const meetsAllWishesByFrequency = projectedEvaluation.allWishesSatisfied;

  // Kiểm tra các phương án đồng hạng (nếu môn thứ 2 bằng Điểm ưu tiên, TanSuatNV1 và TongTanSuat với các môn kế tiếp,
  // hoặc môn thứ 1 và thứ 2 cùng đồng hạng với môn khác)
  const tiedTopPairs: ExamPairEvaluation[] = [];
  const rank1Row = freqMap.get(sub1);
  const rank2Row = freqMap.get(sub2);

  if (rank1Row && rank2Row) {
    const topPairScore = rank1Row.diemUuTien + rank2Row.diemUuTien;
    const seenPairKeys = new Set<string>([[sub1, sub2].sort().join('|')]);

    for (let i = 0; i < frequencyTable.length; i++) {
      for (let j = i + 1; j < frequencyTable.length; j++) {
        const rA = frequencyTable[i];
        const rB = frequencyTable[j];
        const sumScore = rA.diemUuTien + rB.diemUuTien;
        // Đồng hạng nếu tổng điểm ưu tiên bằng đúng cặp đứng đầu và có cùng chỉ số NV1/Tổng tần suất tương đương ở vị trí biên
        const sameNV1 = rA.tanSuatNV1 + rB.tanSuatNV1 === rank1Row.tanSuatNV1 + rank2Row.tanSuatNV1;
        const sameTotal = rA.tongTanSuat + rB.tongTanSuat === rank1Row.tongTanSuat + rank2Row.tongTanSuat;
        const pKey = [rA.subject, rB.subject].sort().join('|');
        if (sumScore === topPairScore && sameNV1 && sameTotal && !seenPairKeys.has(pKey)) {
          seenPairKeys.add(pKey);
          tiedTopPairs.push(
            evaluateExamPairAgainstWishes(rA.subject, rB.subject, wishesAnalysis, freqMap)
          );
        }
      }
    }
  }

  // Tìm các phương án cặp môn thay thế có khả năng đáp ứng đầy đủ nhiều nguyện vọng hơn (hoặc giữ NV1 tốt hơn)
  const allPossibleValidElectives = Array.from(
    new Set([...candidatePool, ...Array.from(VALID_GRADUATION_ELECTIVES)])
  );
  const allCandidatePairsEvals: ExamPairEvaluation[] = [];
  const seenAllPairKeys = new Set<string>();

  for (let i = 0; i < allPossibleValidElectives.length; i++) {
    for (let j = i + 1; j < allPossibleValidElectives.length; j++) {
      const a = allPossibleValidElectives[i];
      const b = allPossibleValidElectives[j];
      // Chỉ xét các cặp có ít nhất 1 môn liên quan đến nguyện vọng để tránh nhiễu
      if (!freqMap.has(a) && !freqMap.has(b)) continue;
      const key = [a, b].sort().join('|');
      if (seenAllPairKeys.has(key)) continue;
      seenAllPairKeys.add(key);
      allCandidatePairsEvals.push(evaluateExamPairAgainstWishes(a, b, wishesAnalysis, freqMap));
    }
  }

  allCandidatePairsEvals.sort((a, b) => b.coverageScore - a.coverageScore);

  const primaryKey = [sub1, sub2].sort().join('|');
  const higherCoverageAlternatives = allCandidatePairsEvals.filter((pe) => {
    const key = [pe.sub1, pe.sub2].sort().join('|');
    if (key === primaryKey) return false;
    // Có số nguyện vọng đáp ứng nhiều hơn, hoặc đáp ứng NV1 khi phương án chính không đáp ứng NV1
    if (pe.satisfiedWishesCount > projectedEvaluation.satisfiedWishesCount) return true;
    if (!projectedEvaluation.supportsNV1 && pe.supportsNV1 && pe.satisfiedWishesCount >= projectedEvaluation.satisfiedWishesCount) {
      return true;
    }
    return false;
  });

  // Trạng thái chuẩn xác theo Lưu ý Bước 4 & Bước 8
  const statusTag: 'FULL_MATCH' | 'PARTIAL_MATCH' = meetsAllWishesByFrequency
    ? 'FULL_MATCH'
    : 'PARTIAL_MATCH';

  const statusBadgeText = meetsAllWishesByFrequency
    ? `Đáp ứng đầy đủ cả ${projectedEvaluation.satisfiedWishesCount}/${wishesAnalysis.length} nguyện vọng đã chọn`
    : `Phù hợp theo tần suất, chưa đáp ứng đầy đủ tổ hợp xét tuyển (${projectedEvaluation.satisfiedWishesCount}/${wishesAnalysis.length} NV đạt)`;

  const r1Str = rank1Row
    ? `${sub1} (Điểm ưu tiên: ${rank1Row.diemUuTien} = ${WISH_PRIORITY_WEIGHTS[1]}×${rank1Row.tanSuatNV1} + ${WISH_PRIORITY_WEIGHTS[2]}×${rank1Row.tanSuatNV2} + ${WISH_PRIORITY_WEIGHTS[3]}×${rank1Row.tanSuatNV3}; Tổng tần suất: ${rank1Row.tongTanSuat})`
    : sub1;
  const r2Str = rank2Row
    ? `${sub2} (Điểm ưu tiên: ${rank2Row.diemUuTien} = ${WISH_PRIORITY_WEIGHTS[1]}×${rank2Row.tanSuatNV1} + ${WISH_PRIORITY_WEIGHTS[2]}×${rank2Row.tanSuatNV2} + ${WISH_PRIORITY_WEIGHTS[3]}×${rank2Row.tanSuatNV3}; Tổng tần suất: ${rank2Row.tongTanSuat})`
    : sub2;

  const satisfiedWishesDesc = projectedEvaluation.breakdown
    .filter((b) => b.isSatisfied)
    .map((b) => `NV${b.order} (${b.majorName} – ${b.schoolName}) qua ${b.satisfiedCombos.map((c) => c.code).join(', ')}`)
    .join('; ');

  const unsatisfiedWishesDesc = projectedEvaluation.breakdown
    .filter((b) => !b.isSatisfied)
    .map((b) => `NV${b.order} (${b.majorName} – ${b.schoolName})`)
    .join('; ');

  let selectionReasonText = `Theo thuật toán Thống kê tần suất môn học ưu tiên NV1 (hệ số ${WISH_PRIORITY_WEIGHTS[1]}–${WISH_PRIORITY_WEIGHTS[2]}–${WISH_PRIORITY_WEIGHTS[3]}), hai môn thi tự chọn có điểm ưu tiên cao nhất là ${r1Str} và ${r2Str}.`;
  if (satisfiedWishesDesc) {
    selectionReasonText += ` Khi kết hợp với 2 môn bắt buộc (Toán, Ngữ văn), tập hợp 4 môn thi này đáp ứng đầy đủ ${satisfiedWishesDesc}.`;
  }
  if (unsatisfiedWishesDesc) {
    selectionReasonText += ` Lưu ý: Phương án theo tần suất này chưa đáp ứng đầy đủ tổ hợp xét tuyển của ${unsatisfiedWishesDesc} — học sinh nên xem thêm các phương án thay thế bên dưới.`;
  }

  // Danh sách môn ưu tiên tiếp theo (loại trừ 2 môn thi dự kiến) cho Bước 6
  const nextPriorityCandidates = frequencyTable.filter(
    (row) => row.subject !== sub1 && row.subject !== sub2
  );

  // Tổng hợp các phương án thay thế (ưu tiên phương án đáp ứng nhiều NV hơn nếu cần, sau đó là phương án đồng hạng và phương án kế tiếp có độ phủ tốt)
  const combinedAlternativesMap = new Map<string, ExamPairEvaluation>();
  [...higherCoverageAlternatives, ...tiedTopPairs, ...allCandidatePairsEvals].forEach((pe) => {
    const key = [pe.sub1, pe.sub2].sort().join('|');
    if (key === primaryKey) return;
    if (pe.satisfiedWishesCount === 0 && combinedAlternativesMap.size >= 3) return;
    if (!combinedAlternativesMap.has(key) && combinedAlternativesMap.size < 4) {
      combinedAlternativesMap.set(key, pe);
    }
  });
  const alternativePairs = Array.from(combinedAlternativesMap.values());

  // BƯỚC 5, 6, 7: Truy xuất tổ hợp THPT thực tế của trường, bổ sung 2 môn lựa chọn còn lại & xếp hạng
  const targetHollandSubjects = HOLLAND_MATCH_MAP[dominantHollandCode] || [];

  const rawEvaluatedTHPT: EvaluatedTHPTCombination[] = validTHPTCombinations
    .filter((item) => {
      const status = (item.trangThai || '').trim().toLowerCase();
      return !status.includes('ngừng') && !status.includes('hủy') && !status.includes('không áp dụng');
    })
    .map((item) => {
      // Đọc đúng 4 môn lựa chọn của tổ hợp từ Google Sheets (không tính môn bắt buộc hay chuyên đề)
      const electives =
        item.monLuaChon && item.monLuaChon.length > 0
          ? item.monLuaChon.filter(Boolean)
          : [item.monLuaChon1, item.monLuaChon2, item.monLuaChon3, item.monLuaChon4].filter(
              (m): m is string => Boolean(m && m.trim())
            );

      const topics =
        item.chuyenDe && item.chuyenDe.length > 0
          ? item.chuyenDe.filter(Boolean)
          : [item.chuyenDe1, item.chuyenDe2, item.chuyenDe3].filter((c): c is string =>
              Boolean(c && c.trim())
            );

      const normElectives = electives.map(normalizeSubjectName);

      // Các môn thực tế học sinh học liên tục đến lớp 12 khi chọn tổ hợp này:
      // Gồm các môn văn hóa bắt buộc (Toán, Ngữ văn, Tiếng Anh, Lịch sử) + 4 môn lựa chọn của tổ hợp
      const actualSubjectsToGrade12 = Array.from(
        new Set<string>([...COMPULSORY_THPT_CORE, ...normElectives])
      );
      const grade12Set = new Set(actualSubjectsToGrade12);

      // Bước 5: Kiểm tra tổ hợp THPT có đủ cả 2 môn thi dự kiến học đến lớp 12 hay không
      const containsProjectedSub1 = grade12Set.has(sub1);
      const containsProjectedSub2 = grade12Set.has(sub2);
      const containsBothProjectedExams = containsProjectedSub1 && containsProjectedSub2;

      // Bước 6: Trong 4 môn lựa chọn của tổ hợp THPT thực tế này, loại bỏ 2 môn thi dự kiến (nếu có trong 4 môn),
      // xếp hạng các môn lựa chọn còn lại theo Điểm ưu tiên -> TanSuatNV1 -> TongTanSuat và lấy 2 môn bổ sung cao nhất
      const remainingElectives = normElectives.filter((e) => e !== sub1 && e !== sub2);
      const sortedRemaining = [...remainingElectives].sort((a, b) => {
        const ra = freqMap.get(a);
        const rb = freqMap.get(b);
        const pa = ra?.diemUuTien || 0;
        const pb = rb?.diemUuTien || 0;
        if (pb !== pa) return pb - pa;
        const nv1a = ra?.tanSuatNV1 || 0;
        const nv1b = rb?.tanSuatNV1 || 0;
        if (nv1b !== nv1a) return nv1b - nv1a;
        const ta = ra?.tongTanSuat || 0;
        const tb = rb?.tongTanSuat || 0;
        if (tb !== ta) return tb - ta;
        const fa = normFavs.includes(a) ? 1 : 0;
        const fb = normFavs.includes(b) ? 1 : 0;
        return fb - fa;
      });

      const additionalElectives = sortedRemaining.slice(0, 2);
      const additionalElectiveDetails = additionalElectives.map((s) => ({
        subject: s,
        diemUuTien: freqMap.get(s)?.diemUuTien || 0,
        tongTanSuat: freqMap.get(s)?.tongTanSuat || 0,
      }));

      const top2AdditionalPriorityScore = additionalElectives.reduce(
        (sum, s) => sum + (freqMap.get(s)?.diemUuTien || 0),
        0
      );
      const allAdditionalPriorityScore = remainingElectives.reduce(
        (sum, s) => sum + (freqMap.get(s)?.diemUuTien || 0),
        0
      );

      // Đếm tổng số tổ hợp xét tuyển của các nguyện vọng nằm gọn trong các môn học đến lớp 12 của tổ hợp THPT này
      let reachableCombosCount = 0;
      wishesAnalysis.forEach((wa) => {
        wa.comboDetails.forEach((cd) => {
          if (cd.subjects.every((s) => grade12Set.has(s))) {
            reachableCombosCount++;
          }
        });
      });

      // Nếu tổ hợp THPT chứa cả 2 môn thi dự kiến thì đánh giá chính cặp dự kiến;
      // nếu không chứa đủ, tìm cặp môn thi tốt nghiệp hợp lệ tốt nhất có thể thi từ các môn của tổ hợp THPT này
      let bestExamPairInCombo: ExamPairEvaluation = projectedEvaluation;
      if (!containsBothProjectedExams) {
        const eligibleExams = actualSubjectsToGrade12.filter(
          (s) => s !== 'Toán' && s !== 'Ngữ văn' && VALID_GRADUATION_ELECTIVES.has(s)
        );
        let bestLocal: ExamPairEvaluation | null = null;
        for (let i = 0; i < eligibleExams.length; i++) {
          for (let j = i + 1; j < eligibleExams.length; j++) {
            const pe = evaluateExamPairAgainstWishes(
              eligibleExams[i],
              eligibleExams[j],
              wishesAnalysis,
              freqMap
            );
            if (!bestLocal || pe.coverageScore > bestLocal.coverageScore) {
              bestLocal = pe;
            }
          }
        }
        if (bestLocal) bestExamPairInCombo = bestLocal;
      }

      const supportsNV1 = bestExamPairInCombo.supportsNV1;
      const supportsNV2 = bestExamPairInCombo.supportsNV2;
      const supportsNV3 = bestExamPairInCombo.supportsNV3;
      const supportedWishesCount = bestExamPairInCombo.satisfiedWishesCount;
      const totalSatisfiedCombos = bestExamPairInCombo.totalSatisfiedCombos;

      const supportedWishesOrders: number[] = [];
      if (supportsNV1) supportedWishesOrders.push(1);
      if (supportsNV2) supportedWishesOrders.push(2);
      if (supportsNV3) supportedWishesOrders.push(3);

      // Tiêu chí 5: Sở thích THCS & Holland RIASEC
      const favoriteMatched = normElectives.filter((e) => normFavs.includes(e));
      const favoriteScore = Math.min(20, favoriteMatched.length * 5);

      const hollandMatched = normElectives.filter((e) => targetHollandSubjects.includes(e));
      const hollandScore =
        hollandMatched.length >= 3
          ? 10
          : hollandMatched.length === 2
          ? 7
          : hollandMatched.length === 1
          ? 4
          : 0;

      const totalScore = Math.min(
        100,
        (containsBothProjectedExams ? 50 : 20) +
          Math.min(25, top2AdditionalPriorityScore * 2) +
          (supportsNV1 ? 15 : 0) +
          Math.min(10, hollandScore + favoriteScore / 4)
      );

      const strengths: string[] = [];
      const limitations: string[] = [];

      if (containsBothProjectedExams) {
        strengths.push(
          `Đảm bảo học liên tục đến lớp 12 đủ cả 02 môn thi dự kiến (${sub1} & ${sub2}).`
        );
      } else {
        limitations.push(
          `Không bao gồm đầy đủ cả 02 môn thi dự kiến (${sub1}, ${sub2}); phương án thi phù hợp nhất với tổ hợp này là ${bestExamPairInCombo.sub1} + ${bestExamPairInCombo.sub2}.`
        );
      }

      if (additionalElectiveDetails.some((d) => d.diemUuTien > 0)) {
        const highSubs = additionalElectiveDetails
          .filter((d) => d.diemUuTien > 0)
          .map((d) => `${d.subject} (${d.diemUuTien}đ)`)
          .join(', ');
        strengths.push(`Bổ sung môn lựa chọn ưu tiên cao: ${highSubs}.`);
      }

      if (supportsNV1) {
        strengths.push('Đáp ứng đầy đủ ít nhất 01 tổ hợp xét tuyển của Nguyện vọng 1.');
      } else {
        limitations.push('Chưa đáp ứng trực tiếp tổ hợp xét tuyển của Nguyện vọng 1.');
      }

      return {
        comb: item,
        electives,
        topics,
        normElectives,
        actualSubjectsToGrade12,
        containsBothProjectedExams,
        containsProjectedSub1,
        containsProjectedSub2,
        additionalElectives,
        additionalElectiveDetails,
        top2AdditionalPriorityScore,
        allAdditionalPriorityScore,
        bestExamPairInCombo,
        supportsNV1,
        supportsNV2,
        supportsNV3,
        supportedWishesCount,
        supportedWishesOrders,
        totalSatisfiedCombos,
        reachableCombosCount,
        hollandScore,
        favoriteScore,
        score: totalScore,
        strengths,
        limitations,
      };
    });

  // BƯỚC 7: Xếp hạng tổ hợp THPT theo đúng 5 thứ tự ưu tiên
  const evaluatedTHPTCombinations = [...rawEvaluatedTHPT].sort((a, b) => {
    // 1. Tổ hợp THPT thực tế, hợp lệ (đã lọc)
    // 2. Có đủ 2 môn thi tốt nghiệp dự kiến
    if (a.containsBothProjectedExams !== b.containsBothProjectedExams) {
      return a.containsBothProjectedExams ? -1 : 1;
    }

    // Nếu cả 2 đều chứa đủ 2 môn thi dự kiến -> xếp theo:
    // 3. Hai môn lựa chọn còn lại có tổng điểm ưu tiên cao nhất
    // 4. Đáp ứng đầy đủ nhiều tổ hợp xét tuyển và nguyện vọng hơn
    // 5. Phù hợp với sở thích, kết quả Holland của học sinh
    if (a.containsBothProjectedExams && b.containsBothProjectedExams) {
      if (b.top2AdditionalPriorityScore !== a.top2AdditionalPriorityScore) {
        return b.top2AdditionalPriorityScore - a.top2AdditionalPriorityScore;
      }
      if (b.allAdditionalPriorityScore !== a.allAdditionalPriorityScore) {
        return b.allAdditionalPriorityScore - a.allAdditionalPriorityScore;
      }
      if (a.supportsNV1 !== b.supportsNV1) {
        return a.supportsNV1 ? -1 : 1;
      }
      if (b.supportedWishesCount !== a.supportedWishesCount) {
        return b.supportedWishesCount - a.supportedWishesCount;
      }
      if (b.reachableCombosCount !== a.reachableCombosCount) {
        return b.reachableCombosCount - a.reachableCombosCount;
      }
      if (b.totalSatisfiedCombos !== a.totalSatisfiedCombos) {
        return b.totalSatisfiedCombos - a.totalSatisfiedCombos;
      }
    } else {
      // Trường hợp fallback (không có tổ hợp chứa đủ cả 2 môn dự kiến): ưu tiên phương án thực tế đáp ứng được NV1 & nhiều NV nhất
      if (a.supportsNV1 !== b.supportsNV1) {
        return a.supportsNV1 ? -1 : 1;
      }
      if (b.supportedWishesCount !== a.supportedWishesCount) {
        return b.supportedWishesCount - a.supportedWishesCount;
      }
      if (b.top2AdditionalPriorityScore !== a.top2AdditionalPriorityScore) {
        return b.top2AdditionalPriorityScore - a.top2AdditionalPriorityScore;
      }
      if (b.reachableCombosCount !== a.reachableCombosCount) {
        return b.reachableCombosCount - a.reachableCombosCount;
      }
    }

    // 5. Phù hợp với sở thích, kết quả Holland của học sinh
    const aFit = a.hollandScore + a.favoriteScore;
    const bFit = b.hollandScore + b.favoriteScore;
    if (bFit !== aFit) return bFit - aFit;

    return b.score - a.score;
  });

  // Hiển thị tối đa 3 tổ hợp THPT được đề xuất
  const top3THPTCombinations = evaluatedTHPTCombinations.slice(0, 3);
  const anyTHPTContainsBothProjected = evaluatedTHPTCombinations.some(
    (c) => c.containsBothProjectedExams
  );

  let thptFallbackNotice: string | null = null;
  if (evaluatedTHPTCombinations.length > 0 && !anyTHPTContainsBothProjected) {
    const topFallback = evaluatedTHPTCombinations[0];
    thptFallbackNotice = `Lưu ý: Trường THPT đã chọn hiện không có tổ hợp môn học lớp 10 nào bao gồm đầy đủ cả 2 môn thi dự kiến (${sub1} và ${sub2}) đến lớp 12. Hệ thống đã tự động tìm phương án tổ hợp thực tế khả thi nhất tại trường là ${topFallback.comb.maToHopTHPT} (${topFallback.electives.join(', ')}) kết hợp cặp môn thi thay thế ${topFallback.bestExamPairInCombo.sub1} + ${topFallback.bestExamPairInCombo.sub2}.`;
  }

  const activeSupplementaryElectives =
    top3THPTCombinations[0]?.additionalElectives ||
    nextPriorityCandidates.slice(0, 2).map((r) => r.subject);

  return {
    wishesAnalysis,
    frequencyTable,
    excludedNonExamSubjects,
    projectedPair,
    projectedFourSubjects: projectedEvaluation.fourSubjects,
    projectedEvaluation,
    meetsAllWishesByFrequency,
    statusTag,
    statusBadgeText,
    selectionReasonText,
    tiedTopPairs,
    higherCoverageAlternatives,
    alternativePairs,
    evaluatedTHPTCombinations,
    top3THPTCombinations,
    anyTHPTContainsBothProjected,
    thptFallbackNotice,
    activeSupplementaryElectives,
    nextPriorityCandidates,
  };
}
