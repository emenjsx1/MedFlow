import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  MessageSquare,
  Send,
  CheckCheck,
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  patient_id: string | null;
  direction: 'inbound' | 'outbound';
  body: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  sent_at: string;
  patient?: { name: string; whatsapp: string } | null;
}

const statusConfig = {
  sent: { label: 'Enviado', icon: Send, className: 'text-muted-foreground' },
  delivered: { label: 'Entregue', icon: CheckCheck, className: 'text-muted-foreground' },
  read: { label: 'Lido', icon: CheckCheck, className: 'text-primary' },
  failed: { label: 'Falhou', icon: AlertCircle, className: 'text-destructive' },
};

export default function Messages() {
  const { tenantId } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  useEffect(() => {
    if (tenantId) {
      loadMessages();
    }
  }, [tenantId]);

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`*, patient:patients(name, whatsapp)`)
        .eq('tenant_id', tenantId)
        .order('sent_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group messages by patient
  const conversations = messages.reduce((acc, msg) => {
    const patientKey = msg.patient_id || 'unknown';
    const existing = acc.find((c) => c.patientId === patientKey);
    if (existing) {
      existing.messages.push(msg);
    } else {
      acc.push({
        patientId: patientKey,
        patientName: msg.patient?.name || 'Desconhecido',
        patientPhone: msg.patient?.whatsapp || '',
        messages: [msg],
        lastMessage: msg.body,
        lastMessageAt: msg.sent_at,
      });
    }
    return acc;
  }, [] as { patientId: string; patientName: string; patientPhone: string; messages: Message[]; lastMessage: string; lastMessageAt: string }[]);

  const filteredConversations = conversations.filter(
    (c) =>
      c.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.patientPhone.includes(searchQuery)
  );

  const selectedConversation = conversations.find(c => c.patientId === selectedPatientId);

  const stats = {
    total: messages.length,
    sent: messages.filter((m) => m.direction === 'outbound').length,
    received: messages.filter((m) => m.direction === 'inbound').length,
    failed: messages.filter((m) => m.status === 'failed').length,
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold">Mensagens</h1>
          <p className="text-muted-foreground mt-1">Histórico de mensagens enviadas e recebidas</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <ArrowUpRight className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.sent}</p>
                <p className="text-sm text-muted-foreground">Enviadas</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <ArrowDownLeft className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.received}</p>
                <p className="text-sm text-muted-foreground">Recebidas</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.failed}</p>
                <p className="text-sm text-muted-foreground">Falhas</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Conversas</CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar paciente..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                {filteredConversations.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    Nenhuma conversa encontrada
                  </div>
                ) : (
                  filteredConversations.map((conv) => (
                    <div
                      key={conv.patientId}
                      onClick={() => setSelectedPatientId(conv.patientId)}
                      className={cn(
                        'p-4 border-b border-border/50 cursor-pointer transition-colors hover:bg-muted/50',
                        selectedPatientId === conv.patientId && 'bg-muted/50'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-sm font-medium text-primary">
                            {conv.patientName.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium truncate">{conv.patientName}</p>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(conv.lastMessageAt), 'HH:mm', { locale: ptBR })}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                {selectedConversation ? selectedConversation.patientName : 'Selecione uma conversa'}
              </CardTitle>
              {selectedConversation && (
                <CardDescription>{selectedConversation.patientPhone}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {selectedConversation ? (
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-4">
                    {selectedConversation.messages
                      .sort((a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime())
                      .map((msg) => {
                        const StatusIcon = statusConfig[msg.status || 'sent'].icon;
                        const isOutbound = msg.direction === 'outbound';

                        return (
                          <div
                            key={msg.id}
                            className={cn('flex', isOutbound ? 'justify-end' : 'justify-start')}
                          >
                            <div
                              className={cn(
                                'max-w-[80%] rounded-2xl px-4 py-3',
                                isOutbound
                                  ? 'bg-primary text-primary-foreground rounded-br-md'
                                  : 'bg-muted rounded-bl-md'
                              )}
                            >
                              <p className="text-sm">{msg.body}</p>
                              <div
                                className={cn(
                                  'flex items-center gap-1 mt-1 text-xs',
                                  isOutbound ? 'text-primary-foreground/70' : 'text-muted-foreground'
                                )}
                              >
                                <span>{format(new Date(msg.sent_at), 'HH:mm', { locale: ptBR })}</span>
                                {isOutbound && (
                                  <StatusIcon className={cn('w-3 h-3', statusConfig[msg.status || 'sent'].className)} />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </ScrollArea>
              ) : (
                <div className="h-[500px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>Selecione uma conversa para ver as mensagens</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
