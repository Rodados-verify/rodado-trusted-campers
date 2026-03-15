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
      analisis_precio: {
        Row: {
          analisis: string | null
          comparables: Json | null
          consejo: string | null
          created_at: string | null
          diferencia_porcentaje: number | null
          id: string
          num_comparables: number | null
          precio_medio_mercado: number | null
          precio_recomendado_max: number | null
          precio_recomendado_min: number | null
          solicitud_id: string
          veredicto: string | null
        }
        Insert: {
          analisis?: string | null
          comparables?: Json | null
          consejo?: string | null
          created_at?: string | null
          diferencia_porcentaje?: number | null
          id?: string
          num_comparables?: number | null
          precio_medio_mercado?: number | null
          precio_recomendado_max?: number | null
          precio_recomendado_min?: number | null
          solicitud_id: string
          veredicto?: string | null
        }
        Update: {
          analisis?: string | null
          comparables?: Json | null
          consejo?: string | null
          created_at?: string | null
          diferencia_porcentaje?: number | null
          id?: string
          num_comparables?: number | null
          precio_medio_mercado?: number | null
          precio_recomendado_max?: number | null
          precio_recomendado_min?: number | null
          solicitud_id?: string
          veredicto?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analisis_precio_solicitud_id_fkey"
            columns: ["solicitud_id"]
            isOneToOne: false
            referencedRelation: "solicitudes"
            referencedColumns: ["id"]
          },
        ]
      }
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
      documentos_venta: {
        Row: {
          created_at: string
          datos_comprador: Json | null
          id: string
          solicitud_id: string
          tipo: string
          url_pdf: string
        }
        Insert: {
          created_at?: string
          datos_comprador?: Json | null
          id?: string
          solicitud_id: string
          tipo: string
          url_pdf: string
        }
        Update: {
          created_at?: string
          datos_comprador?: Json | null
          id?: string
          solicitud_id?: string
          tipo?: string
          url_pdf?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_venta_solicitud_id_fkey"
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
      inspeccion_detalle: {
        Row: {
          ac_estado: string | null
          ac_marca: string | null
          ac_tiene: boolean | null
          agua_deposito_grises_l: number | null
          agua_deposito_limpia_l: number | null
          agua_estado: string | null
          bajos_estado: string | null
          bajos_obs: string | null
          banio_completo: boolean | null
          bateria_arranque_estado: string | null
          bateria_arranque_obs: string | null
          bateria_servicio_ah: number | null
          bateria_servicio_anio: number | null
          bateria_servicio_estado: string | null
          bateria_servicio_tipo: string | null
          calefaccion_estado: string | null
          calefaccion_marca: string | null
          calefaccion_tipo: string | null
          calefaccion_webasto_modelo: string | null
          calefaccion_webasto_tiene: boolean | null
          cama_estado: string | null
          cama_fija: boolean | null
          capacidad_deposito_l: number | null
          cargas_embargos: boolean | null
          carroceria_estado: string | null
          carroceria_obs: string | null
          cilindrada: number | null
          cocina_estado: string | null
          cocina_fuegos: number | null
          cocina_horno: boolean | null
          cocina_microondas: boolean | null
          combustible: string | null
          created_at: string
          cristales_estado: string | null
          cristales_obs: string | null
          dinette: boolean | null
          dinette_estado: string | null
          direccion_estado: string | null
          direccion_obs: string | null
          ducha_separada: boolean | null
          electrica_estado: string | null
          electrica_obs: string | null
          escape_estado: string | null
          escape_obs: string | null
          extras_verificados: string[] | null
          foto_34_frontal_url: string | null
          foto_34_trasero_url: string | null
          foto_bajos_url: string | null
          foto_banio_url: string | null
          foto_cama_url: string | null
          foto_cocina_url: string | null
          foto_cuadro_electrico_url: string | null
          foto_dinette_url: string | null
          foto_frontal_url: string | null
          foto_habitaculo_url: string | null
          foto_interior_conduccion_url: string | null
          foto_lateral_der_url: string | null
          foto_lateral_izq_url: string | null
          foto_motor_url: string | null
          foto_neumaticos_url: string | null
          foto_panel_solar_url: string | null
          foto_trasera_url: string | null
          fotos_adicionales_urls: string[] | null
          fotos_desperfectos_urls: string[] | null
          frenos_estado: string | null
          frenos_obs: string | null
          frigorifico_estado: string | null
          frigorifico_tipo: string | null
          gas_estado: string | null
          gas_obs: string | null
          golpes_estado: string | null
          golpes_obs: string | null
          habitaculo_estado: string | null
          habitaculo_obs: string | null
          historial_mantenimiento: string | null
          humedades_estado: string | null
          humedades_obs: string | null
          id: string
          iluminacion_estado: string | null
          inversor_tiene: boolean | null
          inversor_w: number | null
          itv_fecha_caducidad: string | null
          longitud_mm: number | null
          mma_kg: number | null
          motor_estado: string | null
          motor_obs: string | null
          neumaticos_dot: string | null
          neumaticos_estado: string | null
          neumaticos_marca: string | null
          neumaticos_obs: string | null
          neumaticos_profundidad_mm: number | null
          niveles_estado: string | null
          niveles_obs: string | null
          num_propietarios: number | null
          observaciones_generales: string | null
          oxidacion_estado: string | null
          oxidacion_obs: string | null
          panel_solar_estado: string | null
          panel_solar_tiene: boolean | null
          panel_solar_w: number | null
          persianas_estado: string | null
          peso_vacio_kg: number | null
          plazas: number | null
          potencia_cv: number | null
          potencia_kw: number | null
          puntos_destacados: string | null
          puntuacion_general: number | null
          recomendacion: string | null
          repintados_estado: string | null
          repintados_obs: string | null
          sellados_estado: string | null
          sellados_obs: string | null
          solicitud_id: string
          suspension_estado: string | null
          suspension_obs: string | null
          tapiceria_estado: string | null
          tapiceria_obs: string | null
          toldo_estado: string | null
          toldo_tiene: boolean | null
          toldo_tipo: string | null
          toma_220v_estado: string | null
          traccion: string | null
          transmision: string | null
          transmision_mec_estado: string | null
          transmision_mec_obs: string | null
          updated_at: string
          wc_estado: string | null
          wc_tipo: string | null
        }
        Insert: {
          ac_estado?: string | null
          ac_marca?: string | null
          ac_tiene?: boolean | null
          agua_deposito_grises_l?: number | null
          agua_deposito_limpia_l?: number | null
          agua_estado?: string | null
          bajos_estado?: string | null
          bajos_obs?: string | null
          banio_completo?: boolean | null
          bateria_arranque_estado?: string | null
          bateria_arranque_obs?: string | null
          bateria_servicio_ah?: number | null
          bateria_servicio_anio?: number | null
          bateria_servicio_estado?: string | null
          bateria_servicio_tipo?: string | null
          calefaccion_estado?: string | null
          calefaccion_marca?: string | null
          calefaccion_tipo?: string | null
          calefaccion_webasto_modelo?: string | null
          calefaccion_webasto_tiene?: boolean | null
          cama_estado?: string | null
          cama_fija?: boolean | null
          capacidad_deposito_l?: number | null
          cargas_embargos?: boolean | null
          carroceria_estado?: string | null
          carroceria_obs?: string | null
          cilindrada?: number | null
          cocina_estado?: string | null
          cocina_fuegos?: number | null
          cocina_horno?: boolean | null
          cocina_microondas?: boolean | null
          combustible?: string | null
          created_at?: string
          cristales_estado?: string | null
          cristales_obs?: string | null
          dinette?: boolean | null
          dinette_estado?: string | null
          direccion_estado?: string | null
          direccion_obs?: string | null
          ducha_separada?: boolean | null
          electrica_estado?: string | null
          electrica_obs?: string | null
          escape_estado?: string | null
          escape_obs?: string | null
          extras_verificados?: string[] | null
          foto_34_frontal_url?: string | null
          foto_34_trasero_url?: string | null
          foto_bajos_url?: string | null
          foto_banio_url?: string | null
          foto_cama_url?: string | null
          foto_cocina_url?: string | null
          foto_cuadro_electrico_url?: string | null
          foto_dinette_url?: string | null
          foto_frontal_url?: string | null
          foto_habitaculo_url?: string | null
          foto_interior_conduccion_url?: string | null
          foto_lateral_der_url?: string | null
          foto_lateral_izq_url?: string | null
          foto_motor_url?: string | null
          foto_neumaticos_url?: string | null
          foto_panel_solar_url?: string | null
          foto_trasera_url?: string | null
          fotos_adicionales_urls?: string[] | null
          fotos_desperfectos_urls?: string[] | null
          frenos_estado?: string | null
          frenos_obs?: string | null
          frigorifico_estado?: string | null
          frigorifico_tipo?: string | null
          gas_estado?: string | null
          gas_obs?: string | null
          golpes_estado?: string | null
          golpes_obs?: string | null
          habitaculo_estado?: string | null
          habitaculo_obs?: string | null
          historial_mantenimiento?: string | null
          humedades_estado?: string | null
          humedades_obs?: string | null
          id?: string
          iluminacion_estado?: string | null
          inversor_tiene?: boolean | null
          inversor_w?: number | null
          itv_fecha_caducidad?: string | null
          longitud_mm?: number | null
          mma_kg?: number | null
          motor_estado?: string | null
          motor_obs?: string | null
          neumaticos_dot?: string | null
          neumaticos_estado?: string | null
          neumaticos_marca?: string | null
          neumaticos_obs?: string | null
          neumaticos_profundidad_mm?: number | null
          niveles_estado?: string | null
          niveles_obs?: string | null
          num_propietarios?: number | null
          observaciones_generales?: string | null
          oxidacion_estado?: string | null
          oxidacion_obs?: string | null
          panel_solar_estado?: string | null
          panel_solar_tiene?: boolean | null
          panel_solar_w?: number | null
          persianas_estado?: string | null
          peso_vacio_kg?: number | null
          plazas?: number | null
          potencia_cv?: number | null
          potencia_kw?: number | null
          puntos_destacados?: string | null
          puntuacion_general?: number | null
          recomendacion?: string | null
          repintados_estado?: string | null
          repintados_obs?: string | null
          sellados_estado?: string | null
          sellados_obs?: string | null
          solicitud_id: string
          suspension_estado?: string | null
          suspension_obs?: string | null
          tapiceria_estado?: string | null
          tapiceria_obs?: string | null
          toldo_estado?: string | null
          toldo_tiene?: boolean | null
          toldo_tipo?: string | null
          toma_220v_estado?: string | null
          traccion?: string | null
          transmision?: string | null
          transmision_mec_estado?: string | null
          transmision_mec_obs?: string | null
          updated_at?: string
          wc_estado?: string | null
          wc_tipo?: string | null
        }
        Update: {
          ac_estado?: string | null
          ac_marca?: string | null
          ac_tiene?: boolean | null
          agua_deposito_grises_l?: number | null
          agua_deposito_limpia_l?: number | null
          agua_estado?: string | null
          bajos_estado?: string | null
          bajos_obs?: string | null
          banio_completo?: boolean | null
          bateria_arranque_estado?: string | null
          bateria_arranque_obs?: string | null
          bateria_servicio_ah?: number | null
          bateria_servicio_anio?: number | null
          bateria_servicio_estado?: string | null
          bateria_servicio_tipo?: string | null
          calefaccion_estado?: string | null
          calefaccion_marca?: string | null
          calefaccion_tipo?: string | null
          calefaccion_webasto_modelo?: string | null
          calefaccion_webasto_tiene?: boolean | null
          cama_estado?: string | null
          cama_fija?: boolean | null
          capacidad_deposito_l?: number | null
          cargas_embargos?: boolean | null
          carroceria_estado?: string | null
          carroceria_obs?: string | null
          cilindrada?: number | null
          cocina_estado?: string | null
          cocina_fuegos?: number | null
          cocina_horno?: boolean | null
          cocina_microondas?: boolean | null
          combustible?: string | null
          created_at?: string
          cristales_estado?: string | null
          cristales_obs?: string | null
          dinette?: boolean | null
          dinette_estado?: string | null
          direccion_estado?: string | null
          direccion_obs?: string | null
          ducha_separada?: boolean | null
          electrica_estado?: string | null
          electrica_obs?: string | null
          escape_estado?: string | null
          escape_obs?: string | null
          extras_verificados?: string[] | null
          foto_34_frontal_url?: string | null
          foto_34_trasero_url?: string | null
          foto_bajos_url?: string | null
          foto_banio_url?: string | null
          foto_cama_url?: string | null
          foto_cocina_url?: string | null
          foto_cuadro_electrico_url?: string | null
          foto_dinette_url?: string | null
          foto_frontal_url?: string | null
          foto_habitaculo_url?: string | null
          foto_interior_conduccion_url?: string | null
          foto_lateral_der_url?: string | null
          foto_lateral_izq_url?: string | null
          foto_motor_url?: string | null
          foto_neumaticos_url?: string | null
          foto_panel_solar_url?: string | null
          foto_trasera_url?: string | null
          fotos_adicionales_urls?: string[] | null
          fotos_desperfectos_urls?: string[] | null
          frenos_estado?: string | null
          frenos_obs?: string | null
          frigorifico_estado?: string | null
          frigorifico_tipo?: string | null
          gas_estado?: string | null
          gas_obs?: string | null
          golpes_estado?: string | null
          golpes_obs?: string | null
          habitaculo_estado?: string | null
          habitaculo_obs?: string | null
          historial_mantenimiento?: string | null
          humedades_estado?: string | null
          humedades_obs?: string | null
          id?: string
          iluminacion_estado?: string | null
          inversor_tiene?: boolean | null
          inversor_w?: number | null
          itv_fecha_caducidad?: string | null
          longitud_mm?: number | null
          mma_kg?: number | null
          motor_estado?: string | null
          motor_obs?: string | null
          neumaticos_dot?: string | null
          neumaticos_estado?: string | null
          neumaticos_marca?: string | null
          neumaticos_obs?: string | null
          neumaticos_profundidad_mm?: number | null
          niveles_estado?: string | null
          niveles_obs?: string | null
          num_propietarios?: number | null
          observaciones_generales?: string | null
          oxidacion_estado?: string | null
          oxidacion_obs?: string | null
          panel_solar_estado?: string | null
          panel_solar_tiene?: boolean | null
          panel_solar_w?: number | null
          persianas_estado?: string | null
          peso_vacio_kg?: number | null
          plazas?: number | null
          potencia_cv?: number | null
          potencia_kw?: number | null
          puntos_destacados?: string | null
          puntuacion_general?: number | null
          recomendacion?: string | null
          repintados_estado?: string | null
          repintados_obs?: string | null
          sellados_estado?: string | null
          sellados_obs?: string | null
          solicitud_id?: string
          suspension_estado?: string | null
          suspension_obs?: string | null
          tapiceria_estado?: string | null
          tapiceria_obs?: string | null
          toldo_estado?: string | null
          toldo_tiene?: boolean | null
          toldo_tipo?: string | null
          toma_220v_estado?: string | null
          traccion?: string | null
          transmision?: string | null
          transmision_mec_estado?: string | null
          transmision_mec_obs?: string | null
          updated_at?: string
          wc_estado?: string | null
          wc_tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inspeccion_detalle_solicitud_id_fkey"
            columns: ["solicitud_id"]
            isOneToOne: true
            referencedRelation: "solicitudes"
            referencedColumns: ["id"]
          },
        ]
      }
      kit_publicacion: {
        Row: {
          cochesnet_descripcion: string | null
          cochesnet_titulo: string | null
          created_at: string | null
          id: string
          milanuncios_descripcion: string | null
          milanuncios_titulo: string | null
          solicitud_id: string
          wallapop_descripcion: string | null
          wallapop_titulo: string | null
          whatsapp_texto: string | null
        }
        Insert: {
          cochesnet_descripcion?: string | null
          cochesnet_titulo?: string | null
          created_at?: string | null
          id?: string
          milanuncios_descripcion?: string | null
          milanuncios_titulo?: string | null
          solicitud_id: string
          wallapop_descripcion?: string | null
          wallapop_titulo?: string | null
          whatsapp_texto?: string | null
        }
        Update: {
          cochesnet_descripcion?: string | null
          cochesnet_titulo?: string | null
          created_at?: string | null
          id?: string
          milanuncios_descripcion?: string | null
          milanuncios_titulo?: string | null
          solicitud_id?: string
          wallapop_descripcion?: string | null
          wallapop_titulo?: string | null
          whatsapp_texto?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kit_publicacion_solicitud_id_fkey"
            columns: ["solicitud_id"]
            isOneToOne: false
            referencedRelation: "solicitudes"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          created_at: string
          email: string
          id: string
          nombre: string | null
          origen: string | null
          solicitud_id: string
          telefono: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          nombre?: string | null
          origen?: string | null
          solicitud_id: string
          telefono?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          nombre?: string | null
          origen?: string | null
          solicitud_id?: string
          telefono?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_solicitud_id_fkey"
            columns: ["solicitud_id"]
            isOneToOne: false
            referencedRelation: "solicitudes"
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
      delete_solicitud_cascade: {
        Args: { _solicitud_id: string }
        Returns: undefined
      }
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
      is_taller_of_published: { Args: { _taller_id: string }; Returns: boolean }
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
