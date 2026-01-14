/**
 * Connector status constants (normalized PascalCase values)
 */
export enum ConnectorStatus {
  Available = 'Available',
  Preparing = 'Preparing',
  Charging = 'Charging',
  Occupied = 'Occupied',
  SuspendedEVSE = 'SuspendedEVSE',
  SuspendedEV = 'SuspendedEV',
  Finishing = 'Finishing',
  Reserved = 'Reserved',
  Unavailable = 'Unavailable',
  Faulted = 'Faulted',
  OutOfOrder = 'OutOfOrder',
  Offline = 'Offline',
  Unknown = 'Unknown'
}

/**
 * Status categories for grouping
 */
const AVAILABLE_STATUSES = ['available', 'preparing'];
const CHARGING_STATUSES = ['charging'];
const OCCUPIED_STATUSES = ['occupied', 'suspendedevse', 'suspendedev', 'finishing', 'reserved'];
const FAULTED_STATUSES = ['faulted', 'out_of_order', 'outoforder', 'unavailable', 'offline'];

/**
 * Utility functions for connector status checks.
 * All methods are case-insensitive for flexibility.
 */
export class ConnectorUtils {
  /**
   * Normalize a status string to lowercase for comparison
   */
  private static normalize(status: string | null | undefined): string {
    return (status || '').toLowerCase().trim();
  }

  /**
   * Check if a connector is available for charging.
   * Returns true if status is "Available" or "Preparing" (case-insensitive).
   */
  static isAvailable(status: string | null | undefined): boolean {
    return AVAILABLE_STATUSES.includes(this.normalize(status));
  }

  /**
   * Check if a connector is currently charging.
   */
  static isCharging(status: string | null | undefined): boolean {
    return CHARGING_STATUSES.includes(this.normalize(status));
  }

  /**
   * Check if a connector is occupied but not actively charging.
   */
  static isOccupied(status: string | null | undefined): boolean {
    return OCCUPIED_STATUSES.includes(this.normalize(status));
  }

  /**
   * Check if a connector is in a faulted or error state.
   */
  static isFaulted(status: string | null | undefined): boolean {
    return FAULTED_STATUSES.includes(this.normalize(status));
  }

  /**
   * Check if a connector is in use (charging or occupied).
   */
  static isInUse(status: string | null | undefined): boolean {
    const normalized = this.normalize(status);
    return CHARGING_STATUSES.includes(normalized) || OCCUPIED_STATUSES.includes(normalized);
  }

  /**
   * Get the status category for styling/display purposes.
   */
  static getStatusCategory(status: string | null | undefined): 'available' | 'charging' | 'occupied' | 'faulted' | 'unknown' {
    if (this.isAvailable(status)) return 'available';
    if (this.isCharging(status)) return 'charging';
    if (this.isOccupied(status)) return 'occupied';
    if (this.isFaulted(status)) return 'faulted';
    return 'unknown';
  }

  /**
   * Get CSS class for a connector status.
   */
  static getStatusClass(status: string | null | undefined): string {
    return this.getStatusCategory(status);
  }
}

