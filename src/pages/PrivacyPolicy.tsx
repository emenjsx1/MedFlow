import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const PrivacyPolicy = () => {
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
          <h1 className="text-3xl font-bold mb-2">Política de Privacidade</h1>
          <p className="text-muted-foreground mb-8">Última atualização: 21 de dezembro de 2025</p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">1. Introdução</h2>
            <p className="text-muted-foreground leading-relaxed">
              A AgendaClin ("nós", "nosso" ou "nossa") opera a plataforma de gestão de agendamentos para clínicas 
              e consultórios médicos. Esta Política de Privacidade descreve como coletamos, usamos, armazenamos 
              e protegemos suas informações pessoais quando você utiliza nossos serviços.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">2. Informações que Coletamos</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">Coletamos os seguintes tipos de informações:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Informações de Conta:</strong> nome, e-mail, telefone e senha quando você cria uma conta.</li>
              <li><strong>Informações de Pacientes:</strong> nome, telefone, e-mail e histórico de agendamentos dos pacientes cadastrados.</li>
              <li><strong>Dados de Agendamento:</strong> datas, horários, profissionais e status dos compromissos.</li>
              <li><strong>Dados de Integração:</strong> quando você conecta sua conta Google, acessamos informações do Google Agenda para sincronização.</li>
              <li><strong>Dados de Uso:</strong> informações sobre como você interage com nossa plataforma.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">3. Como Usamos suas Informações</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">Utilizamos suas informações para:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Fornecer e manter nossos serviços de agendamento</li>
              <li>Enviar lembretes e confirmações de consultas via WhatsApp</li>
              <li>Sincronizar agendamentos com o Google Agenda</li>
              <li>Melhorar e personalizar sua experiência</li>
              <li>Comunicar atualizações importantes sobre o serviço</li>
              <li>Detectar e prevenir fraudes ou abusos</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">4. Compartilhamento de Dados</h2>
            <p className="text-muted-foreground leading-relaxed">
              Não vendemos suas informações pessoais. Compartilhamos dados apenas com:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-4">
              <li><strong>Provedores de Serviço:</strong> empresas que nos ajudam a operar (hospedagem, comunicação)</li>
              <li><strong>Integrações Autorizadas:</strong> Google Agenda e WhatsApp, quando você autoriza a conexão</li>
              <li><strong>Requisitos Legais:</strong> quando exigido por lei ou ordem judicial</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">5. Segurança dos Dados</h2>
            <p className="text-muted-foreground leading-relaxed">
              Implementamos medidas de segurança técnicas e organizacionais para proteger suas informações, 
              incluindo criptografia de dados em trânsito e em repouso, controles de acesso rigorosos e 
              monitoramento contínuo de segurança.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">6. Seus Direitos</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem direito a:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Acessar seus dados pessoais</li>
              <li>Corrigir dados incompletos ou incorretos</li>
              <li>Solicitar a exclusão de seus dados</li>
              <li>Revogar consentimentos dados anteriormente</li>
              <li>Solicitar a portabilidade de seus dados</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">7. Retenção de Dados</h2>
            <p className="text-muted-foreground leading-relaxed">
              Mantemos suas informações pelo tempo necessário para fornecer nossos serviços ou conforme 
              exigido por lei. Você pode solicitar a exclusão de seus dados a qualquer momento.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">8. Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              Utilizamos cookies essenciais para o funcionamento da plataforma, como manter sua sessão 
              ativa e lembrar suas preferências.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">9. Alterações nesta Política</h2>
            <p className="text-muted-foreground leading-relaxed">
              Podemos atualizar esta política periodicamente. Notificaremos sobre mudanças significativas 
              por e-mail ou através de aviso em nossa plataforma.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">10. Contato</h2>
            <p className="text-muted-foreground leading-relaxed">
              Para dúvidas sobre esta Política de Privacidade ou para exercer seus direitos, entre em contato:
            </p>
            <p className="text-muted-foreground mt-4">
              <strong>E-mail:</strong> privacidade@agendaclin.com<br />
              <strong>Responsável pela Proteção de Dados:</strong> AgendaClin LTDA
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
