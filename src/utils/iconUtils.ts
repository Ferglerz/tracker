import * as allIcons from 'ionicons/icons';

const iconMap = allIcons as Record<string, string>;

/**
 * Safely resolve an ionicon by its camelCase name.
 * Returns undefined if the icon name is invalid.
 */
export function getIcon(name: string | undefined): string | undefined {
  if (!name) return undefined;
  return iconMap[name];
}
