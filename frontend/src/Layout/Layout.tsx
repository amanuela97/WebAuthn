import { useLayoutEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { CgProfile } from "react-icons/cg";
import { SiAuthelia } from "react-icons/si";
import Navigate from "../components/Navigate";
import { autoLogin } from "../scripts/Store";

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useLayoutEffect(() => {
    autoLogin(navigate, location.pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="h-screen flex flex-col items-center bg-gray-800 text-white text-2xl">
      <nav className="h-20 w-full flex justify-between items-center px-4 font-bold text-4xl  bg-[#5f464b]">
        <Navigate to="/">
          <SiAuthelia size={40} />
        </Navigate>
        <h1>Web Authentication</h1>
        <Navigate to="/profile">
          <CgProfile size={40} />
        </Navigate>
      </nav>
      <main className="pt-10">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
