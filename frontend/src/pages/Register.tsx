import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

import Navigate from "../components/Navigate";
import API from "../scripts/API";
import { postLogin } from "../scripts/Store";
import { User } from "../types";

export default function Register() {
  const navigate = useNavigate();

  const [user, setUser] = useState<User>({
    name: "",
    email: "",
    password: "",
  });

  const Register = async (event: FormEvent<HTMLFormElement>) => {
    if (event) event.preventDefault();
    const response = await API.register(user);
    postLogin(
      response,
      {
        ...user,
        isGoogle: false,
      },
      navigate
    );
  };

  return (
    <section className="p-6 w-[400px] bg-black">
      <h2>Register</h2>
      <form onSubmit={Register}>
        <fieldset className="flex flex-col text-white">
          <label htmlFor="register_name">name</label>
          <input
            className=" text-black"
            placeholder="name"
            id="register_name"
            required
            value={user.name}
            autoComplete="off"
            onChange={(e) => setUser({ ...user, name: e.target.value })}
          />
          <label htmlFor="register_email">email</label>
          <input
            className=" text-black"
            placeholder="email"
            id="register_email"
            required
            value={user.email}
            autoComplete="off"
            onChange={(e) => setUser({ ...user, email: e.target.value })}
          />
          <label htmlFor="register_password">Password</label>
          <input
            className=" text-black"
            placeholder="password"
            type="password"
            id="register_password"
            value={user.password}
            required
            autoComplete="off"
            onChange={(e) => setUser({ ...user, password: e.target.value })}
          />
        </fieldset>
        <button className="bg-blue-500 text-white p-2 mt-2">Register</button>
        <Navigate to="/login" text="login instead" />
      </form>
    </section>
  );
}
