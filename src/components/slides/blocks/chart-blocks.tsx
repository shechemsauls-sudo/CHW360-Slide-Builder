"use client";

import { useId } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import type { SlideTheme } from "~/lib/themes";
import {
  parseChartData,
  toRechartsData,
  getChartColorPalette,
  getChartHeight,
} from "./chart-utils";

export interface ChartBlockProps {
  arg?: string;
  content: string;
  theme: SlideTheme;
  layout: string;
}

function ChartTitle({ title, theme }: { title: string; theme: SlideTheme }) {
  if (!title) return null;
  return (
    <p className="mb-2 text-sm font-semibold" style={{ color: theme.colors.text }}>
      {title}
    </p>
  );
}

function ChartTooltipStyle({ theme }: { theme: SlideTheme }) {
  return {
    contentStyle: {
      backgroundColor: theme.colors.surface,
      border: `1px solid ${theme.colors.accent}30`,
      borderRadius: 8,
      fontSize: 11,
      color: theme.colors.text,
    },
    labelStyle: { color: theme.colors.textMuted, fontWeight: 600 },
  };
}

export function BarChartBlock({ arg, content, theme, layout }: ChartBlockProps) {
  const parsed = parseChartData(arg ?? "", content);
  const data = toRechartsData(parsed);
  const colors = getChartColorPalette(theme, parsed.seriesNames.length);
  const height = getChartHeight(layout);
  const tooltipStyle = ChartTooltipStyle({ theme });

  return (
    <div className="my-5 w-full">
      <ChartTitle title={parsed.title} theme={theme} />
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid stroke={`${theme.colors.textMuted}20`} strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tick={{ fill: theme.colors.textMuted, fontSize: 11 }}
            axisLine={{ stroke: `${theme.colors.textMuted}30` }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: theme.colors.textMuted, fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip {...tooltipStyle} />
          {parsed.seriesNames.map((name, i) => (
            <Bar
              key={name}
              dataKey={name}
              fill={colors[i]}
              radius={[4, 4, 0, 0]}
              fillOpacity={i === 0 ? 0.9 : 0.6}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PieChartBlock({ arg, content, theme, layout }: ChartBlockProps) {
  const parsed = parseChartData(arg ?? "", content);
  const colors = getChartColorPalette(theme, parsed.data.length);
  const height = getChartHeight(layout);

  // Pie uses first value only
  const pieData = parsed.data.map((d, i) => ({
    name: d.label,
    value: d.values[0] ?? 0,
    fill: colors[i % colors.length],
  }));

  const tooltipStyle = ChartTooltipStyle({ theme });

  return (
    <div className="mx-auto my-5 max-w-[65%]">
      <ChartTitle title={parsed.title} theme={theme} />
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={pieData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius="80%"
            innerRadius="30%"
            strokeWidth={2}
            stroke={theme.colors.background}
            label={({ name, percent }) =>
              `${name} ${(percent * 100).toFixed(0)}%`
            }
            labelLine={{ stroke: theme.colors.textMuted, strokeWidth: 1 }}
          >
            {pieData.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip {...tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LineChartBlock({ arg, content, theme, layout }: ChartBlockProps) {
  const parsed = parseChartData(arg ?? "", content);
  const data = toRechartsData(parsed);
  const colors = getChartColorPalette(theme, parsed.seriesNames.length);
  const height = getChartHeight(layout);
  const tooltipStyle = ChartTooltipStyle({ theme });

  return (
    <div className="my-5 w-full">
      <ChartTitle title={parsed.title} theme={theme} />
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid stroke={`${theme.colors.textMuted}20`} strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tick={{ fill: theme.colors.textMuted, fontSize: 11 }}
            axisLine={{ stroke: `${theme.colors.textMuted}30` }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: theme.colors.textMuted, fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip {...tooltipStyle} />
          {parsed.seriesNames.map((name, i) => (
            <Line
              key={name}
              type="monotone"
              dataKey={name}
              stroke={colors[i]}
              strokeWidth={2}
              dot={{ fill: colors[i], r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: colors[i] }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AreaChartBlock({ arg, content, theme, layout }: ChartBlockProps) {
  const uid = useId();
  const parsed = parseChartData(arg ?? "", content);
  const data = toRechartsData(parsed);
  const colors = getChartColorPalette(theme, parsed.seriesNames.length);
  const height = getChartHeight(layout);
  const tooltipStyle = ChartTooltipStyle({ theme });

  return (
    <div className="my-5 w-full">
      <ChartTitle title={parsed.title} theme={theme} />
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <defs>
            {parsed.seriesNames.map((name, i) => (
              <linearGradient key={name} id={`area-grad-${uid}-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors[i]} stopOpacity={0.4} />
                <stop offset="95%" stopColor={colors[i]} stopOpacity={0.05} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid stroke={`${theme.colors.textMuted}20`} strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tick={{ fill: theme.colors.textMuted, fontSize: 11 }}
            axisLine={{ stroke: `${theme.colors.textMuted}30` }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: theme.colors.textMuted, fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip {...tooltipStyle} />
          {parsed.seriesNames.map((name, i) => (
            <Area
              key={name}
              type="monotone"
              dataKey={name}
              stroke={colors[i]}
              strokeWidth={2}
              fill={`url(#area-grad-${uid}-${i})`}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RadarChartBlock({ arg, content, theme, layout }: ChartBlockProps) {
  const parsed = parseChartData(arg ?? "", content);
  const data = toRechartsData(parsed);
  const colors = getChartColorPalette(theme, parsed.seriesNames.length);
  const height = getChartHeight(layout);
  const tooltipStyle = ChartTooltipStyle({ theme });

  return (
    <div className="mx-auto my-3 max-w-[80%]">
      <ChartTitle title={parsed.title} theme={theme} />
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
          <PolarGrid stroke={`${theme.colors.textMuted}25`} />
          <PolarAngleAxis
            dataKey="label"
            tick={{ fill: theme.colors.textMuted, fontSize: 11 }}
            tickLine={false}
          />
          <PolarRadiusAxis
            angle={90}
            tick={false}
            axisLine={false}
          />
          <Tooltip {...tooltipStyle} />
          {parsed.seriesNames.map((name, i) => (
            <Radar
              key={name}
              dataKey={name}
              stroke={colors[i]}
              fill={colors[i]}
              fillOpacity={i === 0 ? 0.25 : 0.1}
              strokeWidth={2}
            />
          ))}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
