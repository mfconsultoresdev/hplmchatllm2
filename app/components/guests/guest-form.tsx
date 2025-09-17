
'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { User, Phone, MapPin, FileText, Crown } from 'lucide-react'
import { toast } from 'react-hot-toast'

const guestSchema = z.object({
  first_name: z.string().min(1, 'Nombre es requerido'),
  last_name: z.string().min(1, 'Apellido es requerido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  document_type: z.enum(['ID', 'PASSPORT', 'DRIVER_LICENSE']).optional(),
  document_number: z.string().optional(),
  nationality: z.string().optional(),
  date_of_birth: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  postal_code: z.string().optional(),
  vip_status: z.boolean().default(false),
  notes: z.string().optional(),
})

type GuestFormData = z.infer<typeof guestSchema>

interface Guest {
  id: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  document_type?: string
  document_number?: string
  nationality?: string
  date_of_birth?: string
  address?: string
  city?: string
  country?: string
  postal_code?: string
  vip_status: boolean
  notes?: string
}

interface Props {
  guest?: Guest | null
  onSuccess: () => void
}

export default function GuestForm({ guest, onSuccess }: Props) {
  const [submitting, setSubmitting] = useState(false)
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<GuestFormData>({
    resolver: zodResolver(guestSchema),
    defaultValues: {
      vip_status: false,
      ...(guest && {
        first_name: guest.first_name,
        last_name: guest.last_name,
        email: guest.email,
        phone: guest.phone,
        document_type: guest.document_type as 'ID' | 'PASSPORT' | 'DRIVER_LICENSE' | undefined,
        document_number: guest.document_number,
        nationality: guest.nationality,
        date_of_birth: guest.date_of_birth,
        address: guest.address,
        city: guest.city,
        country: guest.country,
        postal_code: guest.postal_code,
        vip_status: guest.vip_status,
        notes: guest.notes,
      })
    }
  })

  const vipStatus = watch('vip_status')

  // Set form values when guest prop changes
  useEffect(() => {
    if (guest) {
      Object.entries(guest).forEach(([key, value]) => {
        if (key === 'date_of_birth' && value) {
          // Convert date to YYYY-MM-DD format
          const date = new Date(value)
          setValue(key as keyof GuestFormData, date.toISOString().split('T')[0])
        } else {
          setValue(key as keyof GuestFormData, value as any)
        }
      })
    }
  }, [guest, setValue])

  const onSubmit = async (data: GuestFormData) => {
    try {
      setSubmitting(true)
      
      // Clean up empty strings
      const cleanedData = Object.entries(data).reduce((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value
        }
        return acc
      }, {} as any)

      const url = guest ? `/api/guests/${guest.id}` : '/api/guests'
      const method = guest ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanedData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || `Failed to ${guest ? 'update' : 'create'} guest`)
      }

      onSuccess()
    } catch (error: any) {
      console.error('Error submitting guest:', error)
      toast.error(error.message || `Error al ${guest ? 'actualizar' : 'crear'} huésped`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            Información Personal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">Nombre *</Label>
              <Input
                id="first_name"
                {...register('first_name')}
                placeholder="Juan"
              />
              {errors.first_name && (
                <p className="text-sm text-red-500">{errors.first_name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="last_name">Apellido *</Label>
              <Input
                id="last_name"
                {...register('last_name')}
                placeholder="Pérez"
              />
              {errors.last_name && (
                <p className="text-sm text-red-500">{errors.last_name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="date_of_birth">Fecha de Nacimiento</Label>
              <Input
                id="date_of_birth"
                type="date"
                {...register('date_of_birth')}
              />
            </div>

            <div>
              <Label htmlFor="nationality">Nacionalidad</Label>
              <Input
                id="nationality"
                {...register('nationality')}
                placeholder="Ecuatoriana"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Phone className="h-5 w-5 mr-2" />
            Información de Contacto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="juan.perez@email.com"
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                {...register('phone')}
                placeholder="+593 99 123 4567"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Información de Documento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="document_type">Tipo de Documento</Label>
              <Select onValueChange={(value) => setValue('document_type', value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ID">Cédula de Identidad</SelectItem>
                  <SelectItem value="PASSPORT">Pasaporte</SelectItem>
                  <SelectItem value="DRIVER_LICENSE">Licencia de Conducir</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="document_number">Número de Documento</Label>
              <Input
                id="document_number"
                {...register('document_number')}
                placeholder="1234567890"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            Información de Dirección
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="address">Dirección</Label>
              <Input
                id="address"
                {...register('address')}
                placeholder="Av. Principal 123"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">Ciudad</Label>
                <Input
                  id="city"
                  {...register('city')}
                  placeholder="Quito"
                />
              </div>

              <div>
                <Label htmlFor="country">País</Label>
                <Input
                  id="country"
                  {...register('country')}
                  placeholder="Ecuador"
                />
              </div>

              <div>
                <Label htmlFor="postal_code">Código Postal</Label>
                <Input
                  id="postal_code"
                  {...register('postal_code')}
                  placeholder="170501"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Crown className="h-5 w-5 mr-2" />
            Información Adicional
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="vip_status"
              checked={vipStatus}
              onCheckedChange={(checked) => setValue('vip_status', checked)}
            />
            <Label htmlFor="vip_status" className="text-sm font-medium">
              Estado VIP
            </Label>
          </div>

          <div>
            <Label htmlFor="notes">Notas Especiales</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Preferencias del huésped, alergias, etc..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end space-x-4">
        <Button type="submit" disabled={submitting} className="min-w-32">
          {submitting ? 'Guardando...' : guest ? 'Actualizar' : 'Crear Huésped'}
        </Button>
      </div>
    </form>
  )
}
