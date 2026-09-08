import Image from "next/image";

export function CatalogCategoryArt({ src }: { src: string }) {
  return <Image alt="" fill sizes="110px" src={src}/>;
}
