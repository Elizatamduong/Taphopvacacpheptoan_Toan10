/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { RealSet, SetOperation } from '../types';
import { parseRealSet, calculateOperation, generateExplanation, formatNumber } from '../utils/mathEngine';
import { NumberLine } from './NumberLine';
import { MathSymbolKeyboard } from './MathSymbolKeyboard';
import {
  Layers,
  Eye,
  EyeOff,
  Footprints,
  RotateCcw,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Split,
  Equal,
} from 'lucide-react';

export const TabTwoSets: React.FC = () => {
  // Inputs
  const [inputA, setInputA] = useState('[-3;4)');
  const [inputB, setInputB] = useState('(1;6]');
  const [activeOp, setActiveOp] = useState<SetOperation>('INTERSECTION');

  // Interactive teaching flags
  const [isHideResult, setIsHideResult] = useState(false);
  const [isStepByStep, setIsStepByStep] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Active input focus for virtual keyboard
  const [activeInputFocus, setActiveInputFocus] = useState<'A' | 'B'>('A');

  // Parsed sets
  const setA = useMemo(() => parseRealSet(inputA), [inputA]);
  const setB = useMemo(() => parseRealSet(inputB), [inputB]);

  // Calculated result
  const result = useMemo(() => {
    return calculateOperation(setA, setB, activeOp);
  }, [setA, setB, activeOp]);

  // Pedagogical explanation
  const explanation = useMemo(() => {
    if (!setA.isValid || !setB.isValid) return '';
    return generateExplanation(setA, setB, activeOp, result);
  }, [setA, setB, activeOp, result]);

  // Compute common bounding range so all 3 number lines share exact same scale and axis
  const sharedRange = useMemo(() => {
    const allPoints: number[] = [];
    [...setA.intervals, ...setB.intervals, ...result.intervals].forEach(i => {
      if (typeof i.left === 'number') allPoints.push(i.left);
      if (typeof i.right === 'number') allPoints.push(i.right);
    });

    if (allPoints.length === 0) {
      return { min: -7, max: 7, keyPoints: [0] };
    }

    const minVal = Math.min(...allPoints);
    const maxVal = Math.max(...allPoints);
    const span = Math.max(maxVal - minVal, 5);
    const pad = Math.max(Math.ceil(span * 0.25), 2);

    return {
      min: Math.floor(minVal - pad),
      max: Math.ceil(maxVal + pad),
      keyPoints: Array.from(new Set(allPoints)).sort((a, b) => a - b),
    };
  }, [setA, setB, result]);

  // Preset scenarios to test all required cases from prompt:
  const presetCases = [
    {
      title: 'Cắt nhau thông thường',
      a: '[-3;4)',
      b: '(1;6]',
      op: 'INTERSECTION' as SetOperation,
      desc: 'Ví dụ kinh điển SGK: A ∩ B = (1;4)',
    },
    {
      title: 'Chỉ gặp tại 1 điểm',
      a: '[0;2]',
      b: '[2;5]',
      op: 'INTERSECTION' as SetOperation,
      desc: 'Giao tại điểm 2: A ∩ B = {2}',
    },
    {
      title: 'Tập chứa vô cực',
      a: '(-∞;3]',
      b: '(1;+∞)',
      op: 'INTERSECTION' as SetOperation,
      desc: 'Giao tạo (1;3], hợp là ℝ',
    },
    {
      title: 'Hai tập rời nhau',
      a: '[-4;-1]',
      b: '[2;5]',
      op: 'INTERSECTION' as SetOperation,
      desc: 'Không có điểm chung: A ∩ B = ∅',
    },
    {
      title: 'Tập con (A ⊂ B)',
      a: '[1;3]',
      b: '[0;6]',
      op: 'DIFF_B_A' as SetOperation,
      desc: 'A nằm trong B: B \\ A thành 2 khoảng',
    },
    {
      title: 'Hiệu tạo 2 phần rời',
      a: '[-5;7]',
      b: '(-2;3)',
      op: 'DIFF_A_B' as SetOperation,
      desc: 'A \\ B = [-5;-2] ∪ [3;7]',
    },
    {
      title: 'Hai tập bằng nhau',
      a: '[-2;4)',
      b: '[-2;4)',
      op: 'DIFF_A_B' as SetOperation,
      desc: 'A = B ⇒ A \\ B = ∅',
    },
    {
      title: 'Điểm mút chạm',
      a: '[1;5]',
      b: '(1;5)',
      op: 'DIFF_A_B' as SetOperation,
      desc: 'A \\ B = {1; 5}',
    },
  ];

  const handleApplyPreset = (p: typeof presetCases[0]) => {
    setInputA(p.a);
    setInputB(p.b);
    setActiveOp(p.op);
    setIsHideResult(false);
    if (isStepByStep) setCurrentStep(1);
  };

  const handleReset = () => {
    setInputA('[-3;4)');
    setInputB('(1;6]');
    setActiveOp('INTERSECTION');
    setIsHideResult(false);
    setIsStepByStep(false);
    setCurrentStep(1);
  };

  const insertSymbol = (sym: string) => {
    if (activeInputFocus === 'A') {
      setInputA(prev => prev + sym);
    } else {
      setInputB(prev => prev + sym);
    }
  };

  // Operation button labels & symbols
  const opInfo: Record<SetOperation, { label: string; symbol: string; desc: string }> = {
    INTERSECTION: {
      label: 'A ∩ B',
      symbol: '∩',
      desc: 'GIAO – Lấy các phần tử vừa thuộc A vừa thuộc B (phần chung)',
    },
    UNION: {
      label: 'A ∪ B',
      symbol: '∪',
      desc: 'HỢP – Lấy các phần tử thuộc A hoặc thuộc B (gộp chung)',
    },
    DIFF_A_B: {
      label: 'A \\ B',
      symbol: '\\',
      desc: 'HIỆU (A \\ B) – Thuộc A nhưng KHÔNG thuộc B (giữ A, bỏ B)',
    },
    DIFF_B_A: {
      label: 'B \\ A',
      symbol: '\\',
      desc: 'HIỆU (B \\ A) – Thuộc B nhưng KHÔNG thuộc A (giữ B, bỏ A)',
    },
  };

  // Step-by-step descriptions
  const stepDetails = [
    {
      step: 1,
      title: 'Vẽ tập hợp A và gạch bỏ phần không thuộc A',
      content: `Biểu diễn tập A = ${setA.formatted} trên trục số 1 (màu xanh lam) và gạch chéo xóa đi tất cả phần tử không thuộc A (chuẩn SGK Toán 10).`,
    },
    {
      step: 2,
      title: 'Vẽ tập hợp B và gạch bỏ phần không thuộc B',
      content: `Biểu diễn tập B = ${setB.formatted} trên trục số 2 (màu cam) và gạch chéo xóa đi phần không thuộc B trên cùng hệ trục.`,
    },
    {
      step: 3,
      title: `Xác định quy tắc phép toán ${opInfo[activeOp].label}`,
      content: `Theo định nghĩa: ${opInfo[activeOp].desc}. Quan sát vị trí tương đối giữa hai tập A và B.`,
    },
    {
      step: 4,
      title: 'Viết kết quả bằng ký hiệu tập hợp',
      content: `Kết luận toán học: ${activeOp === 'DIFF_B_A' ? 'B \\ A' : opInfo[activeOp].label} = ${result.formatted}.`,
    },
    {
      step: 5,
      title: 'Trực quan hóa quá trình gạch xóa trên trục kết quả',
      content: `Trên trục số 3 hiển thị đồng thời cả 2 tập hợp ban đầu A & B, thể hiện các vết gạch chéo xóa đi theo phép toán, và tô nổi bật vùng kết quả màu xanh lục ngọc.`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Input & Operations Control Center */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">
              Phép toán giữa hai tập hợp
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Nhập hai tập hợp A và B, chọn phép toán để tính toán và quan sát 3 trục số song song cùng tỉ lệ.
            </p>
          </div>

          {/* Action buttons: Hide result / Step by step / Reset */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsHideResult(!isHideResult)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs md:text-sm font-bold rounded-xl border transition-all ${
                isHideResult
                  ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
              }`}
            >
              {isHideResult ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              {isHideResult ? 'ĐANG ẨN KẾT QUẢ (Bấm để hiện)' : 'ẨN KẾT QUẢ (Cho HS dự đoán)'}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsStepByStep(!isStepByStep);
                if (!isStepByStep) setCurrentStep(1);
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs md:text-sm font-bold rounded-xl border transition-all ${
                isStepByStep
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
              }`}
            >
              <Footprints className="w-4 h-4" />
              {isStepByStep ? 'TẮT CHẾ ĐỘ TỪNG BƯỚC' : 'XEM TỪNG BƯỚC'}
            </button>

            <button
              type="button"
              onClick={handleReset}
              title="Đặt lại trạng thái ban đầu"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Inputs for A and B */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Box A */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              activeInputFocus === 'A'
                ? 'border-blue-500 bg-blue-50/20 shadow-xs'
                : 'border-slate-200 bg-white'
            }`}
            onClick={() => setActiveInputFocus('A')}
          >
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-extrabold text-blue-800 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-600"></span>
                TẬP HỢP A
              </label>
              {setA.isValid && (
                <span className="text-xs font-mono font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                  A = {setA.formatted}
                </span>
              )}
            </div>

            <input
              type="text"
              value={inputA}
              onFocus={() => setActiveInputFocus('A')}
              onChange={e => setInputA(e.target.value)}
              placeholder="Ví dụ: [-3;4) hoặc (-∞;3]"
              className="w-full px-3.5 py-2.5 text-lg font-bold font-mono text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            {!setA.isValid && (
              <p className="text-xs text-rose-600 mt-1 font-medium">
                {setA.errorMessage || 'Tập hợp A chưa hợp lệ.'}
              </p>
            )}
          </div>

          {/* Box B */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              activeInputFocus === 'B'
                ? 'border-amber-500 bg-amber-50/20 shadow-xs'
                : 'border-slate-200 bg-white'
            }`}
            onClick={() => setActiveInputFocus('B')}
          >
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-extrabold text-amber-800 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-600"></span>
                TẬP HỢP B
              </label>
              {setB.isValid && (
                <span className="text-xs font-mono font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded">
                  B = {setB.formatted}
                </span>
              )}
            </div>

            <input
              type="text"
              value={inputB}
              onFocus={() => setActiveInputFocus('B')}
              onChange={e => setInputB(e.target.value)}
              placeholder="Ví dụ: (1;6] hoặc [2;+∞)"
              className="w-full px-3.5 py-2.5 text-lg font-bold font-mono text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            {!setB.isValid && (
              <p className="text-xs text-rose-600 mt-1 font-medium">
                {setB.errorMessage || 'Tập hợp B chưa hợp lệ.'}
              </p>
            )}
          </div>
        </div>

        {/* Math Symbol Keyboard */}
        <div className="mb-6">
          <div className="text-xs text-slate-500 mb-1 font-medium">
            Chèn nhanh ký hiệu vào ô <strong>{activeInputFocus === 'A' ? 'Tập hợp A' : 'Tập hợp B'}</strong>:
          </div>
          <MathSymbolKeyboard onInsert={insertSymbol} />
        </div>

        {/* 4 Large Operation Buttons required in prompt */}
        <div className="pt-2 border-t border-slate-100">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Chọn phép toán cần thực hiện:
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(['INTERSECTION', 'UNION', 'DIFF_A_B', 'DIFF_B_A'] as SetOperation[]).map(op => {
              const info = opInfo[op];
              const isSelected = activeOp === op;

              return (
                <button
                  key={op}
                  type="button"
                  onClick={() => {
                    setActiveOp(op);
                    if (isStepByStep && currentStep < 3) setCurrentStep(3);
                  }}
                  className={`p-3.5 rounded-xl border-2 font-bold transition-all text-center flex flex-col items-center justify-center gap-1 active:scale-98 ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-emerald-300'
                  }`}
                >
                  <span className="text-xl md:text-2xl font-black tracking-tight">{info.label}</span>
                  <span className={`text-xs font-normal ${isSelected ? 'text-emerald-100' : 'text-slate-500'}`}>
                    {op === 'INTERSECTION'
                      ? 'Giao (Phần chung)'
                      : op === 'UNION'
                      ? 'Hợp (Gộp hai tập)'
                      : op === 'DIFF_A_B'
                      ? 'Hiệu A trừ B'
                      : 'Hiệu B trừ A'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Example Presets Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Bộ ví dụ mẫu các trường hợp đặc biệt (Bấm để nạp dữ liệu):
          </div>
          <div className="flex flex-wrap gap-2">
            {presetCases.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className="px-3 py-1.5 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-800 text-xs font-semibold rounded-lg border border-slate-200 hover:border-blue-300 transition-colors text-left"
              >
                <span className="font-bold text-slate-900">{p.title}:</span>{' '}
                <span className="font-mono text-slate-600">{p.a} & {p.b}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Step-by-step Teaching Guidance Banner (when active) */}
      {isStepByStep && (
        <div className="p-4 md:p-5 rounded-2xl bg-indigo-50 border border-indigo-200 shadow-xs space-y-3 animate-fadeIn">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-extrabold bg-indigo-600 text-white rounded-md">
                BƯỚC {currentStep} / 5
              </span>
              <h3 className="font-bold text-indigo-950 text-base">
                {stepDetails[currentStep - 1].title}
              </h3>
            </div>

            {/* Stepper Navigation buttons */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentStep === 1}
                onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                className="px-2.5 py-1 text-xs font-bold bg-white disabled:opacity-40 border border-indigo-200 rounded text-indigo-800 hover:bg-indigo-100 flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Bước trước
              </button>
              <button
                type="button"
                disabled={currentStep === 5}
                onClick={() => setCurrentStep(prev => Math.min(5, prev + 1))}
                className="px-2.5 py-1 text-xs font-bold bg-indigo-600 disabled:opacity-40 text-white rounded hover:bg-indigo-700 flex items-center gap-1"
              >
                Bước tiếp theo <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <p className="text-sm text-indigo-900 font-medium">
            {stepDetails[currentStep - 1].content}
          </p>

          {/* Step circles */}
          <div className="flex items-center gap-2 pt-1">
            {[1, 2, 3, 4, 5].map(stepNum => (
              <button
                key={stepNum}
                type="button"
                onClick={() => setCurrentStep(stepNum)}
                className={`w-7 h-7 text-xs font-bold rounded-full transition-all flex items-center justify-center ${
                  currentStep === stepNum
                    ? 'bg-indigo-600 text-white ring-2 ring-indigo-300'
                    : currentStep > stepNum
                    ? 'bg-indigo-200 text-indigo-800'
                    : 'bg-white text-indigo-400 border border-indigo-200'
                }`}
              >
                {stepNum}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3 SYNCHRONIZED NUMBER LINES VIEW */}
      <div className="space-y-4">
        {/* Number Line 1: Tập A */}
        {(!isStepByStep || currentStep >= 1) && (
          <div className="transition-all">
            <NumberLine
              set={setA}
              title="Trục số 1: Tập hợp A"
              subtitle="Tập hợp ban đầu thứ nhất (Gạch chéo xóa phần không thuộc A)"
              color="blue"
              fixedRange={sharedRange}
              guideLines={sharedRange.keyPoints}
              height={130}
              hatchExcluded={true}
            />
          </div>
        )}

        {/* Number Line 2: Tập B */}
        {(!isStepByStep || currentStep >= 2) && (
          <div className="transition-all">
            <NumberLine
              set={setB}
              title="Trục số 2: Tập hợp B"
              subtitle="Tập hợp ban đầu thứ hai (Gạch chéo xóa phần không thuộc B)"
              color="amber"
              fixedRange={sharedRange}
              guideLines={sharedRange.keyPoints}
              height={130}
              hatchExcluded={true}
            />
          </div>
        )}

        {/* Number Line 3: Kết Quả */}
        {(!isStepByStep || currentStep >= 5) && (
          <div className="relative">
            {/* If Hide Result is active */}
            {isHideResult ? (
              <div className="w-full bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 p-8 text-center space-y-3">
                <div className="inline-flex p-3 rounded-full bg-amber-100 text-amber-700 mb-1">
                  <HelpCircle className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-slate-800">
                  Đáp án đang được ẩn cho học sinh tự dự đoán kết quả
                </h4>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  Hãy nhìn vào hai trục số A và B phía trên, xác định các điểm mút và vùng thỏa mãn phép toán{' '}
                  <strong className="text-slate-800 font-bold">{opInfo[activeOp].label}</strong> trước khi đối chiếu đáp án.
                </p>
                <button
                  type="button"
                  onClick={() => setIsHideResult(false)}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-sm transition-all"
                >
                  👁️ HIỂN THỊ ĐÁP ÁN VÀ HÌNH VẼ KẾT QUẢ
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Result Formula Banner */}
                <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-300 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-extrabold uppercase px-2.5 py-1 rounded bg-emerald-600 text-white tracking-wider">
                      Kết quả chính xác
                    </span>
                    <span className="text-xl md:text-2xl font-black font-mono text-emerald-900">
                      {activeOp === 'DIFF_B_A' ? 'B \\ A' : opInfo[activeOp].label} = {result.formatted}
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-emerald-800">
                    {result.intervals.length === 0
                      ? 'Tập rỗng ∅'
                      : result.kind === 'singleton'
                      ? 'Tập gồm đúng 1 điểm duy nhất'
                      : result.intervals.length > 1
                      ? 'Hợp của các khoảng rời nhau'
                      : 'Khoảng / Đoạn liên tục'}
                  </div>
                </div>

                {/* Trục số 3 - Hiển thị cả 2 tập hợp ban đầu A & B và quá trình gạch xóa */}
                <NumberLine
                  set={result}
                  title={`Trục số 3: Kết quả (${activeOp === 'DIFF_B_A' ? 'B \\ A' : opInfo[activeOp].label})`}
                  subtitle="Hiển thị đồng thời cả 2 tập hợp ban đầu A & B trên trục kết quả để quan sát cách thực hiện phép toán"
                  color="emerald"
                  fixedRange={sharedRange}
                  guideLines={sharedRange.keyPoints}
                  height={180}
                  originalSetsOverlay={{
                    setA,
                    setB,
                    operation: activeOp,
                  }}
                  className="ring-2 ring-emerald-500/20 shadow-md"
                />
              </div>
            )}
          </div>
        )}

        {/* Pedagogical Explanation Box (Khung Giải Thích Kết Quả) */}
        {!isHideResult && (!isStepByStep || currentStep >= 4) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              <span>Giải thích ngắn gọn (Toán 10 GDPT 2018):</span>
            </div>

            <p className="text-sm md:text-base text-slate-700 leading-relaxed font-medium pl-7">
              {explanation}
            </p>

            <div className="mt-3 pt-2 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs text-slate-500 pl-7">
              <span>💡 <em>Đường gióng đứt nét dọc:</em> Giúp so sánh thẳng hàng vị trí các đầu mút giữa 3 trục số.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
