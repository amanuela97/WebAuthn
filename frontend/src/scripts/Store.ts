import { Store } from "@tanstack/store";
import { NavigateFunction } from "react-router-dom";
import {
  StoreType,
  User,
  Response,
  options,
  PasswordCredential,
} from "../types";
import API from "./API";

// You can use @tanstack/store outside of React components too!
export const store = new Store<StoreType>({
  IsLoggedIn: false,
  account: null,
});

export const postLogin = (
  response: Response,
  user: User,
  navigate: NavigateFunction
) => {
  if (response.ok) {
    store.setState((state) => {
      return {
        ...state,
        IsLoggedIn: true,
        account: user,
      };
    });

    navigate("/profile");
  } else {
    alert(response.message);
  }

  // Credential Management API
  if ("PasswordCredential" in window && user.password) {
    const credential = new window.PasswordCredential({
      name: user.name,
      id: user.email,
      password: user.password,
    });
    navigator.credentials.store(credential);
  }
};

export const logout = async (navigate: NavigateFunction) => {
  store.setState((state) => {
    return {
      ...state,
      IsLoggedIn: false,
      account: null,
    };
  });

  if ("PasswordCredential" in window) {
    navigator.credentials.preventSilentAccess();
  }
  navigate("/");
};

let isRequestPending = false;

export const autoLogin = async (navigate: NavigateFunction, path: string) => {
  if (isRequestPending) {
    console.log("autoLogin request already pending");
    return;
  }

  isRequestPending = true;
  if ("credentials" in navigator) {
    const credentials = (await navigator.credentials.get(
      options
    )) as PasswordCredential;
    const email = document.getElementById("login_email") as HTMLInputElement;
    const pass = document.getElementById("login_password") as HTMLInputElement;
    try {
      if (credentials) {
        if (email && pass && path === "/login") {
          email.value = credentials.id;
          pass.value = credentials.password;
        }
        const user = {
          email: credentials.id,
          password: credentials.password,
        };
        const response = await API.login(user);
        postLogin(
          response,
          {
            ...user,
            name: response.user.name,
            isGoogle: false,
          },
          navigate
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      isRequestPending = false;
    }
  }
};
