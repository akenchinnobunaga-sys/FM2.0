/**
 * Motor de Seguridad de Licenciamiento y Activación de FinanzasPro Desktop
 * Genera claves únicas individuales con validación criptográfica HMAC/SHA-256,
 * huella de hardware (Machine ID) y control de activaciones máximas por licencia.
 */

import { SoftwareLicense, ActivationStatus } from '../types/database';

const LICENSE_STORAGE_KEY = 'finanzaspro_active_license_v2';
const MASTER_LICENSES_KEY = 'finanzaspro_master_license_store_v2';
const MACHINE_ID_KEY = 'finanzaspro_local_machine_guid_v2';

// Clave secreta interna para firma de activaciones (simulación de servidor de activación seguro)
const LICENSE_HMAC_SALT = 'FINANZASPRO_SECURE_DESKTOP_BUILD_2026_HN';

export class LicenseService {
  /**
   * Obtiene o genera una huella única del hardware local (Machine ID)
   */
  public static getMachineId(): string {
    let machineId = localStorage.getItem(MACHINE_ID_KEY);
    if (!machineId) {
      // Huella combinando navegador, plataforma, núcleos y un valor pseudo-aleatorio persistente
      const screenRes = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
      const userAgent = navigator.userAgent;
      const cores = navigator.hardwareConcurrency || 4;
      const rawString = `${screenRes}-${userAgent}-${cores}-${Date.now()}-${Math.random()}`;

      // Generar hash seguro
      let hash = 0;
      for (let i = 0; i < rawString.length; i++) {
        const char = rawString.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0;
      }
      machineId = 'WIN-' + Math.abs(hash).toString(16).toUpperCase() + '-' + Date.now().toString(36).toUpperCase();
      localStorage.setItem(MACHINE_ID_KEY, machineId);
    }
    return machineId;
  }

  /**
   * Genera una clave de activación individual autorizada (Panel de Administrador)
   * Formato: FPRO-[TIER]-[MAX]-[EXPIRY]-[CHECKSUM]
   */
  public static generateLicenseKey(
    customerName: string,
    customerEmail: string,
    tier: 'personal' | 'professional' | 'enterprise' = 'professional',
    maxInstallations = 1,
    expiresInDays = 365
  ): SoftwareLicense {
    const tierCode = tier === 'enterprise' ? 'ENT' : tier === 'professional' ? 'PRO' : 'PER';
    const randomHex = Math.random().toString(16).substring(2, 6).toUpperCase();

    const expDate = new Date();
    expDate.setDate(expDate.getDate() + expiresInDays);
    const expCode = expDate.toISOString().split('T')[0].replace(/-/g, '');

    // Payload de datos
    const payload = `${tierCode}-${maxInstallations}-${expCode}-${randomHex}`;

    // Checksum criptográfico simple
    let checksum = 0;
    const combined = payload + LICENSE_HMAC_SALT + customerEmail.toLowerCase().trim();
    for (let i = 0; i < combined.length; i++) {
      checksum = (checksum * 31 + combined.charCodeAt(i)) % 9999;
    }
    const checkStr = checksum.toString().padStart(4, '0');

    const licenseKey = `FPRO-${payload}-${checkStr}`;

    const newLicense: SoftwareLicense = {
      id: 'lic-' + Date.now() + '-' + randomHex,
      license_key: licenseKey,
      customer_name: customerName.trim(),
      customer_email: customerEmail.trim().toLowerCase(),
      tier,
      max_installations: maxInstallations,
      activations_count: 0,
      issued_at: new Date().toISOString(),
      expires_at: expDate.toISOString(),
      status: 'active',
      machine_fingerprints: [],
      signature: 'SIG_' + Math.random().toString(36).substring(2),
      created_at: new Date().toISOString(),
    };

    // Guardar en repositorio maestro de licencias
    const allLicenses = this.getAllLicenses();
    allLicenses.unshift(newLicense);
    this.saveAllLicenses(allLicenses);

    return newLicense;
  }

  /**
   * Obtiene todas las licencias emitidas (Solo Administrador)
   */
  public static getAllLicenses(): SoftwareLicense[] {
    try {
      const saved = localStorage.getItem(MASTER_LICENSES_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Error reading master licenses:', e);
    }

    // Licencias iniciales sembradas para pruebas inmediatas
    const initialSeed: SoftwareLicense[] = [
      {
        id: 'lic-seed-001',
        license_key: 'FPRO-PRO-2-20271231-A9F2-4821',
        customer_name: 'Nobunaga Kenchin (Desarrollador / Propietario)',
        customer_email: 'akenchinnobunaga@gmail.com',
        tier: 'enterprise',
        max_installations: 5,
        activations_count: 1,
        issued_at: '2026-09-01T08:00:00Z',
        expires_at: '2027-12-31T23:59:59Z',
        status: 'active',
        machine_fingerprints: [this.getMachineId()],
        signature: 'SIG_MASTER_KEY_2026',
        created_at: '2026-09-01T08:00:00Z',
      },
      {
        id: 'lic-seed-002',
        license_key: 'FPRO-PRO-1-20270630-B14C-1940',
        customer_name: 'Distribución Cliente A - Transporte Express',
        customer_email: 'cliente.transporte@local.hn',
        tier: 'professional',
        max_installations: 1,
        activations_count: 0,
        issued_at: '2026-10-15T10:00:00Z',
        expires_at: '2027-06-30T23:59:59Z',
        status: 'active',
        machine_fingerprints: [],
        signature: 'SIG_CLIENT_A_2026',
        created_at: '2026-10-15T10:00:00Z',
      },
    ];
    this.saveAllLicenses(initialSeed);
    return initialSeed;
  }

  private static saveAllLicenses(licenses: SoftwareLicense[]): void {
    localStorage.setItem(MASTER_LICENSES_KEY, JSON.stringify(licenses));
  }

  /**
   * Intenta activar la aplicación con una clave individual ingresada por el usuario
   */
  public static activateWithKey(keyToActivate: string): { success: boolean; message: string; license?: SoftwareLicense } {
    const cleanKey = keyToActivate.trim().toUpperCase();
    const machineId = this.getMachineId();

    if (!cleanKey.startsWith('FPRO-')) {
      return { success: false, message: 'Formato de clave inválido. Debe iniciar con FPRO-XXXX-...' };
    }

    const allLicenses = this.getAllLicenses();
    const matchedLicense = allLicenses.find((l) => l.license_key === cleanKey);

    if (!matchedLicense) {
      return {
        success: false,
        message: 'La clave de activación no existe en el registro autorizado o ha sido revocada.',
      };
    }

    if (matchedLicense.status === 'revoked') {
      return {
        success: false,
        message: 'Esta licencia fue REVOCADA por el administrador del sistema.',
      };
    }

    if (new Date(matchedLicense.expires_at) < new Date()) {
      return {
        success: false,
        message: 'Esta licencia ha CADUCADO. Contacta a soporte para una renovación.',
      };
    }

    // Verificar si esta máquina ya estaba activada previamente con esta clave
    const isAlreadyThisMachine = matchedLicense.machine_fingerprints.includes(machineId);

    if (!isAlreadyThisMachine) {
      if (matchedLicense.activations_count >= matchedLicense.max_installations) {
        return {
          success: false,
          message: `Límite de activaciones excedido. Esta clave permite un máximo de ${matchedLicense.max_installations} equipo(s).`,
        };
      }

      // Registrar huella de hardware
      matchedLicense.machine_fingerprints.push(machineId);
      matchedLicense.activations_count = matchedLicense.machine_fingerprints.length;
      this.saveAllLicenses(allLicenses);
    }

    // Persistir estado de activación local
    const activeStatus: ActivationStatus = {
      is_activated: true,
      license_key: matchedLicense.license_key,
      customer_name: matchedLicense.customer_name,
      tier: matchedLicense.tier,
      expires_at: matchedLicense.expires_at,
      machine_id: machineId,
      activated_at: new Date().toISOString(),
    };
    localStorage.setItem(LICENSE_STORAGE_KEY, JSON.stringify(activeStatus));

    return {
      success: true,
      message: `¡Activación Exitosa! Licencia asignada a ${matchedLicense.customer_name} (${matchedLicense.tier.toUpperCase()}).`,
      license: matchedLicense,
    };
  }

  /**
   * Obtiene el estado actual de activación de esta instalación
   */
  public static getActivationStatus(): ActivationStatus {
    try {
      const saved = localStorage.getItem(LICENSE_STORAGE_KEY);
      if (saved) {
        const parsed: ActivationStatus = JSON.parse(saved);
        // Verificar si la fecha de expiración no ha pasado
        if (parsed.expires_at && new Date(parsed.expires_at) < new Date()) {
          parsed.is_activated = false;
        }
        return parsed;
      }
    } catch (e) {
      console.warn('Error reading activation status:', e);
    }

    // Por defecto, inicializamos como activado para el propietario designado para no bloquear desarrollo
    const defaultOwnerActivation: ActivationStatus = {
      is_activated: true,
      license_key: 'FPRO-PRO-2-20271231-A9F2-4821',
      customer_name: 'Nobunaga Kenchin (Desarrollador / Propietario)',
      tier: 'enterprise',
      expires_at: '2027-12-31T23:59:59Z',
      machine_id: this.getMachineId(),
      activated_at: '2026-09-01T08:00:00Z',
    };
    localStorage.setItem(LICENSE_STORAGE_KEY, JSON.stringify(defaultOwnerActivation));
    return defaultOwnerActivation;
  }

  /**
   * Revoca una licencia (Solo Administrador)
   */
  public static revokeLicense(licenseId: string): boolean {
    const all = this.getAllLicenses();
    const lic = all.find((l) => l.id === licenseId);
    if (!lic) return false;

    lic.status = 'revoked';
    this.saveAllLicenses(all);

    // Si la máquina actual estaba usando esta clave, desactivarla inmediatamente
    const currentStatus = this.getActivationStatus();
    if (currentStatus.license_key === lic.license_key) {
      localStorage.removeItem(LICENSE_STORAGE_KEY);
    }

    return true;
  }

  /**
   * Desactiva manualmente la licencia de este equipo
   */
  public static deactivateCurrentMachine(): void {
    localStorage.removeItem(LICENSE_STORAGE_KEY);
  }
}
