'use client';

import Link from 'next/link';
import { Ban, VolumeX, ChevronRight } from 'lucide-react';

const settingsItems = [
  {
    href: '/settings/blocked',
    icon: Ban,
    label: 'Nguoi dung da chan',
  },
  {
    href: '/settings/muted',
    icon: VolumeX,
    label: 'Nguoi dung da tat tieng',
  },
];

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <h1 className="mb-6 text-xl font-bold">Cai dat</h1>

      <div className="divide-y rounded-lg border">
        {settingsItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted"
          >
            <item.icon className="size-5 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium">{item.label}</span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </div>
  );
}
