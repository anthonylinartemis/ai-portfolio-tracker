'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, LineStyle, LineSeries } from 'lightweight-charts';
import type { IChartApi, ISeriesApi, MouseEventParams } from 'lightweight-charts';
import { Card } from '@/components/ui/Card';
import { TimeframeSelector } from './TimeframeSelector';
import { Spinner } from '@/components/ui/Spinner';
import type { Timeframe } from '@/types';

interface SeriesData {
  label: string;
  color: string;
  data: { date: string; value: number }[];
}

interface PerformanceChartProps {
  series: SeriesData[];
  loading?: boolean;
  title?: string;
  timeframe?: Timeframe;
  onTimeframeChange?: (tf: Timeframe) => void;
}

interface TooltipData {
  x: number;
  y: number;
  date: string;
  values: { label: string; color: string; value: number }[];
}

export function PerformanceChart({
  series,
  loading = false,
  title = 'Performance',
  timeframe = 'ALL',
  onTimeframeChange,
}: PerformanceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesMapRef = useRef<Map<string, ISeriesApi<'Line'>>>(new Map());
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current || series.length === 0 || loading) return;

    // Clean up previous chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }
    seriesMapRef.current.clear();

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#1E2329' },
        textColor: '#848E9C',
        fontFamily: 'Arial, Helvetica, sans-serif',
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      grid: {
        vertLines: { color: '#2B3139' },
        horzLines: { color: '#2B3139' },
      },
      rightPriceScale: {
        borderColor: '#2B3139',
      },
      timeScale: {
        borderColor: '#2B3139',
        timeVisible: false,
      },
      crosshair: {
        vertLine: {
          color: '#3B4149',
          style: LineStyle.Dashed,
        },
        horzLine: {
          color: '#3B4149',
          style: LineStyle.Dashed,
        },
      },
    });

    chartRef.current = chart;

    for (const s of series) {
      const lineSeries = chart.addSeries(LineSeries, {
        color: s.color,
        lineWidth: 2,
        priceFormat: {
          type: 'custom',
          formatter: (price: number) => `$${price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
        },
      });

      const chartData = s.data.map((d) => ({
        time: d.date as string,
        value: d.value,
      }));

      lineSeries.setData(chartData);
      seriesMapRef.current.set(s.label, lineSeries);
    }

    chart.timeScale().fitContent();

    // Crosshair tooltip
    chart.subscribeCrosshairMove((param: MouseEventParams) => {
      if (
        !param.time ||
        !param.point ||
        param.point.x < 0 ||
        param.point.y < 0
      ) {
        setTooltip(null);
        return;
      }

      const values: { label: string; color: string; value: number }[] = [];
      for (const s of series) {
        const seriesApi = seriesMapRef.current.get(s.label);
        if (seriesApi) {
          const data = param.seriesData.get(seriesApi);
          if (data && 'value' in data) {
            values.push({ label: s.label, color: s.color, value: data.value });
          }
        }
      }

      if (values.length > 0) {
        setTooltip({
          x: param.point.x,
          y: param.point.y,
          date: String(param.time),
          values,
        });
      } else {
        setTooltip(null);
      }
    });

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
      seriesMapRef.current.clear();
    };
  }, [series, loading]);

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-lg">{title}</h2>
        {onTimeframeChange && (
          <TimeframeSelector selected={timeframe} onChange={onTimeframeChange} />
        )}
      </div>

      {/* Legend */}
      {series.length > 0 && (
        <div className="flex items-center gap-4 mb-4">
          {series.map((s) => (
            <div key={s.label} className="flex items-center gap-1.5">
              <div
                className="w-3 h-0.5 rounded"
                style={{ backgroundColor: s.color }}
              />
              <span className="text-xs text-[var(--secondary-text)]">{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-[400px]">
          <Spinner />
        </div>
      ) : (
        <div className="relative" onMouseLeave={() => setTooltip(null)}>
          <div ref={chartContainerRef} className="w-full" />
          {tooltip && (
            <div
              className="absolute z-10 pointer-events-none bg-[#1E2329] border border-[#2B3139] rounded-lg px-3 py-2 shadow-lg"
              style={{
                left: tooltip.x + 16,
                top: 8,
              }}
            >
              <p className="text-xs text-[var(--secondary-text)] mb-1">{tooltip.date}</p>
              {tooltip.values.map((v) => (
                <div key={v.label} className="flex items-center gap-2 text-sm">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: v.color }}
                  />
                  <span className="text-[var(--secondary-text)]">{v.label}</span>
                  <span className="font-medium text-[var(--foreground)] ml-auto pl-3">
                    ${v.value.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
