import { Course, Category, Benefit } from "@/types/home";

export const categories: Category[] = [
  { id: "design", name: "Design", icon: "/window.svg" },
  { id: "development", name: "Development", icon: "/window.svg" },
  { id: "marketing", name: "Marketing", icon: "/window.svg" },
  { id: "it", name: "IT & Software", icon: "/window.svg" },
  { id: "personal", name: "Personal Development", icon: "/window.svg" },
  { id: "business", name: "Business", icon: "/window.svg" },
  { id: "photo", name: "Photography", icon: "/window.svg" },
  { id: "music", name: "Music", icon: "/window.svg" },
];

export const featuredCourses: Course[] = [
  {
    id: 'c-1',
    title: 'Complete Python Bootcamp From Zero to Hero',
    instructor: 'Jose Portilla',
    price: 14.99,
    image: '/globe.svg',
    rating: 4.6,
    reviews: 124500,
    hours: 22.5,
    lectures: 155,
    badge: 'Bestseller'
  },
  {
    id: 'c-2',
    title: 'The Web Developer Bootcamp 2025',
    instructor: 'Colt Steele',
    price: 18.99,
    image: '/globe.svg',
    rating: 4.7,
    reviews: 98500,
    hours: 45,
    lectures: 320
  },
  {
    id: 'c-3',
    title: 'JavaScript: Understanding the Weird Parts',
    instructor: 'Tony Alicea',
    price: 12.99,
    image: '/globe.svg',
    rating: 4.5,
    reviews: 65000,
    hours: 12,
    lectures: 96
  },
  {
    id: 'c-4',
    title: 'React - The Complete Guide (Hooks, Context, Redux)',
    instructor: 'Max Schwarzmüller',
    price: 16.99,
    image: '/globe.svg',
    rating: 4.8,
    reviews: 205000,
    hours: 48,
    lectures: 540,
    badge: 'Highest Rated'
  },
  {
    id: 'c-5',
    title: 'Mastering TypeScript 2025 Edition',
    instructor: 'Jane Doe',
    price: 15.99,
    image: '/globe.svg',
    rating: 4.6,
    reviews: 24000,
    hours: 19,
    lectures: 210
  },
  {
    id: 'c-6',
    title: 'Docker & Kubernetes: The Practical Guide',
    instructor: 'Academind',
    price: 17.99,
    image: '/globe.svg',
    rating: 4.7,
    reviews: 74000,
    hours: 23,
    lectures: 165
  },
];

export const benefits: Benefit[] = [
  { id: "pace", title: "Learn at your own pace", description: "Enjoy lifetime access to courses on the platform." },
  { id: "experts", title: "Industry experts", description: "Select from top instructors around the world." },
  { id: "budget", title: "For every budget", description: "Choose courses starting at $14.99 with frequent discounts." },
];

export const popularTags = ["Python", "Excel", "Web Development", "JavaScript", "Data Science"];

export const companyLogos: { id: string; name: string; logo: string }[] = [
  { id: 'c1', name: 'Company 1', logo: '/vercel.svg' },
  { id: 'c2', name: 'Company 2', logo: '/next.svg' },
  { id: 'c3', name: 'Company 3', logo: '/vercel.svg' },
  { id: 'c4', name: 'Company 4', logo: '/next.svg' },
  { id: 'c5', name: 'Company 5', logo: '/vercel.svg' },
];

export const topicsByCategory: { category: string; topics: string[] }[] = [
  { category: 'Development', topics: ['Python', 'React', 'Java', 'C#', 'Node.js', 'Angular'] },
  { category: 'Business', topics: ['Project Management', 'Leadership', 'Business Strategy', 'Communication'] },
  { category: 'IT & Software', topics: ['AWS', 'Linux', 'Cybersecurity', 'Azure'] },
  { category: 'Design', topics: ['UI/UX', 'Figma', 'Graphic Design', '3D Modeling'] },
];
