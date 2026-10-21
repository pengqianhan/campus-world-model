// The landmark that a viewer page shows: ?landmark=<name>, a folder in landmarks/ beside pipeline/.
// Its model.js exports build(materials, only); its config is config/<name>.json.
const name = new URLSearchParams(location.search).get("landmark") ?? "";
if (!/^[a-z0-9-]+$/.test(name)) {
  document.body.style.color = "#fff";
  document.body.textContent = "Give the landmark in the address: ?landmark=<name>, the name of its folder in landmarks/.";
  throw new Error("no ?landmark=<name>");
}

export const NAME = name;
/** The landmark's folder, relative to the viewer's pages and modules. */
export const DIR = `../../${name}/`;
export const config = await (await fetch(`${DIR}config/${name}.json`)).json();
export const { build } = await import(`${DIR}model.js`);
