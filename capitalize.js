export const capitalize = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";

export const titleCase = (str) =>
  str.split(" ").map(capitalize).join(" ");
