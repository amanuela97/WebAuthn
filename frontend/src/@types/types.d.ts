// types.d.ts
declare global {
  interface Window {
    PasswordCredential: PasswordCredentialConstructor;
    FederatedCredential: unknown;
  }
}

interface PasswordCredentialData {
  id: string;
  password: string;
  name?: string;
  iconURL?: string;
}

interface PasswordCredential extends Credential {
  readonly id: string;
  readonly password: string;
  readonly name?: string;
  readonly iconURL?: string;
}

interface PasswordCredentialConstructor {
  new (data: PasswordCredentialData): PasswordCredential;
}

// Ensure these types are part of the global namespace
export {};
