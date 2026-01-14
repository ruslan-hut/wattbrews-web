import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { map } from 'rxjs/operators';

/**
 * Mapping from lowercase connector status to normalized PascalCase status.
 * These follow the OCPP standard connector status values.
 */
const CONNECTOR_STATUS_MAP: Record<string, string> = {
  'available': 'Available',
  'preparing': 'Preparing',
  'charging': 'Charging',
  'occupied': 'Occupied',
  'suspendedevse': 'SuspendedEVSE',
  'suspendedev': 'SuspendedEV',
  'finishing': 'Finishing',
  'reserved': 'Reserved',
  'unavailable': 'Unavailable',
  'faulted': 'Faulted',
  'out_of_order': 'OutOfOrder',
  'outoforder': 'OutOfOrder',
  'offline': 'Offline',
  'unknown': 'Unknown'
};

/**
 * Normalize a connector status string to PascalCase format.
 * Handles various case formats: 'available', 'AVAILABLE', 'Available', etc.
 */
function normalizeStatus(status: string): string {
  if (!status || typeof status !== 'string') {
    return status;
  }
  return CONNECTOR_STATUS_MAP[status.toLowerCase()] || status;
}

/**
 * Recursively normalize connector statuses in response data.
 * Looks for 'status' fields in objects and 'connectors' arrays.
 */
function normalizeConnectorStatuses(data: unknown): unknown {
  if (data === null || data === undefined) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(normalizeConnectorStatuses);
  }

  if (typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    const normalized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (key === 'status' && typeof value === 'string') {
        // Normalize status fields
        normalized[key] = normalizeStatus(value);
      } else if (key === 'connectors' && Array.isArray(value)) {
        // Recursively normalize connectors array
        normalized[key] = value.map((connector: unknown) => {
          if (connector && typeof connector === 'object') {
            return normalizeConnectorStatuses(connector);
          }
          return connector;
        });
      } else if (typeof value === 'object') {
        // Recursively process nested objects
        normalized[key] = normalizeConnectorStatuses(value);
      } else {
        normalized[key] = value;
      }
    }

    return normalized;
  }

  return data;
}

/**
 * HTTP interceptor that normalizes connector status values in API responses.
 *
 * This ensures consistent status values across the application regardless
 * of the case format returned by the API ('available', 'AVAILABLE', etc.)
 *
 * The normalized statuses follow PascalCase format: 'Available', 'Charging', etc.
 */
export const responseNormalizerInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    map(event => {
      if (event instanceof HttpResponse && event.body) {
        const normalizedBody = normalizeConnectorStatuses(event.body);
        return event.clone({ body: normalizedBody });
      }
      return event;
    })
  );
};
