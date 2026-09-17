/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type EndpointVal = number | '-Infinity' | '+Infinity';

export interface IntervalItem {
  left: number | '-Infinity';
  leftInclusive: boolean;
  right: number | '+Infinity';
  rightInclusive: boolean;
}

export interface RealSet {
  rawInput: string;
  isValid: boolean;
  errorMessage?: string;
  // Disjoint sorted intervals (or singletons where left === right)
  intervals: IntervalItem[];
  // Standard formatted string representation, e.g. "[-3; 4)"
  formatted: string;
  // Type classification for pedagogy
  kind: 'empty' | 'real' | 'open' | 'closed' | 'half_open' | 'infinite_left' | 'infinite_right' | 'singleton' | 'union' | 'unknown';
}

export type SetOperation = 'INTERSECTION' | 'UNION' | 'DIFF_A_B' | 'DIFF_B_A';

export interface StepExplanation {
  stepIndex: number;
  title: string;
  description: string;
  activeFocus: 'A' | 'B' | 'COMPARE' | 'NOTATION' | 'RESULT';
}
