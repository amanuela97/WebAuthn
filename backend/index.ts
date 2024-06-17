import express from "express";
import cors from "cors";
//import { Low } from "lowdb";
import { JSONFilePreset } from "lowdb/node";
import * as url from "url";
import bcrypt from "bcrypt";
import * as jwtJsDecode from "jwt-js-decode";
import { Crypto } from "@peculiar/webcrypto";
//import base64url from "base64url";
import {
  // Authentication
  generateAuthenticationOptions,
  // Registration
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import type {
  GenerateAuthenticationOptionsOpts,
  GenerateRegistrationOptionsOpts,
  VerifiedAuthenticationResponse,
  VerifiedRegistrationResponse,
  VerifyAuthenticationResponseOpts,
  VerifyRegistrationResponseOpts,
} from "@simplewebauthn/server";

import type {
  AuthenticationResponseJSON,
  AuthenticatorDevice,
  RegistrationResponseJSON,
} from "@simplewebauthn/types";
import { isBooleanObject } from "util/types";

global.crypto = new Crypto();
const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

const app = express();
const defaultData = { users: [] };
const db = await JSONFilePreset(__dirname + "/auth.json", defaultData);

const rpID = "localhost";
const protocol = "http";
const port = 4000;
const clientPort = 3000;
const expectedOrigin = `${protocol}://${rpID}:${clientPort}`;
app.use(cors());
app.use(express.static("public"));
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);

function findUser(email: string) {
  const user = db.data.users.find((u) => u.email == email);
  if (!user) return undefined;
  return user;
}

function convertToUint8Array(obj: Uint8Array) {
  const array = Object.keys(obj).map((key) => obj[key]);
  return new Uint8Array(array);
}

app.post("/auth/login", (req, res) => {
  const user = findUser(req.body.email);
  if (user) {
    try {
      // user exists, check password
      if (
        user.password &&
        bcrypt.compareSync(req.body.password, user.password)
      ) {
        res.send({ ok: true, user });
      } else {
        res.send({ ok: false, message: "Data is invalid" });
      }
    } catch (error) {
      const _error = error as Error;
      console.error(_error);
      return res.send({ ok: false, message: _error.message });
    }
  } else {
    // User doesn't exist
    res.send({ ok: false, message: "Data is invalid" });
  }
});

app.post("/auth/register", (req, res) => {
  const userFound = findUser(req.body.email);

  if (userFound) {
    // User already registered
    res.send({ ok: false, message: "User already exists" });
  } else {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(req.body.password, salt);
    const user = {
      name: req.body.name,
      email: req.body.email,
      password: hash,
    };
    // New User
    db.data.users.push(user);
    db.write();
    res.send({ ok: true, user });
  }
});

app.post("/auth/login-google", async (req, res) => {
  let jwt = jwtJsDecode.jwtDecode(req.body.credential);
  let payload = jwt.payload;
  let user = {
    email: payload.email,
    name: payload.given_name + " " + payload.family_name,
    password: false,
  };
  const { name, email } = user;
  const userFound = findUser(email);

  if (userFound) {
    // User exists, we update it with the Google data
    userFound.federated = userFound.federated || {};
    userFound.federated.google = payload.aud;
    await db.write();
    res.send({
      ok: true,
      name,
      email,
      isGoogle: true,
    });
  } else {
    // User doesn't exist we create it
    db.data.users.push({
      ...user,
      federated: {
        google: payload.aud,
      },
    });
    await db.write();
    res.send({ ok: true, name, email, isGoogle: true });
  }
});

app.post("/auth/auth-options", (req, res) => {
  const user = findUser(req.body.email);

  if (user) {
    res.send({
      password: true,
      google: user.federated && user.federated.google,
      webauthn: user.webauthn,
    });
  } else {
    res.send({
      password: true,
    });
  }
});

app.post("/auth/webauth-registration-options", async (req, res) => {
  const user = findUser(req.body.email);

  if (!user) {
    throw new Error("User is not defined");
  }

  // Initialize user.devices if it's undefined
  const userDevices: AuthenticatorDevice[] = Array.isArray(user.devices)
    ? user.devices
    : [];

  const buffer = Buffer.from(user.email);
  const userID: Uint8Array = new Uint8Array(buffer);

  const options: GenerateRegistrationOptionsOpts = {
    rpName: "Auth App",
    rpID,
    userID,
    userName: user.name,
    timeout: 60000,
    attestationType: "none",

    /**
     * Passing in a user's list of already-registered authenticator IDs here prevents users from
     * registering the same device multiple times. The authenticator will simply throw an error in
     * the browser if it's asked to perform registration when one of these ID's already resides
     * on it.
     */
    excludeCredentials: userDevices.map((dev) => ({
      id: dev.credentialID,
      type: "public-key",
      transports: dev.transports,
    })),

    authenticatorSelection: {
      userVerification: "preferred",
      residentKey: "discouraged",
    },
    /**
     * The two most common algorithms: ES256, and RS256
     */
    supportedAlgorithmIDs: [-7, -257],
  };

  /**
   * The server needs to temporarily remember this value for verification, so don't lose it until
   * after you verify an authenticator response.
   */

  try {
    const regOptions = await generateRegistrationOptions(options);
    user.currentChallenge = regOptions.challenge;
    db.write();

    res.send(regOptions);
  } catch (error) {
    const _error = error as Error;
    console.error(_error);
    return res.status(400).send({ error: _error.message });
  }
});

app.post("/auth/webauth-registration-verification", async (req, res) => {
  const user = findUser(req.body.user.email);
  const data: RegistrationResponseJSON = req.body.data;

  const expectedChallenge = user.currentChallenge;

  let verification: VerifiedRegistrationResponse;
  try {
    const options: VerifyRegistrationResponseOpts = {
      response: data,
      expectedChallenge: `${expectedChallenge}`,
      expectedOrigin,
      expectedRPID: rpID,
      requireUserVerification: true,
    };
    verification = await verifyRegistrationResponse(options);
  } catch (error) {
    const _error = error as Error;
    console.error(_error);
    return res.status(400).send({ error: _error.message });
  }

  const { verified, registrationInfo } = verification;

  if (verified && registrationInfo) {
    const { credentialPublicKey, credentialID, counter } = registrationInfo;

    const existingDevice = user.devices
      ? user.devices.find(
          (device: AuthenticatorDevice) => device.credentialID === credentialID
        )
      : false;

    if (!existingDevice) {
      const newDevice: AuthenticatorDevice = {
        credentialPublicKey,
        credentialID,
        counter,
        transports: data.response.transports,
      };
      if (user.devices == undefined) {
        user.devices = [];
      }
      user.webauthn = true;
      user.devices.push(newDevice);
      db.write();
    }
  }

  res.send({ ok: true });
});

app.post("/auth/webauth-login-options", async (req, res) => {
  try {
    const user = findUser(req.body.email);
    if (!user) {
      throw new Error("User is not defined");
    }

    // Initialize user.devices if it's undefined
    const userDevices: AuthenticatorDevice[] = Array.isArray(user.devices)
      ? user.devices
      : [];

    const options: GenerateAuthenticationOptionsOpts = {
      timeout: 60000,
      allowCredentials: userDevices.map((dev) => ({
        id: dev.credentialID,
        type: "public-key",
        transports: dev.transports,
      })),
      userVerification: "preferred",
      rpID,
    };
    const loginOpts = await generateAuthenticationOptions(options);
    if (user) user.currentChallenge = loginOpts.challenge;
    res.send(loginOpts);
  } catch (error) {
    const _error = error as Error;
    console.error(_error);
    return res.status(400).send({ error: _error.message });
  }
});

app.post("/auth/webauth-login-verification", async (req, res) => {
  const data: AuthenticationResponseJSON = req.body.data;
  const message = "server error";
  const user = findUser(req.body.email);
  if (user == null) {
    res.sendStatus(400).send({ ok: false, message });
    return;
  }

  const expectedChallenge = user.currentChallenge;

  let dbAuthenticator: AuthenticatorDevice;
  for (const dev of user.devices) {
    if ((dev as AuthenticatorDevice).credentialID === data.id) {
      dbAuthenticator = dev as AuthenticatorDevice;
      break;
    }
  }

  if (!dbAuthenticator) {
    return res.status(400).send({
      ok: false,
      message: "Authenticator is not registered with this site",
    });
  }

  let verification: VerifiedAuthenticationResponse;
  try {
    const options: VerifyAuthenticationResponseOpts = {
      response: data,
      expectedChallenge: `${expectedChallenge}`,
      expectedOrigin,
      expectedRPID: rpID,
      authenticator: {
        ...dbAuthenticator,
        credentialPublicKey: convertToUint8Array(
          dbAuthenticator.credentialPublicKey
        ),
      },
    };
    verification = await verifyAuthenticationResponse(options);
  } catch (error) {
    const _error = error as Error;
    console.error(_error);
    return res.status(400).send({ ok: false, error: _error.message, message });
  }

  const { verified, authenticationInfo } = verification;

  if (verified) {
    dbAuthenticator.counter = authenticationInfo.newCounter;
  }

  res.send({
    ok: true,
    user: {
      name: user.name,
      email: user.email,
    },
  });
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
