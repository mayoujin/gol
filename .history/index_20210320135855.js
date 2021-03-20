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
  constructor(canvas, options = {}) {
    if (!canvas || canvas.tagName !== "CANVAS") {
      throw new Error("Canvas is not exists or not invalid node type");
    }
    this.canvas = canvas;
    this.context = this.canvas.getContext("2d");

    const { rows = 40, columns = 75 } = options;
    const { width, height } = canvas;
    this.cellManager = new CellManager(this.context, { rows, columns });
    // Request an animation frame for the first time
    // The gameLoop() function will be called as a callback of this request
    const gameLoop = () => {
      window.requestAnimationFrame(() => {
        this.cellManager.nextCycle();
        setTimeout(() => gameLoop(), 100);
      });
    };

    // The loop function has reached it's end, keep requesting new frames
    setTimeout(() => {
      window.requestAnimationFrame(() => this.nextCycle());
    }, 100);
  }
}

class CellManager {
  width = 0;
  height = 0;

  columns = 75;
  rows = 40;

  gameObjects = [];
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
        this.gameObjects.push(new Cell(this.context, x, y));
      }
    }
  }

  isAlive(x, y) {
    if (x < 0 || x >= this.columns || y < 0 || y >= this.rows) {
      return false;
    }

    return this.gameObjects[this.gridToIndex(x, y)].alive ? 1 : 0;
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

        if (numAlive == 2) {
          // Do nothing
          this.gameObjects[centerIndex].nextAlive = this.gameObjects[
            centerIndex
          ].alive;
        } else if (numAlive == 3) {
          // Make alive
          this.gameObjects[centerIndex].nextAlive = true;
        } else {
          // Make dead
          this.gameObjects[centerIndex].nextAlive = false;
        }
      }
    }

    // Apply the new state to the cells
    for (let i = 0; i < this.gameObjects.length; i++) {
      this.gameObjects[i].alive = this.gameObjects[i].nextAlive;
    }
  }

  nextCycle() {
    // Check the surrounding of each cell
    this.checkSurrounding();

    // Clear the screen
    this.context.clearRect(0, 0, this.width, this.height);

    // Draw all the gameobjects
    for (let i = 0; i < this.gameObjects.length; i++) {
      this.gameObjects[i].draw();
    }
  }
}

window.onload = () => {
  // The page has loaded, start the game
  const canvas = document.querySelector("#canvas");
  const options = { columns: 50, rows: 100 };
  new Game(canvas, options);
};
