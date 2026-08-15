import Image from "next/image";

type CareerDirectLogoProps = {
  variant?: "color" | "white";
  className?: string;
  koreaClassName?: string;
  priority?: boolean;
};

const logoSources = {
  color: "/brand/career-direct/CD_LivingBD_2CP_RGB.png",
  white: "/brand/career-direct/CD_LivingBD_1CR_White.png",
} as const;

export default function CareerDirectLogo({
  variant = "color",
  className = "h-8 w-auto",
  koreaClassName,
  priority = false,
}: CareerDirectLogoProps) {
  const defaultKoreaColor = variant === "white" ? "text-gold" : "text-navy";

  return (
    <span className="inline-flex shrink-0 items-center gap-3 whitespace-nowrap">
      <Image
        src={logoSources[variant]}
        alt="Career Direct"
        width={1824}
        height={510}
        className={className}
        priority={priority}
      />
      <span className={koreaClassName ?? `text-sm font-black tracking-[.12em] ${defaultKoreaColor}`}>
        Korea
      </span>
    </span>
  );
}
