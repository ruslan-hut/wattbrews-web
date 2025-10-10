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
  
  /**
   * Get time ago string (e.g., "2 minutes ago", "3 hours ago", "5 days ago")
   */
  static getTimeAgo(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return 'Unknown';
    }
    
    const now = new Date();
    const diffInMs = now.getTime() - dateObj.getTime();
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    }
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
    }
    
    if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    }
    
    if (diffInDays < 7) {
      return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    }
    
    if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    }
    
    if (diffInDays < 365) {
      const months = Math.floor(diffInDays / 30);
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    }
    
    const years = Math.floor(diffInDays / 365);
    return `${years} ${years === 1 ? 'year' : 'years'} ago`;
  }
}
