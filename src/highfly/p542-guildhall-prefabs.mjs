/* Guildhall composition data: Copyright (c) 2026 Codestz, MIT.
 * See docs/licenses/GUILDHALL-MIT.txt. No upstream model files copied.
 * Exact source x/z/rot retained; scale calibration and substitutions are experimental.
 */
export const GUILDHALL_TILES = [
  {
    "blockers": [
      {
        "of": 4
      }
    ],
    "ground": "grass",
    "group": "town",
    "id": "house-pair",
    "name": "Two cottages",
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
    "ground": "grass",
    "group": "town",
    "id": "cottage-garden",
    "name": "Cottage with a garden",
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
    "ground": "dirt",
    "group": "town",
    "id": "smithy-yard",
    "name": "Smithy with a yard",
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
    "ground": "grass",
    "group": "town",
    "id": "tavern-yard",
    "name": "Tavern with a beer garden",
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
    "footprint": [
      3,
      5
    ],
    "ground": "paved",
    "group": "town",
    "id": "market-square",
    "name": "Market square",
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
    "footprint": [
      1,
      2
    ],
    "ground": "grass",
    "group": "country",
    "id": "farmstead-yard",
    "name": "Farmstead with its barn, pen and haystacks",
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
    "footprint": [
      1
    ],
    "ground": "paved",
    "group": "town",
    "id": "town-hall-plaza",
    "name": "Town hall on its plaza",
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
  }
];
const EQUIVALENTS = {
  "kenney-graveyard/bench": "bench",
  "kenney-town/hedge": "village-shrub",
  "kenney-nature/flower-red-a": "village-flowerbed",
  "kenney-nature/flower-purple-a": "village-flowerbed",
  "kenney-nature/flower-yellow-a": "village-flowerbed",
  "kenney-nature/pot-small": "village-flowerbed",
  "kenney-nature/pot-large": "village-flowerbed",
  "kenney-nature/fence-simple-low": "free-fence-wood-straight",
  "kenney-nature/fence-simple": "qcc0-fence",
  "kenney-nature/fence-gate": "free-fence-wood-straight-gate",
  "kenney-survival/workbench-anvil": "qcc0-anvil",
  "kaykit-resources/iron-bars-stack-medium": "free-resource-stone",
  "kaykit-resources/wood-log-stack": "free-resource-lumber",
  "kenney-nature/log-stack": "free-resource-lumber",
  "kenney-pirate/barrel": "free-barrel",
  "kaykit-dungeon/barrel-small": "free-barrel",
  "kaykit-dungeon/barrel-small-stack": "free-barrel",
  "kaykit-dungeon/table-long": "bench",
  "kaykit-dungeon/stool": "bench",
  "kenney-survival/signpost": "hf-wooden-signpost",
  "kaykit-halloween/post-lantern": "hf-streetlamp-bronze",
  "kenney-town/fountain-round-detail": "hf-fountain-stone",
  "kenney-town/stall-red": "qcc0-market_stand_1",
  "kenney-town/stall-green": "qcc0-market_stand_2",
  "kenney-town/cart-high": "qcc0-cart",
  "kenney-town/cart": "qcc0-cart",
  "kenney-pirate/crate": "free-crate-a-big",
  "kenney-pirate/crate-bottles": "qcc0-crate_wooden",
  "kaykit-resources/textiles-stack-large-colored": "free-sack",
  "kenney-graveyard/hay-bale": "free-sack",
  "kenney-graveyard/hay-bale-bundled": "free-sack",
  "kenney-survival/bucket": "free-bucket-empty",
  "kenney-nature/sign": "hf-wooden-signpost",
  "kaykit-dungeon/banner-shield-red": "village-banner"
};
const LABELS = {"house-pair":"Dos casas","cottage-garden":"Casa con jardín","smithy-yard":"Herrería","tavern-yard":"Taberna","market-square":"Mercado","farmstead-yard":"Granja","town-hall-plaza":"Plaza cívica"};
export const GUILDHALL_OPTIONS = [{id:'pilot',label:'Aldea de prueba (5 prefabs)'},...GUILDHALL_TILES.map(t=>({id:t.id,label:LABELS[t.id]}))];
export const GUILDHALL_KEY='hf-world-forge-layout-p542-guildhall-v1';
function resolve(p){
 const m=/^kaykit-hexagon\/building-(.+)-(red|blue|green|yellow)$/.exec(p);
 if(m)return {type:m[2]==='red'?'kaykit-'+m[1]:'free-building-'+m[1]+'-'+m[2],exact:true};
 return EQUIVALENTS[p]?{type:EQUIVALENTS[p],exact:false}:null;
}
const PILOT=[['market-square',0,0],['house-pair',-43,-24],['smithy-yard',40,-25],['tavern-yard',-40,35],['cottage-garden',42,35]];
export function guildhallPlan(id,{x,z,yaw=0,unit=6,stamp='pilot',hasAsset=()=>true}={}){
 if(![x,z,yaw,unit].every(Number.isFinite)||unit<4||unit>10)throw Error('Ancla o escala inválida');
 const placements=id==='pilot'?PILOT:[[id,0,0]];
 const objects=[],omitted=[],substitutions=[];
 const c=Math.cos(yaw),s=Math.sin(yaw);
 for(const [name,ox,oz] of placements){
  const tile=GUILDHALL_TILES.find(t=>t.id===name);
  if(!tile)throw Error('Prefab desconocido: '+name);
  for(const [i,p] of tile.pieces.entries()){
   const asset=resolve(p.piece);
   // Schema 1 cannot preserve stacked props / tilted meshes, so never flatten them silently.
   if(!asset||!hasAsset(asset.type)||p.y||p.tilt){omitted.push({tile:name,index:i,piece:p.piece,reason:p.y||p.tilt?'altura/inclinación no compatible':'modelo no disponible'});continue;}
   const dx=ox+p.x*unit,dz=oz+p.z*unit;
   const item={id:'hf-p542-'+stamp+'-'+name+'-'+i,type:asset.type,x:x+dx*c+dz*s,z:z-dx*s+dz*c,yaw:(p.rot||0)+yaw,scale:Math.min(3,Math.max(.5,(p.scale||1)/(asset.exact?.48:.75))),clearTrees:true,guildhallTile:name,guildhallSource:p.piece};
   if(!asset.exact)substitutions.push({tile:name,index:i,from:p.piece,to:asset.type});
   objects.push(item);
  }
 }
 return {objects,omitted,substitutions};
}
