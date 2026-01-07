import DashboardLayout from '@/components/layout/DashboardLayout';
import { TakeoverHistoryPanel } from '@/components/takeover/TakeoverHistoryPanel';

export default function TakeoverHistory() {
  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold">Histórico de Takeovers</h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe todas as intervenções humanas nas conversas do agente IA
          </p>
        </div>

        <TakeoverHistoryPanel />
      </div>
    </DashboardLayout>
  );
}
