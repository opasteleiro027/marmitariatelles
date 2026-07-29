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
      aria-hidden="true"
      alt=""
      className={styles.logo}
      height={512}
      priority={priority}
      sizes={`${size}px`}
      src="/brand/marmitaria-telles-mark.png"
      style={{ width: size, height: size }}
      width={512}
    />
  );
}
