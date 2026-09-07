import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProductoCard from "./components/ProductoCard";
import { useLenis } from "./lib/useLenis";
import { useSEO } from "./lib/seo";
import { useData } from "@/lib/DataProvider";
import { useFavorites } from "./context/FavoritesContext";

export default function Favoritos() {
  useLenis();
  useSEO({ titulo: "Favoritos · Brack Indumentaria", path: "/favoritos" });
  const { productos } = useData();
  const { favoritos } = useFavorites();
  const lista = productos.filter((p) => p.publicado && favoritos.includes(p.id));

  return (
    <div className="min-h-screen bg-paper text-graph">
      <div className="grain" />
      <Navbar variant="solid" />

      <header className="container-x pt-32 pb-8">
        <p className="eyebrow flex items-center gap-2">
          <Heart size={16} /> Sus guardados
        </p>
        <h1 className="mt-3 font-display text-4xl font-medium tracking-tight text-graph md:text-5xl">Favoritos</h1>
        <p className="mt-3 text-graph-500">
          {lista.length} {lista.length === 1 ? "producto guardado" : "productos guardados"}
        </p>
      </header>

      <section className="pb-20">
        <div className="container-x">
          {lista.length === 0 ? (
            <div className="rounded-2xl border border-graph/10 bg-paper-100 py-24 text-center">
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-graph/5 text-graph-400">
                <Heart size={28} />
              </span>
              <p className="mt-5 font-display text-2xl text-graph">Todavía no guardó productos</p>
              <p className="mt-2 text-graph-500">Toque el corazón en los productos que le interesen para verlos acá.</p>
              <Link to="/tienda" className="btn-primary mt-7">Ver la tienda</Link>
            </div>
          ) : (
            <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {lista.map((p) => (
                <ProductoCard key={p.id} p={p} />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
