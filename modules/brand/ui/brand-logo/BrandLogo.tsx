import Image from "next/image";
import styles from "./brand-logo.module.css";

type BrandLogoProps = {
  size?: number;
  priority?: boolean;
};

export function BrandLogo({
  size = 44,
  priority = false,
}: BrandLogoProps) {
  return (
    <Image
      alt="Pote Mix"
      className={styles.logo}
      height={512}
      priority={priority}
      sizes={`${Math.round(size * 2.734)}px`}
      src="/brand/pote-mix-logo.webp"
      style={{ width: `min(${size * 2.734}px, 100%)`, height: size }}
      width={1400}
    />
  );
}
