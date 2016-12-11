const blessed = require('blessed');
const contrib = require(`blessed-contrib`);
const fs = require('fs');
const path = require('path');

function renderMap(props) {
  const screen = blessed.screen();
  const grid = new contrib.grid({
    rows: 10,
    cols: 10,
    screen: screen
  });

  const data = props.data;

  const map = grid.set(0, 0, 10, 10, contrib.map, {
    label: `World Map`
  });

  data.forEach(x => {
    map.addMarker({lat: x[0], lon: x[1], color: `red`, char: `×`});
  });

  screen.key([`escape`, `q`, `C-c`], (ch, key) => {
    return process.exit(0);
  });

  screen.render()

  /* TODO: figure out why when reading from stdin the map exists right away.
   * This timeout keeps the map alive.
   */
  setTimeout(() => {}, 1e9);
}

function normalizeData(v) {
  let data = [];

  if (Buffer.isBuffer(v)) {
    v = v.toString();
  }

  if (typeof v === `string`) {
    data = v.split(/[\n\s]/)
      .filter(x => x)
      .map(x => x.split(',')
      .map(x => Number(x)));
  }

  return data;
}

const encoding = 'utf-8';
let data = ``;

function processData() {
  data = normalizeData(data);

  renderMap({data});
}

if (process.stdin.isTTY) {
  const arg = process.argv[2];
  data = new Buffer(arg || ``, encoding);

  if (fs.existsSync(arg)) {
    data = fs.readFileSync(path.resolve(__dirname, arg));
  }

  processData();
} else {
  process.stdin.setEncoding(encoding);

  process.stdin.on(`readable`, function() {
    let chunk = ``;

    while (chunk = process.stdin.read()) {
      data += chunk;
    }
  });

  process.stdin.on(`end`, function () {
    // There will be a trailing \n from the user hitting enter. Get rid of it.
    data = data.replace(/\n$/, ``);
    processData();
  });
}
