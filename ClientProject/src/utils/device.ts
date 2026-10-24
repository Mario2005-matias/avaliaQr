export function getDeviceId(): string {
  let deviceId = localStorage.getItem("avalia_qr_device_id");
  
  if (!deviceId) {
    // Gera um UUID v4 simples se não existir
    deviceId = crypto.randomUUID();
    localStorage.setItem("avalia_qr_device_id", deviceId);
  }
  
  return deviceId;
}