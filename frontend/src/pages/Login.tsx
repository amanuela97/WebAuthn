import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CredentialResponse, GoogleLogin } from "@react-oauth/google";
import { startAuthentication } from "@simplewebauthn/browser";

import Navigate from "../components/Navigate";
import API from "../scripts/API";
import { postLogin, store } from "../scripts/Store";
import { User } from "../types";

export default function Login() {
  const navigate = useNavigate();
  const [loginStep, setLoginStep] = useState(1);
  const [hiddenSections, setHiddenSections] = useState({
    password: true,
    webauthn: true,
  });
  const [user, setUser] = useState<User>({
    email: "",
    password: "",
  });

  const checkAuthOptions = async () => {
    const response = await API.checkAuthOptions({
      email: user.email,
    });
    if (response.password) {
      setHiddenSections((prev) => ({ ...prev, password: false }));
    }
    if (response?.webauthn) {
      setHiddenSections((prev) => ({ ...prev, webauthn: false }));
    }
    store.setState((state) => {
      return {
        ...state,
        challenge: response.challenge,
      };
    });
    setLoginStep(2);
  };

  const Login = async (event: FormEvent<HTMLFormElement>) => {
    if (event) event.preventDefault();

    if (loginStep == 1) {
      checkAuthOptions();
    } else {
      console.log("here");
      const response = await API.login(user);
      postLogin(
        response,
        {
          ...user,
          name: response.ok && response.user.name,
          isGoogle: false,
        },
        navigate
      );
    }
  };

  const webAuthnLogin = async () => {
    const options = await API.webAuthn.loginOptions(user.email);
    const loginRes = await startAuthentication(options);
    const verificationRes = await API.webAuthn.loginVerification(
      user.email,
      loginRes
    );
    if (verificationRes?.ok) {
      postLogin(verificationRes, verificationRes.user, navigate);
    } else {
      alert(verificationRes.message);
    }
  };

  const responseMessage = async (credResponse: CredentialResponse) => {
    const response = await API.loginFromGoogle(credResponse);
    postLogin(
      response,
      {
        name: response.name,
        email: response.email,
        isGoogle: true,
      },
      navigate
    );
  };

  const errorMessage = () => {
    console.error("Google Login Failed");
  };

  return (
    <section className="p-6 w-[400px] bg-black">
      <h2>Log In</h2>
      <form onSubmit={Login} className="pb-2">
        <fieldset className="flex flex-col text-white">
          <label htmlFor="login_email">email</label>
          <input
            className=" text-black"
            placeholder="email"
            id="login_email"
            required
            autoComplete="on"
            value={user.email}
            onChange={(e) => setUser({ ...user, email: e.target.value })}
          />
          <section hidden={hiddenSections.password} id="login_section_password">
            <label htmlFor="login_password">Password</label>
            <input
              className=" text-black"
              placeholder="password"
              type="password"
              id="login_password"
              value={user.password}
              required={!hiddenSections.password}
              autoComplete="on"
              onChange={(e) => setUser({ ...user, password: e.target.value })}
            />
          </section>
          <section hidden={hiddenSections.webauthn} id="login_section_webauthn">
            <button
              type="button"
              onClick={webAuthnLogin}
              className="text-blue-400 block underline"
            >
              Log in with your Authenticator
            </button>
          </section>
        </fieldset>
        <button className="bg-blue-500 text-white p-2 mt-2" type="submit">
          {loginStep == 1 ? "Continue" : "Login"}
        </button>
        <Navigate to="/register" text="Register a new account instead" />
      </form>
      <GoogleLogin
        onSuccess={responseMessage}
        onError={errorMessage}
        theme="filled_blue"
      />
    </section>
  );
}
