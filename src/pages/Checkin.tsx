import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2, Clock, MapPin, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Checkin = () => {
  const { appointmentId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  
  const [status, setStatus] = useState<"loading" | "success" | "error" | "expired" | "already_checked">("loading");
  const [appointment, setAppointment] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const performCheckin = async () => {
      if (!appointmentId) {
        setStatus("error");
        setErrorMessage("Link de check-in inválido.");
        return;
      }

      try {
        // Fetch appointment details (public access - no auth required)
        const { data: appointmentData, error: fetchError } = await supabase
          .from("appointments")
          .select("*, tenant_settings:tenant_id(clinic_name, clinic_address)")
          .eq("id", appointmentId)
          .maybeSingle();

        if (fetchError || !appointmentData) {
          console.error("Error fetching appointment:", fetchError);
          setStatus("error");
          setErrorMessage("Consulta não encontrada.");
          return;
        }

        setAppointment(appointmentData);

        // Check if already checked in
        if (appointmentData.checked_in_at) {
          setStatus("already_checked");
          return;
        }

        // Check if appointment is today
        const scheduledDate = new Date(appointmentData.scheduled_at);
        const today = new Date();
        const isToday = 
          scheduledDate.getDate() === today.getDate() &&
          scheduledDate.getMonth() === today.getMonth() &&
          scheduledDate.getFullYear() === today.getFullYear();

        if (!isToday) {
          setStatus("expired");
          setErrorMessage("Este link de check-in só é válido no dia da consulta.");
          return;
        }

        // Check if appointment is in valid status
        if (!["pending", "confirmed"].includes(appointmentData.status)) {
          setStatus("error");
          setErrorMessage("Esta consulta foi cancelada ou já foi realizada.");
          return;
        }

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

    performCheckin();
  }, [appointmentId, token]);

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      date: format(date, "EEEE, dd 'de' MMMM", { locale: ptBR }),
      time: format(date, "HH:mm", { locale: ptBR }),
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-bold">
            {appointment?.tenant_settings?.clinic_name || "Check-in"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {status === "loading" && (
            <div className="flex flex-col items-center py-8 space-y-4">
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
              <p className="text-muted-foreground">Realizando check-in...</p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center py-8 space-y-4">
              <div className="rounded-full bg-green-100 p-4">
                <CheckCircle2 className="h-16 w-16 text-green-600" />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-green-600">Check-in Realizado!</h2>
                <p className="text-muted-foreground">
                  Olá, <span className="font-semibold">{appointment?.patient_name}</span>!
                </p>
                <p className="text-muted-foreground">
                  Sua presença foi registrada. Por favor, aguarde ser chamado(a).
                </p>
              </div>
              
              {appointment && (
                <div className="w-full bg-muted/50 rounded-lg p-4 space-y-3 mt-4">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Horário</p>
                      <p className="font-medium">{formatDateTime(appointment.scheduled_at).time}</p>
                    </div>
                  </div>
                  {appointment.professional_name && (
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Profissional</p>
                        <p className="font-medium">{appointment.professional_name}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {status === "already_checked" && (
            <div className="flex flex-col items-center py-8 space-y-4">
              <div className="rounded-full bg-blue-100 p-4">
                <CheckCircle2 className="h-16 w-16 text-blue-600" />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-blue-600">Check-in Já Realizado</h2>
                <p className="text-muted-foreground">
                  Olá, <span className="font-semibold">{appointment?.patient_name}</span>!
                </p>
                <p className="text-muted-foreground">
                  Seu check-in já foi registrado anteriormente. Por favor, aguarde ser chamado(a).
                </p>
              </div>
            </div>
          )}

          {status === "expired" && (
            <div className="flex flex-col items-center py-8 space-y-4">
              <div className="rounded-full bg-amber-100 p-4">
                <Clock className="h-16 w-16 text-amber-600" />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-amber-600">Link Expirado</h2>
                <p className="text-muted-foreground">{errorMessage}</p>
                {appointment && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Sua consulta está agendada para{" "}
                    <span className="font-semibold">{formatDateTime(appointment.scheduled_at).date}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center py-8 space-y-4">
              <div className="rounded-full bg-red-100 p-4">
                <XCircle className="h-16 w-16 text-red-600" />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-red-600">Erro no Check-in</h2>
                <p className="text-muted-foreground">{errorMessage}</p>
                <p className="text-sm text-muted-foreground mt-4">
                  Por favor, dirija-se à recepção para realizar o check-in manualmente.
                </p>
              </div>
            </div>
          )}

          {appointment?.tenant_settings?.clinic_address && (
            <div className="flex items-start gap-2 text-sm text-muted-foreground border-t pt-4">
              <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
              <p>{appointment.tenant_settings.clinic_address}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Checkin;
