import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiService } from '../services/api';
import { Save, AlertCircle, CheckCircle, Database, Plus, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Schema di validazione per i dati
const saveDataSchema = z.object({
  name: z.string().min(1, 'Il nome è obbligatorio'),
  email: z.string().email('Email non valida').optional().or(z.literal('')),
  phone: z.string().optional(),
  company: z.string().optional(),
  notes: z.string().optional(),
});

type SaveDataForm = z.infer<typeof saveDataSchema>;

export const SaveDataPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [customFields, setCustomFields] = useState<{ key: string; value: string }[]>([]);

  const form = useForm<SaveDataForm>({
    resolver: zodResolver(saveDataSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      company: '',
      notes: '',
    }
  });

  const addCustomField = () => {
    setCustomFields([...customFields, { key: '', value: '' }]);
  };

  const removeCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const updateCustomField = (index: number, field: 'key' | 'value', value: string) => {
    const updatedFields = [...customFields];
    updatedFields[index][field] = value;
    setCustomFields(updatedFields);
  };

  const onSubmit = async (data: SaveDataForm) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Prepara i dati includendo i campi personalizzati
      const dataToSave = {
        ...data,
        customFields: customFields.filter(field => field.key && field.value),
        timestamp: new Date().toISOString()
      };

      const result = await apiService.saveData(dataToSave);
      setSuccess(`Dati salvati con successo nel file: ${result.fileName}`);
      form.reset();
      setCustomFields([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante il salvataggio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Salva Nuovi Dati</h2>
          <p className="text-muted-foreground">
            Inserisci e salva nuovi dati nel sistema
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Inserimento Dati
            </CardTitle>
            <CardDescription>
              Compila il form sottostante per salvare i dati nel sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Success/Error Messages */}
            {success && (
              <Alert className="mb-6">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Campo Nome */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome *</FormLabel>
                      <FormControl>
                        <Input placeholder="Inserisci il nome" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Campo Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@esempio.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Campo Telefono */}
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefono</FormLabel>
                      <FormControl>
                        <Input placeholder="+39 123 456 7890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Campo Azienda */}
                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Azienda</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome dell'azienda" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Campo Note */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Note</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Note aggiuntive..." 
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Campi Personalizzati */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Campi Personalizzati</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addCustomField}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Aggiungi Campo
                    </Button>
                  </div>

                  {customFields.map((field, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        placeholder="Chiave"
                        value={field.key}
                        onChange={(e) => updateCustomField(index, 'key', e.target.value)}
                      />
                      <Input
                        placeholder="Valore"
                        value={field.value}
                        onChange={(e) => updateCustomField(index, 'value', e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCustomField(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Submit Button */}
                <Button type="submit" className="w-full" disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Salvataggio in corso...' : 'Salva Dati'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
