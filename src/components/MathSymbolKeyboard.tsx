/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface MathSymbolKeyboardProps {
  onInsert: (symbol: string) => void;
  className?: string;
}

export const MathSymbolKeyboard: React.FC<MathSymbolKeyboardProps> = ({ onInsert, className = '' }) => {
  const symbols = [
    { label: '[', insert: '[', tip: 'Ngoặc vuông trái (lấy mút)' },
    { label: ']', insert: ']', tip: 'Ngoặc vuông phải (lấy mút)' },
    { label: '(', insert: '(', tip: 'Ngoặc tròn trái (không lấy mút)' },
    { label: ')', insert: ')', tip: 'Ngoặc tròn phải (không lấy mút)' },
    { label: ';', insert: ';', tip: 'Dấu phân cách hai đầu mút' },
    { label: '-∞', insert: '-∞', tip: 'Âm vô cực' },
    { label: '+∞', insert: '+∞', tip: 'Dương vô cực' },
    { label: 'ℝ', insert: 'ℝ', tip: 'Tập số thực' },
    { label: '∅', insert: '∅', tip: 'Tập rỗng' },
  ];

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      <span className="text-xs font-semibold text-slate-500 mr-1 select-none">Ký hiệu:</span>
      {symbols.map(s => (
        <button
          key={s.label}
          type="button"
          onClick={() => onInsert(s.insert)}
          title={s.tip}
          className="px-2.5 py-1 text-sm font-semibold bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded border border-slate-200 hover:border-blue-300 shadow-2xs transition-all active:scale-95"
        >
          {s.label}
        </button>
      ))}
    </div>
  );
};
