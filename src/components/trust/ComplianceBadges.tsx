import { Badge } from "@/components/ui/badge";
import { FileCheck, ShieldCheck } from "lucide-react";

export function ComplianceBadges() {
  return (
    <div className="flex flex-wrap gap-3 items-center justify-center">
      <Badge variant="secondary" className="gap-2 px-3 py-1.5">
        <FileCheck className="h-4 w-4" />
        LGPD Compliant
      </Badge>
      <Badge variant="secondary" className="gap-2 px-3 py-1.5">
        <ShieldCheck className="h-4 w-4" />
        HIPAA Ready
      </Badge>
      <Badge variant="secondary" className="gap-2 px-3 py-1.5">
        <ShieldCheck className="h-4 w-4" />
        ISO 27001
      </Badge>
    </div>
  );
}




