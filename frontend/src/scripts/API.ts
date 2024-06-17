import { CredentialResponse } from "@react-oauth/google";
import { User } from "../types";
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from "@simplewebauthn/types";

type AllData =
  | User
  | CredentialResponse
  | {
      data: RegistrationResponseJSON | AuthenticationResponseJSON;
      user?: User;
      email?: string;
    };

const API = {
  endpoint: "http://localhost:4000/auth/",
  // ADD HERE ALL THE OTHER API FUNCTIONS
  makePostRequest: async (url: string, data: AllData) => {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return await response.json();
  },
  login: async (user: User) => {
    return await API.makePostRequest(API.endpoint + "login", user);
  },
  register: async (user: User) => {
    return await API.makePostRequest(API.endpoint + "register", user);
  },
  loginFromGoogle: async (googleUser: CredentialResponse) => {
    return await API.makePostRequest(API.endpoint + "login-google", googleUser);
  },
  checkAuthOptions: async (user: User) => {
    return await API.makePostRequest(API.endpoint + "auth-options", user);
  },
  webAuthn: {
    loginOptions: async (email: string) => {
      return await API.makePostRequest(API.endpoint + "webauth-login-options", {
        email,
      });
    },
    loginVerification: async (
      email: string,
      data: AuthenticationResponseJSON
    ) => {
      return await API.makePostRequest(
        API.endpoint + "webauth-login-verification",
        {
          email,
          data,
        }
      );
    },
    registrationOptions: async (account: User) => {
      return await API.makePostRequest(
        API.endpoint + "webauth-registration-options",
        account
      );
    },
    registrationVerification: async (
      data: RegistrationResponseJSON,
      account: User
    ) => {
      return await API.makePostRequest(
        API.endpoint + "webauth-registration-verification",
        {
          data,
          user: account,
        }
      );
    },
  },
};

export default API;
