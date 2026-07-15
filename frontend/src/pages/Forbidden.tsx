import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export default function Forbidden() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
          <ShieldAlert className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="text-3xl font-bold">Accès refusé</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          Contactez votre Responsable Magasin si vous pensez qu'il s'agit d'une erreur.
        </p>
        <Button asChild className="mt-6 bg-primary">
          <Link to="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" /> Retour au tableau de bord</Link>
        </Button>
      </div>
    </div>
  );
}