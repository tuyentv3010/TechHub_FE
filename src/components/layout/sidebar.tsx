'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Home,
  BookOpen,
  Users,
  Settings,
  BarChart3,
  Calendar,
  MessageSquare,
  FileText,
} from 'lucide-react';

interface SidebarItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

const sidebarItems: SidebarItem[] = [
  {
    title: 'Trang chủ',
    href: '/dashboard',
    icon: Home,
    description: 'Tổng quan hệ thống',
  },
  {
    title: 'Khóa học',
    href: '/dashboard/courses',
    icon: BookOpen,
    description: 'Quản lý khóa học',
  },
  {
    title: 'Học viên',
    href: '/dashboard/students',
    icon: Users,
    description: 'Quản lý học viên',
  },
  {
    title: 'Lịch học',
    href: '/dashboard/schedule',
    icon: Calendar,
    description: 'Lịch học và sự kiện',
  },
  {
    title: 'Thảo luận',
    href: '/dashboard/discussions',
    icon: MessageSquare,
    description: 'Diễn đàn thảo luận',
  },
  {
    title: 'Báo cáo',
    href: '/dashboard/reports',
    icon: BarChart3,
    description: 'Thống kê và báo cáo',
  },
  {
    title: 'Tài liệu',
    href: '/dashboard/documents',
    icon: FileText,
    description: 'Thư viện tài liệu',
  },
  {
    title: 'Cài đặt',
    href: '/dashboard/settings',
    icon: Settings,
    description: 'Cấu hình hệ thống',
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="pb-12 w-64">
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent hover:text-accent-foreground',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}