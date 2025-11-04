/**
 * Utility functions for connector status checks
 */
export class ConnectorUtils {
  /**
   * Check if a connector is available for selection
   * Returns true if status is "Available" or "Preparing"
   */
  static isAvailable(status: string): boolean {
    return status === 'Available' || status === 'Preparing';
  }
}

