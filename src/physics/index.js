const Matter = window.Matter;
const { Graphics } = PIXI;

export function initPhysics(app) {
  const engine = Matter.Engine.create();
  const runner = Matter.Runner.create();
  const bodies = [
    Matter.Bodies.rectangle(256, 280, 512, 16, { isStatic: true }),
    Matter.Bodies.circle(200, 100, 10),
    Matter.Bodies.rectangle(300, 100, 20, 20)
  ];
  Matter.World.add(engine.world, bodies);
  Matter.Runner.run(runner, engine);

  const gfx = new Graphics();
  app.stage.addChild(gfx);

  function render() {
    gfx.clear();
    gfx.beginFill(0x999999);
    bodies.forEach(b => {
      const verts = b.vertices;
      gfx.moveTo(verts[0].x, verts[0].y);
      for (let i = 1; i < verts.length; i++) {
        gfx.lineTo(verts[i].x, verts[i].y);
      }
      gfx.closePath();
    });
    gfx.endFill();
  }

  return { engine, runner, bodies, render };
}
