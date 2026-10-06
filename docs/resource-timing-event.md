# Resource Timing Event

## Purpose

- Capture fine-grained network timing and delivery metrics for resources loaded by the browser (stylesheets, scripts, images, fonts, fetch/XHR requests) using the [PerformanceResourceTiming](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceResourceTiming) API.
- Provide a lightweight event-based signal (`browser.resource_timing`) aligned with unified HTTP client network timing conventions ([semantic-conventions#3385](https://github.com/open-telemetry/semantic-conventions/issues/3385)) that decouples timing collection from span lifecycle management.

## Use Cases

### Comprehensive Asset and Subresource Performance Analysis

Browser applications often load dozens or hundreds of subresources. Creating a full trace span for every static asset or image introduces high memory overhead and span-lifecycle complexity. An asynchronous event provides a compact, high-efficiency telemetry record capturing transfer sizes, compression efficiency, DNS, and connection timings.

### Correlating Subresources with User Journeys and Page Navigations

Because the Resource Timing API reports entries asynchronously after resource transfers complete, the `browser.resource_timing` event captures timing milestones accurately even when resources finish loading after initial document load. When contextual HTTP span context is available, events correlate back to their initiating trace.

## Architectural Conventions (semconv #3385)

- **Signal type**: Event (log record with event name), rather than span or metric.
- **Event name**: `browser.resource_timing`.
- **Delta time model**: `http.call.start_time` is an absolute timestamp (ms since epoch); remaining timing fields represent delta offsets relative to `http.call.start_time`.
- **Omission of unreached phases**: Browser timing values of `0` indicate the phase did not occur (e.g. no DNS lookup due to connection reuse, or no redirects). In these cases, the attribute MUST be omitted.
- **Time origin normalization**: Browsers report timestamps relative to `performance.timeOrigin`; instrumentation translates these into absolute start time and relative phase deltas.

## Event Metadata

- **Timestamp**: `http.call.start_time` (when fetch started).
- **ObservedTimestamp**: Timestamp when the event is emitted by the instrumentation.
- **Context**: Context of the initiating trace span (if available) for correlation.

## Timing Attribute Mapping

| Browser API field | Proposed attribute | Requirement | Notes |
|---|---|---|---|
| `fetchStart` | `http.call.start_time` | Required | Absolute timestamp (ms since epoch) |
| `responseEnd` | `http.call.end_time` | Required | Delta from `http.call.start_time` |
| `redirectStart` | `http.redirect.start_time` | Opt-In | Omit if 0 (no redirect). Browser only. |
| `redirectEnd` | `http.redirect.end_time` | Opt-In | Omit if 0. Browser only. |
| `domainLookupStart` | `http.dns.start_time` | Opt-In | Omit if 0 (reused connection) |
| `domainLookupEnd` | `http.dns.end_time` | Opt-In | Delta from start_time |
| `connectStart` | `http.connect.start_time` | Opt-In | Delta from start_time |
| `connectEnd` | `http.connect.end_time` | Opt-In | Implicitly TLS end |
| `secureConnectionStart` | `http.secure_connect.start_time` | Opt-In | HTTPS only, omit if 0 |
| `requestStart` | `http.request.headers.start_time` | Opt-In | Single request start in browser |
| `responseStart` | `http.response.headers.start_time` | Opt-In | First byte received (TTFB) |
| `workerStart` | `http.worker.start_time` | Opt-In | Omit if 0 (no service worker). Browser only. |

Attributes not exposed by the browser API (`http.secure_connect.end_time`, `http.request.headers.end_time`, `http.request.body.*`, `http.response.headers.end_time`, `http.response.body.*`) are not populated.

## Additional Resource Attributes

| Browser API field | Proposed attribute | Notes |
|---|---|---|
| `responseStatus` | `http.response.status_code` | HTTP status code |
| `encodedBodySize` | `http.response.body.size` | Encoded/compressed body size |
| `transferSize` | `http.response.size` | Total wire transfer size |
| `decodedBodySize` | `http.response.body.uncompressed_size` | Uncompressed body size |
| `contentType` | `http.response.header.content-type` | Content type header value |
| `nextHopProtocol` | `network.protocol.name` / `network.protocol.version` | Parsed ALPN protocol identifier |

## Optional HTTP Context Attributes

For telemetry backends that do not correlate events with spans, the event may optionally be configured to include basic HTTP attributes:

| Attribute | Type | Example |
|---|---|---|
| `url.full` | string | `https://cdn.example.com/assets/app.js` |
| `http.request.method` | string | `GET` |
| `http.response.status_code` | int | `200` |
| `server.address` | string | `cdn.example.com` |
| `server.port` | int | `443` |
| `network.protocol.version` | string | `2` |
