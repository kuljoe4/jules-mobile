/**
 * Global Persona Storage Helpers
 *
 * To reduce "God Mode" and redundant/broken raw localStorage operations,
 * these functions are delegated to the centralized, safe `SafeStorage` helper service.
 * This ensures strict adherence to Single Responsibility (SRP) and Don't Repeat Yourself (DRY)
 * principles while preserving the existing public interface exactly.
 */

function loadPersonas() {
  return SafeStorage.loadPersonas();
}

function savePersonaPrompt(id, prompt) {
  SafeStorage.savePersonaPrompt(id, prompt);
}

function saveCustomPersona(persona) {
  SafeStorage.saveCustomPersona(persona);
}

function deleteCustomPersona(id) {
  SafeStorage.deleteCustomPersona(id);
}

function resetPersonas() {
  return SafeStorage.resetPersonas();
}
