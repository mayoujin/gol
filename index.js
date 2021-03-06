/**
 *
 */
class Cell {
  // Set the size for each cell
  static width = 10;
  static height = 10;
  static colors = {
    true: "#3b4859",
    false: "#dde2e9",
  };

  constructor(context, gridX, gridY) {
    this.context = context;

    // Store the position of this cell in the grid
    this.gridX = gridX;
    this.gridY = gridY;

    // Make random squares alive
    this.alive = Math.random() > 0.5;
  }

  draw() {
    // Draw a square, let the state determine the color
    this.context.fillStyle = this.constructor.colors[this.alive];
    this.context.fillRect(
      this.gridX * Cell.width,
      this.gridY * Cell.height,
      Cell.width,
      Cell.height
    );
  }
}

/**
 *
 */
class Game {
  /**
   *
   */
  cellManager = null;

  constructor(canvas, options = {}) {
    if (!canvas || canvas.tagName !== "CANVAS") {
      throw new Error("Canvas is not exists or not invalid node type");
    }
    const context = canvas.getContext("2d");
    const { rows = 40, columns = 80 } = options;

    const { width, height } = canvas;

    this.cellManager = new CellManager(context, {
      rows,
      columns,
      width,
      height,
    });
  }

  makeGeneration() {
    this.cellManager.makeGeneration();
  }
}

class CellManager {
  width = 0;
  height = 0;

  columns = 75;
  rows = 40;

  cells = [];
  context = null;

  constructor(context, options) {
    this.context = context;

    const { rows = 40, columns = 75, width, height } = options;
    Object.assign(this, { rows, columns, width, height });

    this.createGrid();
  }

  createGrid() {
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.columns; x++) {
        this.cells.push(new Cell(this.context, x, y));
      }
    }
  }

  isAlive(x, y) {
    if (x < 0 || x >= this.columns || y < 0 || y >= this.rows) {
      return false;
    }

    return this.cells[this.gridToIndex(x, y)].alive ? 1 : 0;
  }

  gridToIndex(x, y) {
    return x + y * this.columns;
  }

  checkSurrounding() {
    // Iterate over all cells
    const isAlive = this.isAlive.bind(this);

    for (let x = 0; x < this.columns; x++) {
      for (let y = 0; y < this.rows; y++) {
        // Count the nearby population
        const countAlive =
          isAlive(x - 1, y - 1) +
          isAlive(x, y - 1) +
          isAlive(x + 1, y - 1) +
          isAlive(x - 1, y) +
          isAlive(x + 1, y) +
          isAlive(x - 1, y + 1) +
          isAlive(x, y + 1) +
          isAlive(x + 1, y + 1);
        const centerIndex = this.gridToIndex(x, y);

        this.cells[centerIndex].nextAlive = ((countAlive) => {
          switch (countAlive) {
            case 2:
              // Do nothing
              return this.cells[centerIndex].alive;
            case 3:
              // Make alive
              return true;
            default:
              // Make dead
              return false;
          }
        })(countAlive);
      }
    }

    // Apply the new state to the cells
    this.cells.forEach((cell) => {
      cell.alive = cell.nextAlive;
    });
  }

  makeGeneration() {
    // Check the surrounding of each cell
    this.checkSurrounding();

    // Clear the screen
    this.context.clearRect(0, 0, this.width, this.height);

    // Draw all the cells
    this.cells.forEach((cell) => cell.draw());
  }
}

window.onload = () => {
  // The page has loaded, start the game
  const canvas = document.querySelector("#canvas");
  const options = { columns: 500, rows: 100 };

  Cell.width = 2;
  Cell.height = 2;

  let stop = false;

  const gameLoop = (game, signal) => {
    window.requestAnimationFrame(() => {
      game.makeGeneration();
      if (signal.aborted === true) {
        return;
      }
      setTimeout(() => gameLoop(game, signal), 100);
    });
  };

  let abortController = new AbortController();

  const startGame = (options) => {
    abortController.abort();
    abortController = new AbortController();
    const game = new Game(canvas, options);
    gameLoop(game, abortController.signal);
  };

  startGame(options);

  const columns = document.querySelector("#columns");
  columns.value = options.columns;
  const rows = document.querySelector("#rows");
  rows.value = options.rows;

  columns.addEventListener("change", function () {
    const options = {
      columns: Number(columns.value),
      rows: Number(rows.value),
    };
    startGame(options);
  });

  rows.addEventListener("change", function () {
    const options = {
      columns: Number(columns.value),
      rows: Number(rows.value),
    };
    startGame(options);
  });
};
