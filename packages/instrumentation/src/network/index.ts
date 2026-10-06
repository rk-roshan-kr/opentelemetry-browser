/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */

export { NetworkInstrumentation } from './instrumentation.ts';
export {
  ATTR_BROWSER_NETWORK_DOWNLINK,
  ATTR_BROWSER_NETWORK_EFFECTIVE_TYPE,
  ATTR_BROWSER_NETWORK_RTT,
  ATTR_BROWSER_NETWORK_SAVE_DATA,
  ATTR_BROWSER_NETWORK_TYPE,
  NETWORK_EVENT_NAME,
} from './semconv.ts';
export type {
  ConnectionType,
  EffectiveConnectionType,
  NetworkInstrumentationConfig,
} from './types.ts';
