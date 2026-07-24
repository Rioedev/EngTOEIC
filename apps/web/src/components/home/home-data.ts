import {
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  Flame,
  Headphones,
  Mic,
  Search,
  Settings,
  SlidersHorizontal,
  Trophy,
  Video,
} from "lucide-react";

export const headerActions = [
  { label: "Thành tựu", icon: Trophy },
  { label: "Lịch học", icon: CalendarDays },
  { label: "Tiến độ", icon: BarChart3 },
  { label: "Tài liệu", icon: BriefcaseBusiness },
];

export const progressCards = [
  {
    eyebrow: "Có gì mới?",
    title: "Cải thiện Shadowing",
    tone: "cyan",
  },
  {
    eyebrow: "Học từ vựng",
    title: "Bộ thẻ đang học: Vật dụng thông thường",
    tone: "gold",
  },
  {
    eyebrow: "Luyện phát âm",
    title: "Bắt đầu với âm /ɪ/ nhé",
    tone: "blue",
  },
];

export const practiceActions = [
  { label: "Luyện phát âm", icon: Mic },
  { label: "Ôn từ vựng", icon: Headphones },
  { label: "Luyện đọc", icon: BookOpen },
  { label: "Xem video", icon: Video },
];

export const rightToolbarActions = [
  { label: "Tìm kiếm", icon: Search },
  { label: "Cài đặt học", icon: Settings },
  { label: "Bài học", icon: BookOpen },
  { label: "Bộ lọc", icon: SlidersHorizontal },
];

export const streakIcon = Flame;
