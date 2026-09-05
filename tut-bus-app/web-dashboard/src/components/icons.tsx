import type { SVGProps } from 'react';

/**
 * Consistent stroke-based icon set for the dashboard chrome (sidebar nav,
 * stat cards). Keeping every icon on the same viewBox/stroke settings so the
 * set reads as one system instead of a grab-bag of emoji.
 */
function Icon({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
}

export function IconOverview(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="4" y="10" width="4" height="10" rx="1" />
      <rect x="10" y="5" width="4" height="15" rx="1" />
      <rect x="16" y="13" width="4" height="7" rx="1" />
    </Icon>
  );
}

export function IconMap(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </Icon>
  );
}

export function IconPulse(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M3 12h4l2 7 4-14 2 7h6" />
    </Icon>
  );
}

export function IconBus(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="4" y="5" width="16" height="11" rx="2.5" />
      <path d="M4 11.5h16" />
      <path d="M7.5 5v-.5A1.5 1.5 0 0 1 9 3h6a1.5 1.5 0 0 1 1.5 1.5V5" />
      <circle cx="8.5" cy="18" r="1.5" />
      <circle cx="15.5" cy="18" r="1.5" />
    </Icon>
  );
}

export function IconIdCard(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <circle cx="9" cy="11" r="2" />
      <path d="M6.3 16c.4-1.7 1.7-2.5 2.7-2.5s2.3.8 2.7 2.5" />
      <path d="M14.5 10h3M14.5 13h3" />
    </Icon>
  );
}

export function IconRoute(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="5.5" cy="17.5" r="2" />
      <circle cx="18.5" cy="6.5" r="2" />
      <path d="M7.5 17.5h3.5a3 3 0 0 0 3-3v-1a3 3 0 0 1 3-3h1.5" />
    </Icon>
  );
}

export function IconClock(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7.5V12l3 2.5" />
    </Icon>
  );
}

export function IconGraduationCap(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M12 4 2.5 9 12 14l9.5-5L12 4Z" />
      <path d="M6.5 11.5V16c0 1.4 2.7 2.8 5.5 2.8s5.5-1.4 5.5-2.8v-4.5" />
    </Icon>
  );
}

export function IconBell(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 13 6 9Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </Icon>
  );
}

export function IconChat(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M4.5 5.5h15v10.5h-9L6 20v-4H4.5V5.5Z" />
    </Icon>
  );
}

export function IconLogout(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M9 4H6a1.5 1.5 0 0 0-1.5 1.5v13A1.5 1.5 0 0 0 6 20h3" />
      <path d="M13 8l4 4-4 4" />
      <path d="M17 12H9" />
    </Icon>
  );
}

export function IconWarning(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M12 4.5 21 19H3L12 4.5Z" />
      <path d="M12 10v3.5" />
      <circle cx="12" cy="16.5" r="0.75" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function IconSun(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2.4M12 19.1v2.4M4.6 4.6l1.7 1.7M17.7 17.7l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.6 19.4l1.7-1.7M17.7 6.3l1.7-1.7" />
    </Icon>
  );
}

export function IconMoon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5Z" />
    </Icon>
  );
}

export function IconStar(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M12 4.5l2.2 4.9 5.3.6-4 3.7 1.1 5.3-4.6-2.7-4.6 2.7 1.1-5.3-4-3.7 5.3-.6L12 4.5Z" />
    </Icon>
  );
}
