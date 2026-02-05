/**
 * Address Utility Functions
 * Handles conversion between frontend address format (separate fields) and backend format (single address string)
 */

export interface AddressInputFields {
  title?: string;
  address: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface AddressDisplayFields {
  title?: string;
  address: string; // Full address string (combined from city, state, zipCode, country)
  latitude?: string;
  longitude?: string;
}

/**
 * Combine separate address fields into a single address string
 * Format: "address, city, state zipCode, country"
 */
export function combineAddressFields(fields: AddressInputFields): string {
  const parts: string[] = [];
  
  // Add main address
  if (fields.address) {
    parts.push(fields.address);
  }
  
  // Combine city, state, zipCode
  const cityStateZip: string[] = [];
  if (fields.city) cityStateZip.push(fields.city);
  if (fields.state) cityStateZip.push(fields.state);
  if (fields.zipCode) cityStateZip.push(fields.zipCode);
  
  if (cityStateZip.length > 0) {
    parts.push(cityStateZip.join(", "));
  }
  
  // Add country separately
  if (fields.country) {
    parts.push(fields.country);
  }
  
  return parts.join(", ");
}

/**
 * Extract address fields from a combined address string
 * Attempts to parse: "address, city, state zipCode, country"
 * Note: This is a best-effort parsing. For more complex addresses, manual editing may be needed.
 */
export function extractAddressFields(addressString: string): AddressInputFields {
  if (!addressString || !addressString.trim()) {
    return { address: "" };
  }
  
  // Split by comma
  const parts = addressString.split(",").map(p => p.trim()).filter(Boolean);
  
  if (parts.length === 0) {
    return { address: addressString };
  }
  
  // First part is usually the street address
  const address = parts[0] || "";
  
  // Last part might be country
  let country: string | undefined;
  let remainingParts = parts.slice(1);
  
  // Check if last part looks like a country (usually 2-3 words or a known country name)
  if (remainingParts.length > 0) {
    const lastPart = remainingParts[remainingParts.length - 1];
    // Simple heuristic: if it's a single word or short, might be country
    // For now, we'll treat the last part as country if there are multiple parts
    if (remainingParts.length > 1) {
      country = lastPart;
      remainingParts = remainingParts.slice(0, -1);
    }
  }
  
  // Middle parts: city, state, zipCode
  let city: string | undefined;
  let state: string | undefined;
  let zipCode: string | undefined;
  
  if (remainingParts.length > 0) {
    // Try to identify zipCode (usually numeric, 5-10 digits)
    const zipCodeRegex = /^\d{5}(-\d{4})?$/;
    const zipIndex = remainingParts.findIndex(p => zipCodeRegex.test(p));
    
    if (zipIndex !== -1) {
      zipCode = remainingParts[zipIndex];
      remainingParts = remainingParts.filter((_, i) => i !== zipIndex);
    }
    
    // Remaining parts: city and state
    if (remainingParts.length >= 2) {
      // Usually: city, state
      city = remainingParts[0];
      state = remainingParts.slice(1).join(", ");
    } else if (remainingParts.length === 1) {
      // Could be city or state - assume city
      city = remainingParts[0];
    }
  }
  
  return {
    address,
    city,
    state,
    zipCode,
    country,
  };
}

/**
 * Format address for display
 * Returns a formatted string suitable for display
 */
export function formatAddressForDisplay(address: AddressDisplayFields): string {
  const parts: string[] = [];
  
  if (address.title) {
    parts.push(address.title);
  }
  
  if (address.address) {
    parts.push(address.address);
  }
  
  return parts.join(" - ");
}
