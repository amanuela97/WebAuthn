import Navigate from "../components/Navigate";

/*const topics = [
  "classic login flow",
  "federated login",
  "identifier-first flow",
  "webauthn",
  "passkeys",
];*/

const navigation = [
  {
    to: "/login",
    text: "nagivate to /login",
  },
  {
    to: "/register",
    text: "nagivate to /register",
  },
];

export default function Root() {
  return (
    <>
      <h2>Welcome!</h2>
      {navigation.map(({ to, text }, i) => (
        <Navigate key={i} to={to} text={text} />
      ))}
    </>
  );
}
