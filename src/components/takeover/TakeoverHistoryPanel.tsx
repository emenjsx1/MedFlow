import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  User,
  Clock,
  MessageSquare,
  CheckCircle,
  XCircle,
  ArrowRight,
  Timer,
  Loader2,
  History,
  RefreshCw,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface TakeoverRecord {
  id: string;
  patient_phone: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  outcome: string | null;
  notes: string | null;
  messages_during_takeover: number;
  patient?: { name: string } | null;
}

const outcomeConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  resolved: { label: 'Resolvido', icon: CheckCircle, color: 'bg-green-500/10 text-green-600 border-green-500/30' },
  escalated: { label: 'Escalado', icon: ArrowRight, color: 'bg-amber-500/10 text-amber-600 border-amber-500/30' },
  transferred_back_to_ai: { label: 'Devolvido à IA', icon: RefreshCw, color: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
  timeout: { label: 'Timeout', icon: Timer, color: 'bg-gray-500/10 text-gray-600 border-gray-500/30' },
};

export function TakeoverHistoryPanel() {
  const { tenantId } = useAuth();
  const [records, setRecords] = useState<TakeoverRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = async () => {
    if (!tenantId) return;
    
    try {
      const { data, error } = await supabase
        .from('takeover_history')
        .select(`
          *,
          patient:patients!takeover_history_patient_id_fkey(name)
        `)
        .eq('tenant_id', tenantId)
        .order('started_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error('Error loading takeover history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [tenantId]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadHistory();
  };

  // Calculate stats
  const stats = {
    total: records.length,
    resolved: records.filter(r => r.outcome === 'resolved').length,
    avgDuration: records.filter(r => r.duration_minutes).reduce((acc, r) => acc + (r.duration_minutes || 0), 0) / (records.filter(r => r.duration_minutes).length || 1),
    avgMessages: records.reduce((acc, r) => acc + r.messages_during_takeover, 0) / (records.length || 1),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-primary" />
            <div>
              <p className="text-lg font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <div>
              <p className="text-lg font-bold">{stats.resolved}</p>
              <p className="text-xs text-muted-foreground">Resolvidos</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            <div>
              <p className="text-lg font-bold">{Math.round(stats.avgDuration)}m</p>
              <p className="text-xs text-muted-foreground">Média</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-amber-500" />
            <div>
              <p className="text-lg font-bold">{Math.round(stats.avgMessages)}</p>
              <p className="text-xs text-muted-foreground">Msgs/Takeover</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Histórico Recente</h3>
        <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
        </Button>
      </div>

      {/* Records List */}
      <ScrollArea className="h-[400px]">
        {records.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p>Nenhum takeover registrado ainda</p>
          </div>
        ) : (
          <div className="space-y-3">
            {records.map(record => {
              const outcome = record.outcome ? outcomeConfig[record.outcome] : null;
              const OutcomeIcon = outcome?.icon || Clock;
              
              return (
                <Card key={record.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                        <User className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {record.patient?.name || record.patient_phone}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(record.started_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                        
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          {record.duration_minutes && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {record.duration_minutes}min
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {record.messages_during_takeover} msgs
                          </span>
                        </div>
                        
                        {record.notes && (
                          <p className="text-sm text-muted-foreground mt-2 italic">
                            "{record.notes}"
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      {outcome ? (
                        <Badge variant="outline" className={cn("gap-1", outcome.color)}>
                          <OutcomeIcon className="w-3 h-3" />
                          {outcome.label}
                        </Badge>
                      ) : record.ended_at ? (
                        <Badge variant="outline">Finalizado</Badge>
                      ) : (
                        <Badge variant="default" className="gap-1 animate-pulse">
                          <Clock className="w-3 h-3" />
                          Em andamento
                        </Badge>
                      )}
                      
                      {!record.ended_at && (
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(record.started_at), { locale: ptBR, addSuffix: true })}
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
