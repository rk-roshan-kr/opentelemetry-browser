/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { LogRecord } from '@opentelemetry/api-logs';
import { SeverityNumber } from '@opentelemetry/api-logs';
import { InstrumentationBase } from '@opentelemetry/instrumentation';
import { version } from '../../package.json' with { type: 'json' };
import {
  ATTR_BROWSER_NETWORK_DOWNLINK,
  ATTR_BROWSER_NETWORK_EFFECTIVE_TYPE,
  ATTR_BROWSER_NETWORK_RTT,
  ATTR_BROWSER_NETWORK_SAVE_DATA,
  ATTR_BROWSER_NETWORK_TYPE,
  NETWORK_EVENT_NAME,
} from './semconv.ts';
import type { NetworkInstrumentationConfig } from './types.ts';

interface NetworkInformation extends EventTarget {
  downlink?: number;
  effectiveType?: string;
  rtt?: number;
  saveData?: boolean;
  type?: string;
  onchange?: ((this: NetworkInformation, ev: Event) => unknown) | null;
}

interface NavigatorWithConnection {
  connection?: NetworkInformation;
  mozConnection?: NetworkInformation;
  webkitConnection?: NetworkInformation;
}

/**
 * Instrumentation for the Network Information API (connection quality).
 */
export class NetworkInstrumentation extends InstrumentationBase<NetworkInstrumentationConfig> {
  declare private _isEnabled: boolean;
  private _onConnectionChange?: () => void;

  constructor(config: NetworkInstrumentationConfig = {}) {
    super('@opentelemetry/browser-instrumentation/network', version, config);
  }

  protected override init() {
    return [];
  }

  private _getConnection(): NetworkInformation | undefined {
    if (typeof navigator === 'undefined') {
      return undefined;
    }
    const nav = navigator as unknown as NavigatorWithConnection;
    return nav.connection ?? nav.mozConnection ?? nav.webkitConnection;
  }

  private _emitNetworkEvent(connection: NetworkInformation): void {
    const attributes: NonNullable<LogRecord['attributes']> = {};

    if (connection.effectiveType !== undefined) {
      attributes[ATTR_BROWSER_NETWORK_EFFECTIVE_TYPE] =
        connection.effectiveType;
    }
    if (connection.downlink !== undefined) {
      attributes[ATTR_BROWSER_NETWORK_DOWNLINK] = connection.downlink;
    }
    if (connection.rtt !== undefined) {
      attributes[ATTR_BROWSER_NETWORK_RTT] = connection.rtt;
    }
    if (connection.saveData !== undefined) {
      attributes[ATTR_BROWSER_NETWORK_SAVE_DATA] = connection.saveData;
    }
    if (connection.type !== undefined) {
      attributes[ATTR_BROWSER_NETWORK_TYPE] = connection.type;
    }

    const logRecord: LogRecord = {
      eventName: NETWORK_EVENT_NAME,
      severityNumber: SeverityNumber.INFO,
      attributes,
    };

    this.logger.emit(logRecord);
  }

  override enable(): void {
    if (this._isEnabled) {
      return;
    }
    this._isEnabled = true;

    const connection = this._getConnection();
    if (!connection) {
      this._diag.debug(
        'Network Information API not supported on this browser.',
      );
      return;
    }

    this._emitNetworkEvent(connection);

    this._onConnectionChange = () => {
      if (this._isEnabled) {
        this._emitNetworkEvent(connection);
      }
    };

    connection.addEventListener('change', this._onConnectionChange);
  }

  override disable(): void {
    if (!this._isEnabled) {
      return;
    }
    this._isEnabled = false;

    const connection = this._getConnection();
    if (connection && this._onConnectionChange) {
      connection.removeEventListener('change', this._onConnectionChange);
      this._onConnectionChange = undefined;
    }
  }
}
