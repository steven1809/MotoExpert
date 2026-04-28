export default function Navbar() {
  return (
    <nav className="bg-primary text-white p-4 flex justify-between shadow-md">
      <h1 className="text-xl font-bold">MotoExpert </h1>
      <div className="space-x-4">
        <a href="#servicios" className="hover:text-light">
          Servicios
        </a>
        <a href="#empleados" className="hover:text-light">
          Empleados
        </a>
      </div>
    </nav>
  );
}
