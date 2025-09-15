export class FormatUtils {
  /**
   * Format currency amount
   */
  static formatCurrency(amount: number, currency: string = 'EUR', locale: string = 'en-US'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }
  
  /**
   * Format energy amount (kWh)
   */
  static formatEnergy(amount: number, decimals: number = 2): string {
    return `${amount.toFixed(decimals)} kWh`;
  }
  
  /**
   * Format power amount (kW)
   */
  static formatPower(amount: number, decimals: number = 1): string {
    return `${amount.toFixed(decimals)} kW`;
  }
  
  /**
   * Format distance in kilometers
   */
  static formatDistance(km: number, decimals: number = 1): string {
    if (km < 1) {
      return `${Math.round(km * 1000)} m`;
    }
    return `${km.toFixed(decimals)} km`;
  }
  
  /**
   * Format phone number
   */
  static formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Format based on length
    if (cleaned.length === 10) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return cleaned.replace(/(\d{1})(\d{3})(\d{3})(\d{4})/, '+$1 ($2) $3-$4');
    }
    
    return phone; // Return original if format is not recognized
  }
  
  /**
   * Truncate text to specified length
   */
  static truncateText(text: string, maxLength: number, suffix: string = '...'): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength - suffix.length) + suffix;
  }
  
  /**
   * Format file size in bytes to human readable format
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  /**
   * Format percentage
   */
  static formatPercentage(value: number, decimals: number = 0): string {
    return `${value.toFixed(decimals)}%`;
  }
  
  /**
   * Format rating with stars
   */
  static formatRating(rating: number, maxRating: number = 5): string {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = maxRating - fullStars - (hasHalfStar ? 1 : 0);
    
    return '★'.repeat(fullStars) + 
           (hasHalfStar ? '☆' : '') + 
           '☆'.repeat(emptyStars);
  }
}
