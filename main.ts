/*
 * Constants
 */
const MAX_FRAME_TIME = 0.25;
const DT = 1/60;

/*
 * Interfaces
 */
interface Updatable {
    update(dt: number): void;
}

interface Renderable {
    render(ctx: CanvasRenderingContext2D): void;
}

/*
 * Utilities
 */

class Vector {
    static zero = new Vector(0, 0);
    constructor(public x: number, public y: number) {}
}

class BoundingBox {
    constructor(
        public x: number,
        public y: number,
        public width: number,
        public height: number
    ) {}

    setPosition(x: number, y: number): void {
        this.x = x;
        this.y = y;
    }

    setSize(width: number, height: number): void {
        this.width = width;
        this.height = height;
    }

    right(): number {
        return this.x + this.width;
    }

    bottom(): number {
        return this.y + this.height;
    }

    intersects(other: BoundingBox): boolean {
        return !(this.x        >= other.right()  ||
                 this.right()  <= other.x        ||
                 this.y        >= other.bottom() ||
                 this.bottom() <= other.y);
    }
}

/*
 * DrawUtil
 */
class DrawUtil {
    static drawFilledStrokedRect(
        ctx: CanvasRenderingContext2D,
        fillColor: string,
        strokeColor: string,
        x: number,
        y: number,
        width: number,
        height: number,
        strokeWidth: number
    ) {
        ctx.fillStyle = fillColor;
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
        ctx.strokeRect(x, y, width, height);
    }
}

/*
 * Game
 */
class Game implements Updatable, Renderable {
    constructor(
        public tiles: Tile[][],
        public entities: Entity[]
    ) {}

    update(dt: number): void {
        this.entities.forEach(e => {
            e.update(dt);
            if (e.bb.y > this.tiles.length * Tile.size) {
                e.die();
            }
        });
    }

    render(ctx: CanvasRenderingContext2D): void {
        this.tiles.forEach(row => row.forEach(col => col.render(ctx)));
        this.entities.forEach(e => e.render(ctx));
    }
}

/*
 * Tile
 */
class Tile implements Renderable {
    static size = 24;

    public x: number;
    public y: number;

    constructor(
        public id: number,
        public row: number,
        public col: number
    ) {
        this.id = id;
        this.row = row;
        this.col = col;
        this.x = col * Tile.size;
        this.y = row * Tile.size;
    }

    render(ctx: CanvasRenderingContext2D): void {
        if (this.id == 1) {
            ctx.strokeRect(this.x, this.y, Tile.size, Tile.size);
        }
    }
}

/*
 * Entity
 */
abstract class Entity implements Updatable, Renderable {
    private finished: boolean;

    constructor(
        public colorString: string,
        public bb: BoundingBox,
        public velocity: Vector
    ) {
        this.finished = false;
    }

    abstract render(ctx: CanvasRenderingContext2D): void;

    update(dt: number): void {
        this.updatePosition(dt);
        this.handleEvents();
    }

    updatePosition(dt: number): void {
        this.bb.x += this.velocity.x * dt;
        this.bb.y += this.velocity.y * dt;
    }

    handleEvents(): void {
        this.getCollidingEntities().forEach(e => this.onEntityCollide(e));
    }

    onEntityCollide(sender: Entity): void {
    }

    die(): void {
        this.finished = true;
    }

    getCollidingEntities(): Entity[] {
        return [];
    }
}

/*
 * Main Loop
 */
let previousTime = 0;
let accumulator = 0;
function loop(
    currentTime: number,
    ctx: CanvasRenderingContext2D,
    game: Game
): void {
    const frameTime = Math.min((currentTime - previousTime) / 1000,
                               MAX_FRAME_TIME);
    accumulator += frameTime;

    while (accumulator >= DT) {
        accumulator -= DT;
        game.update(DT);
    }

    game.render(ctx);

    previousTime = currentTime;
    window.requestAnimationFrame((timestamp) => {
        loop(timestamp, ctx, game)
    });
}

/*
 * Main
 */
function main(): void {
    const gameCanvas = <HTMLCanvasElement> document.getElementById("game");

    gameCanvas.width = window.innerWidth;
    gameCanvas.height = window.innerHeight;

    const ctx = gameCanvas.getContext("2d");

    const map = [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 2],
        [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
        [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0],
        [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 1, 0, 1, 0, 0, 0, 0],
        [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0],
        [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0],
        [1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 0, 1, 1, 0, 0, 0],
        [1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0],
        [1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0],
        [1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 1, 0, 1, 0, 0, 0, 0],
        [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 0],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
        [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
        [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ];

    let tiles: Tile[][] = [[]];

    for (let r = 0; r < map.length; r++) {
        for (let c = 0; c < map[r].length; c++) {
            tiles[r].push(new Tile(map[r][c], r, c));
        }
        tiles.push([]);
    }

    window.requestAnimationFrame((timestamp) => {
        loop(timestamp, ctx, new Game(tiles, []))
    });
}

window.onload = main;
