const b3 = window.b3;
const { Sprite, Texture } = PIXI;

class Wander extends b3.Action {
  tick(tick) {
    const agent = tick.target;
    agent.vx = (Math.random()-0.5) * 1;
    return b3.SUCCESS;
  }
}

export function initAgents(app, engine, grid) {
  const sprite = new Sprite(Texture.WHITE);
  sprite.width = sprite.height = 16;
  sprite.anchor.set(0.5);
  sprite.tint = 0x996633;
  sprite.position.set(256, 100);
  app.stage.addChild(sprite);

  const agent = { sprite, vx:0 };
  const tree = new b3.BehaviorTree();
  tree.load({
    title: 'Villager',
    root: '1',
    nodes: {
      '1': { id:'1', name:'MemSequence', children:['2','3'] },
      '2': { id:'2', name:'Wait', properties:{ milliseconds:1000 } },
      '3': { id:'3', name:'Wander' }
    },
    custom_nodes:[{ name:'Wander', category:'action' }]
  });
  tree._nodes['3'] = new Wander();
  const blackboard = new b3.Blackboard();

  app.ticker.add(() => {
    tree.tick(agent, blackboard);
    agent.sprite.x += agent.vx;
  });
}
