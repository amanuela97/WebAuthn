import { useStore } from "@tanstack/react-store";
import { useNavigate } from "react-router-dom";
import { startRegistration } from "@simplewebauthn/browser";

import { logout, store } from "../scripts/Store";
import Navigate from "../components/Navigate";
import API from "../scripts/API";

export default function Profile() {
  const navigate = useNavigate();
  const { IsLoggedIn, account } = useStore(store, (state) => state);

  const addWebAuthn = async () => {
    if (!account) return;
    const options = await API.webAuthn.registrationOptions(account);
    options.authenticatorSelection.residentKey = "required";
    options.authenticatorSelection.requireResidentKey = true;
    options.extensions = {
      credProps: true,
    };
    const authRes = await startRegistration(options);
    const verificationRes = await API.webAuthn.registrationVerification(
      authRes,
      account
    );
    if (verificationRes.ok) {
      alert("You can now login using the registered method!");
    } else {
      alert(verificationRes.message);
    }
  };

  return (
    <>
      <p className="text-3xl">Profile</p>
      {IsLoggedIn ? (
        <div>
          {account?.isGoogle ? (
            <p>you are logged with Google as: </p>
          ) : (
            <p>you are logged in as: </p>
          )}
          <p>name: {account?.name}</p>
          <p>email: {account?.email}</p>
          <button
            onClick={addWebAuthn}
            className="text-blue-400 block underline"
          >
            Add Authenticator / Passkey
          </button>
          <button
            className="bg-blue-500 text-white p-2 mt-2"
            onClick={() => logout(navigate)}
          >
            Logout
          </button>
        </div>
      ) : (
        <div>
          <p>You are currently logged out.</p>
          <Navigate to={"/login"} text={"login"} />
        </div>
      )}
    </>
  );
}
