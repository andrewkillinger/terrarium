export class Villager {
  constructor(engine, grid, treeData) {
    this.grid = grid;
    this.body = Matter.Bodies.rectangle(256, 120, 16, 32, { frictionAir: 0.2 });
    Matter.World.add(engine.world, this.body);
    this.tree = new b3.BehaviorTree();
    this.tree.load(treeData, {
      wander: Wander,
      plant: Plant
    });
    this.blackboard = new b3.Blackboard();
  }
  update() {
    this.tree.tick(this, this.blackboard);
  }
}

class Wander extends b3.Action {
  tick(tick) {
    const body = tick.target.body;
    Matter.Body.applyForce(body, body.position, { x: (Math.random() - 0.5) * 0.0005, y: 0 });
    return b3.SUCCESS;
  }
}

class Plant extends b3.Action {
  tick(tick) {
    const { grid, body } = tick.target;
    const gx = Math.floor(body.position.x / 8);
    const gy = Math.floor(body.position.y / 8) + 1;
    if (grid.inBounds(gx, gy)) grid.set(gx, gy, 'SEED');
    return b3.SUCCESS;
  }
}
