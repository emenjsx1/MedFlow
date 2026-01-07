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

interface DateRangeFilterProps {
  startDate: string | null;
  endDate: string | null;
  onStartDateChange: (date: string | null) => void;
  onEndDateChange: (date: string | null) => void;
  className?: string;
}

const presets = [
  { label: 'Hoje', getValue: () => ({ start: new Date(), end: new Date() }) },
  { label: 'Últimos 7 dias', getValue: () => ({ start: subDays(new Date(), 7), end: new Date() }) },
  { label: 'Últimos 30 dias', getValue: () => ({ start: subDays(new Date(), 30), end: new Date() }) },
  { label: 'Este mês', getValue: () => ({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) }) },
  { label: 'Esta semana', getValue: () => ({ start: startOfWeek(new Date(), { locale: ptBR }), end: endOfWeek(new Date(), { locale: ptBR }) }) },
];

export function DateRangeFilter({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  className,
}: DateRangeFilterProps) {
  const [open, setOpen] = useState(false);

  const hasFilter = startDate || endDate;

  const handlePreset = (preset: typeof presets[0]) => {
    const { start, end } = preset.getValue();
    onStartDateChange(format(start, 'yyyy-MM-dd'));
    onEndDateChange(format(end, 'yyyy-MM-dd'));
    setOpen(false);
  };

  const handleClear = () => {
    onStartDateChange(null);
    onEndDateChange(null);
  };

  const getDisplayText = () => {
    if (!startDate && !endDate) return 'Filtrar por data';
    if (startDate && endDate) {
      if (startDate === endDate) {
        return format(new Date(startDate + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR });
      }
      return `${format(new Date(startDate + 'T00:00:00'), 'dd/MM', { locale: ptBR })} - ${format(new Date(endDate + 'T00:00:00'), 'dd/MM', { locale: ptBR })}`;
    }
    if (startDate) return `A partir de ${format(new Date(startDate + 'T00:00:00'), 'dd/MM', { locale: ptBR })}`;
    return `Até ${format(new Date(endDate + 'T00:00:00'), 'dd/MM', { locale: ptBR })}`;
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
                value={startDate || ''}
                onChange={(e) => onStartDateChange(e.target.value || null)}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endDate" className="text-xs">Até</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate || ''}
                onChange={(e) => onEndDateChange(e.target.value || null)}
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
