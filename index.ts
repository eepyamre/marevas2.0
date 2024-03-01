/*
Copyright (C) 2024  eepyamre

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { Core } from "./src/app/core";

const WIDTH = 2400;
const HEIGHT = 1440;

addEventListener("DOMContentLoaded", () => {
  const appRoot = document.querySelector<HTMLDivElement>("#app");
  if (!appRoot) throw new Error("No #app found.");
  Core.setup(appRoot, "ws://127.0.0.1:6969", {
    width: WIDTH,
    height: HEIGHT,
    zoom: 1,
    offsetX: 0,
    offsetY: 0,
  });
});
