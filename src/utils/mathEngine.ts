/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EndpointVal, IntervalItem, RealSet, SetOperation } from '../types';

/**
 * Parses numeric value or infinity from string
 */
function parseBoundValue(valStr: string): { val: number | '-Infinity' | '+Infinity'; isInfinity: boolean } | null {
  const s = valStr.trim().toLowerCase();
  if (s === '-∞' || s === '-oo' || s === '-inf' || s === '-infinity') {
    return { val: '-Infinity', isInfinity: true };
  }
  if (s === '+∞' || s === '+oo' || s === '+inf' || s === '+infinity' || s === '∞' || s === 'oo' || s === 'inf') {
    return { val: '+Infinity', isInfinity: true };
  }

  // Check fraction like 1/2 or -3/4
  if (s.includes('/')) {
    const parts = s.split('/');
    if (parts.length === 2) {
      const num = Number(parts[0]);
      const den = Number(parts[1]);
      if (!isNaN(num) && !isNaN(den) && den !== 0) {
        return { val: num / den, isInfinity: false };
      }
    }
  }

  // Handle decimal with comma like 2,5 -> 2.5
  const normalized = s.replace(',', '.');
  const n = Number(normalized);
  if (!isNaN(n)) {
    return { val: n, isInfinity: false };
  }
  return null;
}

/**
 * Format a number cleanly (e.g. 2 instead of 2.0, or rounded decimals if needed)
 */
export function formatNumber(n: number | '-Infinity' | '+Infinity'): string {
  if (n === '-Infinity') return '-∞';
  if (n === '+Infinity') return '+∞';
  // If integer
  if (Number.isInteger(n)) return n.toString();
  // Round to max 3 decimal places
  const rounded = Math.round(n * 1000) / 1000;
  return rounded.toString();
}

/**
 * Formats a single IntervalItem to standard Vietnamese notation
 */
export function formatSingleInterval(item: IntervalItem): string {
  if (item.left === '-Infinity' && item.right === '+Infinity') {
    return 'ℝ';
  }
  if (item.left === item.right && typeof item.left === 'number') {
    return `{${formatNumber(item.left)}}`;
  }

  const leftBracket = item.leftInclusive ? '[' : '(';
  const rightBracket = item.rightInclusive ? ']' : ')';
  const leftStr = formatNumber(item.left);
  const rightStr = formatNumber(item.right);

  return `${leftBracket}${leftStr}; ${rightStr}${rightBracket}`;
}

/**
 * Formats an array of intervals into standard Vietnamese mathematical string
 */
export function formatRealSet(intervals: IntervalItem[]): string {
  if (intervals.length === 0) {
    return '∅';
  }
  if (intervals.length === 1) {
    return formatSingleInterval(intervals[0]);
  }
  // Multiple disjoint components joined by ∪
  return intervals.map(formatSingleInterval).join(' ∪ ');
}

/**
 * Classifies the type of set for pedagogical explanations
 */
function classifySetKind(intervals: IntervalItem[]): RealSet['kind'] {
  if (intervals.length === 0) return 'empty';
  if (intervals.length > 1) return 'union';
  const item = intervals[0];
  if (item.left === '-Infinity' && item.right === '+Infinity') return 'real';
  if (item.left === item.right) return 'singleton';
  if (item.left === '-Infinity') return 'infinite_left';
  if (item.right === '+Infinity') return 'infinite_right';
  if (item.leftInclusive && item.rightInclusive) return 'closed';
  if (!item.leftInclusive && !item.rightInclusive) return 'open';
  return 'half_open';
}

/**
 * Parses user input into a RealSet with strict pedagogical error checking
 */
export function parseRealSet(input: string): RealSet {
  const trimmed = input.trim();

  if (!trimmed) {
    return {
      rawInput: input,
      isValid: false,
      errorMessage: 'Vui lòng nhập một tập hợp (ví dụ: [-2; 5), (1; +∞), ℝ, ∅).',
      intervals: [],
      formatted: '',
      kind: 'unknown',
    };
  }

  // Check ℝ / R
  if (trimmed === 'ℝ' || trimmed.toUpperCase() === 'R' || trimmed.toLowerCase() === 'r') {
    const item: IntervalItem = {
      left: '-Infinity',
      leftInclusive: false,
      right: '+Infinity',
      rightInclusive: false,
    };
    return {
      rawInput: input,
      isValid: true,
      intervals: [item],
      formatted: 'ℝ',
      kind: 'real',
    };
  }

  // Check empty set ∅ / {} / phi
  if (trimmed === '∅' || trimmed === '{}' || trimmed.toLowerCase() === 'phi' || trimmed.toLowerCase() === 'rong') {
    return {
      rawInput: input,
      isValid: true,
      intervals: [],
      formatted: '∅',
      kind: 'empty',
    };
  }

  // Check singleton or finite set like {2} or {1; 3}
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    const inner = trimmed.slice(1, -1).trim();
    if (!inner) {
      return {
        rawInput: input,
        isValid: true,
        intervals: [],
        formatted: '∅',
        kind: 'empty',
      };
    }
    const elements = inner.split(/[,;]/).map(s => s.trim()).filter(Boolean);
    const nums: number[] = [];
    for (const el of elements) {
      const parsed = parseBoundValue(el);
      if (!parsed || parsed.isInfinity || typeof parsed.val !== 'number') {
        return {
          rawInput: input,
          isValid: false,
          errorMessage: 'Các phần tử trong tập hợp hữu hạn phải là các số thực cụ thể.',
          intervals: [],
          formatted: '',
          kind: 'unknown',
        };
      }
      nums.push(parsed.val);
    }
    nums.sort((a, b) => a - b);
    // Remove duplicates
    const uniqueNums = Array.from(new Set(nums));
    const intervals: IntervalItem[] = uniqueNums.map(n => ({
      left: n,
      leftInclusive: true,
      right: n,
      rightInclusive: true,
    }));
    return {
      rawInput: input,
      isValid: true,
      intervals,
      formatted: uniqueNums.length === 1 ? `{${formatNumber(uniqueNums[0])}}` : `{${uniqueNums.map(formatNumber).join('; ')}}`,
      kind: uniqueNums.length === 1 ? 'singleton' : 'union',
    };
  }

  // Specific check for invalid infinity bracket syntax requested in prompt:
  // "Nếu dùng ngoặc vuông với vô cực, thông báo: Vô cực không phải là một số thực nên không được lấy làm phần tử của tập hợp. Hãy dùng ngoặc tròn với ±∞."
  if (/\[\s*(-∞|-oo|-inf|-infinity)/i.test(trimmed) || /(\+∞|\+oo|\+inf|\+infinity|∞|oo|inf)\s*\]/i.test(trimmed)) {
    return {
      rawInput: input,
      isValid: false,
      errorMessage: 'Vô cực không phải là một số thực nên không được lấy làm phần tử của tập hợp. Hãy dùng ngoặc tròn với ±∞.',
      intervals: [],
      formatted: '',
      kind: 'unknown',
    };
  }

  // Match bracket expressions: ( or [ ... ; or , ... ) or ]
  const firstChar = trimmed[0];
  const lastChar = trimmed[trimmed.length - 1];

  if ((firstChar !== '(' && firstChar !== '[') || (lastChar !== ')' && lastChar !== ']')) {
    return {
      rawInput: input,
      isValid: false,
      errorMessage: 'Tập hợp chưa đúng định dạng. Em hãy kiểm tra lại hai đầu mút (ví dụ: [-2; 5) hoặc (-∞; 3]).',
      intervals: [],
      formatted: '',
      kind: 'unknown',
    };
  }

  const leftInclusive = firstChar === '[';
  const rightInclusive = lastChar === ']';

  const inner = trimmed.slice(1, -1).trim();
  // Split by semicolon ';' or comma ',' (semicolon is prioritized)
  let parts: string[];
  if (inner.includes(';')) {
    parts = inner.split(';');
  } else {
    parts = inner.split(',');
  }

  if (parts.length !== 2) {
    return {
      rawInput: input,
      isValid: false,
      errorMessage: 'Tập hợp chưa đúng định dạng. Em hãy phân cách hai đầu mút bằng dấu chấm phẩy ; (ví dụ: [-3; 5]).',
      intervals: [],
      formatted: '',
      kind: 'unknown',
    };
  }

  const leftParsed = parseBoundValue(parts[0]);
  const rightParsed = parseBoundValue(parts[1]);

  if (!leftParsed || !rightParsed) {
    return {
      rawInput: input,
      isValid: false,
      errorMessage: 'Tập hợp chưa đúng định dạng. Em hãy kiểm tra lại hai đầu mút.',
      intervals: [],
      formatted: '',
      kind: 'unknown',
    };
  }

  // Infinity sign rules
  if (leftParsed.val === '+Infinity') {
    return {
      rawInput: input,
      isValid: false,
      errorMessage: 'Đầu mút bên trái không thể là +∞. Nếu muốn biểu diễn vô cực bên trái, hãy dùng -∞.',
      intervals: [],
      formatted: '',
      kind: 'unknown',
    };
  }
  if (rightParsed.val === '-Infinity') {
    return {
      rawInput: input,
      isValid: false,
      errorMessage: 'Đầu mút bên phải không thể là -∞. Nếu muốn biểu diễn vô cực bên phải, hãy dùng +∞.',
      intervals: [],
      formatted: '',
      kind: 'unknown',
    };
  }

  // Validate left vs right ordering
  if (typeof leftParsed.val === 'number' && typeof rightParsed.val === 'number') {
    if (leftParsed.val > rightParsed.val) {
      return {
        rawInput: input,
        isValid: false,
        errorMessage: 'Đầu mút bên trái phải nhỏ hơn hoặc bằng đầu mút bên phải.',
        intervals: [],
        formatted: '',
        kind: 'unknown',
      };
    }

    if (leftParsed.val === rightParsed.val) {
      if (leftInclusive && rightInclusive) {
        const item: IntervalItem = {
          left: leftParsed.val,
          leftInclusive: true,
          right: rightParsed.val,
          rightInclusive: true,
        };
        return {
          rawInput: input,
          isValid: true,
          intervals: [item],
          formatted: `{${formatNumber(leftParsed.val)}}`,
          kind: 'singleton',
        };
      } else {
        // e.g. (2; 2) is empty set
        return {
          rawInput: input,
          isValid: true,
          intervals: [],
          formatted: '∅',
          kind: 'empty',
        };
      }
    }
  }

  const intervalItem: IntervalItem = {
    left: leftParsed.val,
    leftInclusive: leftParsed.isInfinity ? false : leftInclusive,
    right: rightParsed.val,
    rightInclusive: rightParsed.isInfinity ? false : rightInclusive,
  };

  const intervals = [intervalItem];
  const formatted = formatRealSet(intervals);
  const kind = classifySetKind(intervals);

  return {
    rawInput: input,
    isValid: true,
    intervals,
    formatted,
    kind,
  };
}

/**
 * Helper to compare endpoints
 */
function compareLeft(a: IntervalItem, b: IntervalItem): number {
  if (a.left === b.left) {
    if (a.leftInclusive === b.leftInclusive) return 0;
    return a.leftInclusive ? -1 : 1; // inclusive comes first at left
  }
  if (a.left === '-Infinity') return -1;
  if (b.left === '-Infinity') return 1;
  return (a.left as number) - (b.left as number);
}

/**
 * Simplifies and merges overlapping/contiguous intervals
 */
export function simplifyIntervals(list: IntervalItem[]): IntervalItem[] {
  if (list.length <= 1) return list;

  // Filter out any invalid intervals where left > right or empty singletons
  const valid = list.filter(item => {
    if (typeof item.left === 'number' && typeof item.right === 'number') {
      if (item.left > item.right) return false;
      if (item.left === item.right && (!item.leftInclusive || !item.rightInclusive)) return false;
    }
    return true;
  });

  if (valid.length === 0) return [];

  // Sort by left boundary
  valid.sort(compareLeft);

  const result: IntervalItem[] = [valid[0]];

  for (let i = 1; i < valid.length; i++) {
    const current = valid[i];
    const prev = result[result.length - 1];

    // Check overlap or touching
    let overlaps = false;

    if (prev.right === '+Infinity') {
      // Prev already extends to +∞, it covers everything to the right
      continue;
    }

    if (current.left === '-Infinity') {
      // Should not happen as first item is already sorted, but if so:
      overlaps = true;
    } else if (typeof prev.right === 'number' && typeof current.left === 'number') {
      if (prev.right > current.left) {
        overlaps = true;
      } else if (prev.right === current.left) {
        // Touch if at least one includes the point
        if (prev.rightInclusive || current.leftInclusive) {
          overlaps = true;
        }
      }
    }

    if (overlaps) {
      // Merge current into prev
      if (current.right === '+Infinity') {
        prev.right = '+Infinity';
        prev.rightInclusive = false;
      } else {
        const prevR = prev.right as number;
        const currR = current.right as number;
        if (currR > prevR) {
          prev.right = currR;
          prev.rightInclusive = current.rightInclusive;
        } else if (currR === prevR) {
          prev.rightInclusive = prev.rightInclusive || current.rightInclusive;
        }
      }
    } else {
      result.push(current);
    }
  }

  return result;
}

/**
 * Computes intersection of two single intervals
 */
function intersectSingle(a: IntervalItem, b: IntervalItem): IntervalItem | null {
  // Determine left
  let maxLeft: number | '-Infinity';
  let leftInc: boolean;

  if (a.left === '-Infinity') {
    maxLeft = b.left;
    leftInc = b.leftInclusive;
  } else if (b.left === '-Infinity') {
    maxLeft = a.left;
    leftInc = a.leftInclusive;
  } else {
    const aL = a.left as number;
    const bL = b.left as number;
    if (aL > bL) {
      maxLeft = aL;
      leftInc = a.leftInclusive;
    } else if (bL > aL) {
      maxLeft = bL;
      leftInc = b.leftInclusive;
    } else {
      maxLeft = aL;
      leftInc = a.leftInclusive && b.leftInclusive;
    }
  }

  // Determine right
  let minRight: number | '+Infinity';
  let rightInc: boolean;

  if (a.right === '+Infinity') {
    minRight = b.right;
    rightInc = b.rightInclusive;
  } else if (b.right === '+Infinity') {
    minRight = a.right;
    rightInc = a.rightInclusive;
  } else {
    const aR = a.right as number;
    const bR = b.right as number;
    if (aR < bR) {
      minRight = aR;
      rightInc = a.rightInclusive;
    } else if (bR < aR) {
      minRight = bR;
      rightInc = b.rightInclusive;
    } else {
      minRight = aR;
      rightInc = a.rightInclusive && b.rightInclusive;
    }
  }

  // Validate intersection
  if (typeof maxLeft === 'number' && typeof minRight === 'number') {
    if (maxLeft > minRight) return null;
    if (maxLeft === minRight) {
      if (leftInc && rightInc) {
        return {
          left: maxLeft,
          leftInclusive: true,
          right: minRight,
          rightInclusive: true,
        };
      }
      return null;
    }
  }

  return {
    left: maxLeft,
    leftInclusive: leftInc,
    right: minRight,
    rightInclusive: rightInc,
  };
}

/**
 * Computes difference: single interval a minus single interval b
 * Returns 0, 1, or 2 intervals.
 */
function differenceSingle(a: IntervalItem, b: IntervalItem): IntervalItem[] {
  const common = intersectSingle(a, b);
  if (!common) {
    // No overlap: a \ b is just a
    return [{ ...a }];
  }

  const result: IntervalItem[] = [];

  // Left piece: from a.left to common.left
  if (a.left !== common.left) {
    result.push({
      left: a.left,
      leftInclusive: a.leftInclusive,
      right: common.left as number,
      rightInclusive: !common.leftInclusive,
    });
  } else if (a.leftInclusive && !common.leftInclusive && typeof a.left === 'number') {
    // a included left endpoint, but common did not -> that point is preserved in difference!
    result.push({
      left: a.left,
      leftInclusive: true,
      right: a.left,
      rightInclusive: true,
    });
  }

  // Right piece: from common.right to a.right
  if (common.right !== a.right) {
    result.push({
      left: common.right as number,
      leftInclusive: !common.rightInclusive,
      right: a.right,
      rightInclusive: a.rightInclusive,
    });
  } else if (a.rightInclusive && !common.rightInclusive && typeof a.right === 'number') {
    // a included right endpoint, but common did not -> that point is preserved!
    result.push({
      left: a.right,
      leftInclusive: true,
      right: a.right,
      rightInclusive: true,
    });
  }

  // Filter valid intervals
  return result.filter(item => {
    if (typeof item.left === 'number' && typeof item.right === 'number') {
      if (item.left > item.right) return false;
      if (item.left === item.right && (!item.leftInclusive || !item.rightInclusive)) return false;
    }
    return true;
  });
}

/**
 * Computes A ∩ B
 */
export function intersectSets(setA: RealSet, setB: RealSet): RealSet {
  if (!setA.isValid || !setB.isValid) {
    return { rawInput: '', isValid: false, intervals: [], formatted: '∅', kind: 'unknown' };
  }

  const resultList: IntervalItem[] = [];
  for (const a of setA.intervals) {
    for (const b of setB.intervals) {
      const inter = intersectSingle(a, b);
      if (inter) {
        resultList.push(inter);
      }
    }
  }

  const simplified = simplifyIntervals(resultList);
  return {
    rawInput: `${setA.formatted} ∩ ${setB.formatted}`,
    isValid: true,
    intervals: simplified,
    formatted: formatRealSet(simplified),
    kind: classifySetKind(simplified),
  };
}

/**
 * Computes A ∪ B
 */
export function unionSets(setA: RealSet, setB: RealSet): RealSet {
  if (!setA.isValid || !setB.isValid) {
    return { rawInput: '', isValid: false, intervals: [], formatted: '∅', kind: 'unknown' };
  }

  const combined = [...setA.intervals, ...setB.intervals];
  const simplified = simplifyIntervals(combined);

  return {
    rawInput: `${setA.formatted} ∪ ${setB.formatted}`,
    isValid: true,
    intervals: simplified,
    formatted: formatRealSet(simplified),
    kind: classifySetKind(simplified),
  };
}

/**
 * Computes A \ B
 */
export function differenceSets(setA: RealSet, setB: RealSet): RealSet {
  if (!setA.isValid || !setB.isValid) {
    return { rawInput: '', isValid: false, intervals: [], formatted: '∅', kind: 'unknown' };
  }

  let currentList = setA.intervals.map(i => ({ ...i }));

  for (const b of setB.intervals) {
    const nextList: IntervalItem[] = [];
    for (const a of currentList) {
      const diffPieces = differenceSingle(a, b);
      nextList.push(...diffPieces);
    }
    currentList = nextList;
  }

  const simplified = simplifyIntervals(currentList);
  return {
    rawInput: `${setA.formatted} \\ ${setB.formatted}`,
    isValid: true,
    intervals: simplified,
    formatted: formatRealSet(simplified),
    kind: classifySetKind(simplified),
  };
}

/**
 * Computes complement of a set in R: C_R(set) = R \ set
 */
export function complementSet(set: RealSet): RealSet {
  if (!set.isValid) {
    return { rawInput: 'ℝ', isValid: true, intervals: [{ left: '-Infinity', leftInclusive: false, right: '+Infinity', rightInclusive: false }], formatted: 'ℝ', kind: 'real' };
  }
  const setR: RealSet = {
    rawInput: 'ℝ',
    isValid: true,
    intervals: [{ left: '-Infinity', leftInclusive: false, right: '+Infinity', rightInclusive: false }],
    formatted: 'ℝ',
    kind: 'real',
  };
  return differenceSets(setR, set);
}

/**
 * Executes requested SetOperation
 */
export function calculateOperation(setA: RealSet, setB: RealSet, op: SetOperation): RealSet {
  switch (op) {
    case 'INTERSECTION':
      return intersectSets(setA, setB);
    case 'UNION':
      return unionSets(setA, setB);
    case 'DIFF_A_B':
      return differenceSets(setA, setB);
    case 'DIFF_B_A':
      return differenceSets(setB, setA);
  }
}

/**
 * Generates clear, concise 1-3 sentence pedagogical explanations (Toán 10 GDPT 2018)
 */
export function generateExplanation(
  setA: RealSet,
  setB: RealSet,
  op: SetOperation,
  result: RealSet
): string {
  const nameA = `A = ${setA.formatted}`;
  const nameB = `B = ${setB.formatted}`;

  if (result.intervals.length === 0) {
    if (op === 'INTERSECTION') {
      return `Phần giao gồm những số đồng thời thuộc cả hai tập hợp A và B. Do tập A và tập B không có phần tử chung nào trên trục số, nên kết quả là tập rỗng ∅.`;
    }
    if (op === 'DIFF_A_B') {
      return `Phép hiệu A \\ B lấy các phần tử thuộc A nhưng loại bỏ các phần tử nằm trong B. Toàn bộ tập A đã nằm trọn trong B, do đó sau khi loại bỏ ta thu được tập rỗng ∅.`;
    }
    if (op === 'DIFF_B_A') {
      return `Phép hiệu B \\ A lấy các phần tử thuộc B nhưng loại bỏ các phần tử nằm trong A. Toàn bộ tập B đã nằm trọn trong A, do đó kết quả là tập rỗng ∅.`;
    }
  }

  if (result.kind === 'singleton') {
    const pt = result.intervals[0].left;
    if (op === 'INTERSECTION') {
      return `Phần giao của A và B chỉ gặp nhau tại đúng một điểm chung duy nhất là x = ${formatNumber(pt)}. Ta biểu diễn kết quả là tập hợp có một phần tử {${formatNumber(pt)}} bằng một chấm tròn đặc trên trục số.`;
    }
  }

  switch (op) {
    case 'INTERSECTION':
      return `Phần giao (A ∩ B) gồm những số đồng thời thuộc cả A và B (phần chung). Quan sát hai trục số phía trên, phần gióng chung gióng xuống cho kết quả ${result.formatted}. Chấm đặc thể hiện điểm mút thuộc cả hai tập; chấm rỗng nếu có ít nhất một tập không chứa điểm mút đó.`;

    case 'UNION':
      return `Phần hợp (A ∪ B) gồm tất cả các số thuộc ít nhất một trong hai tập hợp (gộp A và B lại). Toàn bộ vùng được tô màu của cả tập A và tập B được kết hợp liên tục hoặc hợp các khoảng tạo thành kết quả ${result.formatted}.`;

    case 'DIFF_A_B':
      return `Phép hiệu (A \\ B) giữ lại những phần tử thuộc tập A và loại bỏ toàn bộ phần tử đồng thời nằm trong tập B. Điểm mút của phần bị trừ sẽ đảo trạng thái (từ không thuộc B trở thành thuộc hiệu, hoặc ngược lại). Kết quả là ${result.formatted}.`;

    case 'DIFF_B_A':
      return `Phép hiệu (B \\ A) giữ lại những phần tử thuộc tập B và loại bỏ toàn bộ phần tử đồng thời nằm trong tập A. Ta thu được phần còn lại của B là ${result.formatted}.`;
  }
}
