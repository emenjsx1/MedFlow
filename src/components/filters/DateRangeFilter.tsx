import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar, X } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// Export DateRange type for use in other components
export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface DateRangeFilterProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  className?: string;
}

const presets = [
  { label: 'Hoje', getValue: () => ({ from: new Date(), to: new Date() }) },
  { label: 'Últimos 7 dias', getValue: () => ({ from: subDays(new Date(), 7), to: new Date() }) },
  { label: 'Últimos 30 dias', getValue: () => ({ from: subDays(new Date(), 30), to: new Date() }) },
  { label: 'Este mês', getValue: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
  { label: 'Esta semana', getValue: () => ({ from: startOfWeek(new Date(), { locale: ptBR }), to: endOfWeek(new Date(), { locale: ptBR }) }) },
];

export function DateRangeFilter({
  dateRange,
  onDateRangeChange,
  className,
}: DateRangeFilterProps) {
  const [open, setOpen] = useState(false);

  const hasFilter = dateRange.from || dateRange.to;

  const handlePreset = (preset: typeof presets[0]) => {
    const range = preset.getValue();
    onDateRangeChange(range);
    setOpen(false);
  };

  const handleClear = () => {
    onDateRangeChange({ from: undefined, to: undefined });
  };

  const handleStartDateChange = (value: string) => {
    const date = value ? new Date(value + 'T00:00:00') : undefined;
    onDateRangeChange({ ...dateRange, from: date });
  };

  const handleEndDateChange = (value: string) => {
    const date = value ? new Date(value + 'T00:00:00') : undefined;
    onDateRangeChange({ ...dateRange, to: date });
  };

  const getDisplayText = () => {
    if (!dateRange.from && !dateRange.to) return 'Filtrar por data';
    if (dateRange.from && dateRange.to) {
      const fromStr = format(dateRange.from, 'yyyy-MM-dd');
      const toStr = format(dateRange.to, 'yyyy-MM-dd');
      if (fromStr === toStr) {
        return format(dateRange.from, 'dd/MM/yyyy', { locale: ptBR });
      }
      return `${format(dateRange.from, 'dd/MM', { locale: ptBR })} - ${format(dateRange.to, 'dd/MM', { locale: ptBR })}`;
    }
    if (dateRange.from) return `A partir de ${format(dateRange.from, 'dd/MM', { locale: ptBR })}`;
    return `Até ${format(dateRange.to!, 'dd/MM', { locale: ptBR })}`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "gap-2 justify-start",
            hasFilter && "border-primary/50 bg-primary/5",
            className
          )}
        >
          <Calendar className="w-4 h-4" />
          <span className="truncate">{getDisplayText()}</span>
          {hasFilter && (
            <X
              className="w-4 h-4 ml-auto hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Atalhos</Label>
            <div className="flex flex-wrap gap-1">
              {presets.map((preset) => (
                <Button
                  key={preset.label}
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => handlePreset(preset)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="startDate" className="text-xs">De</Label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : ''}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endDate" className="text-xs">Até</Label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : ''}
                onChange={(e) => handleEndDateChange(e.target.value)}
                className="h-9"
              />
            </div>
          </div>

          {hasFilter && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground"
              onClick={handleClear}
            >
              <X className="w-4 h-4 mr-2" />
              Limpar filtro
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
