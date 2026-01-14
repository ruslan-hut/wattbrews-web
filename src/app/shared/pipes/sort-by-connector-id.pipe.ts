import { Pipe, PipeTransform } from '@angular/core';

/**
 * Interface for objects that have a connector_id property.
 * This allows the pipe to work with various connector types.
 */
interface ConnectorLike {
  connector_id: number;
}

/**
 * Pipe to sort connectors by their connector_id in ascending order.
 *
 * Usage:
 * ```html
 * <div *ngFor="let connector of connectors | sortByConnectorId">
 *   {{ connector.connector_id }}
 * </div>
 * ```
 */
@Pipe({
  name: 'sortByConnectorId',
  standalone: true
})
export class SortByConnectorIdPipe implements PipeTransform {
  transform<T extends ConnectorLike>(connectors: T[] | null | undefined): T[] {
    if (!connectors || connectors.length === 0) {
      return connectors ?? [];
    }

    return [...connectors].sort((a, b) => a.connector_id - b.connector_id);
  }
}
