import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  Search,
  MessageSquare,
  Send,
  CheckCheck,
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Loader2,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

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
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  // Load messages and setup real-time subscription
  useEffect(() => {
    if (tenantId) {
      loadMessages();
      
      // Setup real-time subscription for new messages
      const channel = supabase
        .channel('messages-realtime')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `tenant_id=eq.${tenantId}`,
          },
          async (payload) => {
            console.log('New message received:', payload);
            // Fetch the new message with patient data
            const { data: newMessage, error } = await supabase
              .from('messages')
              .select(`*, patient:patients!left(name, whatsapp)`)
              .eq('id', payload.new.id)
              .single();
            
            if (!error && newMessage) {
              setMessages(prev => [newMessage, ...prev]);
              toast({
                title: 'Nova mensagem',
                description: `${newMessage.direction === 'inbound' ? 'Recebida' : 'Enviada'}: ${newMessage.body.substring(0, 50)}...`,
              });
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [tenantId]);

  const loadMessages = async () => {
    try {
      // Use left join to include messages even without patient_id
      const { data, error } = await supabase
        .from('messages')
        .select(`*, patient:patients!left(name, whatsapp)`)
        .eq('tenant_id', tenantId)
        .order('sent_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      console.log('Messages loaded:', data?.length || 0);
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as mensagens.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadMessages();
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    setSending(true);
    try {
      // Save to database
      const { error: dbError } = await supabase.from('messages').insert({
        tenant_id: tenantId,
        patient_id: selectedPatientId,
        body: newMessage.trim(),
        direction: 'outbound',
        status: 'sent',
      });

      if (dbError) throw dbError;

      // Send via Evolution API
      const { error: sendError } = await supabase.functions.invoke('send-manual-message', {
        body: {
          tenantId,
          patientPhone: selectedConversation.patientPhone,
          message: newMessage.trim(),
        },
      });

      if (sendError) {
        console.error('Error sending via WhatsApp:', sendError);
        // Message is saved but WhatsApp might have failed
        toast({
          title: 'Aviso',
          description: 'Mensagem salva, mas pode haver erro no envio via WhatsApp.',
          variant: 'default',
        });
      } else {
        toast({
          title: 'Sucesso',
          description: 'Mensagem enviada com sucesso.',
        });
      }

      setNewMessage('');
      loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a mensagem.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  // Group messages by patient
  const conversations = messages.reduce((acc, msg) => {
    const patientKey = msg.patient_id || 'unknown';
    const existing = acc.find((c) => c.patientId === patientKey);
    if (existing) {
      existing.messages.push(msg);
    } else {
      // Get patient name - prefer from patient relation, fallback to phone
      const patientName = msg.patient?.name || msg.patient?.whatsapp || 'Sem nome';
      acc.push({
        patientId: patientKey,
        patientName: patientName,
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Mensagens</h1>
            <p className="text-muted-foreground mt-1">Histórico de mensagens enviadas e recebidas</p>
          </div>
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
            Atualizar
          </Button>
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

        {/* Mobile: Show either conversation list OR chat, not both */}
        <div className="lg:hidden">
          {selectedConversation ? (
            /* Mobile Chat View - Full Screen */
            <Card className="flex flex-col h-[calc(100vh-280px)]">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedPatientId(null)}
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-sm font-medium text-primary">
                        {selectedConversation.patientName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <CardTitle className="text-base">{selectedConversation.patientName}</CardTitle>
                      <CardDescription className="text-xs">{selectedConversation.patientPhone}</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-3">
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
                                'max-w-[85%] rounded-2xl px-3 py-2',
                                isOutbound
                                  ? 'bg-primary text-primary-foreground rounded-br-md'
                                  : 'bg-muted rounded-bl-md'
                              )}
                            >
                              <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
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
                
                {/* Mobile Message Input */}
                <div className="border-t border-border p-3">
                  <div className="flex gap-2 items-end">
                    <Textarea
                      placeholder="Digite sua mensagem..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="min-h-[44px] max-h-[120px] resize-none text-sm"
                      rows={1}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sending}
                      size="icon"
                      className="shrink-0 h-11 w-11"
                    >
                      {sending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Mobile Conversation List */
            <Card>
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
                <ScrollArea className="h-[calc(100vh-380px)]">
                  {filteredConversations.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      Nenhuma conversa encontrada
                    </div>
                  ) : (
                    filteredConversations.map((conv) => (
                      <div
                        key={conv.patientId}
                        onClick={() => setSelectedPatientId(conv.patientId)}
                        className="p-4 border-b border-border/50 cursor-pointer transition-colors hover:bg-muted/50 active:bg-muted"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-base font-medium text-primary">
                              {conv.patientName.charAt(0).toUpperCase()}
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
          )}
        </div>

        {/* Desktop: Side by side layout - Chat style */}
        <div className="hidden lg:grid gap-6 lg:grid-cols-3 h-[calc(100vh-320px)]">
          {/* Conversation List */}
          <Card className="lg:col-span-1 flex flex-col overflow-hidden">
            <CardHeader className="pb-3 shrink-0">
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
            <CardContent className="p-0 flex-1 overflow-hidden">
              <ScrollArea className="h-full">
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
                            {conv.patientName.charAt(0).toUpperCase()}
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
                          {conv.patientPhone && (
                            <p className="text-xs text-muted-foreground">{conv.patientPhone}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2 flex flex-col overflow-hidden">
            <CardHeader className="pb-3 shrink-0 border-b">
              {selectedConversation ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-medium text-primary">
                      {selectedConversation.patientName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <CardTitle className="text-lg">{selectedConversation.patientName}</CardTitle>
                    <CardDescription>{selectedConversation.patientPhone}</CardDescription>
                  </div>
                </div>
              ) : (
                <CardTitle className="text-lg text-muted-foreground">Selecione uma conversa</CardTitle>
              )}
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
              {selectedConversation ? (
                <>
                  <ScrollArea className="flex-1 p-4">
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
                                  'max-w-[70%] rounded-2xl px-4 py-3',
                                  isOutbound
                                    ? 'bg-primary text-primary-foreground rounded-br-md'
                                    : 'bg-muted rounded-bl-md'
                                )}
                              >
                                <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
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
                  
                  {/* Message Input */}
                  <div className="border-t p-4 shrink-0">
                    <div className="flex gap-3 items-end">
                      <Textarea
                        placeholder="Digite sua mensagem..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="min-h-[50px] max-h-[120px] resize-none"
                        rows={1}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sending}
                        size="lg"
                        className="shrink-0"
                      >
                        {sending ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Enter para enviar • Shift+Enter para nova linha
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p className="text-lg">Selecione uma conversa</p>
                    <p className="text-sm mt-1">para ver as mensagens</p>
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
