import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
        </div>

        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <h1 className="text-3xl font-bold mb-2">Termos de Serviço</h1>
          <p className="text-muted-foreground mb-8">Última atualização: 21 de dezembro de 2025</p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">1. Aceitação dos Termos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Ao acessar ou usar a plataforma AgendaClin, você concorda em cumprir estes Termos de Serviço. 
              Se você não concordar com qualquer parte destes termos, não poderá acessar ou usar nossos serviços.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">2. Descrição do Serviço</h2>
            <p className="text-muted-foreground leading-relaxed">
              A AgendaClin é uma plataforma de gestão de agendamentos para clínicas e consultórios médicos que oferece:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-4">
              <li>Sistema de agendamento online de consultas</li>
              <li>Gestão de pacientes e profissionais</li>
              <li>Envio automático de lembretes via WhatsApp</li>
              <li>Integração com Google Agenda</li>
              <li>Gestão de lista de espera</li>
              <li>Atendimento automatizado por inteligência artificial</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">3. Registro e Conta</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Para usar nossos serviços, você deve:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Criar uma conta fornecendo informações precisas e completas</li>
              <li>Manter a segurança de sua senha e conta</li>
              <li>Notificar-nos imediatamente sobre qualquer uso não autorizado</li>
              <li>Ser responsável por todas as atividades realizadas em sua conta</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">4. Uso Aceitável</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Você concorda em não:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Usar o serviço para fins ilegais ou não autorizados</li>
              <li>Violar qualquer lei local, estadual, nacional ou internacional</li>
              <li>Transmitir vírus, malware ou código malicioso</li>
              <li>Tentar acessar dados de outros usuários sem autorização</li>
              <li>Interferir ou interromper o funcionamento do serviço</li>
              <li>Usar o serviço para enviar spam ou comunicações não solicitadas</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">5. Dados e Privacidade</h2>
            <p className="text-muted-foreground leading-relaxed">
              O uso de dados pessoais é regido por nossa Política de Privacidade. Ao usar nossos serviços, 
              você concorda com a coleta e uso de informações conforme descrito na Política de Privacidade.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">6. Integrações de Terceiros</h2>
            <p className="text-muted-foreground leading-relaxed">
              Nosso serviço pode integrar-se com serviços de terceiros (Google Agenda, WhatsApp). 
              O uso dessas integrações está sujeito aos termos de serviço dos respectivos provedores. 
              Não somos responsáveis pelo funcionamento ou disponibilidade desses serviços externos.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">7. Propriedade Intelectual</h2>
            <p className="text-muted-foreground leading-relaxed">
              Todo o conteúdo, design, código e funcionalidades da plataforma AgendaClin são de nossa 
              propriedade ou licenciados para nós. Você não pode copiar, modificar, distribuir ou criar 
              obras derivadas sem nossa autorização expressa por escrito.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">8. Limitação de Responsabilidade</h2>
            <p className="text-muted-foreground leading-relaxed">
              Na extensão máxima permitida por lei, a AgendaClin não será responsável por:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-4">
              <li>Danos indiretos, incidentais ou consequenciais</li>
              <li>Perda de dados, lucros ou oportunidades de negócio</li>
              <li>Interrupções no serviço ou falhas técnicas</li>
              <li>Ações de terceiros ou integrações externas</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">9. Disponibilidade do Serviço</h2>
            <p className="text-muted-foreground leading-relaxed">
              Nos esforçamos para manter o serviço disponível 24 horas por dia, 7 dias por semana. 
              No entanto, não garantimos disponibilidade ininterrupta e podemos realizar manutenções 
              programadas ou emergenciais quando necessário.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">10. Cancelamento e Encerramento</h2>
            <p className="text-muted-foreground leading-relaxed">
              Você pode cancelar sua conta a qualquer momento. Reservamo-nos o direito de suspender 
              ou encerrar contas que violem estes termos, sem aviso prévio.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">11. Alterações nos Termos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Podemos modificar estes termos a qualquer momento. Alterações significativas serão 
              comunicadas por e-mail ou através de aviso na plataforma. O uso continuado após as 
              alterações constitui aceitação dos novos termos.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">12. Lei Aplicável</h2>
            <p className="text-muted-foreground leading-relaxed">
              Estes Termos de Serviço são regidos pelas leis da República Federativa do Brasil. 
              Qualquer disputa será resolvida nos tribunais competentes da comarca de São Paulo, SP.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">13. Contato</h2>
            <p className="text-muted-foreground leading-relaxed">
              Para dúvidas sobre estes Termos de Serviço, entre em contato:
            </p>
            <p className="text-muted-foreground mt-4">
              <strong>E-mail:</strong> suporte@agendaclin.com<br />
              <strong>Empresa:</strong> AgendaClin LTDA
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
