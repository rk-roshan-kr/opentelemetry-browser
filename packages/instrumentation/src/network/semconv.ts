/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Event name for network information events.
 */
export const NETWORK_EVENT_NAME = 'browser.network';

/**
 * The effective connection type (e.g., 'slow-2g', '2g', '3g', '4g').
 */
export const ATTR_BROWSER_NETWORK_EFFECTIVE_TYPE =
  'browser.network.effective_type';

/**
 * The estimated downlink speed in megabits per second.
 */
export const ATTR_BROWSER_NETWORK_DOWNLINK = 'browser.network.downlink';

/**
 * The estimated round-trip time in milliseconds.
 */
export const ATTR_BROWSER_NETWORK_RTT = 'browser.network.rtt';

/**
 * Reduced data usage preference.
 */
export const ATTR_BROWSER_NETWORK_SAVE_DATA = 'browser.network.save_data';

/**
 * The underlying connection type (e.g., 'wifi', 'cellular', 'ethernet').
 */
export const ATTR_BROWSER_NETWORK_TYPE = 'browser.network.type';
