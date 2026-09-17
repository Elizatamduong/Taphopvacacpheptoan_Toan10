/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { parseRealSet } from '../utils/mathEngine';
import { NumberLine } from './NumberLine';
import { MathSymbolKeyboard } from './MathSymbolKeyboard';
import { Sparkles, RotateCcw, HelpCircle, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

export const TabSingleSet: React.FC = () => {
  const [inputValue, setInputValue] = useState<string>('[-2;5)');
  const [activeSet, setActiveSet] = useState(() => parseRealSet('[-2;5)'));
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Guided builder state
  const [showBuilder, setShowBuilder] = useState(false);
  const [builderType, setBuilderType] = useState<'bounded' | 'left_inf' | 'right_inf' | 'real' | 'empty'>('bounded');
  const [builderLeftVal, setBuilderLeftVal] = useState('-2');
  const [builderRightVal, setBuilderRightVal] = useState('5');
  const [builderLeftInc, setBuilderLeftInc] = useState(true);
  const [builderRightInc, setBuilderRightInc] = useState(false);
  const [hatchExcluded, setHatchExcluded] = useState<boolean>(true);

  // Quick examples from prompt:
  // (-2;4), [-3;5], [1;6), (-∞;3], [-2;+∞)
  const quickExamples = [
    { label: '(-2;4)', value: '(-2;4)', desc: 'Khoảng' },
    { label: '[-3;5]', value: '[-3;5]', desc: 'Đoạn' },
    { label: '[1;6)', value: '[1;6)', desc: 'Nửa khoảng' },
    { label: '(-∞;3]', value: '(-∞;3]', desc: 'Nửa khoảng vô cực' },
    { label: '[-2;+∞)', value: '[-2;+∞)', desc: 'Nửa khoảng vô cực' },
    { label: 'ℝ', value: 'ℝ', desc: 'Toàn bộ trục số thực' },
    { label: '∅', value: '∅', desc: 'Tập rỗng' },
  ];

  const handleDraw = (textToParse?: string) => {
    const text = textToParse !== undefined ? textToParse : inputValue;
    const parsed = parseRealSet(text);
    if (!parsed.isValid) {
      setErrorMsg(parsed.errorMessage || 'Tập hợp chưa đúng định dạng. Em hãy kiểm tra lại hai đầu mút.');
    } else {
      setErrorMsg(null);
      setActiveSet(parsed);
      setInputValue(text);
    }
  };

  const handleReset = () => {
    setInputValue('');
    setErrorMsg(null);
    setActiveSet(parseRealSet('∅'));
  };

  const handleApplyBuilder = () => {
    let result = '';
    if (builderType === 'real') {
      result = 'ℝ';
    } else if (builderType === 'empty') {
      result = '∅';
    } else if (builderType === 'left_inf') {
      const rightBracket = builderRightInc ? ']' : ')';
      result = `(-∞;${builderRightVal.trim()}${rightBracket}`;
    } else if (builderType === 'right_inf') {
      const leftBracket = builderLeftInc ? '[' : '(';
      result = `${leftBracket}${builderLeftVal.trim()};+∞)`;
    } else {
      const leftBracket = builderLeftInc ? '[' : '(';
      const rightBracket = builderRightInc ? ']' : ')';
      result = `${leftBracket}${builderLeftVal.trim()};${builderRightVal.trim()}${rightBracket}`;
    }

    setInputValue(result);
    handleDraw(result);
  };

  const insertSymbol = (sym: string) => {
    setInputValue(prev => prev + sym);
  };

  // Human-readable type name in Vietnamese
  const getKindDescription = (kind: string) => {
    switch (kind) {
      case 'open':
        return { name: 'Khoảng (a; b)', desc: 'Tập hợp các số thực x sao cho a < x < b. Không lấy hai đầu mút a và b (vẽ bằng chấm tròn rỗng).' };
      case 'closed':
        return { name: 'Đoạn [a; b]', desc: 'Tập hợp các số thực x sao cho a ≤ x ≤ b. Lấy cả hai đầu mút a và b (vẽ bằng chấm tròn đặc).' };
      case 'half_open':
        return { name: 'Nửa khoảng [a; b) hoặc (a; b]', desc: 'Chỉ lấy một trong hai đầu mút: đầu mút có ngoặc vuông dùng chấm đặc, đầu mút có ngoặc tròn dùng chấm rỗng.' };
      case 'infinite_left':
        return { name: 'Khoảng/Nửa khoảng vô cực (-∞; b) hoặc (-∞; b]', desc: 'Tập hợp các số nhỏ hơn (hoặc nhỏ hơn hay bằng) b, kéo dài vô tận về phía âm.' };
      case 'infinite_right':
        return { name: 'Khoảng/Nửa khoảng vô cực (a; +∞) hoặc [a; +∞)', desc: 'Tập hợp các số lớn hơn (hoặc lớn hơn hay bằng) a, kéo dài vô tận về phía dương.' };
      case 'real':
        return { name: 'Tập số thực ℝ', desc: 'Toàn bộ trục số thực (-∞; +∞).' };
      case 'singleton':
        return { name: 'Tập hợp chỉ có một phần tử {a}', desc: 'Chỉ gồm đúng một số duy nhất, biểu diễn bằng một chấm tròn đặc duy nhất trên trục số.' };
      case 'empty':
        return { name: 'Tập rỗng ∅', desc: 'Tập hợp không chứa bất kỳ phần tử nào.' };
      default:
        return { name: 'Tập hợp con của ℝ', desc: 'Tập hợp được biểu diễn trên trục số.' };
    }
  };

  const kindInfo = getKindDescription(activeSet.kind);

  return (
    <div className="space-y-6">
      {/* Input Section Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">
              Nhập tập hợp cần biểu diễn
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Nhập trực tiếp ký hiệu khoảng, đoạn, nửa khoảng hoặc sử dụng công cụ chọn nhanh bên dưới.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowBuilder(!showBuilder)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 hover:border-blue-400 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            {showBuilder ? 'Ẩn bảng hỗ trợ chọn' : 'Mở bảng hỗ trợ chọn'}
          </button>
        </div>

        {/* Guided Builder Section (when toggled) */}
        {showBuilder && (
          <div className="mb-5 p-4 rounded-xl bg-blue-50/60 border border-blue-200/80 space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-blue-800">
              Bộ tạo tập hợp trực quan (Dành cho học sinh thao tác nhanh)
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { id: 'bounded', label: 'Khoảng / Đoạn [a; b]' },
                { id: 'left_inf', label: 'Vô cực âm (-∞; b]' },
                { id: 'right_inf', label: 'Vô cực dương [a; +∞)' },
                { id: 'real', label: 'Tập số thực ℝ' },
                { id: 'empty', label: 'Tập rỗng ∅' },
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setBuilderType(t.id as any)}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all text-center ${
                    builderType === t.id
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {builderType === 'bounded' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* Left endpoint controls */}
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <div className="text-xs font-bold text-slate-600 mb-2">Đầu mút bên trái:</div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setBuilderLeftInc(true)}
                      className={`px-2.5 py-1 text-xs font-bold rounded ${builderLeftInc ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                    >
                      [ Lấy mút (Chấm đặc)
                    </button>
                    <button
                      type="button"
                      onClick={() => setBuilderLeftInc(false)}
                      className={`px-2.5 py-1 text-xs font-bold rounded ${!builderLeftInc ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                    >
                      ( Không lấy mút (Chấm rỗng)
                    </button>
                  </div>
                  <div className="mt-2.5 flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium">Giá trị trái a:</span>
                    <input
                      type="text"
                      value={builderLeftVal}
                      onChange={e => setBuilderLeftVal(e.target.value)}
                      className="w-24 px-2 py-1 text-sm border border-slate-300 rounded font-semibold text-center"
                    />
                  </div>
                </div>

                {/* Right endpoint controls */}
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <div className="text-xs font-bold text-slate-600 mb-2">Đầu mút bên phải:</div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setBuilderRightInc(true)}
                      className={`px-2.5 py-1 text-xs font-bold rounded ${builderRightInc ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                    >
                      ] Lấy mút (Chấm đặc)
                    </button>
                    <button
                      type="button"
                      onClick={() => setBuilderRightInc(false)}
                      className={`px-2.5 py-1 text-xs font-bold rounded ${!builderRightInc ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                    >
                      ) Không lấy mút (Chấm rỗng)
                    </button>
                  </div>
                  <div className="mt-2.5 flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium">Giá trị phải b:</span>
                    <input
                      type="text"
                      value={builderRightVal}
                      onChange={e => setBuilderRightVal(e.target.value)}
                      className="w-24 px-2 py-1 text-sm border border-slate-300 rounded font-semibold text-center"
                    />
                  </div>
                </div>
              </div>
            )}

            {builderType === 'left_inf' && (
              <div className="p-3 bg-white rounded-lg border border-slate-200 flex flex-wrap items-center gap-3">
                <span className="text-xs font-medium text-slate-700">Dạng: (-∞ ;</span>
                <input
                  type="text"
                  value={builderRightVal}
                  onChange={e => setBuilderRightVal(e.target.value)}
                  className="w-20 px-2 py-1 text-sm border border-slate-300 rounded font-semibold text-center"
                />
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setBuilderRightInc(true)}
                    className={`px-2.5 py-1 text-xs font-bold rounded ${builderRightInc ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                  >
                    ] Lấy mút (chấm đặc)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBuilderRightInc(false)}
                    className={`px-2.5 py-1 text-xs font-bold rounded ${!builderRightInc ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                  >
                    ) Không lấy mút (chấm rỗng)
                  </button>
                </div>
              </div>
            )}

            {builderType === 'right_inf' && (
              <div className="p-3 bg-white rounded-lg border border-slate-200 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setBuilderLeftInc(true)}
                    className={`px-2.5 py-1 text-xs font-bold rounded ${builderLeftInc ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                  >
                    [ Lấy mút (chấm đặc)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBuilderLeftInc(false)}
                    className={`px-2.5 py-1 text-xs font-bold rounded ${!builderLeftInc ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                  >
                    ( Không lấy mút (chấm rỗng)
                  </button>
                </div>
                <input
                  type="text"
                  value={builderLeftVal}
                  onChange={e => setBuilderLeftVal(e.target.value)}
                  className="w-20 px-2 py-1 text-sm border border-slate-300 rounded font-semibold text-center"
                />
                <span className="text-xs font-medium text-slate-700">; +∞)</span>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleApplyBuilder}
                className="px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm"
              >
                Áp dụng vào ô nhập & vẽ ngay
              </button>
            </div>
          </div>
        )}

        {/* Direct Text Input Bar */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={inputValue}
                onChange={e => {
                  setInputValue(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleDraw();
                }}
                placeholder="Ví dụ: [-2;5) hoặc (-∞;3] hoặc ℝ"
                className={`w-full px-4 py-3 text-lg md:text-xl font-bold font-mono text-slate-900 bg-slate-50 border rounded-xl focus:outline-none focus:ring-3 transition-all ${
                  errorMsg
                    ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/40'
                    : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100'
                }`}
              />
            </div>

            {/* Main Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleDraw()}
                className="flex-1 sm:flex-none px-6 py-3 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-base md:text-lg font-bold rounded-xl shadow-md shadow-blue-500/20 hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <span>VẼ TRỤC SỐ</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={handleReset}
                title="Xóa và nhập lại từ đầu"
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4 text-slate-600" />
                <span>XÓA / LÀM LẠI</span>
              </button>
            </div>
          </div>

          {/* Math Symbol Quick Insert bar */}
          <MathSymbolKeyboard onInsert={insertSymbol} />
        </div>

        {/* Error message box if input is invalid */}
        {errorMsg && (
          <div className="mt-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800 text-sm font-medium animate-fadeIn">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-rose-900">Lưu ý sư phạm:</div>
              <div>{errorMsg}</div>
            </div>
          </div>
        )}

        {/* Quick Example Buttons requested in prompt */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Ví dụ mẫu nhanh (Bấm để xem hình vẽ ngay):
          </div>
          <div className="flex flex-wrap gap-2">
            {quickExamples.map(ex => (
              <button
                key={ex.label}
                type="button"
                onClick={() => {
                  setInputValue(ex.value);
                  handleDraw(ex.value);
                }}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-blue-100/70 hover:text-blue-800 text-slate-700 text-sm font-bold font-mono rounded-lg border border-slate-200 hover:border-blue-300 transition-all"
              >
                {ex.label}
                <span className="ml-1.5 text-xs font-normal text-slate-400 font-sans">({ex.desc})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Center Number Line Display */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 px-1">
          <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs hover:bg-slate-50">
            <input
              type="checkbox"
              checked={hatchExcluded}
              onChange={e => setHatchExcluded(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
            />
            <span>Gạch chéo xóa đi phần không thuộc tập hợp (Chuẩn SGK Toán 10)</span>
          </label>
        </div>

        <NumberLine
          set={activeSet}
          title="Biểu diễn tập hợp trên trục số"
          subtitle="Tự động điều chỉnh phạm vi và điểm mút"
          color="blue"
          height={160}
          hatchExcluded={hatchExcluded}
          className="ring-1 ring-blue-500/10 shadow-md"
        />

        {/* Pedagogical Explanation Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-blue-800 font-bold text-base">
            <CheckCircle2 className="w-5 h-5 text-blue-600" />
            <span>Phân tích tính chất toán học & Quy ước vẽ hình</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-xs font-semibold text-slate-500 block">Dạng tập hợp:</span>
              <span className="font-bold text-slate-800 text-base">{kindInfo.name}</span>
              <p className="text-xs text-slate-600 mt-1">{kindInfo.desc}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-xs font-semibold text-slate-500 block">Đặc trưng phần tử:</span>
              <span className="font-bold text-blue-700 font-mono text-sm block mt-0.5">
                {activeSet.kind === 'real'
                  ? '∀x ∈ ℝ'
                  : activeSet.kind === 'empty'
                  ? 'x ∈ ∅ (Không có x)'
                  : `{ x ∈ ℝ | ${activeSet.intervals.map(it => {
                      if (it.left === it.right) return `x = ${it.left}`;
                      const lSign = it.leftInclusive ? '≤' : '<';
                      const rSign = it.rightInclusive ? '≤' : '<';
                      if (it.left === '-Infinity') return `x ${rSign} ${it.right}`;
                      if (it.right === '+Infinity') return `x ${it.leftInclusive ? '≥' : '>'} ${it.left}`;
                      return `${it.left} ${lSign} x ${rSign} ${it.right}`;
                    }).join(' hoặc ')} }`}
              </span>
              <p className="text-xs text-slate-500 mt-1">
                Ký hiệu điều kiện tương đương trong hệ trục tọa độ số thực.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-xs font-semibold text-slate-500 block">Quy ước đầu mút SGK:</span>
              <ul className="text-xs text-slate-700 space-y-1 mt-1 font-medium">
                <li>• Ngoặc vuông <code className="font-bold text-blue-700">[ ]</code>: gắn trực tiếp lên trục số, lấy mút (<strong>chấm đặc</strong>).</li>
                <li>• Ngoặc tròn <code className="font-bold text-blue-700">( )</code>: gắn trực tiếp lên trục số, không lấy mút (<strong>chấm rỗng</strong>).</li>
                <li>• Vô cực <code className="font-bold text-blue-700">±∞</code>: không dùng ngoặc hay chấm ở vô cực, dải màu kéo dài theo mũi tên.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
