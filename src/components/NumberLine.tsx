/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { IntervalItem, RealSet, SetOperation } from '../types';
import { complementSet, formatNumber, intersectSets } from '../utils/mathEngine';

interface NumberLineProps {
  set: RealSet;
  title?: string;
  subtitle?: string;
  color?: 'blue' | 'amber' | 'emerald' | 'purple' | 'slate';
  // If provided, uses this exact axis range for synchronization across multiple number lines
  fixedRange?: { min: number; max: number };
  // Vertical guidelines at specified numbers
  guideLines?: number[];
  height?: number;
  showTicks?: boolean;
  className?: string;
  interactive?: boolean;
  // Xóa đi / gạch chéo phần tử không thuộc tập hợp (chuẩn SGK Toán 10)
  hatchExcluded?: boolean;
  // Hình ảnh trực quan của cả 2 tập hợp ban đầu trên trục kết quả
  originalSetsOverlay?: {
    setA: RealSet;
    setB: RealSet;
    operation: SetOperation;
  };
}

const COLOR_MAP = {
  blue: {
    stroke: '#2563eb', // blue-600
    fill: '#3b82f6',   // blue-500
    light: '#eff6ff',  // blue-50
    border: '#1d4ed8', // blue-700
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
    title: 'text-blue-700',
  },
  amber: {
    stroke: '#d97706', // amber-600
    fill: '#f59e0b',   // amber-500
    light: '#fffbeb',  // amber-50
    border: '#b45309', // amber-700
    badge: 'bg-amber-100 text-amber-900 border-amber-200',
    title: 'text-amber-700',
  },
  emerald: {
    stroke: '#059669', // emerald-600
    fill: '#10b981',   // emerald-500
    light: '#ecfdf5',  // emerald-50
    border: '#047857', // emerald-700
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    title: 'text-emerald-700',
  },
  purple: {
    stroke: '#7c3aed',
    fill: '#8b5cf6',
    light: '#f5f3ff',
    border: '#6d28d9',
    badge: 'bg-purple-100 text-purple-800 border-purple-200',
    title: 'text-purple-700',
  },
  slate: {
    stroke: '#475569',
    fill: '#64748b',
    light: '#f8fafc',
    border: '#334155',
    badge: 'bg-slate-100 text-slate-800 border-slate-200',
    title: 'text-slate-700',
  },
};

export const NumberLine: React.FC<NumberLineProps> = ({
  set,
  title,
  subtitle,
  color = 'blue',
  fixedRange,
  guideLines = [],
  height = 140,
  showTicks = true,
  className = '',
  hatchExcluded = false,
  originalSetsOverlay,
}) => {
  const colorScheme = COLOR_MAP[color] || COLOR_MAP.blue;

  // If showing dual original sets overlay, allocate enough vertical room
  const effectiveHeight = originalSetsOverlay ? Math.max(height, 175) : height;
  const axisY = originalSetsOverlay ? effectiveHeight - 48 : effectiveHeight / 2 + 8;

  // 1. Calculate axis domain [min, max]
  const { minX, maxX, keyPoints } = useMemo(() => {
    if (fixedRange) {
      const pts: number[] = [];
      set.intervals.forEach(i => {
        if (typeof i.left === 'number') pts.push(i.left);
        if (typeof i.right === 'number') pts.push(i.right);
      });
      if (originalSetsOverlay) {
        originalSetsOverlay.setA.intervals.forEach(i => {
          if (typeof i.left === 'number') pts.push(i.left);
          if (typeof i.right === 'number') pts.push(i.right);
        });
        originalSetsOverlay.setB.intervals.forEach(i => {
          if (typeof i.left === 'number') pts.push(i.left);
          if (typeof i.right === 'number') pts.push(i.right);
        });
      }
      return { minX: fixedRange.min, maxX: fixedRange.max, keyPoints: Array.from(new Set(pts)) };
    }

    const points: number[] = [];
    set.intervals.forEach(i => {
      if (typeof i.left === 'number') points.push(i.left);
      if (typeof i.right === 'number') points.push(i.right);
    });
    if (originalSetsOverlay) {
      originalSetsOverlay.setA.intervals.forEach(i => {
        if (typeof i.left === 'number') points.push(i.left);
        if (typeof i.right === 'number') points.push(i.right);
      });
      originalSetsOverlay.setB.intervals.forEach(i => {
        if (typeof i.left === 'number') points.push(i.left);
        if (typeof i.right === 'number') points.push(i.right);
      });
    }

    if (points.length === 0) {
      return { minX: -6, maxX: 6, keyPoints: [0] };
    }

    const minPt = Math.min(...points);
    const maxPt = Math.max(...points);
    const span = Math.max(maxPt - minPt, 4);
    const margin = Math.max(Math.ceil(span * 0.25), 2);

    return {
      minX: Math.floor(minPt - margin),
      maxX: Math.ceil(maxPt + margin),
      keyPoints: Array.from(new Set(points)),
    };
  }, [set, fixedRange, originalSetsOverlay]);

  // SVG dimensions
  const svgWidth = 840;
  const paddingX = 45; // Space for arrowheads and infinity symbols
  const usableWidth = svgWidth - 2 * paddingX;

  // Coordinate conversion: value -> pixel X
  const toPixel = (val: number) => {
    if (maxX === minX) return paddingX + usableWidth / 2;
    const ratio = (val - minX) / (maxX - minX);
    return paddingX + ratio * usableWidth;
  };

  const leftArrowX = paddingX - 10;
  const rightArrowX = svgWidth - paddingX + 10;

  // Generate integer ticks
  const ticks = useMemo(() => {
    const list: number[] = [];
    const range = maxX - minX;
    let step = 1;
    if (range > 30) step = 5;
    else if (range > 15) step = 2;
    else step = 1;

    const start = Math.ceil(minX / step) * step;
    for (let x = start; x <= maxX; x += step) {
      list.push(x);
    }
    return list;
  }, [minX, maxX]);

  // Combined list of ticks and keyPoints (all numbers displayed strictly on the bottom line)
  const displayTicks = useMemo(() => {
    const map = new Map<number, { isKey: boolean; isZero: boolean }>();
    ticks.forEach(t => {
      map.set(t, { isKey: keyPoints.includes(t), isZero: t === 0 });
    });
    keyPoints.forEach(kp => {
      if (kp >= minX && kp <= maxX) {
        map.set(kp, { isKey: true, isZero: kp === 0 });
      }
    });
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [ticks, keyPoints, minX, maxX]);

  // Calculate excluded intervals for single set hatching
  const excludedIntervals = useMemo(() => {
    if (!hatchExcluded || !set.isValid) return [];
    return complementSet(set).intervals;
  }, [hatchExcluded, set]);

  // Calculate intersection of A and B for difference hatching
  const overlapAB = useMemo(() => {
    if (!originalSetsOverlay) return [];
    const inter = intersectSets(originalSetsOverlay.setA, originalSetsOverlay.setB);
    return inter.isValid ? inter.intervals : [];
  }, [originalSetsOverlay]);

  // Left bracket renderer: bold vector SVG directly on axis
  const renderLeftBracket = (px: number, y: number, isInclusive: boolean, strokeColor: string) => {
    if (isInclusive) {
      // [ : Square bracket attached to axis
      return (
        <g key={`lb-sq-${px}-${y}`}>
          {/* Mask rect to clear underlying axis line */}
          <rect x={px - 2} y={y - 17} width="12" height="34" rx="2" fill="#ffffff" />
          <path
            d={`M ${px + 9} ${y - 15} L ${px} ${y - 15} L ${px} ${y + 15} L ${px + 9} ${y + 15}`}
            fill="none"
            stroke={strokeColor}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Solid dot on axis */}
          <circle cx={px} cy={y} r="4.5" fill={strokeColor} stroke="#ffffff" strokeWidth="1.5" />
        </g>
      );
    }
    // ( : Round bracket attached to axis
    return (
      <g key={`lb-rd-${px}-${y}`}>
        {/* Mask rect */}
        <rect x={px - 8} y={y - 17} width="16" height="34" rx="2" fill="#ffffff" />
        <path
          d={`M ${px + 8} ${y - 15} Q ${px - 5} ${y} ${px + 8} ${y + 15}`}
          fill="none"
          stroke={strokeColor}
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        {/* Hollow dot on axis */}
        <circle cx={px} cy={y} r="4.5" fill="#ffffff" stroke={strokeColor} strokeWidth="2.5" />
      </g>
    );
  };

  // Right bracket renderer: bold vector SVG directly on axis
  const renderRightBracket = (px: number, y: number, isInclusive: boolean, strokeColor: string) => {
    if (isInclusive) {
      // ] : Square bracket attached to axis
      return (
        <g key={`rb-sq-${px}-${y}`}>
          {/* Mask rect */}
          <rect x={px - 10} y={y - 17} width="12" height="34" rx="2" fill="#ffffff" />
          <path
            d={`M ${px - 9} ${y - 15} L ${px} ${y - 15} L ${px} ${y + 15} L ${px - 9} ${y + 15}`}
            fill="none"
            stroke={strokeColor}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Solid dot on axis */}
          <circle cx={px} cy={y} r="4.5" fill={strokeColor} stroke="#ffffff" strokeWidth="1.5" />
        </g>
      );
    }
    // ) : Round bracket attached to axis
    return (
      <g key={`rb-rd-${px}-${y}`}>
        {/* Mask rect */}
        <rect x={px - 8} y={y - 17} width="16" height="34" rx="2" fill="#ffffff" />
        <path
          d={`M ${px - 8} ${y - 15} Q ${px + 5} ${y} ${px - 8} ${y + 15}`}
          fill="none"
          stroke={strokeColor}
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        {/* Hollow dot on axis */}
        <circle cx={px} cy={y} r="4.5" fill="#ffffff" stroke={strokeColor} strokeWidth="2.5" />
      </g>
    );
  };

  // Mini track renderer for original sets A & B
  const renderMiniTrack = (
    targetSet: RealSet,
    trackY: number,
    trackLabel: string,
    trackColor: string,
    badgeBg: string
  ) => {
    return (
      <g key={`track-${trackLabel}`}>
        {/* Track Label Badge */}
        <rect x={leftArrowX} y={trackY - 11} width="46" height="20" rx="4" fill={badgeBg} />
        <text
          x={leftArrowX + 23}
          y={trackY + 3}
          textAnchor="middle"
          className="text-xs font-black fill-slate-800"
        >
          {trackLabel}
        </text>

        {/* Faint axis line for track */}
        <line
          x1={leftArrowX + 52}
          y1={trackY}
          x2={rightArrowX}
          y2={trackY}
          stroke="#cbd5e1"
          strokeWidth="1.5"
          strokeDasharray="2 3"
        />

        {/* Intervals on track */}
        {targetSet.isValid &&
          targetSet.intervals.map((item, idx) => {
            const isInfL = item.left === '-Infinity';
            const isInfR = item.right === '+Infinity';
            const pxL = isInfL ? leftArrowX + 52 : toPixel(item.left as number);
            const pxR = isInfR ? rightArrowX : toPixel(item.right as number);

            if (item.left === item.right && typeof item.left === 'number') {
              const px = toPixel(item.left);
              return (
                <circle
                  key={`track-pt-${idx}`}
                  cx={px}
                  cy={trackY}
                  r="4.5"
                  fill={trackColor}
                />
              );
            }

            return (
              <g key={`track-seg-${idx}`}>
                <line
                  x1={pxL}
                  y1={trackY}
                  x2={pxR}
                  y2={trackY}
                  stroke={trackColor}
                  strokeWidth="5"
                  strokeLinecap="butt"
                />
                {!isInfL && typeof item.left === 'number' && (
                  <circle
                    cx={pxL}
                    cy={trackY}
                    r="3.5"
                    fill={item.leftInclusive ? trackColor : '#ffffff'}
                    stroke={trackColor}
                    strokeWidth="1.5"
                  />
                )}
                {!isInfR && typeof item.right === 'number' && (
                  <circle
                    cx={pxR}
                    cy={trackY}
                    r="3.5"
                    fill={item.rightInclusive ? trackColor : '#ffffff'}
                    stroke={trackColor}
                    strokeWidth="1.5"
                  />
                )}
              </g>
            );
          })}
      </g>
    );
  };

  return (
    <div className={`w-full bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm ${className}`}>
      {/* Title & Subtitle Header */}
      {(title || subtitle) && (
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            {title && <span className={`text-base font-bold tracking-tight ${colorScheme.title}`}>{title}</span>}
            {set.formatted && (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-semibold border ${colorScheme.badge}`}>
                {set.formatted}
              </span>
            )}
          </div>
          {subtitle && <span className="text-xs text-slate-500 italic">{subtitle}</span>}
        </div>
      )}

      {/* Main SVG Number Line */}
      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${effectiveHeight}`}
          className="w-full h-auto select-none"
          style={{ minWidth: '550px' }}
        >
          <defs>
            {/* Arrowhead marker for positive direction */}
            <marker
              id={`arrow-right-${color}`}
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#334155" />
            </marker>

            {/* Left arrow marker */}
            <marker
              id={`arrow-left-${color}`}
              viewBox="0 0 10 10"
              refX="4"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M 8 1.5 L 0 5 L 8 8.5 z" fill="#334155" />
            </marker>

            {/* Standard Cross-Hatch pattern for eliminated elements */}
            <pattern
              id={`hatch-gray-${color}`}
              width="8"
              height="8"
              patternTransform="rotate(45 0 0)"
              patternUnits="userSpaceOnUse"
            >
              <line x1="0" y1="0" x2="0" y2="8" stroke="#94a3b8" strokeWidth="1.5" />
            </pattern>

            {/* Blue Hatch pattern (outside A) */}
            <pattern
              id="hatch-blue-overlay"
              width="9"
              height="9"
              patternTransform="rotate(45 0 0)"
              patternUnits="userSpaceOnUse"
            >
              <line x1="0" y1="0" x2="0" y2="9" stroke="#93c5fd" strokeWidth="1.5" />
            </pattern>

            {/* Orange Hatch pattern (outside B or removal of B) */}
            <pattern
              id="hatch-orange-overlay"
              width="9"
              height="9"
              patternTransform="rotate(-45 0 0)"
              patternUnits="userSpaceOnUse"
            >
              <line x1="0" y1="0" x2="0" y2="9" stroke="#fdba74" strokeWidth="1.5" />
            </pattern>

            {/* Strike-out pattern for difference operation */}
            <pattern
              id="hatch-strike-red"
              width="7"
              height="7"
              patternTransform="rotate(-45 0 0)"
              patternUnits="userSpaceOnUse"
            >
              <line x1="0" y1="0" x2="0" y2="7" stroke="#f87171" strokeWidth="1.8" />
            </pattern>
          </defs>

          {/* Vertical guidelines from key points if provided (for comparison across axes) */}
          {guideLines.map((gx, idx) => {
            if (gx < minX || gx > maxX) return null;
            const px = toPixel(gx);
            return (
              <line
                key={`guide-${idx}`}
                x1={px}
                y1={10}
                x2={px}
                y2={effectiveHeight - 10}
                stroke="#cbd5e1"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                opacity="0.8"
              />
            );
          })}

          {/* DUAL MINI TRACKS FOR ORIGINAL SETS A AND B (WHEN OVERLAY REQUESTED) */}
          {originalSetsOverlay && (
            <g key="original-sets-mini-tracks">
              {renderMiniTrack(
                originalSetsOverlay.setA,
                26,
                'Tập A',
                '#2563eb',
                '#dbeafe'
              )}
              {renderMiniTrack(
                originalSetsOverlay.setB,
                54,
                'Tập B',
                '#ea580c',
                '#ffedd5'
              )}
            </g>
          )}

          {/* Base Number Line Axis */}
          <line
            x1={leftArrowX}
            y1={axisY}
            x2={rightArrowX}
            y2={axisY}
            stroke="#475569"
            strokeWidth="2.5"
            markerEnd={`url(#arrow-right-${color})`}
            markerStart={`url(#arrow-left-${color})`}
          />

          {/* Infinity symbols at extremities */}
          <text
            x={leftArrowX - 6}
            y={axisY - 12}
            textAnchor="end"
            className="text-xs font-semibold fill-slate-500"
          >
            -∞
          </text>
          <text
            x={rightArrowX + 6}
            y={axisY - 12}
            textAnchor="start"
            className="text-xs font-semibold fill-slate-500"
          >
            +∞
          </text>
          {/* Axis label x */}
          <text
            x={rightArrowX + 4}
            y={axisY + 18}
            className="text-sm font-bold italic fill-slate-700"
          >
            x
          </text>

          {/* GẠCH BỎ PHẦN KHÔNG THUỘC TẬP HỢP (HATCH EXCLUDED ELEMENTS) */}
          {hatchExcluded &&
            excludedIntervals.map((exc, idx) => {
              const isInfL = exc.left === '-Infinity';
              const isInfR = exc.right === '+Infinity';
              const pxL = isInfL ? leftArrowX : toPixel(exc.left as number);
              const pxR = isInfR ? rightArrowX : toPixel(exc.right as number);
              const w = Math.max(0, pxR - pxL);
              if (w <= 0) return null;

              return (
                <g key={`exc-hatch-${idx}`}>
                  <rect
                    x={pxL}
                    y={axisY - 13}
                    width={w}
                    height={26}
                    fill={`url(#hatch-gray-${color})`}
                    opacity="0.85"
                  />
                  <line
                    x1={pxL}
                    y1={axisY}
                    x2={pxR}
                    y2={axisY}
                    stroke="#94a3b8"
                    strokeWidth="3"
                    strokeDasharray="4 3"
                  />
                </g>
              );
            })}

          {/* OPERATION ELIMINATION OVERLAY ON RESULT AXIS */}
          {originalSetsOverlay && (
            <g key="operation-elimination-overlay">
              {/* Faint ghost strips of both original sets directly on axis */}
              {originalSetsOverlay.setA.intervals.map((item, idx) => {
                const pxL = item.left === '-Infinity' ? leftArrowX : toPixel(item.left as number);
                const pxR = item.right === '+Infinity' ? rightArrowX : toPixel(item.right as number);
                return (
                  <line
                    key={`ghost-a-${idx}`}
                    x1={pxL}
                    y1={axisY - 5}
                    x2={pxR}
                    y2={axisY - 5}
                    stroke="#3b82f6"
                    strokeWidth="4"
                    opacity="0.45"
                  />
                );
              })}

              {originalSetsOverlay.setB.intervals.map((item, idx) => {
                const pxL = item.left === '-Infinity' ? leftArrowX : toPixel(item.left as number);
                const pxR = item.right === '+Infinity' ? rightArrowX : toPixel(item.right as number);
                return (
                  <line
                    key={`ghost-b-${idx}`}
                    x1={pxL}
                    y1={axisY + 5}
                    x2={pxR}
                    y2={axisY + 5}
                    stroke="#f97316"
                    strokeWidth="4"
                    opacity="0.45"
                  />
                );
              })}

              {/* Show eliminated areas according to operation */}
              {originalSetsOverlay.operation === 'INTERSECTION' && (
                <>
                  {/* Hatch outside A in blue */}
                  {complementSet(originalSetsOverlay.setA).intervals.map((exc, idx) => {
                    const pxL = exc.left === '-Infinity' ? leftArrowX : toPixel(exc.left as number);
                    const pxR = exc.right === '+Infinity' ? rightArrowX : toPixel(exc.right as number);
                    return (
                      <rect
                        key={`hatch-out-a-${idx}`}
                        x={pxL}
                        y={axisY - 14}
                        width={Math.max(0, pxR - pxL)}
                        height={28}
                        fill="url(#hatch-blue-overlay)"
                        opacity="0.8"
                      />
                    );
                  })}
                  {/* Hatch outside B in orange */}
                  {complementSet(originalSetsOverlay.setB).intervals.map((exc, idx) => {
                    const pxL = exc.left === '-Infinity' ? leftArrowX : toPixel(exc.left as number);
                    const pxR = exc.right === '+Infinity' ? rightArrowX : toPixel(exc.right as number);
                    return (
                      <rect
                        key={`hatch-out-b-${idx}`}
                        x={pxL}
                        y={axisY - 14}
                        width={Math.max(0, pxR - pxL)}
                        height={28}
                        fill="url(#hatch-orange-overlay)"
                        opacity="0.8"
                      />
                    );
                  })}
                </>
              )}

              {originalSetsOverlay.operation === 'UNION' && (
                <>
                  {/* Hatch outside both A and B */}
                  {complementSet(set).intervals.map((exc, idx) => {
                    const pxL = exc.left === '-Infinity' ? leftArrowX : toPixel(exc.left as number);
                    const pxR = exc.right === '+Infinity' ? rightArrowX : toPixel(exc.right as number);
                    return (
                      <rect
                        key={`hatch-out-union-${idx}`}
                        x={pxL}
                        y={axisY - 14}
                        width={Math.max(0, pxR - pxL)}
                        height={28}
                        fill={`url(#hatch-gray-${color})`}
                        opacity="0.8"
                      />
                    );
                  })}
                </>
              )}

              {originalSetsOverlay.operation === 'DIFF_A_B' && (
                <>
                  {/* Hatch outside A */}
                  {complementSet(originalSetsOverlay.setA).intervals.map((exc, idx) => {
                    const pxL = exc.left === '-Infinity' ? leftArrowX : toPixel(exc.left as number);
                    const pxR = exc.right === '+Infinity' ? rightArrowX : toPixel(exc.right as number);
                    return (
                      <rect
                        key={`hatch-out-a-diff-${idx}`}
                        x={pxL}
                        y={axisY - 14}
                        width={Math.max(0, pxR - pxL)}
                        height={28}
                        fill="url(#hatch-blue-overlay)"
                        opacity="0.75"
                      />
                    );
                  })}
                  {/* Strike-out portion of B inside A (xóa đi phần thuộc B) */}
                  {overlapAB.map((ov, idx) => {
                    const pxL = ov.left === '-Infinity' ? leftArrowX : toPixel(ov.left as number);
                    const pxR = ov.right === '+Infinity' ? rightArrowX : toPixel(ov.right as number);
                    return (
                      <rect
                        key={`strike-b-in-a-${idx}`}
                        x={pxL}
                        y={axisY - 14}
                        width={Math.max(0, pxR - pxL)}
                        height={28}
                        fill="url(#hatch-strike-red)"
                        opacity="0.9"
                      />
                    );
                  })}
                </>
              )}

              {originalSetsOverlay.operation === 'DIFF_B_A' && (
                <>
                  {/* Hatch outside B */}
                  {complementSet(originalSetsOverlay.setB).intervals.map((exc, idx) => {
                    const pxL = exc.left === '-Infinity' ? leftArrowX : toPixel(exc.left as number);
                    const pxR = exc.right === '+Infinity' ? rightArrowX : toPixel(exc.right as number);
                    return (
                      <rect
                        key={`hatch-out-b-diff-${idx}`}
                        x={pxL}
                        y={axisY - 14}
                        width={Math.max(0, pxR - pxL)}
                        height={28}
                        fill="url(#hatch-orange-overlay)"
                        opacity="0.75"
                      />
                    );
                  })}
                  {/* Strike-out portion of A inside B (xóa đi phần thuộc A) */}
                  {overlapAB.map((ov, idx) => {
                    const pxL = ov.left === '-Infinity' ? leftArrowX : toPixel(ov.left as number);
                    const pxR = ov.right === '+Infinity' ? rightArrowX : toPixel(ov.right as number);
                    return (
                      <rect
                        key={`strike-a-in-b-${idx}`}
                        x={pxL}
                        y={axisY - 14}
                        width={Math.max(0, pxR - pxL)}
                        height={28}
                        fill="url(#hatch-strike-red)"
                        opacity="0.9"
                      />
                    );
                  })}
                </>
              )}
            </g>
          )}

          {/* Regular Tick Marks & Numbers (Numbers strictly at bottom) */}
          {showTicks &&
            displayTicks.map(([val, { isKey, isZero }]) => {
              const px = toPixel(val);

              return (
                <g key={`tick-${val}`}>
                  <line
                    x1={px}
                    y1={axisY - (isKey || isZero ? 7 : 4)}
                    x2={px}
                    y2={axisY + (isKey || isZero ? 7 : 4)}
                    stroke={isKey ? colorScheme.stroke : '#94a3b8'}
                    strokeWidth={isKey || isZero ? 2 : 1}
                  />
                  {/* Single number row strictly at bottom */}
                  <text
                    x={px}
                    y={axisY + (isKey ? 24 : 22)}
                    textAnchor="middle"
                    className={`select-none ${
                      isKey
                        ? 'font-black fill-slate-900 text-sm'
                        : isZero
                        ? 'font-bold fill-slate-700 text-xs'
                        : 'fill-slate-400 font-normal text-xs'
                    }`}
                  >
                    {formatNumber(val)}
                  </text>
                </g>
              );
            })}

          {/* HIGHLIGHTED RESULT INTERVALS / RAYS / POINTS WITH BOLD ATTACHED BRACKETS */}
          {set.isValid &&
            set.intervals.map((item, idx) => {
              const isInfiniteLeft = item.left === '-Infinity';
              const isInfiniteRight = item.right === '+Infinity';
              const pxLeft = isInfiniteLeft ? leftArrowX : toPixel(item.left as number);
              const pxRight = isInfiniteRight ? rightArrowX : toPixel(item.right as number);

              // 1. Singleton Point {c}
              if (item.left === item.right && typeof item.left === 'number') {
                const px = toPixel(item.left);
                return (
                  <g key={`singleton-${idx}`}>
                    <circle
                      cx={px}
                      cy={axisY}
                      r="13"
                      fill={colorScheme.light}
                      stroke={colorScheme.stroke}
                      strokeWidth="1.5"
                      opacity="0.8"
                    />
                    <circle
                      cx={px}
                      cy={axisY}
                      r="7"
                      fill={colorScheme.stroke}
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                  </g>
                );
              }

              // 2. Continuous interval or Ray
              return (
                <g key={`interval-${idx}`}>
                  {/* Glowing background halo along the interval */}
                  <line
                    x1={pxLeft}
                    y1={axisY}
                    x2={pxRight}
                    y2={axisY}
                    stroke={colorScheme.stroke}
                    strokeWidth="14"
                    strokeLinecap={isInfiniteLeft || isInfiniteRight ? 'butt' : 'round'}
                    opacity="0.25"
                  />
                  {/* Primary highlight bar directly on the axis */}
                  <line
                    x1={pxLeft}
                    y1={axisY}
                    x2={pxRight}
                    y2={axisY}
                    stroke={colorScheme.stroke}
                    strokeWidth="6"
                    strokeLinecap="butt"
                  />

                  {/* Left Endpoint Bracket (attached directly on axis, no top number) */}
                  {!isInfiniteLeft &&
                    typeof item.left === 'number' &&
                    renderLeftBracket(pxLeft, axisY, item.leftInclusive, colorScheme.stroke)}

                  {/* Right Endpoint Bracket (attached directly on axis, no top number) */}
                  {!isInfiniteRight &&
                    typeof item.right === 'number' &&
                    renderRightBracket(pxRight, axisY, item.rightInclusive, colorScheme.stroke)}
                </g>
              );
            })}
        </svg>
      </div>

      {/* Instructional Legend for Original Sets & Elimination (on Result axis) */}
      {originalSetsOverlay && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-2.5 rounded bg-blue-500 inline-block"></span>
              <span className="font-semibold text-blue-900">Tập A ban đầu</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-2.5 rounded bg-orange-500 inline-block"></span>
              <span className="font-semibold text-orange-900">Tập B ban đầu</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-3 rounded border border-slate-300 bg-slate-100 inline-flex items-center justify-center font-mono text-[9px] text-slate-500">
                ///
              </span>
              <span className="font-semibold text-slate-700">Vùng bị xóa / gạch bỏ</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-2.5 rounded bg-emerald-600 inline-block shadow-xs"></span>
              <span className="font-bold text-emerald-800">Kết quả phép toán</span>
            </div>
          </div>

          <span className="text-slate-500 italic">
            {originalSetsOverlay.operation === 'INTERSECTION' && 'Gạch bỏ phần ngoài A & ngoài B → Còn lại là A ∩ B'}
            {originalSetsOverlay.operation === 'UNION' && 'Gộp cả A và B → Gạch bỏ phần nằm ngoài cả hai'}
            {originalSetsOverlay.operation === 'DIFF_A_B' && 'Lấy tập A → Xóa bỏ phần ngoài A và phần thuộc B → Còn lại là A \\ B'}
            {originalSetsOverlay.operation === 'DIFF_B_A' && 'Lấy tập B → Xóa bỏ phần ngoài B và phần thuộc A → Còn lại là B \\ A'}
          </span>
        </div>
      )}

      {/* Bracket Conventions Legend (when not showing dual overlay) */}
      {!originalSetsOverlay && (
        <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-blue-50 border border-blue-500 font-mono font-bold text-blue-700 text-xs">
                [
              </span>
              <span className="font-medium text-slate-700">Ngoặc vuông</span>
              <span className="text-slate-400">↔</span>
              <span>Lấy điểm mút (chấm đặc)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-blue-50 border border-blue-500 font-mono font-bold text-blue-700 text-xs">
                (
              </span>
              <span className="font-medium text-slate-700">Ngoặc tròn</span>
              <span className="text-slate-400">↔</span>
              <span>Không lấy mút (chấm rỗng)</span>
            </div>
          </div>

          {hatchExcluded && (
            <div className="flex items-center gap-1.5 text-slate-500">
              <span className="w-4 h-3 rounded border border-slate-300 bg-slate-100 inline-flex items-center justify-center font-mono text-[9px]">
                ///
              </span>
              <span>Gạch chéo xóa đi phần không thuộc tập hợp</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
