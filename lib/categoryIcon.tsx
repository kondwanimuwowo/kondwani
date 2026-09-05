import {
  Web,
  Public,
  Dashboard,
  Work,
  PhoneIphone,
  Palette,
  VolunteerActivism,
  Description,
  Apps,
} from "@mui/icons-material"

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  "web app": Web,
  "website": Public,
  "dashboard": Dashboard,
  "portfolio": Work,
  "mobile app": PhoneIphone,
  "design": Palette,
  "nonprofit": VolunteerActivism,
  "case study": Description,
}

export function getCategoryIcon(category: string): React.ElementType {
  return CATEGORY_ICONS[category.toLowerCase()] ?? Apps
}
