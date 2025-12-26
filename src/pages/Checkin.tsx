import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Clock, 
  MapPin, 
  User, 
  Calendar,
  Phone,
  Stethoscope,
  Sparkles
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type CheckinStatus = "loading" | "ready" | "confirming" | "success" | "error" | "expired" | "already_checked" | "too_early";

const Checkin = () => {
  const { appointmentId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  
  const [status, setStatus] = useState<CheckinStatus>("loading");
  const [appointment, setAppointment] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadAppointment = async () => {
      if (!appointmentId) {
        setStatus("error");
        setErrorMessage("Link de check-in inválido.");
        return;
      }

      try {
        // Fetch appointment details via public edge function
        const { data, error: fetchError } = await supabase.functions.invoke('get-appointment-checkin', {
          body: { appointmentId }
        });

        if (fetchError || !data?.success || !data?.appointment) {
          console.error("Error fetching appointment:", fetchError || data?.error);
          setStatus("error");
          setErrorMessage("Consulta não encontrada.");
          return;
        }

        const appointmentData = data.appointment;

        setAppointment(appointmentData);

        // Check if already checked in
        if (appointmentData.checked_in_at) {
          setStatus("already_checked");
          return;
        }

        // Check if appointment is within 5 hours (link available 5h before)
        const scheduledDate = new Date(appointmentData.scheduled_at);
        const now = new Date();
        const hoursUntilAppointment = (scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60);

        // If appointment already passed
        if (hoursUntilAppointment < -1) {
          setStatus("expired");
          setErrorMessage("Esta consulta já passou.");
          return;
        }

        // If more than 5 hours until appointment, show "too early" message
        if (hoursUntilAppointment > 5) {
          setStatus("too_early");
          return;
        }

        // Check if appointment is in valid status
        if (!["pending", "confirmed"].includes(appointmentData.status)) {
          setStatus("error");
          setErrorMessage("Esta consulta foi cancelada ou já foi realizada.");
          return;
        }

        // Show appointment details and wait for user to confirm
        setStatus("ready");
      } catch (error) {
        console.error("Check-in error:", error);
        setStatus("error");
        setErrorMessage("Erro inesperado. Por favor, informe a recepção.");
      }
    };

    loadAppointment();
  }, [appointmentId, token]);

  const handleConfirmCheckin = async () => {
    setStatus("confirming");
    
    try {
      // Perform check-in (using service role via edge function for public access)
      const { error: updateError } = await supabase.functions.invoke("process-noshow", {
        body: { 
          action: "checkin", 
          appointmentId: appointmentId 
        }
      });

      if (updateError) {
        console.error("Error performing check-in:", updateError);
        setStatus("error");
        setErrorMessage("Erro ao realizar check-in. Tente novamente.");
        return;
      }

      setStatus("success");
    } catch (error) {
      console.error("Check-in error:", error);
      setStatus("error");
      setErrorMessage("Erro inesperado. Por favor, informe a recepção.");
    }
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      date: format(date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
      time: format(date, "HH:mm", { locale: ptBR }),
      shortDate: format(date, "dd/MM/yyyy", { locale: ptBR }),
    };
  };

  const clinicName = appointment?.tenant_settings?.clinic_name || "Clínica";

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-lg relative z-10">
        {/* Logo/Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Stethoscope className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{clinicName}</h1>
          <p className="text-muted-foreground text-sm mt-1">Sistema de Check-in Digital</p>
        </div>

        <Card className="shadow-2xl border-0 overflow-hidden">
          {/* Loading State */}
          {status === "loading" && (
            <CardContent className="p-8">
              <div className="flex flex-col items-center py-8 space-y-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <Loader2 className="h-10 w-10 text-primary animate-spin" />
                  </div>
                </div>
                <p className="text-muted-foreground font-medium">Carregando informações...</p>
              </div>
            </CardContent>
          )}

          {/* Ready State - Show appointment details with confirm button */}
          {status === "ready" && appointment && (
            <CardContent className="p-0">
              {/* Header with gradient */}
              <div className="bg-gradient-to-r from-primary to-primary/80 p-6 text-primary-foreground">
                <div className="flex items-center gap-3 mb-2">
                  <User className="w-5 h-5" />
                  <span className="text-sm opacity-90">Paciente</span>
                </div>
                <h2 className="text-2xl font-bold">{appointment.patient_name}</h2>
              </div>

              {/* Appointment Details */}
              <div className="p-6 space-y-4">
                <div className="grid gap-4">
                  {/* Date */}
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/50 border border-border/50">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Calendar className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Data da Consulta</p>
                      <p className="font-semibold text-foreground capitalize">
                        {formatDateTime(appointment.scheduled_at).date}
                      </p>
                    </div>
                  </div>

                  {/* Time */}
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/50 border border-border/50">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                      <Clock className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Horário</p>
                      <p className="text-3xl font-bold text-foreground">
                        {formatDateTime(appointment.scheduled_at).time}
                      </p>
                    </div>
                  </div>

                  {/* Professional */}
                  {appointment.professional_name && (
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/50 border border-border/50">
                      <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
                        <Stethoscope className="w-6 h-6 text-success" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground font-medium">Profissional</p>
                        <p className="font-semibold text-foreground">{appointment.professional_name}</p>
                      </div>
                    </div>
                  )}

                  {/* Location */}
                  {appointment.tenant_settings?.clinic_address && (
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/50 border border-border/50">
                      <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
                        <MapPin className="w-6 h-6 text-warning" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground font-medium">Endereço</p>
                        <p className="font-semibold text-foreground">{appointment.tenant_settings.clinic_address}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Button */}
                <div className="pt-4">
                  <Button 
                    onClick={handleConfirmCheckin}
                    size="lg"
                    className="w-full h-14 text-lg font-semibold gap-3 shadow-lg hover:shadow-xl transition-all"
                  >
                    <CheckCircle2 className="w-6 h-6" />
                    Confirmar Presença
                  </Button>
                  <p className="text-center text-xs text-muted-foreground mt-3">
                    Clique para confirmar que você chegou à clínica
                  </p>
                </div>
              </div>
            </CardContent>
          )}

          {/* Confirming State */}
          {status === "confirming" && (
            <CardContent className="p-8">
              <div className="flex flex-col items-center py-8 space-y-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <Loader2 className="h-10 w-10 text-primary animate-spin" />
                  </div>
                </div>
                <p className="text-muted-foreground font-medium">Confirmando presença...</p>
              </div>
            </CardContent>
          )}

          {/* Success State */}
          {status === "success" && appointment && (
            <CardContent className="p-0">
              {/* Success Header */}
              <div className="bg-gradient-to-r from-success to-success/80 p-8 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 mb-4">
                  <CheckCircle2 className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Check-in Realizado!</h2>
                <p className="text-white/90">Sua presença foi confirmada com sucesso</p>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-success/5 border border-success/20">
                  <Sparkles className="w-6 h-6 text-success" />
                  <div>
                    <p className="font-medium text-foreground">Olá, {appointment.patient_name}!</p>
                    <p className="text-sm text-muted-foreground">
                      Por favor, aguarde ser chamado(a) na sala de espera.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-muted/50 text-center">
                    <Clock className="w-6 h-6 text-primary mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Horário</p>
                    <p className="text-xl font-bold">{formatDateTime(appointment.scheduled_at).time}</p>
                  </div>
                  {appointment.professional_name && (
                    <div className="p-4 rounded-xl bg-muted/50 text-center">
                      <User className="w-6 h-6 text-primary mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Profissional</p>
                      <p className="font-semibold truncate">{appointment.professional_name}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          )}

          {/* Already Checked State */}
          {status === "already_checked" && appointment && (
            <CardContent className="p-0">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-8 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 mb-4">
                  <CheckCircle2 className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Check-in Já Realizado</h2>
                <p className="text-white/90">Você já confirmou sua presença</p>
              </div>

              <div className="p-6">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                  <User className="w-6 h-6 text-blue-600" />
                  <div>
                    <p className="font-medium text-foreground">Olá, {appointment.patient_name}!</p>
                    <p className="text-sm text-muted-foreground">
                      Seu check-in foi registrado anteriormente. Aguarde ser chamado(a).
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          )}

          {/* Too Early State */}
          {status === "too_early" && appointment && (
            <CardContent className="p-0">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-8 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 mb-4">
                  <Clock className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Aguarde um Momento</h2>
                <p className="text-white/90">O check-in ainda não está disponível</p>
              </div>

              <div className="p-6 space-y-4">
                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-center">
                    <span className="text-muted-foreground">Sua consulta está agendada para</span>
                    <br />
                    <span className="font-semibold text-foreground capitalize">
                      {formatDateTime(appointment.scheduled_at).date}
                    </span>
                    <br />
                    <span className="text-muted-foreground">às</span>{" "}
                    <span className="font-bold text-xl">{formatDateTime(appointment.scheduled_at).time}</span>
                  </p>
                </div>
                
                <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                  <Clock className="w-6 h-6 text-amber-600 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    O link de check-in ficará disponível <strong className="text-foreground">5 horas antes</strong> da sua consulta. Por favor, volte mais tarde.
                  </p>
                </div>
              </div>
            </CardContent>
          )}

          {/* Expired State */}
          {status === "expired" && appointment && (
            <CardContent className="p-0">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-8 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 mb-4">
                  <Clock className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Link Não Disponível</h2>
                <p className="text-white/90">{errorMessage}</p>
              </div>

              <div className="p-6">
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                  <p className="text-sm text-center">
                    <span className="text-muted-foreground">Sua consulta estava agendada para</span>
                    <br />
                    <span className="font-semibold text-foreground capitalize">
                      {formatDateTime(appointment.scheduled_at).date}
                    </span>
                    <br />
                    <span className="text-muted-foreground">às</span>{" "}
                    <span className="font-bold text-xl">{formatDateTime(appointment.scheduled_at).time}</span>
                  </p>
                </div>
                <p className="text-center text-xs text-muted-foreground mt-4">
                  Por favor, entre em contacto com a recepção.
                </p>
              </div>
            </CardContent>
          )}

          {/* Error State */}
          {status === "error" && (
            <CardContent className="p-0">
              <div className="bg-gradient-to-r from-destructive to-destructive/80 p-8 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 mb-4">
                  <XCircle className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Erro no Check-in</h2>
                <p className="text-white/90">{errorMessage}</p>
              </div>

              <div className="p-6">
                <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20 text-center">
                  <p className="text-sm text-muted-foreground">
                    Por favor, dirija-se à recepção para realizar o check-in manualmente.
                  </p>
                </div>

                {appointment?.tenant_settings?.clinic_phone && (
                  <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    <span>{appointment.tenant_settings.clinic_phone}</span>
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Sistema de agendamento inteligente
        </p>
      </div>
    </div>
  );
};

export default Checkin;
