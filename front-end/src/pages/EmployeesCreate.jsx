import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { Button, Card, Sheet, useToast } from '../components/ui';
import AddEmployeeForm from '../components/Employees/AddEmployeeForm';
import { createEmployee } from '../services/employeesApi';

function EmployeesCreate() {
  const toast = useToast();
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);

  const handleCreateEmployee = async (values) => {
    try {
      const employee = await createEmployee(values);
      toast.success(`Employe cree : ${employee.employeeNumber}.`);
      setIsCreateSheetOpen(false);
    } catch (error) {
      toast.error(error.message || "Impossible de creer l'employe.");
      throw error;
    }
  };

  return (
    <>
      <Card
        title="Créer un employé"
        subtitle="Préparez la fiche administrative, contractuelle et de paie du nouvel employé."
        action={(
          <Button type="button" onClick={() => setIsCreateSheetOpen(true)}>
            <UserPlus size={16} />
            Créer un employé
          </Button>
        )}
      >
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ['Identité et contact', 'Coordonnées professionnelles et personnelles.'],
            ['Organisation et contrat', 'Département, poste, statut et dates clés.'],
            ['Paie', 'Salaire, devise, périodicité et mode de paiement.'],
          ].map(([title, description]) => (
            <div key={title} className="rounded-lg border border-border bg-background p-4">
              <h3 className="text-sm font-semibold text-text">{title}</h3>
              <p className="mt-1 text-sm text-muted">{description}</p>
            </div>
          ))}
        </div>
      </Card>

      <Sheet
        open={isCreateSheetOpen}
        onClose={() => setIsCreateSheetOpen(false)}
        title="Créer un employé"
        description="Renseignez les informations nécessaires pour créer la fiche employé."
        size="lg"
        className="max-w-[1080px]"
      >
        <AddEmployeeForm
          embedded
          onSubmit={handleCreateEmployee}
          onCancel={() => setIsCreateSheetOpen(false)}
          submitLabel="Enregistrer l'employé"
        />
      </Sheet>
    </>
  );
}

export default EmployeesCreate;
