/**
 * Avatar utility for manager profile photos
 * Handles avatar URL generation with case-insensitive matching
 */

/**
 * Manager name to avatar filename mapping
 * Maps display names to lowercase filename conventions matching Yahoo team names
 * Only includes managers that actually have avatar files
 */
const MANAGER_AVATAR_MAP: Record<string, string> = {
  // Only include managers that have actual avatar files
  'geoff': 'geoff',
  'toph': 'toph',
  'h0geveen': 'h0geveen',
  'deeze nuts': 'deezenuts',
  'bendy': 'bendy',
  'blake': 'blake',
  'deke': 'deke',
  'bryan inglis': 'inglis',
  'luke': 'luke',
  'scott': 'scott',
  'shane': 'shane',
}

/**
 * Display name transformations for consistent appearance
 * Maps Yahoo team names to preferred display names
 */
const DISPLAY_NAME_MAP: Record<string, string> = {
  'h0geveen': 'Hogy',
  'bryan inglis': 'Inglis', 
  'deeze nuts': 'Dinesh',
}

/**
 * Get the display name for a manager
 * @param managerName - The manager's Yahoo team name (case-insensitive)
 * @returns The preferred display name or original name if no mapping exists
 */
export function getManagerDisplayName(managerName: string | null | undefined): string {
  if (!managerName) return 'Unknown'
  
  // Normalize the manager name (lowercase, trim whitespace)
  const normalizedName = managerName.toLowerCase().trim()
  
  // Check if we have a display name mapping for this manager
  const displayName = DISPLAY_NAME_MAP[normalizedName]
  
  return displayName || managerName
}

/**
 * Get the avatar URL for a manager
 * @param managerName - The manager's display name (case-insensitive)
 * @returns The avatar URL path or undefined if no avatar exists
 */
export function getManagerAvatarUrl(managerName: string | null | undefined): string | undefined {
  if (!managerName) return undefined
  
  // Normalize the manager name (lowercase, trim whitespace)
  const normalizedName = managerName.toLowerCase().trim()
  
  // Check if we have a mapping for this manager
  const avatarFilename = MANAGER_AVATAR_MAP[normalizedName]
  
  if (avatarFilename) {
    return `/images/teams/avatars/${avatarFilename}.png`
  }
  
  return undefined
}

/**
 * Check if a manager has an avatar
 * @param managerName - The manager's display name
 * @returns true if avatar exists, false otherwise
 */
export function hasAvatar(managerName: string | null | undefined): boolean {
  return getManagerAvatarUrl(managerName) !== undefined
}

/**
 * Get all available manager avatars
 * @returns Array of manager names that have avatars
 */
export function getAvailableAvatars(): string[] {
  return Object.keys(MANAGER_AVATAR_MAP)
}

