/**
 * Format date string to readable format
 * @param {string} dateString - Date string in format "YYYY-MM-DD HH:mm:ss"
 * @param {string} locale - Locale for formatting (default: 'en-US')
 * @returns {string} Formatted date like "February 21, 2026 at 09:45 PM"
 */
export const formatDate = (dateString, locale = 'en-US') => {
    if (!dateString) return '';
    
    try {
        const date = new Date(dateString);
        
        if (isNaN(date.getTime())) {
            return dateString; // Return original if parsing fails
        }
        
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        };
        
        const formatter = new Intl.DateTimeFormat(locale, options);
        const parts = formatter.formatToParts(date);
        
        // Build formatted string with " at " between date and time
        let dateStr = '';
        let timeStr = '';
        let foundTime = false;
        
        parts.forEach((part) => {
            if (part.type === 'hour' || part.type === 'minute' || part.type === 'dayPeriod') {
                foundTime = true;
            }
            
            if (foundTime) {
                timeStr += part.value;
            } else {
                dateStr += part.value;
            }
        });
        
        return `${dateStr.trim()} ${timeStr.trim()}`;
    } catch (error) {
        console.warn('Date formatting error:', error);
        return dateString;
    }
};

/**
 * Format date for short display (e.g., "Feb 21, 2026")
 */
export const formatDateShort = (dateString, locale = 'en-US') => {
    if (!dateString) return '';
    
    try {
        const date = new Date(dateString);
        
        if (isNaN(date.getTime())) {
            return dateString;
        }
        
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Intl.DateTimeFormat(locale, options).format(date);
    } catch (error) {
        console.warn('Date formatting error:', error);
        return dateString;
    }
};

/**
 * Format time only (e.g., "09:45 PM")
 */
export const formatTime = (dateString, locale = 'en-US') => {
    if (!dateString) return '';
    
    try {
        const date = new Date(dateString);
        
        if (isNaN(date.getTime())) {
            return dateString;
        }
        
        const options = { hour: 'numeric', minute: '2-digit', hour12: true };
        return new Intl.DateTimeFormat(locale, options).format(date);
    } catch (error) {
        console.warn('Date formatting error:', error);
        return dateString;
    }
};
