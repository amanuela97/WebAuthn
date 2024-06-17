export type User = {
  email: string;
  name?: string;
  password?: string;
  isGoogle?: boolean;
};
export type Response = { ok: boolean; message: string };
export type StoreType = {
  IsLoggedIn: boolean;
  account: null | User;
  challenge?: string;
};

export interface PasswordCredentialRequestOptions {
  mediation?: "silent" | "optional" | "required";
}

export interface CustomCredentialRequestOptions
  extends CredentialRequestOptions {
  password?: PasswordCredentialRequestOptions;
}

export const options: CustomCredentialRequestOptions = {
  password: {},
};

export interface PasswordCredential extends Credential {
  readonly id: string;
  readonly password: string;
  readonly name?: string;
  readonly iconURL?: string;
}
