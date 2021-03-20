class Cell {
  // Set the size for each cell
  static width = 10;
  static height = 10;

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
    this.context.fillStyle = this.alive ? "#ff8080" : "#303030";
    this.context.fillRect(
      this.gridX * Cell.width,
      this.gridY * Cell.height,
      Cell.width,
      Cell.height
    );
  }
}

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
    const { rows = 40, columns = 75 } = options;
    const { width, height } = canvas;

    this.cellManager = new CellManager(context, {
      rows,
      columns,
      width,
      height,
    });
  }
  nextCycle() {
    this.cellManager.nextCycle();
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
    // Loop over all cells
    for (let x = 0; x < this.columns; x++) {
      for (let y = 0; y < this.rows; y++) {
        // Count the nearby population
        let numAlive =
          this.isAlive(x - 1, y - 1) +
          this.isAlive(x, y - 1) +
          this.isAlive(x + 1, y - 1) +
          this.isAlive(x - 1, y) +
          this.isAlive(x + 1, y) +
          this.isAlive(x - 1, y + 1) +
          this.isAlive(x, y + 1) +
          this.isAlive(x + 1, y + 1);
        let centerIndex = this.gridToIndex(x, y);

        switch (numAlive) {
          case 2:
            this.cells[centerIndex].nextAlive = this.cells[centerIndex].alive;
            break;
          case 3:
            this.cells[centerIndex].nextAlive = true;
            break;
          default:
            this.cells[centerIndex].nextAlive = false;
        }
        // if (numAlive === 2) {
        //   // Do nothing
        //   this.cells[centerIndex].nextAlive = this.cells[centerIndex].alive;
        //   return;
        // }
        // if (numAlive === 3) {
        //   // Make alive
        //   this.cells[centerIndex].nextAlive = true;
        //   return;
        // }
        // // Make dead
        // this.cells[centerIndex].nextAlive = false;
      }
    }

    // Apply the new state to the cells
    for (let i = 0; i < this.cells.length; i++) {
      this.cells[i].alive = this.cells[i].nextAlive;
    }
  }

  nextCycle() {
    // Check the surrounding of each cell
    this.checkSurrounding();

    // Clear the screen
    this.context.clearRect(0, 0, this.width, this.height);

    // Draw all the gameobjects
    for (let i = 0; i < this.cells.length; i++) {
      this.cells[i].draw();
    }
  }
}

window.onload = () => {
  // The page has loaded, start the game
  const canvas = document.querySelector("#canvas");
  const options = { columns: 50, rows: 100 };
  const game = new Game(canvas, options);
  (function gameLoop() {
    window.requestAnimationFrame(() => {
      game.nextCycle();
      setTimeout(() => gameLoop(), 100);
    });
  })();
};