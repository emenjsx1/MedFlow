import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  Plus,
  X,
  Loader2,
  StickyNote,
  Clock,
  User,
  Tag,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface PatientNote {
  id: string;
  note_type: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
  user_id: string;
}

interface Patient {
  id: string;
  name: string;
  whatsapp: string;
  email?: string;
  status?: string;
  pipeline_stage?: string;
  tags?: string[];
  source?: string;
  priority?: number;
  total_appointments?: number;
  last_interaction_at?: string;
}

interface PatientCRMPanelProps {
  patient: Patient;
  onUpdate?: () => void;
}

const statusOptions = [
  { value: 'active', label: 'Ativo', color: 'bg-green-500' },
  { value: 'inactive', label: 'Inativo', color: 'bg-gray-500' },
  { value: 'vip', label: 'VIP', color: 'bg-amber-500' },
  { value: 'churned', label: 'Perdido', color: 'bg-red-500' },
];

const pipelineStages = [
  { value: 'new', label: 'Novo', icon: '🆕' },
  { value: 'contacted', label: 'Contactado', icon: '📞' },
  { value: 'scheduled', label: 'Agendado', icon: '📅' },
  { value: 'attended', label: 'Atendido', icon: '✅' },
  { value: 'follow_up', label: 'Follow-up', icon: '🔄' },
  { value: 'loyal', label: 'Fidelizado', icon: '⭐' },
];

const noteTypes = [
  { value: 'note', label: 'Nota', icon: StickyNote },
  { value: 'call', label: 'Ligação', icon: Phone },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'meeting', label: 'Reunião', icon: Calendar },
];

export function PatientCRMPanel({ patient, onUpdate }: PatientCRMPanelProps) {
  const { tenantId, user } = useAuth();
  const [notes, setNotes] = useState<PatientNote[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [newNoteType, setNewNoteType] = useState('note');
  const [savingNote, setSavingNote] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [updating, setUpdating] = useState(false);
  const [localPatient, setLocalPatient] = useState(patient);

  // Load notes when panel opens
  const loadNotes = async () => {
    if (!tenantId) return;
    setLoadingNotes(true);
    try {
      const { data, error } = await supabase
        .from('patient_notes')
        .select('*')
        .eq('patient_id', patient.id)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setLoadingNotes(false);
    }
  };

  // Save new note
  const handleSaveNote = async () => {
    if (!newNote.trim() || !tenantId || !user) return;
    
    setSavingNote(true);
    try {
      const { error } = await supabase.from('patient_notes').insert({
        tenant_id: tenantId,
        patient_id: patient.id,
        user_id: user.id,
        note_type: newNoteType,
        content: newNote.trim(),
      });
      
      if (error) throw error;
      
      setNewNote('');
      loadNotes();
      toast({ title: 'Nota adicionada' });
    } catch (error) {
      console.error('Error saving note:', error);
      toast({ title: 'Erro ao salvar nota', variant: 'destructive' });
    } finally {
      setSavingNote(false);
    }
  };

  // Update patient field
  const updatePatientField = async (field: string, value: unknown) => {
    if (!tenantId) return;
    
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('patients')
        .update({ [field]: value })
        .eq('id', patient.id);
      
      if (error) throw error;
      
      setLocalPatient(prev => ({ ...prev, [field]: value }));
      onUpdate?.();
      toast({ title: 'Atualizado' });
    } catch (error) {
      console.error('Error updating patient:', error);
      toast({ title: 'Erro ao atualizar', variant: 'destructive' });
    } finally {
      setUpdating(false);
    }
  };

  // Add tag
  const addTag = async () => {
    if (!newTag.trim()) return;
    const currentTags = localPatient.tags || [];
    if (currentTags.includes(newTag.trim())) {
      setNewTag('');
      return;
    }
    await updatePatientField('tags', [...currentTags, newTag.trim()]);
    setNewTag('');
  };

  // Remove tag
  const removeTag = async (tagToRemove: string) => {
    const currentTags = localPatient.tags || [];
    await updatePatientField('tags', currentTags.filter(t => t !== tagToRemove));
  };

  // Load notes on mount
  useState(() => {
    loadNotes();
  });

  const NoteIcon = noteTypes.find(n => n.value === newNoteType)?.icon || StickyNote;

  return (
    <div className="space-y-4">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-2">
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-lg font-bold">{localPatient.total_appointments || 0}</p>
              <p className="text-xs text-muted-foreground">Consultas</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs font-medium">
                {localPatient.last_interaction_at 
                  ? format(new Date(localPatient.last_interaction_at), 'dd/MM', { locale: ptBR })
                  : '-'}
              </p>
              <p className="text-xs text-muted-foreground">Última Interação</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Status & Pipeline */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
          <Select 
            value={localPatient.status || 'active'} 
            onValueChange={(v) => updatePatientField('status', v)}
            disabled={updating}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", opt.color)} />
                    {opt.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Pipeline</label>
          <Select 
            value={localPatient.pipeline_stage || 'new'} 
            onValueChange={(v) => updatePatientField('pipeline_stage', v)}
            disabled={updating}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pipelineStages.map(stage => (
                <SelectItem key={stage.value} value={stage.value}>
                  <span>{stage.icon} {stage.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Priority */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Prioridade</label>
        <div className="flex gap-1">
          {[0, 1, 2].map(p => (
            <Button
              key={p}
              variant={localPatient.priority === p ? "default" : "outline"}
              size="sm"
              onClick={() => updatePatientField('priority', p)}
              disabled={updating}
              className="flex-1"
            >
              {p === 0 ? 'Normal' : p === 1 ? 'Alta' : 'Urgente'}
            </Button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">
          <Tag className="w-3 h-3 inline mr-1" />
          Tags
        </label>
        <div className="flex flex-wrap gap-1 mb-2">
          {(localPatient.tags || []).map(tag => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <X 
                className="w-3 h-3 cursor-pointer hover:text-destructive" 
                onClick={() => removeTag(tag)}
              />
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Nova tag..."
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            className="h-8 text-sm"
            onKeyDown={(e) => e.key === 'Enter' && addTag()}
          />
          <Button size="sm" variant="outline" onClick={addTag} disabled={updating}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Notes Section */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-2 block">
          Notas & Atividades
        </label>
        
        {/* Add Note */}
        <div className="space-y-2 mb-3">
          <div className="flex gap-2">
            {noteTypes.map(type => {
              const Icon = type.icon;
              return (
                <Button
                  key={type.value}
                  variant={newNoteType === type.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setNewNoteType(type.value)}
                  className="flex-1 gap-1"
                >
                  <Icon className="w-3 h-3" />
                  <span className="hidden sm:inline">{type.label}</span>
                </Button>
              );
            })}
          </div>
          <div className="flex gap-2">
            <Textarea
              placeholder="Adicionar nota..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="min-h-[60px] text-sm"
            />
          </div>
          <Button 
            onClick={handleSaveNote} 
            disabled={!newNote.trim() || savingNote}
            size="sm"
            className="w-full"
          >
            {savingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar Nota'}
          </Button>
        </div>

        {/* Notes List */}
        <ScrollArea className="h-[200px]">
          {loadingNotes ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : notes.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-4">
              Nenhuma nota ainda
            </p>
          ) : (
            <div className="space-y-2">
              {notes.map(note => {
                const NoteTypeIcon = noteTypes.find(n => n.value === note.note_type)?.icon || StickyNote;
                return (
                  <Card key={note.id} className="p-3">
                    <div className="flex items-start gap-2">
                      <NoteTypeIcon className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{note.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(note.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
