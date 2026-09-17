/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TabSingleSet } from './components/TabSingleSet';
import { TabTwoSets } from './components/TabTwoSets';
import { Compass, BookCheck, Maximize2, Minimize2, Info, ChevronDown, Phone, UserCheck } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'SINGLE' | 'OPERATIONS'>('SINGLE');
  const [isClassroomMode, setIsClassroomMode] = useState(false);
  const [showNotationHelp, setShowNotationHelp] = useState(false);

  return (
    <div className={`min-h-screen bg-slate-50 text-slate-900 transition-all ${isClassroomMode ? 'text-lg' : 'text-base'}`}>
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200/90 shadow-2xs sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20 shrink-0">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">
                Trục Số Tương Tác
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium italic">
                Khám phá tập hợp và các phép toán của tập hợp (Toán 10 GDPT 2018)
              </p>
            </div>
          </div>

          {/* Author Badge & Quick Tools */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Teacher / Author Contact Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50/90 border border-blue-200 rounded-xl text-xs font-semibold text-blue-950 shadow-2xs">
              <span className="text-slate-500 font-normal">Tác giả:</span>
              <span className="font-extrabold text-blue-700">Eliza Tâm Dương</span>
              <span className="text-blue-300">•</span>
              <a
                href="tel:0962571826"
                className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline inline-flex items-center gap-1"
                title="Gọi hoặc liên hệ Zalo"
              >
                <Phone className="w-3 h-3 text-emerald-600" />
                <span>0962571826</span>
              </a>
            </div>

            <button
              type="button"
              onClick={() => setShowNotationHelp(!showNotationHelp)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
            >
              <Info className="w-4 h-4 text-blue-600" />
              <span>Bảng ký hiệu chuẩn SGK</span>
            </button>

            <button
              type="button"
              onClick={() => setIsClassroomMode(!isClassroomMode)}
              title="Phóng to giao diện và chữ để chiếu trên bảng tương tác / máy chiếu"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                isClassroomMode
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {isClassroomMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              <span>{isClassroomMode ? 'Cỡ chữ chuẩn' : 'Chế độ trình chiếu'}</span>
            </button>
          </div>
        </div>

        {/* Major Tabs Navigation */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex border-b border-slate-200 -mb-px space-x-2">
            <button
              type="button"
              onClick={() => setActiveTab('SINGLE')}
              className={`py-3.5 px-5 font-black text-sm sm:text-base border-b-2 tracking-wide uppercase transition-all flex items-center gap-2 ${
                activeTab === 'SINGLE'
                  ? 'border-blue-600 text-blue-600 bg-blue-50/40'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <span>TAB 1: VẼ MỘT TẬP HỢP</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('OPERATIONS')}
              className={`py-3.5 px-5 font-black text-sm sm:text-base border-b-2 tracking-wide uppercase transition-all flex items-center gap-2 ${
                activeTab === 'OPERATIONS'
                  ? 'border-emerald-600 text-emerald-600 bg-emerald-50/40'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <span>TAB 2: PHÉP TOÁN HAI TẬP HỢP</span>
            </button>
          </div>
        </div>
      </header>

      {/* Notation Help Drawer / Banner */}
      {showNotationHelp && (
        <div className="bg-blue-50/90 border-b border-blue-200 px-4 sm:px-6 py-4 animate-fadeIn">
          <div className="max-w-6xl mx-auto space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-blue-900 flex items-center gap-1.5">
                <BookCheck className="w-4 h-4 text-blue-600" />
                Quy ước ký hiệu tập con của ℝ trong SGK Toán 10 Việt Nam:
              </h3>
              <button
                type="button"
                onClick={() => setShowNotationHelp(false)}
                className="text-xs text-blue-700 hover:text-blue-900 font-bold"
              >
                Đóng ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs text-slate-700 pt-1">
              <div className="bg-white p-2.5 rounded-lg border border-blue-200">
                <span className="font-bold text-blue-700 font-mono text-sm block">(a; b)</span>
                <span>Khoảng: a &lt; x &lt; b. Hai đầu mút là <strong>chấm rỗng</strong>.</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-blue-200">
                <span className="font-bold text-blue-700 font-mono text-sm block">[a; b]</span>
                <span>Đoạn: a ≤ x ≤ b. Hai đầu mút là <strong>chấm đặc</strong>.</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-blue-200">
                <span className="font-bold text-blue-700 font-mono text-sm block">[a; b) hoặc (a; b]</span>
                <span>Nửa khoảng: lấy 1 đầu mút (chấm đặc tại ngoặc vuông, rỗng tại ngoặc tròn).</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-blue-200">
                <span className="font-bold text-blue-700 font-mono text-sm block">(-∞; b] hoặc (a; +∞)</span>
                <span>Vô cực: kéo dài vệt tô về phía mũi tên tương ứng. Không có chấm đặc tại ±∞.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-8">
        {activeTab === 'SINGLE' ? <TabSingleSet /> : <TabTwoSets />}
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-200 bg-white py-8 px-4 text-center text-xs text-slate-500 shadow-2xs">
        <div className="max-w-6xl mx-auto space-y-3">
          <div className="flex flex-wrap items-center justify-center gap-2.5 text-sm">
            <span className="text-slate-600 font-medium">Tác giả & Cố vấn chuyên môn:</span>
            <span className="font-black text-slate-900 px-3 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-800">
              Eliza Tâm Dương
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-600 font-medium">Điện thoại / Zalo:</span>
            <a
              href="tel:0962571826"
              className="font-bold text-emerald-800 px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors inline-flex items-center gap-1.5"
              title="Nhấn để gọi hoặc liên hệ Zalo"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span>0962571826</span>
            </a>
          </div>

          <p className="font-medium text-slate-600 text-xs sm:text-sm">
            Ứng dụng hỗ trợ giảng dạy & học tập môn Toán THPT – Chương trình GDPT 2018
          </p>
          <p className="text-slate-400 text-xs">
            Chính xác toán học • Trực quan hóa tương tác • Minh họa giao, hợp, hiệu trên trục số thực ℝ
          </p>
        </div>
      </footer>
    </div>
  );
}
