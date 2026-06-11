export function loadImage(name: string) {
  return import(`../public/images/${name}.png`);
}

export const getIcon = (type: string) => {
  return require(`../public/images/${type}.svg`);
};
