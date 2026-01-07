import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface TrialExpiredModalProps {
  open: boolean;
}

export function TrialExpiredModal({ open }: TrialExpiredModalProps) {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleGoToPricing = () => {
    // Redirect to landing page pricing section
    window.location.href = '/#pricing';
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <DialogTitle className="text-center text-xl">
            Seu período de teste expirou
          </DialogTitle>
          <DialogDescription className="text-center">
            Seus 3 dias de teste gratuito terminaram. Para continuar usando o AgendaClin, 
            escolha um plano de assinatura.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">O que você perde sem assinar:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>❌ Agendamentos automáticos via IA</li>
              <li>❌ Lembretes via WhatsApp</li>
              <li>❌ Fila de espera inteligente</li>
              <li>❌ Relatórios e métricas</li>
              <li>❌ CRM completo</li>
            </ul>
          </div>
          
          <Button onClick={handleGoToPricing} className="w-full" size="lg">
            <CreditCard className="w-4 h-4 mr-2" />
            Ver Planos e Assinar
          </Button>
          
          <Button variant="ghost" onClick={handleLogout} className="w-full">
            Sair da conta
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}