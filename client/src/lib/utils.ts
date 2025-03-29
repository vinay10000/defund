import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return `${amount.toFixed(4)} ETH`;
}

export function formatCompactNumber(num: number) {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(num);
}

export function getInitials(name?: string) {
  if (!name) return 'U';
  
  const parts = name.split(' ');
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function formatDate(date: string | Date) {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function truncateAddress(address?: string, chars = 4) {
  if (!address) return '';
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
}

export function calculatePercentage(value: number, total: number) {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

export function getRandomColor(index: number) {
  const colors = [
    'bg-primary-100 text-primary-700',
    'bg-secondary-100 text-secondary-700',
    'bg-accent-100 text-accent-700',
    'bg-neutral-100 text-neutral-700'
  ];
  
  return colors[index % colors.length];
}

export function getStageColor(stage: string) {
  switch (stage) {
    case 'pre-seed':
      return 'bg-accent-500 text-white';
    case 'seed':
      return 'bg-secondary-500 text-white';
    case 'series-a':
      return 'bg-primary-500 text-white';
    case 'series-b':
      return 'bg-purple-500 text-white';
    case 'series-c':
      return 'bg-indigo-500 text-white';
    default:
      return 'bg-neutral-500 text-white';
  }
}

export function getStatusColor(status: string) {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'failed':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-neutral-100 text-neutral-800';
  }
}

export function getFileIcon(type: string) {
  switch (type) {
    case 'application/pdf':
      return 'ri-file-text-line';
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
    case 'application/vnd.ms-excel':
      return 'ri-file-chart-line';
    case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
    case 'application/vnd.ms-powerpoint':
      return 'ri-file-ppt-line';
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    case 'application/msword':
      return 'ri-file-word-line';
    case 'image/jpeg':
    case 'image/png':
    case 'image/gif':
      return 'ri-image-line';
    default:
      return 'ri-file-line';
  }
}

export function getFileNameFromPath(path: string) {
  return path.split('/').pop() || path;
}
