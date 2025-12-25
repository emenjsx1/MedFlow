import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Building2, 
  MessageSquare, 
  Users, 
  Calendar, 
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  content: React.ReactNode;
}

interface OnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

export default function OnboardingModal({ open, onOpenChange, onComplete }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Bem-vindo ao AgendaClin! 🎉',
      description: 'Vamos configurar sua clínica em poucos passos',
      icon: Sparkles,
      content: (
        <div className="text-center py-6 space-y-4">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          <p className="text-muted-foreground max-w-md mx-auto">
            O AgendaClin vai automatizar suas confirmações de consulta via WhatsApp, 
            reduzir faltas e preencher buracos na agenda automaticamente.
          </p>
          <div className="grid grid-cols-3 gap-4 pt-4">
            <div className="p-4 bg-success/10 rounded-lg text-center">
              <p className="text-2xl font-bold text-success">-40%</p>
              <p className="text-xs text-muted-foreground">Faltas</p>
            </div>
            <div className="p-4 bg-primary/10 rounded-lg text-center">
              <p className="text-2xl font-bold text-primary">+25%</p>
              <p className="text-xs text-muted-foreground">Produtividade</p>
            </div>
            <div className="p-4 bg-accent/10 rounded-lg text-center">
              <p className="text-2xl font-bold text-accent">24/7</p>
              <p className="text-xs text-muted-foreground">Automação</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'clinic',
      title: 'Configure sua Clínica',
      description: 'Informações básicas do seu negócio',
      icon: Building2,
      content: (
        <div className="space-y-4 py-4">
          <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
            <Building2 className="w-8 h-8 text-primary mt-1" />
            <div>
              <h4 className="font-medium">Dados da Clínica</h4>
              <p className="text-sm text-muted-foreground">
                Vá em <strong>Configurações</strong> para definir:
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside mt-2 space-y-1">
                <li>Nome da clínica</li>
                <li>Endereço e telefone</li>
                <li>Horário de funcionamento</li>
                <li>Dias de atendimento</li>
              </ul>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
            <Calendar className="w-8 h-8 text-success mt-1" />
            <div>
              <h4 className="font-medium">Google Calendar (Opcional)</h4>
              <p className="text-sm text-muted-foreground">
                Conecte seu calendário para sincronizar agendamentos automaticamente.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'whatsapp',
      title: 'Conecte o WhatsApp',
      description: 'Automatize confirmações e lembretes',
      icon: MessageSquare,
      content: (
        <div className="space-y-4 py-4">
          <div className="flex items-start gap-4 p-4 bg-success/10 rounded-lg border border-success/20">
            <MessageSquare className="w-8 h-8 text-success mt-1" />
            <div>
              <h4 className="font-medium">Integração WhatsApp</h4>
              <p className="text-sm text-muted-foreground">
                Use a Evolution API para conectar seu WhatsApp.
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="font-medium">Como conectar:</h4>
            <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-2">
              <li>Vá em <strong>Configurações → WhatsApp</strong></li>
              <li>Clique em <strong>"Gerar QR Code"</strong></li>
              <li>Escaneie o código com seu WhatsApp</li>
              <li>Aguarde a conexão ser estabelecida</li>
            </ol>
          </div>
          <div className="p-4 bg-warning/10 rounded-lg border border-warning/20">
            <p className="text-sm text-warning-foreground">
              ⚠️ <strong>Importante:</strong> Use um número dedicado para a clínica, não seu número pessoal.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'professionals',
      title: 'Adicione Profissionais',
      description: 'Cadastre médicos e especialistas',
      icon: Users,
      content: (
        <div className="space-y-4 py-4">
          <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
            <Users className="w-8 h-8 text-primary mt-1" />
            <div>
              <h4 className="font-medium">Equipe Médica</h4>
              <p className="text-sm text-muted-foreground">
                Cadastre cada profissional com:
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside mt-2 space-y-1">
                <li>Nome completo</li>
                <li>Especialidade</li>
                <li>Horário de atendimento individual</li>
                <li>Duração padrão de consulta</li>
              </ul>
            </div>
          </div>
          <div className="p-4 bg-primary/10 rounded-lg">
            <p className="text-sm">
              💡 <strong>Dica:</strong> Você pode ter horários diferentes para cada profissional. 
              Por exemplo, Dr. João atende de 8h às 12h, Dra. Maria de 14h às 18h.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'complete',
      title: 'Tudo Pronto! 🚀',
      description: 'Sua clínica está configurada',
      icon: CheckCircle2,
      content: (
        <div className="text-center py-6 space-y-4">
          <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-success" />
          </div>
          <p className="text-muted-foreground max-w-md mx-auto">
            Agora você pode começar a usar o AgendaClin! 
            Adicione seus primeiros pacientes e agendamentos.
          </p>
          <div className="grid grid-cols-2 gap-4 pt-4 max-w-sm mx-auto">
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <Calendar className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">Dashboard</p>
              <p className="text-xs text-muted-foreground">Veja consultas do dia</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">Pacientes</p>
              <p className="text-xs text-muted-foreground">Gerencie cadastros</p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;
  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              isLastStep ? "bg-success/10" : "bg-primary/10"
            )}>
              <currentStepData.icon className={cn(
                "w-5 h-5",
                isLastStep ? "text-success" : "text-primary"
              )} />
            </div>
            <div>
              <DialogTitle>{currentStepData.title}</DialogTitle>
              <DialogDescription>{currentStepData.description}</DialogDescription>
            </div>
          </div>
          <Progress value={progress} className="h-1" />
        </DialogHeader>

        <div className="min-h-[280px]">
          {currentStepData.content}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex gap-2">
            {!isFirstStep && (
              <Button variant="ghost" onClick={handlePrev}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {!isLastStep && (
              <Button variant="ghost" onClick={handleSkip}>
                Pular tutorial
              </Button>
            )}
            <Button onClick={handleNext}>
              {isLastStep ? (
                'Começar a usar'
              ) : (
                <>
                  Próximo
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Step indicators */}
        <div className="flex justify-center gap-2 pt-2">
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                index === currentStep 
                  ? "bg-primary w-6" 
                  : index < currentStep 
                    ? "bg-primary/50" 
                    : "bg-muted"
              )}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
