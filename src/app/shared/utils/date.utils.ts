export class DateUtils {
  /**
   * Format a date to a readable string
   */
  static formatDate(date: Date | string, format: 'short' | 'long' | 'time' = 'short'): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }
    
    const options: Intl.DateTimeFormatOptions = {};
    
    switch (format) {
      case 'short':
        options.year = 'numeric';
        options.month = 'short';
        options.day = 'numeric';
        break;
      case 'long':
        options.year = 'numeric';
        options.month = 'long';
        options.day = 'numeric';
        options.hour = '2-digit';
        options.minute = '2-digit';
        break;
      case 'time':
        options.hour = '2-digit';
        options.minute = '2-digit';
        break;
    }
    
    return dateObj.toLocaleDateString('en-US', options);
  }
  
  /**
   * Calculate the difference between two dates in minutes
   */
  static getMinutesDifference(startDate: Date, endDate: Date): number {
    const diffInMs = endDate.getTime() - startDate.getTime();
    return Math.floor(diffInMs / (1000 * 60));
  }
  
  /**
   * Format duration in minutes to a readable string
   */
  static formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    
    return `${hours}h ${remainingMinutes}m`;
  }
  
  /**
   * Check if a date is today
   */
  static isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }
  
  /**
   * Check if a date is yesterday
   */
  static isYesterday(date: Date): boolean {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return date.toDateString() === yesterday.toDateString();
  }
  
  /**
   * Get relative time string (e.g., "2 hours ago", "yesterday")
   */
  static getRelativeTime(date: Date): string {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (this.isToday(date)) {
      return this.formatDate(date, 'time');
    }
    
    if (this.isYesterday(date)) {
      return 'Yesterday';
    }
    
    if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    }
    
    return this.formatDate(date, 'short');
  }
}
