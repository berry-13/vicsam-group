import { SystemData, ParsedFileData } from "../types/fileTypes";

export const parseSystemData = (
  content: unknown
): { systemData?: SystemData; isValidSystemData: boolean } => {
  try {
    if (
      content &&
      typeof content === "object" &&
      (content as SystemData).CustomerVAT
    ) {
      return {
        systemData: content as SystemData,
        isValidSystemData: true,
      };
    }
  } catch (error) {
    console.error("Errore nel parsing dei dati di sistema:", error);
  }
  return { isValidSystemData: false };
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("it-IT", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const getUniqueValues = (data: ParsedFileData[], field: keyof SystemData): string[] => {
  const values = data
    .filter((item) => item.systemData?.[field])
    .map((item) => item.systemData![field] as string)
    .filter((v) => v && v.trim() !== "");
  return [...new Set(values)].sort();
};
