import {
  BookOpen, Briefcase, Cake, ChefHat, FileSpreadsheet, GraduationCap, Headphones, Landmark,
  Megaphone, Monitor, Package, PenLine, PiggyBank, PlugZap, Scale, Shield, Sparkles, Sun,
  TrendingUp, Zap, type LucideIcon,
} from "lucide-react";

const icons: Record<string, LucideIcon> = {
  "book-open": BookOpen,
  briefcase: Briefcase,
  cake: Cake,
  "chef-hat": ChefHat,
  "file-spreadsheet": FileSpreadsheet,
  "graduation-cap": GraduationCap,
  headphones: Headphones,
  landmark: Landmark,
  megaphone: Megaphone,
  monitor: Monitor,
  package: Package,
  "pen-line": PenLine,
  "piggy-bank": PiggyBank,
  "plug-zap": PlugZap,
  scale: Scale,
  shield: Shield,
  sparkles: Sparkles,
  sun: Sun,
  "trending-up": TrendingUp,
  zap: Zap,
};

export const iconNames = Object.keys(icons);

export function Icon({ name, className }: { name: string; className?: string }) {
  const C = icons[name] ?? Sparkles;
  return <C className={className} aria-hidden />;
}
