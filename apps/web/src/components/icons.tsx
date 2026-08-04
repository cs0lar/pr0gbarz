import type { SVGProps } from 'react'

export type IconName =
  'archive' | 'dashboard' | 'moon' | 'plus' | 'projects' | 'sun'

const paths: Record<IconName, string> = {
  archive: 'M4 7h16M6 7v12h12V7M9 11h6M5 3h14l1 4H4l1-4Z',
  dashboard: 'M4 4h6v6H4V4Zm10 0h6v10h-6V4ZM4 14h6v6H4v-6Zm10 4h6v2h-6v-2Z',
  moon: 'M20 15.4A8 8 0 0 1 8.6 4a8 8 0 1 0 11.4 11.4Z',
  plus: 'M12 5v14M5 12h14',
  projects: 'M4 7h6l2 2h8v10H4V7Zm0 0V5h7l2 2',
  sun: 'M12 3v2m0 14v2m9-9h-2M5 12H3m15.4-6.4L17 7m-10 10-1.4 1.4m12.8 0L17 17M7 7 5.6 5.6M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
}

export function Icon({
  name,
  ...props
}: SVGProps<SVGSVGElement> & { name: IconName }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="20"
      viewBox="0 0 24 24"
      width="20"
      {...props}
    >
      <path
        d={paths[name]}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}
