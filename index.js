/**
 * Cell class
 */
class Cell {
  gridX;
  gridY;
  alive;
  constructor(gridX, gridY) {
    // Store the position of this cell in the grid
    this.gridX = gridX;
    this.gridY = gridY;

    // Make random squares alive
    this.alive = Math.random() > 0.5;
  }
}

/**
 * Abstract Renderer
 *
 * @typedef {{rows?: number, columns?: number, width?: number, height?: number }} RenderOptions
 */
class Renderer {
  cell = {
    colors: {
      true: "#3b4859",
      false: "#dde2e9",
    },
    sizes: {
      width: 4,
      height: 2
    }
  }

  area = {
    sizes: {
      width: 600,
      height: 600
    },
    grid: {
      columns: 0,
      rows: 0
    }
  }

  /**
   *
   * @param context
   * @param {RenderOptions} options
   */
  constructor(options) {
    const { width, height, columns, rows } = options;
    if (width) {
      this.area.sizes.width = width
    }
    if (height) {
      this.area.sizes.height = height
    }
    if (columns) {
      this.area.grid.columns = columns
    }
    if (rows) {
      this.area.grid.rows = rows
    }
    this.calcCellSizes({ columns, rows });
  }

  /**
   *
   * @param {number} columns
   * @param {number} rows
   */
  calcCellSizes({ columns, rows }) {
    const width = Math.ceil(this.area.sizes.width / columns);
    const height =  Math.ceil(this.area.sizes.height / rows);
    this.cell.sizes.width = width;
    this.cell.sizes.height = height;
  }

  /**
   *
   */
  drawCell() {
    throw new ReferenceError('drawCell method should be implemented');
  }

  /**
   *
   */
  clearArea() {
    throw new ReferenceError('clearArea method should be implemented');
  }

  /**
   *
   * @param callback
   */
  provideAnimationFrame(callback) {
    window.requestAnimationFrame(() => callback());
  }
}

/**
 * Canvas Renderer
 */
class CanvasRenderer extends Renderer {
  /**
   *
   * @type {CanvasRenderingContext2D}
   */
  #context = null;

  /**
   *
   * @param {HTMLCanvasElement} canvas
   * @param {RenderOptions} options
   */
  constructor(canvas, options) {
    const context = canvas.getContext("2d");
    const { width, height } = CanvasRenderer.calcCanvasSizes(options);
    super({ ...options, width, height });
    this.#context = context;

    this.#initCanvas(canvas);
  }

  /**
   *
   * @param {number} rows
   * @param {number} columns
   * @return {{width: number, height: number}}
   */
  static calcCanvasSizes({ rows, columns }) {
    const rateX = window.innerWidth / columns;
    const rateY = window.innerHeight / rows;
    const rate = Math.min(rateX, rateY)

    const width = Math.ceil(rate * columns);
    const height = Math.ceil( rate * rows);

    return {
      width,
      height
    }
  }
  /**
   *
   * @param {HTMLCanvasElement} canvas
   */
  #initCanvas(canvas) {
    canvas.width = this.area.sizes.width;
    canvas.style.width = canvas.width + 'px';
    canvas.height = this.area.sizes.height;
    canvas.style.height = canvas.height + 'px';
  }
  /**
   *
   * @param {Cell} cell
   */
  drawCell(cell) {
    // Draw a square, let the state determine the color
    this.#context.fillStyle = this.cell.colors[cell.alive];
    this.#context.fillRect(
      cell.gridX * this.cell.sizes.width,
      cell.gridY * this.cell.sizes.height,
      this.cell.sizes.width,
      this.cell.sizes.height
    );
  }

  /**
   *
   */
  clearArea() {
    this.#context.clearRect(0, 0, this.area.sizes.width, this.area.sizes.height);
  }
}

/**
 * Game manage class
 */
class Game {
  /**
   * @type {CanvasRenderer|null}
   */
  #renderer = null;
  /**
   * @type {Generation|null}
   */
  #generation = null;
  /**
   * @type {AbortSignal}
   */
  #signal = null;
  /**
   * @type {AbortController}
   */
  #controller = null;
  /**
   * @type {number}
   */
  interval = 100;

  /**
   * @type {number}
   */
  iterationCount = 0;

  /**
   *
   * @param canvas
   * @param {{ rows?: number, columns?: number, iterationCountControl?: HTMLInputElement }} options
   */
  constructor(canvas, options = {}) {
    if (!canvas || canvas.tagName !== "CANVAS") {
      throw new Error("Canvas does not exist or not valid node type");
    }

    const { rows, columns, iterationCountControl } = options;

    this.#renderer = new CanvasRenderer(canvas, { rows, columns });
    this.#generation = new Generation({
      rows,
      columns,
    });

    this.iterationCountControl = iterationCountControl;
  }

  /**
   *
   */
  #nextGeneration() {
    // Clear the screen
    this.#renderer.clearArea();
    this.#generation.next();
    // Draw all the cells
    this.#generation.cells.forEach((cell) => this.#renderer.drawCell(cell));
  }

  /**
   *
   */
  #increaseIterationCount() {
    this.iterationCount++;
    if (this.iterationCountControl) {
      this.iterationCountControl.value = this.iterationCount;
    }
  }

  /**
   * Makes next iteration of game
   */
  nextIteration() {
    if (this.#signal !== null && this.#signal.aborted) {
      return;
    }
    this.#nextGeneration();
    this.#increaseIterationCount();
  }

  /**
   *
   * @return {AbortController}
   */
  start() {
    if (this.#signal !== null && this.#signal.aborted === false) {
      throw new Error('Game is running and not be started. Stop it first.')
    }
    this.#controller = new AbortController();
    this.#signal = this.#controller.signal

    const loop = () => {
      this.nextIteration();
      setTimeout(loop, this.interval);
    }

    this.#renderer.provideAnimationFrame(loop);

    return this.#controller;
  }

  /**
   *
   */
  stop() {
    if (this.#controller === null) {
      throw new Error('Game is not running');
    }
    this.#controller.abort();
  }
}

/**
 * Generation class
 */
class Generation {
  columns = 50;
  rows = 50;

  cells = [];

  constructor(options) {
    const { rows, columns } = options;
    if (rows) {
      this.rows = rows;
    }
    if (columns) {
      this.columns = columns;
    }
  }

  /**
   *
   */
  createGrid() {
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.columns; x++) {
        this.cells.push(new Cell(x, y));
      }
    }
  }

  /**
   *
   * @param {number} x
   * @param {number} y
   * @return {number}
   */
  isAlive(x, y) {
    if (x < 0 || x >= this.columns || y < 0 || y >= this.rows) {
      return 0;
    }

    return this.cells[this.gridToIndex(x, y)].alive ? 1 : 0;
  }

  gridToIndex(x, y) {
    return x + y * this.columns;
  }

  /**
   *
   */
  updateNextGenCellsAlive() {
    // Iterate over all cells
    for (let x = 0; x < this.columns; x++) {
      for (let y = 0; y < this.rows; y++) {
        // Count the nearby population
        const countAlive =
          this.isAlive(x - 1, y - 1) +
          this.isAlive(x, y - 1) +
          this.isAlive(x + 1, y - 1) +
          this.isAlive(x - 1, y) +
          this.isAlive(x + 1, y) +
          this.isAlive(x - 1, y + 1) +
          this.isAlive(x, y + 1) +
          this.isAlive(x + 1, y + 1);

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

  /**
   * Create initial or produce next generation of cells
   */
  next() {
    if (this.cells.length) {
      this.updateNextGenCellsAlive();
      return;
    }

    this.createGrid();
  }
}

window.onload = () => {
  // The page has loaded, start the game
  const $canvas = document.querySelector("#canvas");
  const $rows = document.querySelector("#rows");
  const $columns = document.querySelector("#columns");
  /**
   * @type {HTMLInputElement}
   */
  const $iterationCount = document.querySelector("#iterationCount");

  /**
   *
   * @return {{columns: number, rows: number, iterationCountControl: HTMLInputElement}}
   */
  const buildGameOptions = () => ({
    rows: Number($rows.value) || 100,
    columns: Number($columns.value) || 100,
    iterationCountControl: $iterationCount
  });

  /**
   * @return {function}
   */
  const startGame = (() => {
    let currentGame = null
    return () => {
      if (currentGame) {
        currentGame.stop();
      }
      currentGame = new Game($canvas, buildGameOptions());
      currentGame.start();
    }
  })();

  $columns.addEventListener("change", startGame);
  $rows.addEventListener("change", startGame);

  startGame();
};
