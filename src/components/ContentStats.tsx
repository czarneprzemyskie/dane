import React, { useMemo } from 'react';
import type { ContentItem } from '../lib/content';
import { FileText, Eye, Edit3, Clock, CheckCircle } from 'lucide-react';

interface ContentStatsProps {
  items: ContentItem[];
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <div className={`stat-card stat-card-${color}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-info">
        <span className="stat-value">{value}</span>
        <span className="stat-label">{label}</span>
      </div>
    </div>
  );
}

export default function ContentStats({ items }: ContentStatsProps) {
  const stats = useMemo(() => {
    const total = items.length;
    const published = items.filter((i) => i.status === 'published').length;
    const drafts = items.filter((i) => i.status === 'draft').length;
    const pendingReview = items.filter((i) => i.status === 'pending_review').length;
    const archived = items.filter((i) => i.status === 'archived').length;

    // Recently updated (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentlyUpdated = items.filter(
      (i) => new Date(i.updated_at) >= sevenDaysAgo
    ).length;

    return {
      total,
      published,
      drafts,
      pendingReview,
      archived,
      recentlyUpdated,
    };
  }, [items]);

  return (
    <div className="content-stats">
      <StatCard
        icon={<FileText size={24} />}
        label="Łącznie treści"
        value={stats.total}
        color="primary"
      />
      <StatCard
        icon={<Eye size={24} />}
        label="Opublikowane"
        value={stats.published}
        color="success"
      />
      <StatCard
        icon={<Edit3 size={24} />}
        label="Szkice"
        value={stats.drafts}
        color="warning"
      />
      <StatCard
        icon={<Clock size={24} />}
        label="Oczekujące na przegląd"
        value={stats.pendingReview}
        color="info"
      />
      <StatCard
        icon={<CheckCircle size={24} />}
        label="Ostatnio zaktualizowane"
        value={stats.recentlyUpdated}
        color="secondary"
      />
      <StatCard
        icon={<FileText size={24} />}
        label="Zarchiwizowane"
        value={stats.archived}
        color="muted"
      />
    </div>
  );
}
