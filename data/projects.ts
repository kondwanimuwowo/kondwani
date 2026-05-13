export interface Project {
  id: number
  slug: string
  title: string
  description: string
  excerpt?: string
  tech: string[]
  liveUrl: string
  githubUrl: string | null
  image: string
  featured: boolean
  category: string
  role?: string
  year?: number
  status?: string
}

export const projects: Project[] = [
  {
    id: 1,
    slug: "kuwala-weather-app",
    title: "Kuwala Weather App",
    description:
      "A fast and efficient weather application using Visual Crossing API. Features current weather conditions, humidity, wind speed, and unit toggle functionality.",
    excerpt: "Real-time weather for any city — built with vanilla JS and the Visual Crossing API.",
    tech: ["HTML5", "CSS3", "JavaScript", "REST API"],
    liveUrl: "https://kondwanimuwowo.github.io/weather-app",
    githubUrl: "https://github.com/kondwanimuwowo/weather-app",
    image: "/images/projects/kuwala-weather.png",
    featured: true,
    category: "Web App",
    role: "Solo Developer",
    year: 2024,
  },
  {
    id: 2,
    slug: "personal-portfolio",
    title: "Personal Portfolio",
    description:
      "A minimal, modern portfolio website built with React and Tailwind CSS. Showcasing my work as a software developer and UI designer.",
    excerpt: "My digital home — a minimal, animated portfolio built with Next.js and Tailwind CSS.",
    tech: ["Next.js", "React", "Tailwind CSS", "Prisma", "Supabase"],
    liveUrl: "https://kondwanimuwowo.com",
    githubUrl: "https://github.com/kondwanimuwowo",
    image: "/images/projects/portfolio.png",
    featured: true,
    category: "Portfolio",
    role: "Solo Developer & Designer",
    year: 2025,
  },
  {
    id: 3,
    slug: "the-great-achievers-network",
    title: "The Great Achievers Network",
    description:
      "Website for a nonprofit supporting vulnerable girls with education and practical skills. Custom WordPress design with donation integration.",
    excerpt: "A nonprofit website built with WordPress, supporting girls' education and empowerment in Zambia.",
    tech: ["WordPress", "UI Design", "Responsive"],
    liveUrl: "https://greatachieversnetwork.org",
    githubUrl: null,
    image: "/images/projects/gan-website.png",
    featured: true,
    category: "Nonprofit",
    role: "Lead Developer & Designer",
    year: 2024,
  },
  {
    id: 4,
    slug: "smile-fx-traders",
    title: "Smile FX Traders",
    description:
      "Forex trading platform and community website for Zambian traders. Currently under development with React and Node.js.",
    excerpt: "A community platform bridging the financial literacy gap for Zambian forex traders.",
    tech: ["React", "Node.js", "UI/UX Design"],
    liveUrl: "https://smilefxtraders.com",
    githubUrl: null,
    image: "/images/projects/smilefx.png",
    featured: false,
    category: "Platform",
    role: "Lead Developer & Designer",
    year: 2025,
    status: "In Development",
  },
]
