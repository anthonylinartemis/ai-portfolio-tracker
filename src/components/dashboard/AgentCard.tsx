'use client';

import Link from 'next/link';
import Image from 'next/image';
import { TrendingUp, TrendingDown, Trophy } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatPercent } from '@/lib/utils';
import type { AgentWithPerformance } from '@/types';

interface AgentCardProps {
  agent: AgentWithPerformance;
}

const rankLabels: Record<number, string> = {
  1: '1st',
  2: '2nd',
  3: '3rd',
  4: '4th',
};

export function AgentCard({ agent }: AgentCardProps) {
  const isPositive = agent.totalReturn >= 0;

  return (
    <Link href={`/portfolio/${agent.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Image
              src={`/logos/${agent.id}.png`}
              alt={agent.name}
              width={40}
              height={40}
              className="rounded-full"
            />
            <div>
              <h3 className="font-semibold text-[var(--foreground)]">{agent.name}</h3>
              <p className="text-xs text-[var(--secondary-text)]">
                Since {agent.inceptionDate}
              </p>
            </div>
          </div>
          {agent.rank === 1 && (
            <Trophy className="h-5 w-5 text-yellow-500" />
          )}
          {agent.rank && agent.rank > 1 && (
            <span className="text-xs font-medium text-[var(--secondary-text)]">
              {rankLabels[agent.rank] || `${agent.rank}th`}
            </span>
          )}
        </div>

        <div className="space-y-2">
          <div>
            <p className="text-2xl font-bold">{formatCurrency(agent.currentValue)}</p>
          </div>
          <div className="flex items-center gap-2">
            {isPositive ? (
              <TrendingUp className="h-4 w-4 text-[var(--positive)]" />
            ) : (
              <TrendingDown className="h-4 w-4 text-[var(--negative)]" />
            )}
            <Badge variant={isPositive ? 'positive' : 'negative'}>
              {formatPercent(agent.totalReturn)}
            </Badge>
          </div>
        </div>
      </Card>
    </Link>
  );
}
