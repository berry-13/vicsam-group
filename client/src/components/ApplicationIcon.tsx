import React from "react";
import ALYIcon from "@/assets/ALY.ico";
import TSEIcon from "@/assets/TSE.ico";

interface ApplicationIconProps {
  version?: string;
  size?: number;
}

export const ApplicationIcon: React.FC<ApplicationIconProps> = ({
  version,
  size = 20,
}) => {
  if (!version) return null;

  const iconSrc =
    version === "ALY" ? ALYIcon : version === "TSE" ? TSEIcon : null;

  if (!iconSrc) return null;

  return (
    <img
      src={iconSrc}
      alt={`${version} Logo`}
      className="flex-shrink-0"
      style={{ width: size, height: size }}
      title={`Applicazione ${version}`}
    />
  );
};
