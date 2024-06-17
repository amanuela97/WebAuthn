import { ReactElement } from "react";
import { NavLink } from "react-router-dom";

type Props = {
  to: string;
  text?: string;
  children?: ReactElement;
};

export default function Navigate({ to, text, children }: Props) {
  return (
    <div>
      <NavLink
        to={to}
        className={({ isActive, isPending }) =>
          isPending ? "pending" : isActive ? "active" : ""
        }
      >
        {text ? text : children}
      </NavLink>
    </div>
  );
}
