/* HIGHFLY P5.4.4: settlement design + lossless source importer core.
 * Guildhall source compositions copyright Codestz, MIT; see docs/licenses/GUILDHALL-MIT.txt.
 * Upstream declares art CC0; verify each exact model before publishing.
 * This is not a runtime or editor integration. No NPCs or quests instantiated.
 */
export const SOURCE_TILES = [
 {
  "id": "house-pair",
  "name": "Two cottages",
  "ground": "grass",
  "group": "town",
  "pieces": [
   {
    "piece": "kaykit-hexagon/building-home-a-red",
    "rot": 0,
    "scale": 0.39,
    "x": -0.95,
    "z": -0.6
   },
   {
    "piece": "kaykit-hexagon/building-home-a-blue",
    "rot": -0.5,
    "scale": 0.36,
    "x": 1.1,
    "z": -0.2
   },
   {
    "piece": "kenney-nature/pot-small",
    "rot": 0,
    "scale": 0.32,
    "x": -0.25,
    "z": 2.2
   },
   {
    "piece": "kenney-nature/flower-purple-a",
    "rot": 0,
    "scale": 0.7,
    "x": -0.25,
    "y": 0.3,
    "z": 2.2
   },
   {
    "piece": "kaykit-dungeon/barrel-small",
    "rot": 0,
    "scale": 0.45,
    "x": 2,
    "z": 1.2
   },
   {
    "piece": "kenney-nature/fence-simple-low",
    "rot": 3.142,
    "scale": 0.448,
    "x": 0,
    "z": 2.604
   }
  ],
  "blockers": [
   {
    "of": 4
   }
  ],
  "spots": [
   {
    "clip": "Idle_B",
    "facing": 1.047,
    "hours": [
     8,
     20
    ],
    "kind": "talk",
    "x": -1.5,
    "z": 1.55
   },
   {
    "clip": "Waving",
    "facing": -2.094,
    "hours": [
     8,
     20
    ],
    "kind": "talk",
    "x": -0.6,
    "z": 1.8
   }
  ]
 },
 {
  "id": "cottage-garden",
  "name": "Cottage with a garden",
  "ground": "grass",
  "group": "town",
  "pieces": [
   {
    "piece": "kaykit-hexagon/building-home-a-yellow",
    "rot": -0.3,
    "scale": 0.5,
    "x": 0.5,
    "z": -0.6
   },
   {
    "piece": "kenney-town/hedge",
    "rot": 0.5,
    "scale": 0.5,
    "x": -2.088,
    "z": 1.395
   },
   {
    "piece": "kenney-town/hedge",
    "rot": 1.6,
    "scale": 0.5,
    "x": -2,
    "z": 0
   },
   {
    "piece": "kenney-graveyard/bench",
    "rot": 0.4,
    "scale": 0.55,
    "x": -0.6,
    "z": 0.4
   },
   {
    "piece": "kenney-nature/flower-red-a",
    "rot": 0,
    "scale": 1,
    "x": 1.3,
    "z": 1.4
   },
   {
    "piece": "kenney-nature/flower-purple-a",
    "rot": 0,
    "scale": 1,
    "x": 0.6,
    "z": 1.8
   },
   {
    "piece": "kenney-nature/flower-yellow-a",
    "rot": 0,
    "scale": 1,
    "x": 1.9,
    "z": 0.9
   }
  ],
  "blockers": [
   {
    "of": 1
   },
   {
    "of": 2
   },
   {
    "of": 3
   }
  ],
  "spots": [
   {
    "clip": "Sit_Chair_Idle",
    "facing": 0.4,
    "kind": "sit",
    "x": -0.807,
    "z": 0.553
   },
   {
    "clip": "Sit_Chair_Idle",
    "facing": 0.4,
    "kind": "sit",
    "x": -0.346,
    "z": 0.358
   },
   {
    "clip": "Idle_B",
    "facing": 1.047,
    "hours": [
     8,
     20
    ],
    "kind": "talk",
    "x": -0.05,
    "z": 1.55
   },
   {
    "clip": "Waving",
    "facing": -2.094,
    "hours": [
     8,
     20
    ],
    "kind": "talk",
    "x": 0.85,
    "z": 1.8
   }
  ]
 },
 {
  "id": "smithy-yard",
  "name": "Smithy with a yard",
  "ground": "dirt",
  "group": "town",
  "pieces": [
   {
    "piece": "kaykit-hexagon/building-blacksmith-red",
    "rot": 0.3,
    "scale": 0.48,
    "x": -0.3,
    "z": -0.5
   },
   {
    "piece": "kenney-survival/workbench-anvil",
    "rot": 0.4,
    "scale": 0.9,
    "x": 1.4,
    "z": 0.9
   },
   {
    "piece": "kaykit-resources/iron-bars-stack-medium",
    "rot": 0,
    "scale": 0.6,
    "x": 1.9,
    "z": -0.2
   },
   {
    "piece": "kaykit-resources/wood-log-stack",
    "rot": 0.5,
    "scale": 0.55,
    "x": -1.6,
    "z": 1.3
   },
   {
    "piece": "kenney-pirate/barrel",
    "rot": 0,
    "scale": 0.38,
    "x": 2.05,
    "z": 1.65
   }
  ],
  "blockers": [
   {
    "of": 1
   },
   {
    "of": 2
   },
   {
    "of": 3
   },
   {
    "of": 4
   }
  ],
  "spots": [
   {
    "clip": "Hammering",
    "facing": 2.481,
    "kind": "work",
    "prop": "kaykit-tools/hammer",
    "roles": [
     "smith"
    ],
    "x": 0.895,
    "z": 1.469
   },
   {
    "clip": "Chopping",
    "facing": -2.078,
    "kind": "work",
    "prop": "kaykit-tools/axe",
    "roles": [
     "smith"
    ],
    "x": -0.975,
    "z": 1.647
   }
  ]
 },
 {
  "id": "tavern-yard",
  "name": "Tavern with a beer garden",
  "ground": "grass",
  "group": "town",
  "pieces": [
   {
    "piece": "kaykit-hexagon/building-tavern-red",
    "rot": 0,
    "scale": 0.48,
    "x": 0.35,
    "z": -0.75
   },
   {
    "piece": "kaykit-dungeon/table-long",
    "rot": 1.571,
    "scale": 0.45,
    "x": -1.3,
    "z": 1.6
   },
   {
    "piece": "kenney-graveyard/bench",
    "rot": 0,
    "scale": 0.62,
    "x": -1.3,
    "z": 0.9
   },
   {
    "piece": "kenney-graveyard/bench",
    "rot": 3.142,
    "scale": 0.62,
    "x": -1.3,
    "z": 2.3
   },
   {
    "piece": "kenney-pirate/barrel",
    "rot": 0,
    "scale": 0.42,
    "x": 1.15,
    "z": 1.55
   },
   {
    "piece": "kaykit-dungeon/stool",
    "rot": 0,
    "scale": 0.47,
    "x": 1.148,
    "z": 1.95
   },
   {
    "piece": "kaykit-dungeon/stool",
    "rot": 0,
    "scale": 0.47,
    "x": 1.65,
    "z": 2
   },
   {
    "piece": "kenney-pirate/barrel",
    "rot": 0.5,
    "scale": 0.42,
    "x": 2.25,
    "z": 0.35
   },
   {
    "piece": "kenney-pirate/barrel",
    "rot": 0,
    "scale": 0.42,
    "x": 2,
    "z": 0.85
   },
   {
    "piece": "kenney-survival/signpost",
    "rot": 1.1,
    "scale": 0.9,
    "x": -2.3,
    "z": -0.2
   },
   {
    "piece": "kaykit-halloween/post-lantern",
    "rot": 0,
    "scale": 0.55,
    "x": -2.35,
    "z": 0.05
   }
  ],
  "blockers": [
   {
    "of": 1
   },
   {
    "of": 2
   },
   {
    "of": 3
   },
   {
    "of": 4
   },
   {
    "of": 5
   },
   {
    "of": 6
   },
   {
    "of": 7
   },
   {
    "of": 8
   },
   {
    "of": 10
   }
  ],
  "spots": [
   {
    "clip": "Sit_Chair_Idle",
    "facing": 0,
    "hours": [
     17,
     1
    ],
    "kind": "sit",
    "prop": "kaykit-adventurers/mug-full",
    "x": -1.55,
    "z": 0.96
   },
   {
    "clip": "Sit_Chair_Idle",
    "facing": 0,
    "hours": [
     17,
     1
    ],
    "kind": "sit",
    "prop": "kaykit-adventurers/mug-full",
    "x": -1.05,
    "z": 0.96
   },
   {
    "clip": "Sit_Chair_Idle",
    "facing": 3.142,
    "hours": [
     17,
     1
    ],
    "kind": "sit",
    "prop": "kaykit-adventurers/mug-full",
    "x": -1.05,
    "z": 2.24
   },
   {
    "clip": "Sit_Chair_Idle",
    "facing": 3.142,
    "hours": [
     17,
     1
    ],
    "kind": "sit",
    "prop": "kaykit-adventurers/mug-full",
    "x": -1.55,
    "z": 2.24
   },
   {
    "clip": "Sit_Chair_Idle",
    "facing": 2.297,
    "hours": [
     17,
     1
    ],
    "kind": "sit",
    "prop": "kaykit-adventurers/mug-full",
    "x": 0.7,
    "z": 1.95
   },
   {
    "clip": "Sit_Chair_Idle",
    "facing": -2.304,
    "hours": [
     17,
     1
    ],
    "kind": "sit",
    "prop": "kaykit-adventurers/mug-full",
    "x": 1.65,
    "z": 2
   },
   {
    "clip": "Interact",
    "facing": 1.571,
    "kind": "work",
    "roles": [
     "tavern-keeper"
    ],
    "x": 2.493,
    "z": 0.872
   },
   {
    "clip": "Idle_B",
    "facing": -2.65,
    "hours": [
     17,
     1
    ],
    "kind": "work",
    "roles": [
     "bard"
    ],
    "x": 0.1,
    "z": 2.6
   }
  ]
 },
 {
  "id": "market-square",
  "name": "Market square",
  "ground": "paved",
  "group": "town",
  "footprint": [
   3,
   5
  ],
  "pieces": [
   {
    "piece": "kenney-town/fountain-round-detail",
    "pin": true,
    "rot": 0,
    "scale": 0.36,
    "x": 0,
    "z": 0.9
   },
   {
    "piece": "kenney-town/stall-red",
    "rot": 0,
    "scale": 0.42,
    "x": 0,
    "z": -1.85
   },
   {
    "piece": "kenney-town/stall-green",
    "rot": 0.927,
    "scale": 0.42,
    "x": -2,
    "z": -0.6
   },
   {
    "piece": "kenney-town/stall-green",
    "rot": -0.927,
    "scale": 0.42,
    "x": 2,
    "z": -0.6
   },
   {
    "piece": "kenney-town/stall-red",
    "rot": 2.084,
    "scale": 0.42,
    "x": -2.75,
    "z": 2.45
   },
   {
    "piece": "kenney-town/stall-red",
    "rot": -2.084,
    "scale": 0.42,
    "x": 2.75,
    "z": 2.45
   },
   {
    "piece": "kaykit-halloween/post-lantern",
    "rot": -0.8,
    "scale": 0.55,
    "x": -1.35,
    "z": 2.45
   },
   {
    "piece": "kaykit-halloween/post-lantern",
    "rot": 0.8,
    "scale": 0.55,
    "x": 1.35,
    "z": 2.45
   },
   {
    "piece": "kenney-town/cart-high",
    "rot": 0.9,
    "scale": 0.38,
    "x": -5.35,
    "z": 3.3
   },
   {
    "piece": "kenney-pirate/crate",
    "rot": 0.2,
    "scale": 0.45,
    "x": -5.9,
    "z": 2.1
   },
   {
    "piece": "kenney-pirate/crate",
    "pin": true,
    "rot": 0.6,
    "scale": 0.42,
    "x": -5.9,
    "y": 0.35,
    "z": 2.1
   },
   {
    "piece": "kenney-pirate/crate-bottles",
    "rot": 0.9,
    "scale": 0.45,
    "x": -5.45,
    "z": 1.7
   },
   {
    "piece": "kaykit-dungeon/barrel-small",
    "rot": 0,
    "scale": 0.45,
    "x": -6.3,
    "z": 2.6
   },
   {
    "piece": "kenney-town/cart",
    "rot": -0.9,
    "scale": 0.4,
    "x": 5.35,
    "z": 3.3
   },
   {
    "piece": "kenney-pirate/barrel",
    "rot": 0,
    "scale": 0.38,
    "x": 5.95,
    "z": 2.2
   },
   {
    "piece": "kenney-pirate/barrel",
    "rot": 0.4,
    "scale": 0.38,
    "x": 6.3,
    "z": 2.65
   },
   {
    "piece": "kaykit-dungeon/barrel-small-stack",
    "rot": -0.5,
    "scale": 0.4,
    "x": 5.6,
    "z": 1.7
   },
   {
    "piece": "kaykit-resources/textiles-stack-large-colored",
    "rot": 0.3,
    "scale": 0.42,
    "x": 4.4,
    "z": 1.25
   }
  ],
  "blockers": [
   {
    "of": 0
   },
   {
    "of": 1
   },
   {
    "of": 2
   },
   {
    "of": 3
   },
   {
    "of": 4
   },
   {
    "of": 5
   },
   {
    "of": 6
   },
   {
    "of": 7
   },
   {
    "of": 8
   },
   {
    "of": 9
   },
   {
    "of": 10
   },
   {
    "of": 11
   },
   {
    "of": 12
   },
   {
    "of": 13
   },
   {
    "of": 14
   },
   {
    "of": 15
   },
   {
    "of": 16
   },
   {
    "of": 17
   }
  ],
  "spots": [
   {
    "clip": "Idle_A",
    "facing": 0,
    "kind": "work",
    "roles": [
     "merchant"
    ],
    "x": -0.64,
    "z": -2.3
   },
   {
    "clip": "Interact",
    "facing": 3.142,
    "kind": "stand",
    "x": 0,
    "z": -0.7
   },
   {
    "clip": "Idle_A",
    "facing": 0.927,
    "kind": "work",
    "roles": [
     "merchant"
    ],
    "x": -1.907,
    "z": -1.323
   },
   {
    "clip": "Idle_B",
    "facing": -2.214,
    "kind": "stand",
    "x": -1.2,
    "z": 0
   },
   {
    "clip": "Idle_A",
    "facing": -0.927,
    "kind": "work",
    "roles": [
     "merchant"
    ],
    "x": 2.04,
    "z": -1.424
   },
   {
    "clip": "Interact",
    "facing": 2.214,
    "kind": "stand",
    "x": 1.2,
    "z": 0
   },
   {
    "clip": "Idle_A",
    "facing": 2.084,
    "kind": "work",
    "roles": [
     "merchant"
    ],
    "x": -3.523,
    "z": 2.886
   },
   {
    "clip": "Interact",
    "facing": -1.058,
    "kind": "stand",
    "x": -1.88,
    "z": 1.96
   },
   {
    "clip": "Idle_A",
    "facing": -2.084,
    "kind": "work",
    "roles": [
     "merchant"
    ],
    "x": 3.523,
    "z": 2.886
   },
   {
    "clip": "Idle_B",
    "facing": 1.058,
    "kind": "stand",
    "x": 1.88,
    "z": 1.96
   },
   {
    "clip": "Idle_B",
    "facing": 0.91,
    "kind": "talk",
    "x": -4,
    "z": 3.5
   },
   {
    "clip": "Idle_B",
    "facing": -2.23,
    "kind": "talk",
    "x": -3.55,
    "z": 3.85
   }
  ]
 },
 {
  "id": "farmstead-yard",
  "name": "Farmstead with its barn, pen and haystacks",
  "ground": "grass",
  "group": "country",
  "footprint": [
   1,
   2
  ],
  "pieces": [
   {
    "piece": "kaykit-hexagon/building-home-a-yellow",
    "rot": 0,
    "scale": 0.47,
    "x": 0.55,
    "z": -0.6
   },
   {
    "piece": "kenney-graveyard/bench",
    "rot": 0.2,
    "scale": 0.5,
    "x": -1.25,
    "z": 1.05
   },
   {
    "piece": "kaykit-resources/wood-log-stack",
    "rot": -0.4,
    "scale": 0.5,
    "x": 2.1,
    "z": 0.55
   },
   {
    "piece": "kaykit-hexagon/building-well-yellow",
    "rot": 0.6,
    "scale": 0.3,
    "x": -1.95,
    "z": -1.15
   },
   {
    "piece": "kenney-survival/structure-roof",
    "rot": 0,
    "scale": 0.82,
    "x": 0.6,
    "z": -6.119
   },
   {
    "piece": "kenney-graveyard/hay-bale-bundled",
    "rot": 0,
    "scale": 0.7,
    "x": 0.15,
    "z": -6.369
   },
   {
    "piece": "kenney-graveyard/hay-bale",
    "rot": 0.1,
    "scale": 0.7,
    "x": 1.05,
    "z": -6.319
   },
   {
    "piece": "kenney-graveyard/hay-bale",
    "rot": 0,
    "scale": 0.7,
    "x": 0.6,
    "z": -6.369
   },
   {
    "piece": "kenney-graveyard/hay-bale-bundled",
    "rot": 1.2,
    "scale": 0.7,
    "x": 1.95,
    "z": -4.619
   },
   {
    "piece": "kenney-graveyard/hay-bale",
    "rot": 1.5,
    "scale": 0.7,
    "x": 2.15,
    "z": -5.219
   },
   {
    "piece": "kenney-graveyard/hay-bale",
    "rot": 0,
    "scale": 0.7,
    "x": 0.62,
    "y": 0.55,
    "z": -6.369
   },
   {
    "piece": "kenney-nature/log-stack",
    "rot": 0.4,
    "scale": 0.45,
    "x": -1.55,
    "z": -6.819
   },
   {
    "piece": "kenney-graveyard/shovel-dirt",
    "rot": 0.6,
    "scale": 0.6,
    "x": 2.25,
    "z": -6.519
   },
   {
    "piece": "kenney-town/cart-high",
    "rot": 2.6,
    "scale": 0.36,
    "x": -1.6,
    "z": -5.069
   },
   {
    "piece": "kenney-nature/fence-simple",
    "rot": -1.047,
    "scale": 0.55,
    "x": -2.961,
    "z": -3.659
   },
   {
    "piece": "kenney-nature/fence-simple",
    "rot": 0,
    "scale": 0.55,
    "x": -4.65,
    "z": -4.634
   },
   {
    "piece": "kenney-nature/fence-simple",
    "rot": 1.047,
    "scale": 0.55,
    "x": -6.338,
    "z": -3.659
   },
   {
    "piece": "kenney-nature/fence-simple",
    "rot": 2.094,
    "scale": 0.55,
    "x": -6.338,
    "z": -1.709
   },
   {
    "piece": "kenney-nature/fence-simple",
    "rot": 3.142,
    "scale": 0.55,
    "x": -4.65,
    "z": -0.734
   },
   {
    "piece": "kenney-nature/fence-gate",
    "rot": 4.189,
    "scale": 0.55,
    "x": -2.961,
    "z": -1.709
   },
   {
    "piece": "kenney-nature/pot-large",
    "rot": 0.5,
    "scale": 0.5,
    "x": -4.95,
    "z": -3.084
   },
   {
    "piece": "kenney-survival/bucket",
    "rot": 0,
    "scale": 0.8,
    "x": -4.1,
    "z": -2.334
   },
   {
    "piece": "kenney-graveyard/hay-bale",
    "rot": 2,
    "scale": 0.6,
    "x": -4.2,
    "z": -3.484
   },
   {
    "piece": "kenney-graveyard/hay-bale-bundled",
    "rot": 0.5,
    "scale": 0.7,
    "x": -2.75,
    "z": -2.95
   },
   {
    "piece": "kenney-graveyard/hay-bale-bundled",
    "rot": 0.3,
    "scale": 0.7,
    "x": -2.35,
    "z": -3.55
   },
   {
    "piece": "kenney-nature/crops-wheat-stage-b",
    "rot": 0,
    "scale": 0.6,
    "x": -1,
    "z": -3.6
   }
  ],
  "blockers": [
   {
    "of": 1
   },
   {
    "of": 2
   },
   {
    "of": 10
   },
   {
    "of": 11
   },
   {
    "of": 8
   },
   {
    "of": 13
   },
   {
    "r": 0.32,
    "x": -3.236,
    "z": -4.136
   },
   {
    "r": 0.32,
    "x": -2.686,
    "z": -3.183
   },
   {
    "r": 0.32,
    "x": -5.2,
    "z": -4.634
   },
   {
    "r": 0.32,
    "x": -4.1,
    "z": -4.634
   },
   {
    "r": 0.32,
    "x": -6.613,
    "z": -3.183
   },
   {
    "r": 0.32,
    "x": -6.063,
    "z": -4.136
   },
   {
    "r": 0.32,
    "x": -6.063,
    "z": -1.233
   },
   {
    "r": 0.32,
    "x": -6.613,
    "z": -2.186
   },
   {
    "r": 0.32,
    "x": -4.1,
    "z": -0.734
   },
   {
    "r": 0.32,
    "x": -5.2,
    "z": -0.734
   },
   {
    "of": 20
   },
   {
    "of": 22
   },
   {
    "of": 23
   },
   {
    "of": 24
   }
  ],
  "spots": [
   {
    "clip": "PickUp",
    "facing": 3.142,
    "hours": [
     6,
     19
    ],
    "kind": "work",
    "roles": [
     "farmer"
    ],
    "x": -0.067,
    "z": -5.617
   },
   {
    "clip": "Working_A",
    "facing": 1.571,
    "hours": [
     6,
     19
    ],
    "kind": "work",
    "roles": [
     "farmer"
    ],
    "x": 1.27,
    "z": -4.919
   },
   {
    "clip": "Interact",
    "facing": 3.142,
    "hours": [
     6,
     19
    ],
    "kind": "work",
    "prop": "kaykit-tools/bucket-metal",
    "roles": [
     "farmer"
    ],
    "x": -4.9,
    "z": -2.334
   },
   {
    "clip": "Chopping",
    "facing": 2.842,
    "hours": [
     6,
     19
    ],
    "kind": "work",
    "prop": "kaykit-tools/axe",
    "roles": [
     "farmer"
    ],
    "x": 1.85,
    "z": 1.45
   },
   {
    "clip": "Interact",
    "facing": -2.356,
    "hours": [
     6,
     19
    ],
    "kind": "work",
    "prop": "kaykit-tools/bucket-metal",
    "roles": [
     "farmer"
    ],
    "x": -1.35,
    "z": -0.5
   },
   {
    "clip": "Sit_Chair_Idle",
    "facing": 0.2,
    "kind": "sit",
    "x": -1.42,
    "y": -0.06,
    "z": 1.12
   },
   {
    "clip": "Sit_Chair_Idle",
    "facing": 0.2,
    "kind": "sit",
    "x": -0.98,
    "y": -0.06,
    "z": 1.03
   },
   {
    "clip": "Idle_B",
    "facing": -0.927,
    "hours": [
     10,
     19
    ],
    "kind": "talk",
    "x": 0.6,
    "z": 1.55
   }
  ]
 },
 {
  "id": "town-hall-plaza",
  "name": "Town hall on its plaza",
  "ground": "paved",
  "group": "town",
  "footprint": [
   1
  ],
  "pieces": [
   {
    "piece": "kaykit-hexagon/building-barracks-red",
    "rot": 0,
    "scale": 0.4,
    "x": 0,
    "z": -5.519
   },
   {
    "piece": "kaykit-dungeon/banner-shield-red",
    "rot": 0,
    "scale": 0.32,
    "x": -1.05,
    "z": -3.119
   },
   {
    "piece": "kaykit-dungeon/banner-shield-red",
    "rot": 0,
    "scale": 0.32,
    "x": 1.05,
    "z": -3.119
   },
   {
    "piece": "kenney-town/fountain-round-detail",
    "rot": 0,
    "scale": 0.36,
    "swatchMap": {
     "20": 61,
     "30": 60,
     "31": 61,
     "32": 62
    },
    "x": 0,
    "z": -0.35
   },
   {
    "piece": "kenney-graveyard/bench",
    "rot": 1.25,
    "scale": 0.55,
    "x": -2.05,
    "z": 0.6
   },
   {
    "piece": "kenney-graveyard/bench",
    "rot": -1.25,
    "scale": 0.55,
    "x": 2.05,
    "z": 0.6
   },
   {
    "piece": "kaykit-halloween/post-lantern",
    "rot": 1.034,
    "scale": 0.55,
    "x": -2.1,
    "z": -1.25
   },
   {
    "piece": "kaykit-halloween/post-lantern",
    "rot": -1.034,
    "scale": 0.55,
    "x": 2.1,
    "z": -1.25
   },
   {
    "piece": "kaykit-halloween/post-lantern",
    "rot": 2.514,
    "scale": 0.55,
    "x": -1.45,
    "z": 2
   },
   {
    "piece": "kaykit-halloween/post-lantern",
    "rot": -2.514,
    "scale": 0.55,
    "x": 1.45,
    "z": 2
   },
   {
    "piece": "kenney-nature/sign",
    "pin": true,
    "rot": -1.571,
    "scale": 0.75,
    "swatchMap": {
     "52": 22,
     "53": 23
    },
    "x": -2.35,
    "z": -0.35
   },
   {
    "piece": "kaykit-tools/map-empty",
    "pin": true,
    "rot": 1.571,
    "scale": 0.2,
    "tilt": [
     1.571,
     0.08
    ],
    "x": -2.26,
    "y": 0.95,
    "z": -0.15
   },
   {
    "piece": "kaykit-tools/map-empty",
    "pin": true,
    "rot": 1.571,
    "scale": 0.18,
    "tilt": [
     1.571,
     -0.06
    ],
    "x": -2.26,
    "y": 0.98,
    "z": -0.55
   },
   {
    "piece": "kaykit-tools/map",
    "pin": true,
    "rot": 1.571,
    "scale": 0.16,
    "tilt": [
     1.571,
     0.03
    ],
    "x": -2.26,
    "y": 0.76,
    "z": -0.37
   }
  ],
  "blockers": [
   {
    "of": 1
   },
   {
    "of": 2
   },
   {
    "of": 3
   },
   {
    "of": 4
   },
   {
    "of": 5
   },
   {
    "of": 6
   },
   {
    "of": 7
   },
   {
    "of": 8
   },
   {
    "of": 9
   },
   {
    "of": 10
   }
  ],
  "spots": [
   {
    "clip": "Waving",
    "facing": -1.722,
    "hours": [
     11,
     21
    ],
    "kind": "talk",
    "x": 1.644,
    "z": -0.949
   },
   {
    "clip": "Waving",
    "facing": 0.373,
    "hours": [
     11,
     21
    ],
    "kind": "talk",
    "x": -1.341,
    "z": -1.475
   },
   {
    "clip": "Idle_B",
    "facing": 2.594,
    "hours": [
     11,
     21
    ],
    "kind": "talk",
    "x": -1.516,
    "z": 0.525
   },
   {
    "clip": "Waving",
    "facing": 2.467,
    "hours": [
     11,
     21
    ],
    "kind": "talk",
    "x": -0.304,
    "z": 1.373
   },
   {
    "clip": "Idle_B",
    "facing": -1.594,
    "hours": [
     11,
     21
    ],
    "kind": "talk",
    "x": 1.516,
    "z": 0.525
   },
   {
    "clip": "Sit_Chair_Idle",
    "facing": 1.25,
    "hours": [
     8,
     21
    ],
    "kind": "sit",
    "x": -2.119,
    "y": -0.06,
    "z": 0.809
   },
   {
    "clip": "Sit_Chair_Idle",
    "facing": 1.25,
    "hours": [
     8,
     21
    ],
    "kind": "sit",
    "x": -1.981,
    "y": -0.06,
    "z": 0.391
   },
   {
    "clip": "Sit_Chair_Idle",
    "facing": -1.25,
    "hours": [
     8,
     21
    ],
    "kind": "sit",
    "x": 1.981,
    "y": -0.06,
    "z": 0.391
   },
   {
    "clip": "Sit_Chair_Idle",
    "facing": -1.25,
    "hours": [
     8,
     21
    ],
    "kind": "sit",
    "x": 2.119,
    "y": -0.06,
    "z": 0.809
   },
   {
    "clip": "Idle_A",
    "facing": 3.142,
    "hours": [
     8,
     18
    ],
    "kind": "stand",
    "x": -0.75,
    "z": -1.7
   },
   {
    "clip": "Idle_A",
    "facing": 2.742,
    "hours": [
     8,
     18
    ],
    "kind": "stand",
    "x": -0.15,
    "z": -1.85
   },
   {
    "clip": "Idle_A",
    "facing": 0,
    "kind": "work",
    "roles": [
     "guard"
    ],
    "x": -0.75,
    "z": -2.619
   },
   {
    "clip": "Idle_A",
    "facing": 0,
    "kind": "work",
    "roles": [
     "guard"
    ],
    "x": 0.75,
    "z": -2.619
   }
  ]
 },
 {
  "id": "mine",
  "name": "Mine",
  "ground": "rock",
  "group": "landmark",
  "pieces": [
   {
    "piece": "kaykit-hexagon/building-mine-blue",
    "rot": 0,
    "scale": 0.36,
    "x": 0,
    "z": -0.4
   },
   {
    "piece": "kaykit-resources/stone-chunks-large",
    "rot": 0,
    "scale": 0.55,
    "x": 1.95,
    "z": 1.35
   },
   {
    "piece": "kaykit-resources/stone-chunks-large",
    "rot": 2.1,
    "scale": 0.45,
    "x": -1.95,
    "z": 1.35
   }
  ],
  "blockers": [
   {
    "of": 1
   },
   {
    "of": 2
   }
  ],
  "spots": [
   {
    "clip": "Pickaxing",
    "facing": 2.28,
    "kind": "work",
    "prop": "kaykit-tools/pickaxe",
    "roles": [
     "miner"
    ],
    "x": 1.25,
    "z": 1.95
   },
   {
    "clip": "Pickaxing",
    "facing": -2.28,
    "kind": "work",
    "prop": "kaykit-tools/pickaxe",
    "roles": [
     "miner"
    ],
    "x": -1.3,
    "z": 1.95
   }
  ]
 },
 {
  "id": "windmill",
  "name": "Windmill",
  "ground": "grass",
  "group": "landmark",
  "pieces": [
   {
    "piece": "kaykit-hexagon/building-windmill-yellow",
    "rot": 0,
    "scale": 0.5,
    "x": 0,
    "z": 0
   },
   {
    "piece": "kenney-nature/crops-leafs-stage-b",
    "rot": 0,
    "scale": 0.55,
    "x": 1.8,
    "z": 1.4
   },
   {
    "piece": "kenney-nature/crop-pumpkin",
    "rot": 0,
    "scale": 0.55,
    "x": 1.2,
    "z": 1.9
   }
  ],
  "blockers": [],
  "spots": [
   {
    "clip": "Digging",
    "facing": -0.524,
    "hours": [
     7,
     18
    ],
    "kind": "work",
    "prop": "kenney-survival/tool-hoe",
    "roles": [
     "farmer"
    ],
    "x": 1.3,
    "z": 1.75
   }
  ]
 },
 {
  "id": "archery-range",
  "name": "Archery range with butts",
  "ground": "dirt",
  "group": "town",
  "footprint": [
   0
  ],
  "pieces": [
   {
    "piece": "kaykit-hexagon/building-archeryrange-red",
    "rot": 0.815,
    "scale": 0.3,
    "x": -2.241,
    "z": -0.381
   },
   {
    "piece": "kaykit-resources/wood-plank-a",
    "rot": 0.524,
    "scale": 0.6,
    "x": 0.408,
    "z": -1.794
   },
   {
    "piece": "kaykit-resources/wood-plank-a",
    "rot": 0.524,
    "scale": 0.6,
    "x": 0.858,
    "z": -1.015
   },
   {
    "piece": "kaykit-resources/wood-plank-a",
    "rot": 0.524,
    "scale": 0.6,
    "x": 1.308,
    "z": -0.235
   },
   {
    "piece": "kaykit-resources/wood-plank-a",
    "rot": 0.524,
    "scale": 0.6,
    "x": 1.758,
    "z": 0.544
   },
   {
    "piece": "kenney-graveyard/hay-bale",
    "rot": 2.0947963267948966,
    "scale": 0.62,
    "x": 5.785,
    "z": -4.379
   },
   {
    "piece": "kaykit-adventurers/shield-round-color",
    "rot": -1.047,
    "scale": 1.05,
    "x": 5.482,
    "y": 0.5,
    "z": -4.204
   },
   {
    "piece": "kenney-graveyard/hay-bale",
    "rot": 2.0947963267948966,
    "scale": 0.62,
    "x": 6.235,
    "z": -3.6
   },
   {
    "piece": "kaykit-adventurers/shield-round-color",
    "rot": -1.047,
    "scale": 1.05,
    "x": 5.932,
    "y": 0.5,
    "z": -3.425
   },
   {
    "piece": "kenney-graveyard/hay-bale",
    "rot": 2.0947963267948966,
    "scale": 0.62,
    "x": 6.685,
    "z": -2.821
   },
   {
    "piece": "kaykit-adventurers/shield-round-color",
    "rot": -1.047,
    "scale": 1.05,
    "x": 6.382,
    "y": 0.5,
    "z": -2.646
   },
   {
    "piece": "kenney-nature/fence-simple-low",
    "rot": 3.6647963267948964,
    "scale": 0.5,
    "x": 1.485,
    "z": -2.728
   },
   {
    "piece": "kenney-nature/fence-simple-low",
    "rot": 3.6647963267948964,
    "scale": 0.5,
    "x": 3.304,
    "z": -3.778
   },
   {
    "piece": "kenney-nature/fence-simple-low",
    "rot": 3.6647963267948964,
    "scale": 0.5,
    "x": 5.122,
    "z": -4.828
   },
   {
    "piece": "kenney-nature/fence-simple-low",
    "rot": 3.6647963267948964,
    "scale": 0.5,
    "x": 3.105,
    "z": 0.078
   },
   {
    "piece": "kenney-nature/fence-simple-low",
    "rot": 3.6647963267948964,
    "scale": 0.5,
    "x": 4.924,
    "z": -0.972
   },
   {
    "piece": "kenney-nature/fence-simple-low",
    "rot": 3.6647963267948964,
    "scale": 0.5,
    "x": 6.742,
    "z": -2.022
   },
   {
    "piece": "kenney-town/poles-horizontal",
    "rot": 2.094,
    "scale": 0.26,
    "x": 1.348,
    "z": 1.935
   },
   {
    "piece": "kaykit-adventurers/bow-with-string",
    "rot": 2.0947963267948966,
    "scale": 0.62,
    "tilt": [
     -1.3507963267948966,
     -0.08
    ],
    "x": 0.93,
    "z": 1.911
   },
   {
    "piece": "kaykit-adventurers/bow-with-string",
    "rot": 2.0947963267948966,
    "scale": 0.62,
    "tilt": [
     -1.3507963267948966,
     0
    ],
    "x": 1.233,
    "z": 1.736
   },
   {
    "piece": "kaykit-adventurers/bow-with-string",
    "rot": 2.0947963267948966,
    "scale": 0.62,
    "tilt": [
     -1.3507963267948966,
     0.08
    ],
    "x": 1.536,
    "z": 1.561
   },
   {
    "piece": "kaykit-adventurers/quiver",
    "rot": -1.047,
    "scale": 0.6,
    "tilt": [
     0.2,
     0
    ],
    "x": 1.923,
    "z": 1.43
   },
   {
    "piece": "kaykit-adventurers/arrow-bow-bundle",
    "rot": 0,
    "scale": 0.55,
    "x": 0.76,
    "z": 2.217
   },
   {
    "piece": "kenney-graveyard/bench",
    "rot": 2.094,
    "scale": 0.5,
    "x": 0.059,
    "z": 2.102
   },
   {
    "piece": "kaykit-dungeon/barrel-small",
    "rot": 0,
    "scale": 0.42,
    "x": -0.109,
    "z": -2.189
   },
   {
    "piece": "kaykit-halloween/post-lantern",
    "rot": 0.524,
    "scale": 0.55,
    "x": -0.822,
    "z": -2.124
   }
  ],
  "blockers": [
   {
    "of": 5
   },
   {
    "of": 7
   },
   {
    "of": 9
   },
   {
    "r": 0.3,
    "x": 0.922,
    "z": -2.403
   },
   {
    "r": 0.3,
    "x": 2.308,
    "z": -3.203
   },
   {
    "r": 0.3,
    "x": 3.693,
    "z": -4.003
   },
   {
    "of": 13
   },
   {
    "r": 0.3,
    "x": 2.542,
    "z": 0.403
   },
   {
    "r": 0.3,
    "x": 3.928,
    "z": -0.397
   },
   {
    "r": 0.3,
    "x": 5.313,
    "z": -1.197
   },
   {
    "of": 16
   },
   {
    "of": 17
   },
   {
    "of": 21
   },
   {
    "of": 22
   },
   {
    "of": 23
   },
   {
    "of": 24
   },
   {
    "of": 25
   }
  ],
  "spots": [
   {
    "clip": "Ranged_Bow_Aiming_Idle",
    "facing": 2.078,
    "kind": "work",
    "prop": "kaykit-adventurers/bow-with-string",
    "roles": [
     "archer"
    ],
    "x": 0.15,
    "z": -1.241
   },
   {
    "clip": "Ranged_Bow_Aiming_Idle",
    "facing": 2.094,
    "kind": "work",
    "prop": "kaykit-adventurers/bow-with-string",
    "roles": [
     "archer"
    ],
    "x": 0.65,
    "z": -0.375
   },
   {
    "clip": "Ranged_Bow_Aiming_Idle",
    "facing": 2.11,
    "kind": "work",
    "prop": "kaykit-adventurers/bow-with-string",
    "roles": [
     "archer"
    ],
    "x": 1.15,
    "z": 0.491
   },
   {
    "clip": "Sit_Chair_Idle",
    "facing": 2.094,
    "kind": "sit",
    "x": -0.039,
    "y": -0.06,
    "z": 1.812
   },
   {
    "clip": "Sit_Chair_Idle",
    "facing": 2.094,
    "kind": "sit",
    "x": 0.261,
    "y": -0.06,
    "z": 2.332
   }
  ]
 },
 {
  "id": "castle",
  "name": "Castle",
  "ground": "rock",
  "group": "landmark",
  "pieces": [
   {
    "piece": "kaykit-hexagon/building-castle-blue",
    "rot": 0,
    "scale": 0.36,
    "x": 0,
    "z": -0.2
   },
   {
    "piece": "kaykit-halloween/post-lantern",
    "rot": 0,
    "scale": 0.55,
    "x": 1.794,
    "z": 1.239
   }
  ],
  "blockers": [
   {
    "of": 1
   }
  ],
  "spots": [
   {
    "clip": "Idle_A",
    "facing": 0,
    "kind": "stand",
    "roles": [
     "guard"
    ],
    "x": -0.75,
    "z": 2.15
   },
   {
    "clip": "Idle_A",
    "facing": 0,
    "kind": "stand",
    "roles": [
     "guard"
    ],
    "x": 0.75,
    "z": 2.15
   }
  ]
 },
 {
  "id": "graveyard",
  "name": "Graveyard",
  "ground": "grass",
  "group": "town",
  "pieces": [
   {
    "piece": "kenney-graveyard/gravestone-round",
    "rot": 0,
    "scale": 0.5,
    "x": -1.4,
    "z": -0.6
   },
   {
    "piece": "kenney-graveyard/gravestone-bevel",
    "rot": 0,
    "scale": 0.5,
    "x": -1.4,
    "z": 0.8
   },
   {
    "piece": "kenney-graveyard/gravestone-cross",
    "rot": 0,
    "scale": 0.5,
    "x": 0,
    "z": -0.6
   },
   {
    "piece": "kenney-graveyard/gravestone-bevel",
    "rot": 0,
    "scale": 0.5,
    "x": 0,
    "z": 0.8
   },
   {
    "piece": "kenney-graveyard/gravestone-round",
    "rot": 0,
    "scale": 0.5,
    "x": 1.4,
    "z": -0.6
   },
   {
    "piece": "kenney-graveyard/gravestone-bevel",
    "rot": 0,
    "scale": 0.5,
    "x": 1.4,
    "z": 0.8
   },
   {
    "piece": "kaykit-forest/tree-bare-1-c-color1",
    "rot": 0,
    "scale": 0.4,
    "x": -1.8,
    "z": 1.5
   },
   {
    "piece": "kenney-nature/fence-simple-low",
    "rot": -1.047,
    "scale": 0.723,
    "x": 2.255,
    "z": -1.302
   },
   {
    "piece": "kenney-nature/fence-simple-low",
    "rot": 0,
    "scale": 0.723,
    "x": 0,
    "z": -2.604
   },
   {
    "piece": "kenney-nature/fence-simple-low",
    "rot": 1.047,
    "scale": 0.723,
    "x": -2.255,
    "z": -1.302
   },
   {
    "piece": "kenney-nature/fence-simple-low",
    "rot": 3.142,
    "scale": 0.723,
    "x": 0,
    "z": 2.604
   },
   {
    "piece": "kenney-nature/fence-simple-low",
    "rot": 4.189,
    "scale": 0.723,
    "x": 2.255,
    "z": 1.302
   }
  ],
  "blockers": [
   {
    "of": 0
   },
   {
    "of": 1
   },
   {
    "of": 2
   },
   {
    "of": 3
   },
   {
    "of": 4
   },
   {
    "of": 5
   },
   {
    "of": 6
   }
  ],
  "spots": [
   {
    "clip": "Idle_A",
    "facing": 3.142,
    "hours": [
     9,
     18
    ],
    "kind": "stand",
    "x": 0.7,
    "z": 0.1
   }
  ]
 },
 {
  "id": "market",
  "name": "Market",
  "ground": "paved",
  "group": "town",
  "pieces": [
   {
    "piece": "kaykit-hexagon/building-market-red",
    "rot": 0,
    "scale": 0.36,
    "x": 0,
    "z": -0.55
   },
   {
    "piece": "kenney-pirate/crate",
    "rot": 0.2,
    "scale": 0.45,
    "x": -2.15,
    "z": 0.95
   },
   {
    "piece": "kenney-pirate/crate",
    "pin": true,
    "rot": 0.7,
    "scale": 0.42,
    "x": -2.15,
    "y": 0.35,
    "z": 0.95
   },
   {
    "piece": "kenney-pirate/crate-bottles",
    "rot": 0.6,
    "scale": 0.45,
    "x": -1.95,
    "z": 1.5
   },
   {
    "piece": "kaykit-dungeon/barrel-small",
    "rot": 0,
    "scale": 0.45,
    "x": 2.2,
    "z": 1.1
   },
   {
    "piece": "kaykit-resources/textiles-stack-large-colored",
    "rot": 0.4,
    "scale": 0.42,
    "x": 2.05,
    "z": 0.45
   },
   {
    "piece": "kaykit-halloween/post-lantern",
    "rot": -0.6,
    "scale": 0.55,
    "x": -1.6,
    "z": 2.15
   }
  ],
  "blockers": [
   {
    "of": 0
   },
   {
    "of": 1
   },
   {
    "of": 2
   },
   {
    "of": 3
   },
   {
    "of": 4
   },
   {
    "of": 5
   },
   {
    "of": 6
   }
  ],
  "spots": [
   {
    "clip": "Idle_A",
    "facing": 0,
    "kind": "work",
    "roles": [
     "merchant"
    ],
    "x": -0.95,
    "z": 1.7
   },
   {
    "clip": "Idle_A",
    "facing": 0,
    "kind": "work",
    "roles": [
     "merchant"
    ],
    "x": 0.95,
    "z": 1.7
   },
   {
    "clip": "Idle_B",
    "facing": 3.142,
    "kind": "stand",
    "x": -0.95,
    "z": 2.4
   },
   {
    "clip": "Interact",
    "facing": 3.142,
    "kind": "stand",
    "x": 0.95,
    "z": 2.4
   }
  ]
 },
 {
  "id": "barracks",
  "name": "Barracks",
  "ground": "dirt",
  "group": "town",
  "pieces": [
   {
    "piece": "kaykit-hexagon/building-barracks-red",
    "rot": 0,
    "scale": 0.44,
    "x": 0,
    "z": 0
   }
  ],
  "blockers": [],
  "spots": [
   {
    "clip": "Melee_2H_Idle",
    "facing": 0,
    "kind": "stand",
    "prop": "kaykit-weapons/sword-a",
    "roles": [
     "guard"
    ],
    "x": -1,
    "z": 2
   },
   {
    "clip": "Idle_A",
    "facing": 0,
    "kind": "stand",
    "roles": [
     "guard"
    ],
    "x": 1,
    "z": 2
   }
  ]
 },
 {
  "id": "dock",
  "name": "Dock",
  "ground": "water",
  "group": "town",
  "pieces": [
   {
    "piece": "kenney-pirate/structure-platform",
    "rot": 0,
    "scale": 0.5,
    "x": 0,
    "z": 2.05
   },
   {
    "piece": "kenney-pirate/structure-platform",
    "rot": 0,
    "scale": 0.5,
    "x": 0,
    "z": 0.05
   },
   {
    "piece": "kenney-pirate/structure-platform",
    "rot": 0,
    "scale": 0.5,
    "x": 0,
    "z": -1.95
   },
   {
    "piece": "kenney-pirate/boat-row-small",
    "rot": 0.1,
    "scale": 0.42,
    "x": 1.45,
    "y": 0.2,
    "z": -0.6
   },
   {
    "piece": "kenney-pirate/crate",
    "rot": 0.3,
    "scale": 0.42,
    "x": -0.3,
    "y": 0.75,
    "z": 1.6
   },
   {
    "piece": "kenney-pirate/barrel",
    "rot": 0,
    "scale": 0.38,
    "x": 0.35,
    "y": 0.75,
    "z": 1.9
   },
   {
    "piece": "kaykit-halloween/post-lantern",
    "rot": 0,
    "scale": 0.5,
    "x": -0.7,
    "y": 0.75,
    "z": -1.6
   }
  ],
  "blockers": [
   {
    "of": 4
   },
   {
    "of": 5
   },
   {
    "of": 6
   }
  ],
  "spots": [
   {
    "clip": "Fishing_Idle",
    "facing": 3.142,
    "kind": "work",
    "prop": "kaykit-weapons/staff-a",
    "roles": [
     "fisher"
    ],
    "x": -0.4,
    "y": 0.75,
    "z": -2.45
   },
   {
    "clip": "Fishing_Idle",
    "facing": 2.443,
    "kind": "work",
    "prop": "kaykit-weapons/staff-a",
    "roles": [
     "fisher"
    ],
    "x": 0.45,
    "y": 0.75,
    "z": -2.15
   }
  ]
 },
 {
  "id": "chapel",
  "name": "Chapel",
  "ground": "grass",
  "group": "town",
  "pieces": [
   {
    "piece": "kaykit-hexagon/building-church-blue",
    "rot": 0,
    "scale": 0.5,
    "x": 0,
    "z": -0.6
   },
   {
    "piece": "kenney-graveyard/gravestone-round",
    "rot": 0,
    "scale": 0.5,
    "x": 1.6,
    "z": 1.3
   },
   {
    "piece": "kenney-graveyard/gravestone-cross",
    "rot": 0.2,
    "scale": 0.5,
    "x": 2.2,
    "z": 0.4
   },
   {
    "piece": "kenney-graveyard/gravestone-bevel",
    "rot": -0.2,
    "scale": 0.5,
    "x": 1,
    "z": 1.9
   }
  ],
  "blockers": [
   {
    "of": 1
   },
   {
    "of": 2
   },
   {
    "of": 3
   }
  ],
  "spots": [
   {
    "clip": "Idle_A",
    "facing": 0,
    "kind": "stand",
    "roles": [
     "monk"
    ],
    "x": 1.946,
    "z": 0.953
   },
   {
    "clip": "Idle_A",
    "facing": 3.142,
    "hours": [
     9,
     12
    ],
    "kind": "stand",
    "x": -1.2,
    "z": 1.55
   }
  ]
 },
 {
  "id": "farmstead",
  "name": "Farmstead",
  "ground": "grass",
  "group": "country",
  "pieces": [
   {
    "piece": "kaykit-hexagon/building-home-a-yellow",
    "rot": 0,
    "scale": 0.45,
    "x": -0.4,
    "z": -1.1
   },
   {
    "piece": "kenney-town/cart",
    "rot": 0.6,
    "scale": 0.45,
    "x": 1.385,
    "z": -0.718
   },
   {
    "piece": "kaykit-dungeon/barrel-small",
    "rot": 0,
    "scale": 0.5,
    "x": 2.1,
    "z": 0.2
   },
   {
    "piece": "kenney-nature/crop-pumpkin",
    "rot": 0,
    "scale": 0.55,
    "x": -1.4,
    "z": 1.1
   },
   {
    "piece": "kenney-nature/crops-leafs-stage-b",
    "rot": 1,
    "scale": 0.55,
    "x": -1.4,
    "z": 1.8
   },
   {
    "piece": "kenney-nature/crops-leafs-stage-b",
    "rot": 1,
    "scale": 0.55,
    "x": -0.6,
    "z": 1.1
   },
   {
    "piece": "kenney-nature/crop-pumpkin",
    "rot": 2,
    "scale": 0.55,
    "x": -0.6,
    "z": 1.8
   },
   {
    "piece": "kenney-nature/crop-pumpkin",
    "rot": 2,
    "scale": 0.55,
    "x": 0.2,
    "z": 1.1
   },
   {
    "piece": "kenney-nature/crops-leafs-stage-b",
    "rot": 3,
    "scale": 0.55,
    "x": 0.2,
    "z": 1.8
   },
   {
    "piece": "kenney-nature/crops-leafs-stage-b",
    "rot": 3,
    "scale": 0.55,
    "x": 1,
    "z": 1.1
   },
   {
    "piece": "kenney-nature/crop-pumpkin",
    "rot": 4,
    "scale": 0.55,
    "x": 1,
    "z": 1.8
   },
   {
    "piece": "kenney-nature/fence-simple-low",
    "rot": 3.142,
    "scale": 0.448,
    "x": 0,
    "z": 2.604
   }
  ],
  "blockers": [
   {
    "of": 1
   },
   {
    "of": 2
   }
  ],
  "spots": [
   {
    "clip": "Digging",
    "facing": 1.571,
    "hours": [
     6,
     19
    ],
    "kind": "work",
    "prop": "kaykit-tools/shovel",
    "roles": [
     "farmer"
    ],
    "x": -1,
    "z": 1.45
   },
   {
    "clip": "PickUp",
    "facing": -1.571,
    "hours": [
     6,
     19
    ],
    "kind": "work",
    "roles": [
     "farmer"
    ],
    "x": 0.6,
    "z": 1.45
   },
   {
    "clip": "Interact",
    "facing": 2.678,
    "kind": "stand",
    "roles": [
     "farmer"
    ],
    "x": 0.917,
    "z": 0.166
   }
  ]
 },
 {
  "id": "watchtower",
  "name": "Watchtower",
  "ground": "grass",
  "group": "landmark",
  "pieces": [
   {
    "piece": "kenney-castle/tower-square-mid-door",
    "pin": true,
    "rot": 0,
    "scale": 0.32,
    "swatchMap": {
     "11": 61,
     "28": 15,
     "29": 16,
     "37": 42,
     "51": 19,
     "52": 61,
     "53": 62,
     "55": 22
    },
    "x": 0.1,
    "z": -0.6
   },
   {
    "piece": "kenney-castle/tower-square-mid",
    "pin": true,
    "rot": 0,
    "scale": 0.32,
    "swatchMap": {
     "11": 61,
     "28": 15,
     "29": 16,
     "37": 42,
     "51": 19,
     "52": 61,
     "53": 62,
     "55": 22
    },
    "x": 0.1,
    "y": 1.39,
    "z": -0.6
   },
   {
    "piece": "kenney-castle/tower-square-mid-windows",
    "pin": true,
    "rot": 0,
    "scale": 0.32,
    "swatchMap": {
     "11": 61,
     "28": 15,
     "29": 16,
     "37": 42,
     "51": 19,
     "52": 61,
     "53": 62,
     "55": 22
    },
    "x": 0.1,
    "y": 2.78,
    "z": -0.6
   },
   {
    "piece": "kenney-castle/tower-square-mid-open-simple",
    "pin": true,
    "rot": 0,
    "scale": 0.32,
    "swatchMap": {
     "11": 61,
     "28": 15,
     "29": 16,
     "37": 42,
     "51": 19,
     "52": 61,
     "53": 62,
     "55": 22
    },
    "x": 0.1,
    "y": 4.17,
    "z": -0.6
   },
   {
    "piece": "kenney-castle/tower-square-top",
    "pin": true,
    "rot": 0,
    "scale": 0.34,
    "swatchMap": {
     "11": 61,
     "28": 15,
     "29": 16,
     "37": 42,
     "51": 19,
     "52": 61,
     "53": 62,
     "55": 22
    },
    "x": 0.1,
    "y": 5.38,
    "z": -0.6
   },
   {
    "piece": "kenney-nature/campfire-logs",
    "pin": true,
    "rot": 0,
    "scale": 0.45,
    "x": 0.1,
    "y": 5.42,
    "z": -0.6
   },
   {
    "piece": "kaykit-dungeon/torch-lit",
    "pin": true,
    "rot": 0,
    "scale": 1.3,
    "x": 0.1,
    "y": 5.45,
    "z": -0.6
   },
   {
    "piece": "kenney-castle/flag",
    "pin": true,
    "rot": 0.8,
    "scale": 0.4,
    "x": -0.45,
    "y": 5.38,
    "z": -1.15
   },
   {
    "piece": "kenney-town/blade",
    "pin": true,
    "rot": 0,
    "scale": 0.72,
    "tilt": [
     0,
     0.11
    ],
    "x": 1.25,
    "z": -0.6
   },
   {
    "piece": "kaykit-forest/rock-3-e-color1",
    "rot": 0,
    "scale": 0.5,
    "x": -1.35,
    "z": -1.45
   },
   {
    "piece": "kaykit-forest/rock-3-f-color1",
    "rot": 1,
    "scale": 0.45,
    "x": 1.75,
    "z": 1.35
   },
   {
    "piece": "kenney-pirate/crate",
    "rot": 0.3,
    "scale": 0.45,
    "x": -1.25,
    "z": 0.35
   },
   {
    "piece": "kaykit-forest/bush-2-c-color1",
    "rot": 0,
    "scale": 0.5,
    "x": 1.6,
    "z": -1.9
   }
  ],
  "blockers": [
   {
    "of": 9
   },
   {
    "of": 10
   },
   {
    "of": 11
   }
  ],
  "spots": [
   {
    "clip": "Idle_A",
    "facing": 0,
    "kind": "stand",
    "roles": [
     "guard",
     "night-watch"
    ],
    "x": 0.45,
    "z": 1.55
   },
   {
    "clip": "Idle_B",
    "facing": -1.2,
    "kind": "stand",
    "roles": [
     "guard"
    ],
    "x": -0.75,
    "z": 1
   }
  ]
 },
 {
  "id": "ruins",
  "name": "Ruins",
  "ground": "grass",
  "group": "landmark",
  "pieces": [
   {
    "piece": "kaykit-hexagon/building-destroyed",
    "rot": 0,
    "scale": 0.42,
    "x": 0,
    "z": 0
   },
   {
    "piece": "kaykit-forest/bush-2-c-color1",
    "rot": 0,
    "scale": 0.8,
    "x": 1.729,
    "z": 1.159
   }
  ],
  "blockers": [
   {
    "of": 0
   },
   {
    "of": 1
   }
  ],
  "spots": [
   {
    "clip": "Idle_B",
    "facing": 3.142,
    "kind": "stand",
    "x": 1.2,
    "z": 2.34
   }
  ]
 },
 {
  "id": "warehouse",
  "name": "Warehouse",
  "ground": "dirt",
  "group": "town",
  "pieces": [
   {
    "piece": "kenney-town/wall-wood-window-shutters",
    "pin": true,
    "rot": -1.571,
    "scale": 0.4,
    "x": -1.388,
    "z": 0.388
   },
   {
    "piece": "kenney-town/wall-wood-doorway-square-wide",
    "pin": true,
    "rot": -1.571,
    "scale": 0.4,
    "x": 0,
    "z": 0.388
   },
   {
    "piece": "kenney-town/wall-wood-window-shutters",
    "pin": true,
    "rot": -1.571,
    "scale": 0.4,
    "x": 1.388,
    "z": 0.388
   },
   {
    "piece": "kenney-town/wall-wood",
    "pin": true,
    "rot": 1.571,
    "scale": 0.4,
    "x": -1.388,
    "z": -1
   },
   {
    "piece": "kenney-town/wall-wood-window-small",
    "pin": true,
    "rot": 1.571,
    "scale": 0.4,
    "x": 0,
    "z": -1
   },
   {
    "piece": "kenney-town/wall-wood",
    "pin": true,
    "rot": 1.571,
    "scale": 0.4,
    "x": 1.388,
    "z": -1
   },
   {
    "piece": "kenney-town/wall-wood",
    "pin": true,
    "rot": 3.142,
    "scale": 0.4,
    "x": -1.388,
    "z": 0.388
   },
   {
    "piece": "kenney-town/wall-wood-window-small",
    "pin": true,
    "rot": 3.142,
    "scale": 0.4,
    "x": -1.388,
    "z": -1
   },
   {
    "piece": "kenney-town/wall-wood-door",
    "pin": true,
    "rot": 0,
    "scale": 0.4,
    "x": 1.388,
    "z": 0.388
   },
   {
    "piece": "kenney-town/wall-wood",
    "pin": true,
    "rot": 0,
    "scale": 0.4,
    "x": 1.388,
    "z": -1
   },
   {
    "piece": "kenney-town/roof",
    "pin": true,
    "rot": 1.571,
    "scale": 0.4,
    "swatchMap": {
     "29": 28,
     "48": 27,
     "49": 28,
     "50": 29
    },
    "x": -1.388,
    "y": 1.388,
    "z": 0.388
   },
   {
    "piece": "kenney-town/roof",
    "pin": true,
    "rot": 1.571,
    "scale": 0.4,
    "swatchMap": {
     "29": 28,
     "48": 27,
     "49": 28,
     "50": 29
    },
    "x": 0,
    "y": 1.388,
    "z": 0.388
   },
   {
    "piece": "kenney-town/roof",
    "pin": true,
    "rot": 1.571,
    "scale": 0.4,
    "swatchMap": {
     "29": 28,
     "48": 27,
     "49": 28,
     "50": 29
    },
    "x": 1.388,
    "y": 1.388,
    "z": 0.388
   },
   {
    "piece": "kenney-town/roof",
    "pin": true,
    "rot": -1.571,
    "scale": 0.4,
    "swatchMap": {
     "29": 28,
     "48": 27,
     "49": 28,
     "50": 29
    },
    "x": -1.388,
    "y": 1.388,
    "z": -1
   },
   {
    "piece": "kenney-town/roof",
    "pin": true,
    "rot": -1.571,
    "scale": 0.4,
    "swatchMap": {
     "29": 28,
     "48": 27,
     "49": 28,
     "50": 29
    },
    "x": 0,
    "y": 1.388,
    "z": -1
   },
   {
    "piece": "kenney-town/roof",
    "pin": true,
    "rot": -1.571,
    "scale": 0.4,
    "swatchMap": {
     "29": 28,
     "48": 27,
     "49": 28,
     "50": 29
    },
    "x": 1.388,
    "y": 1.388,
    "z": -1
   },
   {
    "piece": "kaykit-dungeon/crates-stacked",
    "rot": 0.2,
    "scale": 0.45,
    "x": -1.65,
    "z": 1.7
   },
   {
    "piece": "kenney-pirate/crate",
    "rot": 0.5,
    "scale": 0.45,
    "x": -1,
    "z": 2.05
   },
   {
    "piece": "kaykit-resources/pallet-wood-covered-b",
    "rot": -0.2,
    "scale": 0.55,
    "x": 1.55,
    "z": 1.75
   },
   {
    "piece": "kenney-pirate/barrel",
    "rot": 0,
    "scale": 0.38,
    "x": 2.15,
    "z": 1.2
   },
   {
    "piece": "kaykit-tools/rope-bundle-a",
    "rot": 0.9,
    "scale": 0.6,
    "x": 1,
    "z": 2.2
   }
  ],
  "blockers": [
   {
    "of": 16
   },
   {
    "of": 17
   },
   {
    "of": 18
   },
   {
    "of": 19
   },
   {
    "of": 20
   }
  ],
  "spots": [
   {
    "clip": "PickUp",
    "facing": -1.57,
    "kind": "work",
    "roles": [
     "merchant"
    ],
    "x": -0.75,
    "z": 1.55
   },
   {
    "clip": "Idle_A",
    "facing": 0.5,
    "kind": "stand",
    "roles": [
     "merchant"
    ],
    "x": 0.8,
    "z": 1.5
   }
  ]
 },
 {
  "id": "tavern",
  "name": "Tavern",
  "ground": "grass",
  "group": "town",
  "pieces": [
   {
    "piece": "kaykit-hexagon/building-tavern-blue",
    "rot": 0,
    "scale": 0.5,
    "x": 0,
    "z": -0.45
   },
   {
    "piece": "kenney-pirate/barrel",
    "rot": 0,
    "scale": 0.42,
    "x": 2.05,
    "z": 0.75
   },
   {
    "piece": "kenney-pirate/barrel",
    "rot": 1,
    "scale": 0.42,
    "x": 2.3,
    "z": 0.2
   },
   {
    "piece": "kenney-pirate/barrel",
    "rot": 0.5,
    "scale": 0.36,
    "x": 2.043,
    "y": 0,
    "z": 1.188
   },
   {
    "piece": "kenney-pirate/crate",
    "rot": 0.3,
    "scale": 0.5,
    "x": -2.197,
    "z": 0.748
   },
   {
    "piece": "kaykit-dungeon/table-small",
    "rot": 0.2,
    "scale": 0.47,
    "x": -1.65,
    "z": 1.6
   },
   {
    "piece": "kaykit-dungeon/stool",
    "rot": 0,
    "scale": 0.47,
    "x": -1.904,
    "z": 1.558
   },
   {
    "piece": "kaykit-dungeon/stool",
    "rot": 0,
    "scale": 0.47,
    "x": -1.2,
    "z": 1.95
   },
   {
    "piece": "kaykit-halloween/post-lantern",
    "rot": 0,
    "scale": 0.55,
    "x": 1.15,
    "z": 1.95
   }
  ],
  "blockers": [
   {
    "of": 1
   },
   {
    "of": 2
   },
   {
    "of": 3
   },
   {
    "of": 4
   },
   {
    "of": 5
   },
   {
    "of": 6
   },
   {
    "of": 7
   },
   {
    "of": 8
   }
  ],
  "spots": [
   {
    "clip": "Sit_Chair_Idle",
    "facing": 1.768,
    "hours": [
     17,
     1
    ],
    "kind": "sit",
    "prop": "kaykit-adventurers/mug-full",
    "x": -2.15,
    "z": 1.7
   },
   {
    "clip": "Sit_Chair_Idle",
    "facing": -2.232,
    "hours": [
     17,
     1
    ],
    "kind": "sit",
    "prop": "kaykit-adventurers/mug-full",
    "x": -1.2,
    "z": 1.95
   },
   {
    "clip": "Idle_B",
    "facing": -1.227,
    "hours": [
     17,
     1
    ],
    "kind": "talk",
    "prop": "kaykit-adventurers/mug-full",
    "x": 2.03,
    "z": 1.638
   },
   {
    "clip": "Idle_B",
    "facing": 1.915,
    "hours": [
     17,
     1
    ],
    "kind": "talk",
    "prop": "kaykit-adventurers/mug-full",
    "x": 0.434,
    "z": 2.21
   },
   {
    "clip": "Interact",
    "facing": 1.429,
    "kind": "work",
    "roles": [
     "tavern-keeper"
    ],
    "x": 2.536,
    "z": 0.753
   }
  ]
 }
];
export const SOURCE_PROVENANCE = {
 "house-pair": {
  "repository": "drakenhok01-code/HIGHFLY-FREE-FOUNDATION",
  "commit": "3e9e98edd1169fb9fdb416159344e79e53412c7c",
  "path": "src/highfly/p542-guildhall-prefabs.mjs"
 },
 "cottage-garden": {
  "repository": "drakenhok01-code/HIGHFLY-FREE-FOUNDATION",
  "commit": "3e9e98edd1169fb9fdb416159344e79e53412c7c",
  "path": "src/highfly/p542-guildhall-prefabs.mjs"
 },
 "smithy-yard": {
  "repository": "drakenhok01-code/HIGHFLY-FREE-FOUNDATION",
  "commit": "3e9e98edd1169fb9fdb416159344e79e53412c7c",
  "path": "src/highfly/p542-guildhall-prefabs.mjs"
 },
 "tavern-yard": {
  "repository": "drakenhok01-code/HIGHFLY-FREE-FOUNDATION",
  "commit": "3e9e98edd1169fb9fdb416159344e79e53412c7c",
  "path": "src/highfly/p542-guildhall-prefabs.mjs"
 },
 "market-square": {
  "repository": "drakenhok01-code/HIGHFLY-FREE-FOUNDATION",
  "commit": "3e9e98edd1169fb9fdb416159344e79e53412c7c",
  "path": "src/highfly/p542-guildhall-prefabs.mjs"
 },
 "farmstead-yard": {
  "repository": "drakenhok01-code/HIGHFLY-FREE-FOUNDATION",
  "commit": "3e9e98edd1169fb9fdb416159344e79e53412c7c",
  "path": "src/highfly/p542-guildhall-prefabs.mjs"
 },
 "town-hall-plaza": {
  "repository": "drakenhok01-code/HIGHFLY-FREE-FOUNDATION",
  "commit": "3e9e98edd1169fb9fdb416159344e79e53412c7c",
  "path": "src/highfly/p542-guildhall-prefabs.mjs"
 },
 "mine": {
  "repository": "Codestz/guildhall",
  "path": "data/tiles/mine.json",
  "blob": "a4529bdf068ff018d6706b645aab9f6f6cd4d907"
 },
 "windmill": {
  "repository": "Codestz/guildhall",
  "path": "data/tiles/windmill.json",
  "blob": "488491ce55e3406a6fdc7cda644978b87eb9a6af"
 },
 "archery-range": {
  "repository": "Codestz/guildhall",
  "path": "data/tiles/archery-range.json",
  "blob": "cef174d9dd36d186c16ee6ff572b3ee071b7cefd"
 },
 "castle": {
  "repository": "Codestz/guildhall",
  "path": "data/tiles/castle.json",
  "blob": "6fb32965b673a14bcff90c8f217be784da4756b1"
 },
 "graveyard": {
  "repository": "Codestz/guildhall",
  "path": "data/tiles/graveyard.json",
  "blob": "7c7218a43bd50acd6063186f1aaa8b8c0ba6796e"
 },
 "market": {
  "repository": "Codestz/guildhall",
  "path": "data/tiles/market.json",
  "blob": "888d79764dafc0c464b7714f0e9af2b7c1755b08"
 },
 "barracks": {
  "repository": "Codestz/guildhall",
  "path": "data/tiles/barracks.json",
  "blob": "b4b5e960a4f881cf1008dc7d58daca9ac6c9e802"
 },
 "dock": {
  "repository": "Codestz/guildhall",
  "path": "data/tiles/dock.json",
  "blob": "f1e8f4cde0d884884adae0c64c2061ab66bcbade"
 },
 "chapel": {
  "repository": "Codestz/guildhall",
  "path": "data/tiles/chapel.json",
  "blob": "0d3ea6c7e36dd503fcb32592f98463df770fc38e"
 },
 "farmstead": {
  "repository": "Codestz/guildhall",
  "path": "data/tiles/farmstead.json",
  "blob": "bddb4cfca0f665c0a28d754392cde853076c8232"
 },
 "watchtower": {
  "repository": "Codestz/guildhall",
  "path": "data/tiles/watchtower.json",
  "blob": "83d9c4b456c658894fd3af97cefb01404f09ddc7"
 },
 "ruins": {
  "repository": "Codestz/guildhall",
  "path": "data/tiles/ruins.json",
  "blob": "01a7790701f56af9e64a8b84841c731871de68d5"
 },
 "warehouse": {
  "repository": "Codestz/guildhall",
  "path": "data/tiles/warehouse.json",
  "blob": "d3572da1e1d39695583e493ad45f7d8b1e694070"
 },
 "tavern": {
  "repository": "Codestz/guildhall",
  "path": "data/tiles/tavern.json",
  "blob": "187653a12c3520bc5e00579638b149082d1e1fb1"
 }
};
export const SETTLEMENTS = [
 {
  "id": "arvelia",
  "name": "Ciudad de los Inicios",
  "terrain": "plaza/llanura",
  "parts": [
   "town-hall-plaza",
   "market-square",
   "tavern-yard",
   "smithy-yard",
   "house-pair",
   "cottage-garden",
   "house-pair",
   "market",
   "barracks",
   "castle"
  ],
  "guildTile": "town-hall-plaza",
  "pending": [
   "muralla perimetral",
   "portones",
   "cartel de gremio"
  ],
  "roadMaterial": "unsung-stone",
  "coastal": false,
  "status": "draft-needs-asset-calibration"
 },
 {
  "id": "pesquero",
  "name": "Pueblo pesquero",
  "terrain": "orilla de lago",
  "parts": [
   "town-hall-plaza",
   "dock",
   "dock",
   "warehouse",
   "market",
   "house-pair",
   "tavern-yard",
   "cottage-garden"
  ],
  "guildTile": "town-hall-plaza",
  "pending": [
   "alinear muelles y botes a costa real",
   "cartel de gremio"
  ],
  "roadMaterial": "unsung-dirt",
  "coastal": true,
  "status": "draft-needs-asset-calibration"
 },
 {
  "id": "agricola",
  "name": "Aldea agrícola",
  "terrain": "pradera llana",
  "parts": [
   "town-hall-plaza",
   "farmstead-yard",
   "farmstead",
   "windmill",
   "farmstead-yard",
   "house-pair",
   "market",
   "tavern-yard"
  ],
  "guildTile": "town-hall-plaza",
  "pending": [
   "campos de trigo adicionales",
   "cartel de gremio"
  ],
  "roadMaterial": "unsung-dirt",
  "coastal": false,
  "status": "draft-needs-asset-calibration"
 },
 {
  "id": "forestal",
  "name": "Aldea forestal",
  "terrain": "claro de bosque",
  "parts": [
   "town-hall-plaza",
   "cottage-garden",
   "house-pair",
   "smithy-yard",
   "warehouse",
   "tavern",
   "farmstead"
  ],
  "guildTile": "town-hall-plaza",
  "pending": [
   "aserradero exacto",
   "troncos y tala",
   "cartel de gremio"
  ],
  "roadMaterial": "unsung-dirt",
  "coastal": false,
  "status": "draft-needs-asset-calibration"
 },
 {
  "id": "minero",
  "name": "Pueblo minero",
  "terrain": "ladera rocosa",
  "parts": [
   "town-hall-plaza",
   "mine",
   "mine",
   "smithy-yard",
   "warehouse",
   "house-pair",
   "tavern",
   "market"
  ],
  "guildTile": "town-hall-plaza",
  "pending": [
   "conectar minas a roca existente",
   "cartel de gremio"
  ],
  "roadMaterial": "unsung-dirt",
  "coastal": false,
  "status": "draft-needs-asset-calibration"
 },
 {
  "id": "artesanal",
  "name": "Pueblo artesanal",
  "terrain": "meseta suave",
  "parts": [
   "town-hall-plaza",
   "smithy-yard",
   "market-square",
   "warehouse",
   "house-pair",
   "cottage-garden",
   "tavern-yard",
   "market"
  ],
  "guildTile": "town-hall-plaza",
  "pending": [
   "talleres de textiles y cuero",
   "cartel de gremio"
  ],
  "roadMaterial": "unsung-stone",
  "coastal": false,
  "status": "draft-needs-asset-calibration"
 },
 {
  "id": "arcano",
  "name": "Pueblo arcano",
  "terrain": "lago elevado/cascada",
  "parts": [
   "town-hall-plaza",
   "chapel",
   "cottage-garden",
   "market-square",
   "house-pair",
   "tavern-yard",
   "warehouse"
  ],
  "guildTile": "town-hall-plaza",
  "pending": [
   "torres arcanas y cristales compatibles",
   "cartel de gremio"
  ],
  "roadMaterial": "unsung-stone",
  "coastal": false,
  "status": "draft-needs-asset-calibration"
 },
 {
  "id": "fortaleza",
  "name": "Fortaleza militar",
  "terrain": "meseta elevada",
  "parts": [
   "town-hall-plaza",
   "castle",
   "barracks",
   "archery-range",
   "watchtower",
   "watchtower",
   "smithy-yard",
   "warehouse"
  ],
  "guildTile": "town-hall-plaza",
  "pending": [
   "murallas y portones continuos",
   "cartel de gremio"
  ],
  "roadMaterial": "unsung-dirt",
  "coastal": false,
  "status": "draft-needs-asset-calibration"
 },
 {
  "id": "ruinas",
  "name": "Aldea de ruinas",
  "terrain": "zona aislada",
  "parts": [
   "town-hall-plaza",
   "ruins",
   "ruins",
   "graveyard",
   "chapel",
   "watchtower",
   "cottage-garden"
  ],
  "guildTile": "town-hall-plaza",
  "pending": [
   "gremio intacto en acceso seguro",
   "cartel de gremio"
  ],
  "roadMaterial": "unsung-dirt",
  "coastal": false,
  "status": "draft-needs-asset-calibration"
 },
 {
  "id": "puerto",
  "name": "Puerto comercial",
  "terrain": "costa amplia",
  "parts": [
   "town-hall-plaza",
   "dock",
   "dock",
   "dock",
   "warehouse",
   "warehouse",
   "market-square",
   "tavern-yard",
   "house-pair"
  ],
  "guildTile": "town-hall-plaza",
  "pending": [
   "alinear muelles y botes a costa real",
   "cartel de gremio"
  ],
  "roadMaterial": "unsung-dirt",
  "coastal": true,
  "status": "draft-needs-asset-calibration"
 },
 {
  "id": "santuario",
  "name": "Santuario",
  "terrain": "colina tranquila",
  "parts": [
   "town-hall-plaza",
   "chapel",
   "cottage-garden",
   "cottage-garden",
   "house-pair",
   "market-square",
   "graveyard"
  ],
  "guildTile": "town-hall-plaza",
  "pending": [
   "jardines y templo adicional",
   "cartel de gremio"
  ],
  "roadMaterial": "unsung-stone",
  "coastal": false,
  "status": "draft-needs-asset-calibration"
 },
 {
  "id": "cazadores",
  "name": "Campamento de cazadores",
  "terrain": "borde de bosque",
  "parts": [
   "town-hall-plaza",
   "archery-range",
   "watchtower",
   "cottage-garden",
   "warehouse",
   "house-pair",
   "tavern"
  ],
  "guildTile": "town-hall-plaza",
  "pending": [
   "carpas y fogatas",
   "cartel de gremio"
  ],
  "roadMaterial": "unsung-dirt",
  "coastal": false,
  "status": "draft-needs-asset-calibration"
 },
 {
  "id": "montana",
  "name": "Villa de montaña",
  "terrain": "meseta alta",
  "parts": [
   "town-hall-plaza",
   "watchtower",
   "cottage-garden",
   "house-pair",
   "smithy-yard",
   "warehouse",
   "tavern"
  ],
  "guildTile": "town-hall-plaza",
  "pending": [
   "escalones y terrazas naturales",
   "cartel de gremio"
  ],
  "roadMaterial": "unsung-dirt",
  "coastal": false,
  "status": "draft-needs-asset-calibration"
 },
 {
  "id": "japonesa",
  "name": "Villa japonesa",
  "terrain": "valle junto al agua",
  "parts": [
   "town-hall-plaza",
   "cottage-garden",
   "house-pair",
   "market-square",
   "chapel"
  ],
  "guildTile": "town-hall-plaza",
  "pending": [
   "BLOQUEANTE: sustituir arquitectura europea por edificios japoneses CC0/MIT, torii y puentes; gremio japonés propio"
  ],
  "roadMaterial": "unsung-dirt",
  "coastal": false,
  "status": "blocked-theme-assets"
 },
 {
  "id": "frontera",
  "name": "Puesto fronterizo",
  "terrain": "cruce de caminos",
  "parts": [
   "town-hall-plaza",
   "watchtower",
   "barracks",
   "warehouse",
   "archery-range",
   "house-pair"
  ],
  "guildTile": "town-hall-plaza",
  "pending": [
   "empalizada y puerta",
   "cartel de gremio"
  ],
  "roadMaterial": "unsung-dirt",
  "coastal": false,
  "status": "draft-needs-asset-calibration"
 }
];
const TILES=new Map(SOURCE_TILES.map(t=>[t.id,t]));
const PRESETS=new Map(SETTLEMENTS.map(t=>[t.id,t]));
const finite=(...n)=>n.every(Number.isFinite);
const rot=(x,z,a)=>[x*Math.cos(a)+z*Math.sin(a),-x*Math.sin(a)+z*Math.cos(a)];
const isTerrain=id=>/(^|\/)hex[-_](grass|water|coast|river|road)([-_]|$)/i.test(id);
const isFlora=id=>/(?:^|\/)(?:tree[-_]|trees[-_]|bush[-_])/i.test(id);
export const ASSET_REQUIREMENTS=[...new Set(SOURCE_TILES.flatMap(t=>t.pieces.map(p=>p.piece)))].sort();
export function auditAssets(assetLookup, presetId) {
 const p=PRESETS.get(presetId); if(!p)throw Error('unknown preset');
 const required=[...new Set(p.parts.flatMap(id=>TILES.get(id).pieces.map(x=>x.piece)))];
 return required.filter(id=>!isTerrain(id)&&!isFlora(id)).map(id=>{
 const a=assetLookup(id);
 return {id,ok:!!a&&a.sourceId===id&&['CC0','CC0-1.0','MIT','BSD-2-Clause','BSD-3-Clause','Apache-2.0'].includes(a.license)&&finite(a.width,a.depth,a.height)&&Math.min(a.width,a.depth,a.height)>0,asset:a||null};
 });
}
export function calibrateScale({sourceDoorHeight,unsungDoorHeight,sourceCharacterHeight,unsungCharacterHeight,tolerance=.15}) {
 if(!finite(sourceDoorHeight,unsungDoorHeight,sourceCharacterHeight,unsungCharacterHeight)||Math.min(sourceDoorHeight,unsungDoorHeight,sourceCharacterHeight,unsungCharacterHeight)<=0)throw Error('measure both door and character before scaling');
 const d=unsungDoorHeight/sourceDoorHeight,c=unsungCharacterHeight/sourceCharacterHeight;
 if(Math.abs(d/c-1)>tolerance)throw Error('door and character scale disagree; inspect model calibration');
 return (d+c)/2;
}
function pieceBounds(p,a) {
 // Conservative circular envelope covers rotation and optional tilted pieces; exact bounds can refine.
 const s=p.scale??1,r=Math.hypot(a.width,a.depth,p.tilt?a.height:0)*s/2;
 return [p.x-r,p.z-r,p.x+r,p.z+r];
}
function tileBounds(tile,lookup) {
 const b=tile.pieces.filter(p=>!isTerrain(p.piece)&&!isFlora(p.piece)).map(p=>pieceBounds(p,lookup(p.piece)));
 if(!b.length)throw Error('empty tile');
 return [Math.min(...b.map(x=>x[0])),Math.min(...b.map(x=>x[1])),Math.max(...b.map(x=>x[2])),Math.max(...b.map(x=>x[3]))];
}
export function buildSettlement(id,{assetLookup,metersPerUnit,gapMeters=2.5,roadWidth=3.5,anchor={x:0,z:0},yaw=0,seed=7}={}){
 const preset=PRESETS.get(id);if(!preset)throw Error('unknown settlement');
 if(preset.status==='blocked-theme-assets')throw Error('Japanese architecture not verified; no European substitute permitted');
 if(typeof assetLookup!=='function'||!finite(metersPerUnit,gapMeters,roadWidth,anchor.x,anchor.z,yaw,seed)||metersPerUnit<=0||gapMeters<1||roadWidth<2)throw Error('missing real measured scale or invalid site');
 const missing=auditAssets(assetLookup,id).filter(x=>!x.ok);
 if(missing.length)return {ok:false,id,missing:missing.map(x=>x.id),reason:'exact assets missing, unlicensed or unmeasured; no substitution'};
 const g=gapMeters/metersPerUnit,half=roadWidth/metersPerUnit/2;
 const parts=preset.parts.map((t,i)=>({id:t,i}));
 // Deterministic ordering: keep guild first, dock lots on the same side.
 const rest=parts.slice(1).sort((a,b)=>((a.i*2654435761+seed*1013904223)>>>0)-((b.i*2654435761+seed*1013904223)>>>0));
 const rows=[ [parts[0]],[] ];
 for(const p of rest){if(p.id==='dock')rows[1].push(p);else rows[rows[0].length<=rows[1].length?0:1].push(p)}
 const lots=[],objects=[],roads=[],floraHints=[],blockers=[];
 let minX=Infinity,maxX=-Infinity;
 const world=(x,z)=>{const [dx,dz]=rot(x*metersPerUnit,z*metersPerUnit,yaw);return {x:anchor.x+dx,z:anchor.z+dz}};
 for(let side=0;side<2;side++){
 let x=0;
 for(const entry of rows[side]){
 const t=TILES.get(entry.id),b=tileBounds(t,assetLookup),ox=x-b[0],oz=side===0?-half-g-b[3]:half+g-b[1];
 const key=id+'-'+entry.i;
 const lot={id:key,tile:t.id,role:entry.i===0?'guild':'lot',ground:t.ground,sourceBounds:[ox+b[0],oz+b[1],ox+b[2],oz+b[3]],coastal:t.id==='dock'};
 lots.push(lot);
 minX=Math.min(minX,ox+b[0]);maxX=Math.max(maxX,ox+b[2]);
 for(let i=0;i<t.pieces.length;i++){
 const p=t.pieces[i],pos=world(ox+p.x,oz+p.z);
 if(isTerrain(p.piece))continue;
 if(isFlora(p.piece)){floraHints.push({...pos,original:p.piece,policy:'native-unsung-only'});continue}
 const a=assetLookup(p.piece);
 objects.push({id:key+'-'+i,lot:key,sourceId:p.piece,model:a.uri,license:a.license,...pos,yOffset:(p.y??0)*metersPerUnit,yaw:(p.rot??0)+yaw,tilt:p.tilt??null,scale:(p.scale??1)*metersPerUnit,swatchMap:p.swatchMap??null,pin:p.pin??false,sourcePieceIndex:i,sourceTransform:{...p},surface:/boat/i.test(p.piece)?'water':t.id==='dock'&&/platform/i.test(p.piece)?'shore':'land'});
 }
 for(const b of t.blockers??[]){const p=b.of!==undefined?t.pieces[b.of]:b;if(p&&finite(p.x,p.z))blockers.push({lot:key,source:{...b},...world(ox+p.x,oz+p.z),radius:Number.isFinite(b.r)?b.r*metersPerUnit:null,objectId:b.of!==undefined?key+'-'+b.of:null})}
 const mid=ox+(b[0]+b[2])/2; roads.push({id:key+'-access',material:preset.roadMaterial,width:Math.min(roadWidth,2.5),points:[world(mid,0),world(mid,side===0?oz+b[3]:oz+b[1])],kind:'lot-access'});
 x+=b[2]-b[0]+g;
 }
 }
 roads.unshift({id:id+'-main',material:preset.roadMaterial,width:roadWidth,points:[world(minX-g,0),world(maxX+g,0)],kind:'main'});
 for(const lot of lots){const [a,b,c,d]=lot.sourceBounds;lot.corners=[[a,b],[a,d],[c,b],[c,d]].map(([x,z])=>world(x,z));}
 return {ok:true,schema:'hf-settlement-v2-draft',id,name:preset.name,seed,anchor,yaw,metersPerUnit,lots,objects,roads,floraHints,blockers,pending:[...preset.pending],npc:[],quests:[],terrainPolicy:'preserve-unsung; roads require native ground-conforming mesh; water remains native',status:'requires terrain and actual renderer validation'};
}
export function validateSite(plan,{sampleTerrain,isOccupied=()=>false,maxLotRelief=1.25,maxRoadGrade=.12,step=1}={}){
 if(!plan?.ok||typeof sampleTerrain!=='function'||!finite(maxLotRelief,maxRoadGrade,step)||step<=0)throw Error('site validator requires a real native height sampler');
 const issues=[];
 const check=(p,kind,id)=>{const t=sampleTerrain(p.x,p.z);if(!t||!Number.isFinite(t.height)){issues.push({id,reason:'missing terrain data',...p});return null}if(isOccupied(p.x,p.z))issues.push({id,reason:'existing architecture or reserved space',...p});if(kind==='land'&&t.water)issues.push({id,reason:'land piece or path on water',...p});if(kind==='water'&&!t.water)issues.push({id,reason:'boat not on water',...p});return t};
 for(const lot of plan.lots){const [a,b,c,d]=lot.corners,hs=[];const nx=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/step)),nz=Math.max(1,Math.ceil(Math.hypot(c.x-a.x,c.z-a.z)/step));for(let i=0;i<=nx;i++)for(let j=0;j<=nz;j++){const p={x:a.x+(b.x-a.x)*i/nx+(c.x-a.x)*j/nz,z:a.z+(b.z-a.z)*i/nx+(c.z-a.z)*j/nz};const t=check(p,lot.coastal?'shore':'land',lot.id);if(t&&!t.water)hs.push(t.height)}if(hs.length&&Math.max(...hs)-Math.min(...hs)>maxLotRelief)issues.push({id:lot.id,reason:'lot slope too high; relocate rather than add floating slab'});}
 for(const o of plan.objects)check(o,o.surface,o.id);
 for(const road of plan.roads){for(let k=1;k<road.points.length;k++){const a=road.points[k-1],b=road.points[k],len=Math.hypot(b.x-a.x,b.z-a.z),n=Math.max(1,Math.ceil(len/step));let last=null;for(let i=0;i<=n;i++){const t=check({x:a.x+(b.x-a.x)*i/n,z:a.z+(b.z-a.z)*i/n},'land',road.id);if(t&&last&&len&&Math.abs(t.height-last.height)/(len/n)>maxRoadGrade)issues.push({id:road.id,reason:'road grade exceeds limit; reroute'});last=t}}}
 return {ok:issues.length===0,issues,needs:['verify door accessibility and model collisions','native path and shore mesh generation','render QA on editor and Android']};
}
