import { Shield, Lock, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function SecurityBadges() {
  return (
    <div className="flex flex-wrap gap-3 items-center justify-center">
      <Badge variant="outline" className="gap-2 px-3 py-1.5">
        <Shield className="h-4 w-4" />
        SSL/TLS Encrypted
      </Badge>
      <Badge variant="outline" className="gap-2 px-3 py-1.5">
        <Lock className="h-4 w-4" />
        AES-256 Encryption
      </Badge>
      <Badge variant="outline" className="gap-2 px-3 py-1.5">
        <CheckCircle2 className="h-4 w-4" />
        Secure Backups
      </Badge>
    </div>
  );
}




