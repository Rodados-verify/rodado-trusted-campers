export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      checklist_items: {
        Row: {
          created_at: string
          estado: Database["public"]["Enums"]["checklist_estado"]
          id: string
          item: string
          observacion: string | null
          seccion: string
          solicitud_id: string
        }
        Insert: {
          created_at?: string
          estado?: Database["public"]["Enums"]["checklist_estado"]
          id?: string
          item: string
          observacion?: string | null
          seccion: string
          solicitud_id: string
        }
        Update: {
          created_at?: string
          estado?: Database["public"]["Enums"]["checklist_estado"]
          id?: string
          item?: string
          observacion?: string | null
          seccion?: string
          solicitud_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_items_solicitud_id_fkey"
            columns: ["solicitud_id"]
            isOneToOne: false
            referencedRelation: "solicitudes"
            referencedColumns: ["id"]
          },
        ]
      }
      fichas: {
        Row: {
          activa: boolean
          created_at: string
          descripcion_generada: string | null
          id: string
          incluye_transporte_final: boolean
          precio_final: number | null
          slug: string | null
          solicitud_id: string
        }
        Insert: {
          activa?: boolean
          created_at?: string
          descripcion_generada?: string | null
          id?: string
          incluye_transporte_final?: boolean
          precio_final?: number | null
          slug?: string | null
          solicitud_id: string
        }
        Update: {
          activa?: boolean
          created_at?: string
          descripcion_generada?: string | null
          id?: string
          incluye_transporte_final?: boolean
          precio_final?: number | null
          slug?: string | null
          solicitud_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fichas_solicitud_id_fkey"
            columns: ["solicitud_id"]
            isOneToOne: false
            referencedRelation: "solicitudes"
            referencedColumns: ["id"]
          },
        ]
      }
      fotos_solicitud: {
        Row: {
          created_at: string
          id: string
          solicitud_id: string
          tipo: Database["public"]["Enums"]["foto_tipo"]
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          solicitud_id: string
          tipo?: Database["public"]["Enums"]["foto_tipo"]
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          solicitud_id?: string
          tipo?: Database["public"]["Enums"]["foto_tipo"]
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "fotos_solicitud_solicitud_id_fkey"
            columns: ["solicitud_id"]
            isOneToOne: false
            referencedRelation: "solicitudes"
            referencedColumns: ["id"]
          },
        ]
      }
      informes: {
        Row: {
          borrador: boolean
          created_at: string
          id: string
          observaciones: string | null
          observaciones_generales: string | null
          puntos_positivos: string | null
          solicitud_id: string
          taller_id: string
          url_pdf: string | null
        }
        Insert: {
          borrador?: boolean
          created_at?: string
          id?: string
          observaciones?: string | null
          observaciones_generales?: string | null
          puntos_positivos?: string | null
          solicitud_id: string
          taller_id: string
          url_pdf?: string | null
        }
        Update: {
          borrador?: boolean
          created_at?: string
          id?: string
          observaciones?: string | null
          observaciones_generales?: string | null
          puntos_positivos?: string | null
          solicitud_id?: string
          taller_id?: string
          url_pdf?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "informes_solicitud_id_fkey"
            columns: ["solicitud_id"]
            isOneToOne: false
            referencedRelation: "solicitudes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "informes_taller_id_fkey"
            columns: ["taller_id"]
            isOneToOne: false
            referencedRelation: "talleres"
            referencedColumns: ["id"]
          },
        ]
      }
      solicitudes: {
        Row: {
          anio: number
          created_at: string
          descripcion: string | null
          estado: Database["public"]["Enums"]["solicitud_status"]
          id: string
          incluye_transporte: boolean
          km: number
          marca: string
          modelo: string
          precio_venta: number | null
          provincia: string
          taller_id: string | null
          tipo_vehiculo: string
          vendedor_id: string
        }
        Insert: {
          anio: number
          created_at?: string
          descripcion?: string | null
          estado?: Database["public"]["Enums"]["solicitud_status"]
          id?: string
          incluye_transporte?: boolean
          km: number
          marca: string
          modelo: string
          precio_venta?: number | null
          provincia: string
          taller_id?: string | null
          tipo_vehiculo: string
          vendedor_id: string
        }
        Update: {
          anio?: number
          created_at?: string
          descripcion?: string | null
          estado?: Database["public"]["Enums"]["solicitud_status"]
          id?: string
          incluye_transporte?: boolean
          km?: number
          marca?: string
          modelo?: string
          precio_venta?: number | null
          provincia?: string
          taller_id?: string | null
          tipo_vehiculo?: string
          vendedor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "solicitudes_taller_id_fkey"
            columns: ["taller_id"]
            isOneToOne: false
            referencedRelation: "talleres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      talleres: {
        Row: {
          activo: boolean
          created_at: string
          descripcion: string | null
          direccion: string
          id: string
          nombre_taller: string
          provincia: string
          usuario_id: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          descripcion?: string | null
          direccion: string
          id?: string
          nombre_taller: string
          provincia: string
          usuario_id: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          descripcion?: string | null
          direccion?: string
          id?: string
          nombre_taller?: string
          provincia?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "talleres_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          created_at: string
          email: string
          estado: Database["public"]["Enums"]["user_status"]
          id: string
          nombre: string
          telefono: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          estado?: Database["public"]["Enums"]["user_status"]
          id?: string
          nombre: string
          telefono?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          estado?: Database["public"]["Enums"]["user_status"]
          id?: string
          nombre?: string
          telefono?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_published_solicitud: {
        Args: { _solicitud_id: string }
        Returns: boolean
      }
      is_vendedor_of_published: {
        Args: { _usuario_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "vendedor" | "taller" | "admin"
      checklist_estado: "correcto" | "con_observaciones" | "no_aplica"
      foto_tipo: "original" | "procesada"
      solicitud_status:
        | "pendiente"
        | "asignado"
        | "en_inspeccion"
        | "contenido_generado"
        | "publicado"
      user_status: "pendiente" | "activo" | "rechazado"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["vendedor", "taller", "admin"],
      checklist_estado: ["correcto", "con_observaciones", "no_aplica"],
      foto_tipo: ["original", "procesada"],
      solicitud_status: [
        "pendiente",
        "asignado",
        "en_inspeccion",
        "contenido_generado",
        "publicado",
      ],
      user_status: ["pendiente", "activo", "rechazado"],
    },
  },
} as const
