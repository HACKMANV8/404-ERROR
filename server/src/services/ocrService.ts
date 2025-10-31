import Tesseract from 'tesseract.js';

/**
 * OCR Service to extract UTR number from UPI payment screenshots
 */
export class OCRService {
  /**
   * Extract UTR number from UPI payment screenshot
   * UTR (Unique Transaction Reference) is typically a 12-digit number
   */
  async extractUTRFromImage(imageBuffer: Buffer): Promise<string | null> {
    try {
      console.log('[OCR] 🔍 Starting OCR processing to extract UTR...');
      
      // Perform OCR on the image
      const { data: { text } } = await Tesseract.recognize(imageBuffer, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            // Optional: Log progress
            console.log(`[OCR] Progress: ${Math.round(m.progress * 100)}%`);
          }
        },
      });

      console.log('[OCR] ✅ OCR text extracted (length:', text.length, 'characters)');
      
      // Extract UTR number (typically 12 digits, can be found after "UTR" keyword or standalone)
      // Pattern: Look for numbers that are 10-15 digits (UTR is usually 12 digits)
      const utrPatterns = [
        /UTR[:\s]*(\d{10,15})/i,           // UTR: 123456789012
        /Unique Transaction Reference[:\s]*(\d{10,15})/i,  // Full text
        /(\d{12})/,                         // Direct 12-digit number (most common)
        /(\d{10,15})/,                      // Fallback: any 10-15 digit number
      ];

      for (const pattern of utrPatterns) {
        const match = text.match(pattern);
        if (match) {
          const utr = match[1] || match[0]; // Get captured group or full match
          console.log('[OCR] ✅ UTR found:', utr);
          return utr.trim();
        }
      }

      // If no pattern matched, look for the longest numeric string (likely UTR)
      const numbers = text.match(/\d{10,}/g); // All numbers with 10+ digits
      if (numbers && numbers.length > 0) {
        // Return the longest number (most likely to be UTR)
        const longestNumber = numbers.reduce((a, b) => a.length > b.length ? a : b);
        console.log('[OCR] ✅ UTR found (longest number):', longestNumber);
        return longestNumber;
      }

      console.log('[OCR] ⚠️ No UTR found in image');
      return null;
    } catch (error: any) {
      console.error('[OCR] ❌ Error extracting UTR:', error.message);
      throw new Error(`Failed to extract UTR from image: ${error.message}`);
    }
  }

  /**
   * Clean and normalize UTR for comparison
   * Removes spaces, hyphens, and other non-numeric characters
   */
  normalizeUTR(utr: string): string {
    return utr.replace(/\D/g, ''); // Remove all non-digits
  }

  /**
   * Compare two UTR numbers (normalized)
   */
  compareUTR(utr1: string, utr2: string): boolean {
    const normalized1 = this.normalizeUTR(utr1);
    const normalized2 = this.normalizeUTR(utr2);
    return normalized1 === normalized2;
  }
}

