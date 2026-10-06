/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { InMemoryLogRecordExporter } from '@opentelemetry/sdk-logs';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { setupTestLogExporter } from '#utils/test';
import { NetworkInstrumentation } from './instrumentation.ts';
import {
  ATTR_BROWSER_NETWORK_DOWNLINK,
  ATTR_BROWSER_NETWORK_EFFECTIVE_TYPE,
  ATTR_BROWSER_NETWORK_RTT,
  ATTR_BROWSER_NETWORK_SAVE_DATA,
  ATTR_BROWSER_NETWORK_TYPE,
  NETWORK_EVENT_NAME,
} from './semconv.ts';

class FakeNetworkInformation extends EventTarget {
  downlink?: number = 10;
  effectiveType?: string = '4g';
  rtt?: number = 50;
  saveData?: boolean = false;
  type?: string = 'wifi';
}

describe('NetworkInstrumentation', () => {
  let inMemoryExporter: InMemoryLogRecordExporter;
  let instrumentation: NetworkInstrumentation;
  let fakeConnection: FakeNetworkInformation;
  let originalConnection: unknown;

  beforeAll(() => {
    inMemoryExporter = setupTestLogExporter();
  });

  beforeEach(() => {
    inMemoryExporter.reset();
    fakeConnection = new FakeNetworkInformation();
    originalConnection = (navigator as unknown as { connection?: unknown })
      .connection;
    Object.defineProperty(navigator, 'connection', {
      value: fakeConnection,
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    instrumentation?.disable();
    if (originalConnection !== undefined) {
      Object.defineProperty(navigator, 'connection', {
        value: originalConnection,
        configurable: true,
        writable: true,
      });
    } else {
      delete (navigator as unknown as { connection?: unknown }).connection;
    }
  });

  it('should emit initial network snapshot when enabled', () => {
    instrumentation = new NetworkInstrumentation();
    instrumentation.enable();

    const logs = inMemoryExporter.getFinishedLogRecords();
    expect(logs.length).toBe(1);
    const log = logs[0];
    expect(log?.eventName).toBe(NETWORK_EVENT_NAME);
    expect(log?.attributes[ATTR_BROWSER_NETWORK_EFFECTIVE_TYPE]).toBe('4g');
    expect(log?.attributes[ATTR_BROWSER_NETWORK_DOWNLINK]).toBe(10);
    expect(log?.attributes[ATTR_BROWSER_NETWORK_RTT]).toBe(50);
    expect(log?.attributes[ATTR_BROWSER_NETWORK_SAVE_DATA]).toBe(false);
    expect(log?.attributes[ATTR_BROWSER_NETWORK_TYPE]).toBe('wifi');
  });

  it('should re-emit when connection change event fires', () => {
    instrumentation = new NetworkInstrumentation();
    instrumentation.enable();

    fakeConnection.effectiveType = '3g';
    fakeConnection.downlink = 1.5;
    fakeConnection.dispatchEvent(new Event('change'));

    const logs = inMemoryExporter.getFinishedLogRecords();
    expect(logs.length).toBe(2);
    expect(logs[1]?.attributes[ATTR_BROWSER_NETWORK_EFFECTIVE_TYPE]).toBe('3g');
    expect(logs[1]?.attributes[ATTR_BROWSER_NETWORK_DOWNLINK]).toBe(1.5);
  });

  it('should not emit after being disabled', () => {
    instrumentation = new NetworkInstrumentation();
    instrumentation.enable();
    instrumentation.disable();

    inMemoryExporter.reset();
    fakeConnection.dispatchEvent(new Event('change'));

    const logs = inMemoryExporter.getFinishedLogRecords();
    expect(logs.length).toBe(0);
  });

  it('should handle undefined navigator.connection gracefully', () => {
    Object.defineProperty(navigator, 'connection', {
      value: undefined,
      configurable: true,
      writable: true,
    });
    instrumentation = new NetworkInstrumentation();
    expect(() => instrumentation.enable()).not.toThrow();
    expect(inMemoryExporter.getFinishedLogRecords().length).toBe(0);
  });

  it('should omit undefined attributes', () => {
    fakeConnection.downlink = undefined;
    fakeConnection.type = undefined;

    instrumentation = new NetworkInstrumentation();
    instrumentation.enable();

    const logs = inMemoryExporter.getFinishedLogRecords();
    expect(logs.length).toBe(1);
    expect(logs[0]?.attributes[ATTR_BROWSER_NETWORK_DOWNLINK]).toBeUndefined();
    expect(logs[0]?.attributes[ATTR_BROWSER_NETWORK_TYPE]).toBeUndefined();
    expect(logs[0]?.attributes[ATTR_BROWSER_NETWORK_EFFECTIVE_TYPE]).toBe('4g');
  });
});
