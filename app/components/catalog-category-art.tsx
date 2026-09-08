import Image from "next/image";

export function CatalogCategoryArt({ slug, src }: { slug: string; src: string }) {
  if (slug !== "meshes-tapes") return <Image alt="" fill sizes="110px" src={src}/>;
  return <span className="mesh-category-art" role="img" aria-label="Синяя фасадная сетка, сварная металлическая сетка и соединительные ленты">
    <span className="mesh-photo-welded"><Image alt="" fill sizes="60px" src="/assets/categories/mesh-welded-photo.jpg"/></span>
    <span className="mesh-photo-blue"><Image alt="" fill sizes="70px" src="/assets/categories/mesh-blue-photo.webp"/></span>
    <span className="mesh-photo-tapes"><Image alt="" fill sizes="60px" src="/assets/categories/mesh-tapes-photo.jpg"/></span>
  </span>;
}
