/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { InstrumentationConfig } from '@opentelemetry/instrumentation';

/**
 * Effective connection type.
 */
export type EffectiveConnectionType = 'slow-2g' | '2g' | '3g' | '4g';

/**
 * Underlying connection type.
 */
export type ConnectionType =
  | 'bluetooth'
  | 'cellular'
  | 'ethernet'
  | 'none'
  | 'wifi'
  | 'wimax'
  | 'other'
  | 'unknown';

/**
 * Configuration options for NetworkInstrumentation.
 */
export interface NetworkInstrumentationConfig extends InstrumentationConfig {}
