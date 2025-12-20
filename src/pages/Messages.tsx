import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  MessageSquare,
  Send,
  CheckCheck,
  Clock,
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  patientName: string;
  patientPhone: string;
  direction: 'inbound' | 'outbound';
  body: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  appointmentDate?: string;
}

const mockMessages: Message[] = [
  {
    id: '1',
    patientName: 'Maria Silva',
    patientPhone: '(11) 99999-1234',
    direction: 'outbound',
    body: 'Olá Maria! Confirmando sua consulta para amanhã às 09:00. Responda: 1-Confirmar, 2-Cancelar, 3-Reagendar',
    status: 'read',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    appointmentDate: '2024-12-20',
  },
  {
    id: '2',
    patientName: 'Maria Silva',
    patientPhone: '(11) 99999-1234',
    direction: 'inbound',
    body: '1',
    status: 'read',
    timestamp: new Date(Date.now() - 3000000).toISOString(),
  },
  {
    id: '3',
    patientName: 'João Santos',
    patientPhone: '(11) 98888-5678',
    direction: 'outbound',
    body: 'Olá João! Confirmando sua consulta para amanhã às 10:30. Responda: 1-Confirmar, 2-Cancelar, 3-Reagendar',
    status: 'delivered',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    appointmentDate: '2024-12-20',
  },
  {
    id: '4',
    patientName: 'Ana Costa',
    patientPhone: '(11) 97777-9012',
    direction: 'outbound',
    body: 'Olá Ana! Confirmando sua consulta para amanhã às 11:00. Responda: 1-Confirmar, 2-Cancelar, 3-Reagendar',
    status: 'sent',
    timestamp: new Date(Date.now() - 10800000).toISOString(),
    appointmentDate: '2024-12-20',
  },
  {
    id: '5',
    patientName: 'Pedro Ferreira',
    patientPhone: '(11) 96666-3456',
    direction: 'outbound',
    body: 'Olá Pedro! Confirmando sua consulta para amanhã às 14:00. Responda: 1-Confirmar, 2-Cancelar, 3-Reagendar',
    status: 'read',
    timestamp: new Date(Date.now() - 14400000).toISOString(),
    appointmentDate: '2024-12-20',
  },
  {
    id: '6',
    patientName: 'Pedro Ferreira',
    patientPhone: '(11) 96666-3456',
    direction: 'inbound',
    body: '2',
    status: 'read',
    timestamp: new Date(Date.now() - 13800000).toISOString(),
  },
  {
    id: '7',
    patientName: 'Luciana Almeida',
    patientPhone: '(11) 99999-1111',
    direction: 'outbound',
    body: 'Olá Luciana! Surgiu uma vaga para amanhã às 14:00. Deseja agendar? 1-Sim, 2-Não',
    status: 'delivered',
    timestamp: new Date(Date.now() - 12600000).toISOString(),
  },
];

const statusConfig = {
  sent: { label: 'Enviado', icon: Send, className: 'text-muted-foreground' },
  delivered: { label: 'Entregue', icon: CheckCheck, className: 'text-muted-foreground' },
  read: { label: 'Lido', icon: CheckCheck, className: 'text-primary' },
  failed: { label: 'Falhou', icon: AlertCircle, className: 'text-destructive' },
};

export default function Messages() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  // Group messages by patient for conversation view
  const conversations = mockMessages.reduce((acc, msg) => {
    const existing = acc.find((c) => c.patientPhone === msg.patientPhone);
    if (existing) {
      existing.messages.push(msg);
      if (new Date(msg.timestamp) > new Date(existing.lastMessageAt)) {
        existing.lastMessageAt = msg.timestamp;
        existing.lastMessage = msg.body;
      }
    } else {
      acc.push({
        patientName: msg.patientName,
        patientPhone: msg.patientPhone,
        messages: [msg],
        lastMessage: msg.body,
        lastMessageAt: msg.timestamp,
      });
    }
    return acc;
  }, [] as { patientName: string; patientPhone: string; messages: Message[]; lastMessage: string; lastMessageAt: string }[]);

  // Sort by most recent
  conversations.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

  const filteredConversations = conversations.filter(
    (c) =>
      c.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.patientPhone.includes(searchQuery)
  );

  const stats = {
    total: mockMessages.length,
    sent: mockMessages.filter((m) => m.direction === 'outbound').length,
    received: mockMessages.filter((m) => m.direction === 'inbound').length,
    failed: mockMessages.filter((m) => m.status === 'failed').length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Mensagens</h1>
          <p className="text-muted-foreground mt-1">
            Histórico de mensagens enviadas e recebidas
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total hoje</p>
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
              <div className="w-12 h-12 rounded-xl bg-danger/10 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-danger" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.failed}</p>
                <p className="text-sm text-muted-foreground">Falhas</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Messages */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Conversation list */}
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
                {filteredConversations.map((conv) => (
                  <div
                    key={conv.patientPhone}
                    onClick={() => setSelectedMessage(conv.messages[0])}
                    className={cn(
                      'p-4 border-b border-border/50 cursor-pointer transition-colors hover:bg-muted/50',
                      selectedMessage?.patientPhone === conv.patientPhone && 'bg-muted/50'
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
                        <p className="text-sm text-muted-foreground truncate">
                          {conv.lastMessage}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Message detail */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                {selectedMessage ? selectedMessage.patientName : 'Selecione uma conversa'}
              </CardTitle>
              {selectedMessage && (
                <CardDescription>{selectedMessage.patientPhone}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {selectedMessage ? (
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-4">
                    {conversations
                      .find((c) => c.patientPhone === selectedMessage.patientPhone)
                      ?.messages.sort(
                        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                      )
                      .map((msg) => {
                        const StatusIcon = statusConfig[msg.status].icon;
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
                                <span>
                                  {format(new Date(msg.timestamp), 'HH:mm', { locale: ptBR })}
                                </span>
                                {isOutbound && (
                                  <StatusIcon
                                    className={cn('w-3 h-3', statusConfig[msg.status].className)}
                                  />
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
